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
    console.log("🔧 Initializing chain mediators.");
    this.chainMediators = new Map();
    
    Object.entries(chainConfigs).forEach(([chainId, config]) => {
      console.log(`📈 Setting up mediator for chain: ${chainId}`);
      const mediator = {
        ...config,
        agentSigner: new ethers.Wallet(
          PK_RECHARGE_ETH_CLPD || '',
          config.contractService.getProvider()
        )
      };
      this.chainMediators.set(chainId as ChainId, mediator);
      console.log(`🔗 Mediator configured for chain: ${chainId}`);
    });
  }

  private getChainServices(chain: ChainId = "base") {
    console.log(`🔍 Retrieving services for chain: ${chain}`);
    const chainServices = this.chainMediators.get(chain);
    if (!chainServices) {
      console.error(`❌ Chain ${chain} is not configured.`);
      throw new Error(`Chain ${chain} not configured`);
    }
    console.log(`✅ Services retrieved for chain: ${chain}`);
    return chainServices;
  }

  async executeSwapWithApproval(params: {
    tokenIn: ERC20TokenContract;
    tokenOut: ERC20TokenContract;
    amount: bigint;
    signer: ethers.Wallet;
    chain?: ChainId;
  }): Promise<TransactionResult> {
    console.log("🔄 Starting swap execution with approval.");
    const { contractService, contracts } = this.getChainServices(params.chain);
    console.log("🔗 Retrieved contract services and contracts.");

    console.log("🔍 Checking current allowance.");
    const currentAllowance = await params.tokenIn.getAllowance(
      params.signer.address,
      contracts.router.address
    );
    console.log(`📊 Current allowance: ${currentAllowance}`);

    if (currentAllowance < params.amount) {
      console.log("📝 Approving token for router.");
      const approvalOp = new TokenApprovalOperation(
        contractService,
        params.tokenIn,
        {
          spender: contracts.router.address,
          amount: params.amount,
          signer: params.signer
        }
      );
      console.log("🛠️ Executing approval operation.");
      const approvalResult = await contractService.executeOperation(approvalOp);
      console.log(`✅ Approval result: ${approvalResult.success}`);
      if (!approvalResult.success) {
        console.error("❌ Approval failed.");
        throw new Error("Approval failed");
      }
    } else {
      console.log("✅ No additional approval required.");
    }

    console.log("🔄 Creating swap operation.");
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
    console.log("🛠️ Executing swap operation.");
    const swapResult = await contractService.executeOperation(swapOp);
    console.log(`✅ Swap executed successfully: ${swapResult.success}`);
    return swapResult;
  }

  async executeLiquidityAdditionWithApproval(params: {
    token: ERC20TokenContract;
    amount: bigint;
    signer: ethers.Wallet;
    isClpd: boolean;
    chain?: ChainId;
  }): Promise<TransactionResult> {
    console.log("💧 Starting liquidity addition with approval.");
    const { contractService, contracts } = this.getChainServices(params.chain);
    console.log("🔗 Retrieved contract services and contracts.");

    console.log("🔍 Checking current allowance.");
    const currentAllowance = await params.token.getAllowance(
      params.signer.address,
      BASE_ADDRESS.AERO_SWAP
    );
    console.log(`📊 Current allowance: ${currentAllowance}`);

    if (currentAllowance < params.amount) {
      console.log("📝 Approving token for AERO_SWAP.");
      const approvalOp = new TokenApprovalOperation(
        contractService,
        params.token,
        {
          spender: BASE_ADDRESS.AERO_SWAP,
          amount: params.amount,
          signer: params.signer
        }
      );
      console.log("🛠️ Executing approval operation.");
      const approvalResult = await contractService.executeOperation(approvalOp);
      console.log(`✅ Approval result: ${approvalResult.success}`);
      if (!approvalResult.success) {
        console.error("❌ Approval failed.");
        throw new Error("Approval failed");
      }
    } else {
      console.log("✅ No additional approval required.");
    }

    console.log("💧 Creating liquidity addition operation.");
    const liquidityOp = new LiquidityAddOperation(
      contractService,
      contracts.pool,
      {
        tokenAmount: params.amount,
        signer: params.signer,
        isClpd: params.isClpd
      }
    );
    console.log("🛠️ Executing liquidity addition operation.");
    const liquidityResult = await contractService.executeOperation(liquidityOp);
    console.log(`✅ Liquidity addition executed successfully: ${liquidityResult.success}`);
    return liquidityResult;
  }

  async executeCrossChainBridge(params: {
    amount: bigint;
    sourceChain: ChainId;
    targetChain: ChainId;
    userSigner: ethers.Wallet;
  }): Promise<TransactionResult> {
    console.log("🌉 Starting cross-chain bridge operation.");
    try {
      console.log("🔗 Retrieving services for source chain.");
      const sourceServices = this.getChainServices(params.sourceChain);
      console.log("🔗 Retrieving services for target chain.");
      const targetServices = this.getChainServices(params.targetChain);

      console.log("📊 Fetching initial total supplies.");
      const [initialSourceSupply, initialTargetSupply] = await Promise.all([
        sourceServices.contracts.clpdToken.getTotalSupply(),
        targetServices.contracts.clpdToken.getTotalSupply()
      ]);
      console.log(`📈 Initial supply on source: ${initialSourceSupply}`);
      console.log(`📈 Initial supply on target: ${initialTargetSupply}`);

      const totalBankBalance = BigInt(initialSourceSupply) + BigInt(initialTargetSupply);
      console.log(`💰 Total bank balance: ${totalBankBalance}`);

      console.log("🔥 Creating burn operation.");
      const burnOp = new BridgeCLPDOperation(
        sourceServices.contractService,
        sourceServices.contracts.clpdToken,
        {
          amount: params.amount,
          chain: params.targetChain,
          signer: params.userSigner
        }
      );
      console.log("🛠️ Executing burn operation.");
      const burnResult = await sourceServices.contractService.executeOperation(burnOp);
      console.log(`✅ Burn operation executed: ${burnResult.success}`);
      if (!burnResult.success) throw new Error("Burn operation failed");

      console.log("📊 Fetching total supplies after burn.");
      const [sourceTotalSupply, targetTotalSupply] = await Promise.all([
        sourceServices.contracts.clpd.getTotalSupply(),
        targetServices.contracts.clpd.getTotalSupply()
      ]);
      console.log(`📈 Total supply on source after burn: ${sourceTotalSupply}`);
      console.log(`📈 Total supply on target after burn: ${targetTotalSupply}`);

      const totalSupplyAllChains = BigInt(sourceTotalSupply) + BigInt(targetTotalSupply);
      console.log(`📈 Total supply across all chains: ${totalSupplyAllChains}`);

      console.log("🔍 Creating verification operations for source and target.");
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

      console.log("🛠️ Executing verification operations.");
      const [sourceVerifyResult, targetVerifyResult] = await Promise.all([
        sourceServices.contractService.executeOperation(sourceVerifyOp),
        targetServices.contractService.executeOperation(targetVerifyOp)
      ]);
      console.log(`✅ Verification on source: ${sourceVerifyResult.success}`);
      console.log(`✅ Verification on target: ${targetVerifyResult.success}`);

      if (!sourceVerifyResult.success || !targetVerifyResult.success) {
        console.error("❌ Verification operations failed after burn.");
        throw new Error("Verify operations failed after burn");
      }

      console.log("🪙 Creating mint operation.");
      const mintOp = new MintTokensOperation(
        targetServices.contractService,
        targetServices.contracts.clpdToken,
        {
          pendingUsers: [params.userSigner.address],
          pendingAmounts: [params.amount],
          agentSigner: targetServices.agentSigner
        }
      );
      console.log("🛠️ Executing mint operation.");
      const mintResult = await targetServices.contractService.executeOperation(mintOp);
      console.log(`✅ Mint operation executed: ${mintResult.success}`);
      if (!mintResult.success) throw new Error("Mint operation failed");

      console.log("📊 Fetching final total supplies.");
      const [finalSourceTotalSupply, finalTargetTotalSupply] = await Promise.all([
        sourceServices.contracts.clpd.getTotalSupply(),
        targetServices.contracts.clpd.getTotalSupply()
      ]);
      console.log(`📈 Final total supply on source: ${finalSourceTotalSupply}`);
      console.log(`📈 Final total supply on target: ${finalTargetTotalSupply}`);

      const finalTotalSupplyAllChains = BigInt(finalSourceTotalSupply) + BigInt(finalTargetTotalSupply);
      console.log(`📈 Final total supply across all chains: ${finalTotalSupplyAllChains}`);

      console.log("🔍 Creating final verification operations for source and target.");
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
      console.log(`✅ Final verification on source: ${finalSourceVerifyResult.success}`);
      console.log(`✅ Final verification on target: ${finalTargetVerifyResult.success}`);

      if (!finalSourceVerifyResult.success || !finalTargetVerifyResult.success) {
        console.error("❌ Final verification operations failed after mint.");
        throw new Error("Final verify operations failed after mint");
      }

      console.log("✅ Cross-chain bridge operation completed successfully.");
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
      console.error('❌ Error executing cross-chain bridge operation:', error);
      return { success: false, hash: '', logs: [] };
    }
  }
}