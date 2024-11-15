// src/internal/wallet/operations/pool-operations.ts
import { ContractService, Operation, TransactionResult } from "@internal/ethereum/contract-service";
import { UniswapV3LiquidityPoolContract } from "../contracts/uniswap-v3-pool";
import { UniswapRouterContract } from "../contracts/uniswap-router";
import { AERO_SWAP_CLPD_ABI, POOL_CONTRACT_ABI } from "@internal/constants/abis";
import { formatUnits } from "viem";
import { ethers } from "ethers";

export class TokenSwapOperation implements Operation {
  constructor(
    private readonly contractService: ContractService,
    private readonly routerContract: UniswapRouterContract,
    private readonly params: {
      tokenIn: string;
      tokenOut: string;
      amount: bigint;
      signer: ethers.Wallet;
    }
  ) {}

  async execute(): Promise<TransactionResult> {
    return this.contractService.callContract({
      contractAddress: this.routerContract.address,
      abi: AERO_SWAP_CLPD_ABI,
      method: 'swap',
      methodParams: [
        this.params.tokenIn,
        this.params.tokenOut,
        this.params.amount
      ],
      signer: this.params.signer
    });
  }

  getDescription(): string {
    return `Swap ${formatUnits(this.params.amount, 18)} tokens from ${this.params.tokenIn} to ${this.params.tokenOut}`;
  }
}

export class LiquidityAddOperation implements Operation {
  constructor(
    private readonly contractService: ContractService,
    private readonly poolContract: UniswapV3LiquidityPoolContract,
    private readonly params: {
      tokenAmount: bigint;
      signer: ethers.Wallet;
      isClpd: boolean;
    }
  ) {}

  async execute(): Promise<TransactionResult> {
    const method = this.params.isClpd ? 
      'investCLPDwithoutUSDC' : 
      'investUSDCwithoutCLPD';

    return this.contractService.callContract({
      contractAddress: this.poolContract.address,
      abi: POOL_CONTRACT_ABI,
      method,
      methodParams: [this.params.tokenAmount],
      signer: this.params.signer
    });
  }

  getDescription(): string {
    return `Add ${formatUnits(this.params.tokenAmount, 18)} ${
      this.params.isClpd ? 'CLPD' : 'USDC'
    } to liquidity pool`;
  }
}