import { ContractService, TransactionResult } from "@internal/ethereum/contract-service";
import { ERC20TokenContract } from "./contracts/erc20-token";
import { UniswapV3LiquidityPoolContract } from "./contracts/uniswap-v3-pool";
import { UniswapRouterContract } from "./contracts/uniswap-router";
import { TokenApprovalOperation, TokenSwapOperation, LiquidityAddOperation } from "./operations";
import { BASE_ADDRESS } from "@internal/constants/address";
import { ethers } from "ethers";

export class WalletOperationMediator {
  constructor(
    private readonly contractService: ContractService,
    private readonly contracts: {
      clpd: ERC20TokenContract;
      usdc: ERC20TokenContract;
      pool: UniswapV3LiquidityPoolContract;
      router: UniswapRouterContract;
    }
  ) {}

  async executeSwapWithApproval(params: {
    tokenIn: ERC20TokenContract;
    tokenOut: ERC20TokenContract;
    amount: bigint;
    signer: ethers.Wallet;
  }): Promise<TransactionResult> {
    // Verificar allowance actual
    const currentAllowance = await params.tokenIn.getAllowance(
      params.signer.address,
      this.contracts.router.address
    );

    // Aprobar si es necesario
    if (currentAllowance < params.amount) {
      const approvalOp = new TokenApprovalOperation(
        this.contractService,
        params.tokenIn,
        {
          spender: this.contracts.router.address,
          amount: params.amount,
          signer: params.signer
        }
      );

      const approvalResult = await this.contractService.executeOperation(approvalOp);
      if (!approvalResult.success) {
        throw new Error("Approval failed");
      }
    }

    // Ejecutar swap
    const swapOp = new TokenSwapOperation(
      this.contractService,
      this.contracts.router,
      {
        tokenIn: params.tokenIn.address,
        tokenOut: params.tokenOut.address,
        amount: params.amount,
        signer: params.signer
      }
    );

    return this.contractService.executeOperation(swapOp);
  }

  async executeLiquidityAdditionWithApproval(params: {
    token: ERC20TokenContract;
    amount: bigint;
    signer: ethers.Wallet;
    isClpd: boolean;
  }): Promise<TransactionResult> {
    // Verificar allowance actual
    const currentAllowance = await params.token.getAllowance(
      params.signer.address,
      BASE_ADDRESS.AERO_SWAP
    );

    // Aprobar si es necesario
    if (currentAllowance < params.amount) {
      const approvalOp = new TokenApprovalOperation(
        this.contractService,
        params.token,
        {
          spender: BASE_ADDRESS.AERO_SWAP,
          amount: params.amount,
          signer: params.signer
        }
      );

      const approvalResult = await this.contractService.executeOperation(approvalOp);
      if (!approvalResult.success) {
        throw new Error("Approval failed");
      }
    }

    // Ejecutar adición de liquidez
    const liquidityOp = new LiquidityAddOperation(
      this.contractService,
      this.contracts.pool,
      {
        tokenAmount: params.amount,
        signer: params.signer,
        isClpd: params.isClpd
      }
    );

    return this.contractService.executeOperation(liquidityOp);
  }
}