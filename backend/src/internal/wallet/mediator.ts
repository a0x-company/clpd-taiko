import { ContractService, TransactionResult } from "@internal/ethereum/contract-service";
import { ERC20TokenContract } from "./contracts/erc20-token";
import { UniswapV3LiquidityPoolContract } from "./contracts/uniswap-v3-pool";
import { UniswapRouterContract } from "./contracts/uniswap-router";
import { TokenApprovalOperation, TokenSwapOperation, LiquidityAddOperation } from "./operations";
import { BASE_ADDRESS } from "@internal/constants/address";
import { ethers } from "ethers";
import { CLPDTokenContract } from "./contracts/clpd-token";
import { PK_RECHARGE_ETH_CLPD } from "@internal/config";
import { BridgeCLPDOperation, MintTokensOperation, VerifyValueAPIOperation } from "./operations/clpd-token";
import { ChainId } from "./types";

export class WalletOperationMediator {
  private readonly chainMediators: Map<ChainId, {
    contractService: ContractService;
    contracts: {
      clpd: ERC20TokenContract;
      usdc: ERC20TokenContract;
      pool: UniswapV3LiquidityPoolContract;
      router: UniswapRouterContract;
      clpdToken: CLPDTokenContract;
    };
    agentSigner: ethers.Wallet;
  }>;

  constructor(chainConfigs: Record<ChainId, {
    contractService: ContractService;
    contracts: {
      clpd: ERC20TokenContract;
      usdc: ERC20TokenContract;
      pool: UniswapV3LiquidityPoolContract;
      router: UniswapRouterContract;
      clpdToken: CLPDTokenContract;
    };
  }>) {
    console.log("🔧 Inicializando mediadores");
    this.chainMediators = new Map();
    
    Object.entries(chainConfigs).forEach(([chainId, config]) => {
      const mediator = {
        ...config,
        agentSigner: new ethers.Wallet(
          PK_RECHARGE_ETH_CLPD || '',
          config.contractService.getProvider()
        )
      };
      this.chainMediators.set(chainId as ChainId, mediator);
    });
  }

  private getChainServices(chain: ChainId = "base") {
    const chainServices = this.chainMediators.get(chain);
    if (!chainServices) {
      console.error(`❌ Chain ${chain} no configurada`);
      throw new Error(`Chain ${chain} not configured`);
    }
    return chainServices;
  }

  async executeSwapWithApproval(params: {
    tokenIn: ERC20TokenContract;
    tokenOut: ERC20TokenContract;
    amount: bigint;
    signer: ethers.Wallet;
    chain?: ChainId;
  }): Promise<TransactionResult> {
    console.log("🔄 Iniciando swap con aprobación");
    const { contractService, contracts } = this.getChainServices(params.chain);

    const currentAllowance = await params.tokenIn.getAllowance(
      params.signer.address,
      contracts.router.address
    );

    if (currentAllowance < params.amount) {
      const approvalOp = new TokenApprovalOperation(
        contractService,
        params.tokenIn,
        {
          spender: contracts.router.address,
          amount: params.amount,
          signer: params.signer
        }
      );
      const approvalResult = await contractService.executeOperation(approvalOp);
      if (!approvalResult.success) {
        console.error("❌ Falló la aprobación");
        throw new Error("Approval failed");
      }
    }

    const swapOp = new TokenSwapOperation(
      contractService,
      contracts.router,
      {
        tokenIn: params.tokenIn.address,
        tokenOut: params.tokenOut.address,
        amount: params.amount,
        signer: params.signer
      }
    );
    const swapResult = await contractService.executeOperation(swapOp);
    console.log(`✅ Swap ejecutado: ${swapResult.success}`);
    return swapResult;
  }

  async executeLiquidityAdditionWithApproval(params: {
    token: ERC20TokenContract;
    amount: bigint;
    signer: ethers.Wallet;
    isClpd: boolean;
    chain?: ChainId;
  }): Promise<TransactionResult> {
    console.log("💧 Iniciando adición de liquidez");
    const { contractService, contracts } = this.getChainServices(params.chain);

    const currentAllowance = await params.token.getAllowance(
      params.signer.address,
      BASE_ADDRESS.AERO_SWAP
    );

    if (currentAllowance < params.amount) {
      const approvalOp = new TokenApprovalOperation(
        contractService,
        params.token,
        {
          spender: BASE_ADDRESS.AERO_SWAP,
          amount: params.amount,
          signer: params.signer
        }
      );
      const approvalResult = await contractService.executeOperation(approvalOp);
      if (!approvalResult.success) {
        console.error("❌ Falló la aprobación");
        throw new Error("Approval failed");
      }
    }

    const liquidityOp = new LiquidityAddOperation(
      contractService,
      contracts.pool,
      {
        tokenAmount: params.amount,
        signer: params.signer,
        isClpd: params.isClpd
      }
    );
    const liquidityResult = await contractService.executeOperation(liquidityOp);
    console.log(`✅ Liquidez añadida: ${liquidityResult.success}`);
    return liquidityResult;
  }

  async executeCrossChainBridge(params: {
    amount: bigint;
    sourceChain: ChainId;
    targetChain: ChainId;
    userSigner: ethers.Wallet;
  }): Promise<TransactionResult> {
    console.log("🌉 Iniciando operación de bridge");
    try {
      const sourceServices = this.getChainServices(params.sourceChain);
      const targetServices = this.getChainServices(params.targetChain);

      const [initialSourceSupply, initialTargetSupply] = await Promise.all([
        sourceServices.contracts.clpdToken.getTotalSupply(),
        targetServices.contracts.clpdToken.getTotalSupply()
      ]);

      const totalBankBalance = BigInt(initialSourceSupply) + BigInt(initialTargetSupply);

      const burnOp = new BridgeCLPDOperation(
        sourceServices.contractService,
        sourceServices.contracts.clpdToken,
        {
          amount: params.amount,
          chain: params.targetChain,
          signer: params.userSigner
        }
      );
      const burnResult = await sourceServices.contractService.executeOperation(burnOp);
      console.log(`🔥 Burn ejecutado: ${burnResult.success}`);
      if (!burnResult.success) throw new Error("Burn operation failed");

      const [sourceTotalSupply, targetTotalSupply] = await Promise.all([
        sourceServices.contracts.clpd.getTotalSupply(),
        targetServices.contracts.clpd.getTotalSupply()
      ]);

      const totalSupplyAllChains = BigInt(sourceTotalSupply) + BigInt(targetTotalSupply);

      const sourceVerifyOp = new VerifyValueAPIOperation(
        sourceServices.contractService,
        sourceServices.contracts.clpdToken,
        {
          totalSupplyAllChains,
          currentBankBalance: totalBankBalance,
          agentSigner: sourceServices.agentSigner
        }
      );

      const targetVerifyOp = new VerifyValueAPIOperation(
        targetServices.contractService,
        targetServices.contracts.clpdToken,
        {
          totalSupplyAllChains,
          currentBankBalance: totalBankBalance,
          agentSigner: targetServices.agentSigner
        }
      );

      const [sourceVerifyResult, targetVerifyResult] = await Promise.all([
        sourceServices.contractService.executeOperation(sourceVerifyOp),
        targetServices.contractService.executeOperation(targetVerifyOp)
      ]);

      if (!sourceVerifyResult.success || !targetVerifyResult.success) {
        console.error("❌ Falló la verificación después del burn");
        throw new Error("Verify operations failed after burn");
      }

      const mintOp = new MintTokensOperation(
        targetServices.contractService,
        targetServices.contracts.clpdToken,
        {
          pendingUsers: [params.userSigner.address],
          pendingAmounts: [params.amount],
          agentSigner: targetServices.agentSigner
        }
      );
      const mintResult = await targetServices.contractService.executeOperation(mintOp);
      console.log(`🪙 Mint ejecutado: ${mintResult.success}`);
      if (!mintResult.success) throw new Error("Mint operation failed");

      const [finalSourceTotalSupply, finalTargetTotalSupply] = await Promise.all([
        sourceServices.contracts.clpd.getTotalSupply(),
        targetServices.contracts.clpd.getTotalSupply()
      ]);

      const finalTotalSupplyAllChains = BigInt(finalSourceTotalSupply) + BigInt(finalTargetTotalSupply);

      const [finalSourceVerifyResult, finalTargetVerifyResult] = await Promise.all([
        sourceServices.contractService.executeOperation(
          new VerifyValueAPIOperation(
            sourceServices.contractService,
            sourceServices.contracts.clpdToken,
            {
              totalSupplyAllChains: finalTotalSupplyAllChains,
              currentBankBalance: totalBankBalance,
              agentSigner: sourceServices.agentSigner
            }
          )
        ),
        targetServices.contractService.executeOperation(
          new VerifyValueAPIOperation(
            targetServices.contractService,
            targetServices.contracts.clpdToken,
            {
              totalSupplyAllChains: finalTotalSupplyAllChains,
              currentBankBalance: totalBankBalance,
              agentSigner: targetServices.agentSigner
            }
          )
        )
      ]);

      if (!finalSourceVerifyResult.success || !finalTargetVerifyResult.success) {
        console.error("❌ Falló la verificación final");
        throw new Error("Final verify operations failed after mint");
      }

      console.log("✅ Bridge completado exitosamente");
      return {
        success: true,
        hash: burnResult.hash,
        logs: [
          ...(burnResult.logs || []),
          ...(sourceVerifyResult.logs || []),
          ...(targetVerifyResult.logs || []),
          ...(mintResult.logs || []),
          ...(finalSourceVerifyResult.logs || []),
          ...(finalTargetVerifyResult.logs || [])
        ]
      };
    } catch (error: any) {
      console.error('❌ Error en operación de bridge:', error);
      return { success: false, hash: '', logs: [] };
    }
  }
}