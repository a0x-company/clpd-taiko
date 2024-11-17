// src/internal/ethereum/contract-service.ts
import { ethers, parseEther } from "ethers";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { PK_RECHARGE_ETH_CLPD } from "@internal/config";

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: Error;
  receipt?: any;
  logs?: any[];
}

export interface TransactionOptions {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  value?: bigint;
}

export interface Operation {
  execute(): Promise<TransactionResult>;
  getDescription(): string;
}

export class ContractService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly operationHistory: Operation[] = [];

  constructor(private readonly rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
  async executeOperation(operation: Operation): Promise<TransactionResult> {
    try {
      const result = await operation.execute();
      if (result.success) {
        this.operationHistory.push(operation);
      }
      return result;
    } catch (error) {
      console.error(`Operation failed: ${operation.getDescription()}`, error);
      throw error;
    }
  }

  async callContract(params: {
    contractAddress: string;
    abi: any[];
    method: string;
    methodParams: any[];
    signer: ethers.Wallet;
    options?: TransactionOptions;
  }): Promise<TransactionResult> {
    try {
      const contract = new ethers.Contract(
        params.contractAddress,
        params.abi,
        params.signer
      );

      const gasPrice = await this.getGasPrice();
      const options = {
        gasLimit: params.options?.gasLimit || BigInt(15000000),
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice,
        ...params.options
      };

      const tx = await contract[params.method](...params.methodParams, options);
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        success: true,
        receipt
      };
    } catch (error) {
      if (this.isInsufficientFundsError(error)) {
        await this.handleInsufficientFunds(params.signer.address);
        return this.callContract(params);
      }
      throw error;
    }
  }

  async getGasPrice(): Promise<bigint> {
    const client = createPublicClient({
      chain: base,
      transport: http()
    });
    return BigInt(await client.getGasPrice());
  }

  private async handleInsufficientFunds(address: string): Promise<void> {
    if (!PK_RECHARGE_ETH_CLPD) {
      throw new Error("Recharge private key not found");
    }

    const wallet = new ethers.Wallet(PK_RECHARGE_ETH_CLPD, this.provider);
    const amount = parseEther("0.00005");

    const tx = await wallet.sendTransaction({
      to: address,
      value: amount
    });
    await tx.wait();
  }

  private isInsufficientFundsError(error: any): boolean {
    return error.code === "INSUFFICIENT_FUNDS" && 
           error.message.includes("insufficient funds for gas");
  }

  getOperationHistory(): string[] {
    return this.operationHistory.map(op => op.getDescription());
  }

  get jsonRpcProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}