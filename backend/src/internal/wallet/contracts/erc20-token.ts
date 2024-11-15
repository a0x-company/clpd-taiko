import { ethers } from "ethers";
import { ContractService } from "@internal/ethereum/contract-service";
import { ERC20_CONTRACT_ABI } from "@internal/constants/abis";
import { formatUnits, parseUnits } from "viem";

export class ERC20TokenContract {
  private readonly contract: ethers.Contract;
  private decimals: number | null = null;
  private symbol: string | null = null;

  constructor(
    public readonly address: string,
    { jsonRpcProvider }: ContractService,
  ) {
    this.contract = new ethers.Contract(
      address,
      ERC20_CONTRACT_ABI,
      jsonRpcProvider
    );
  }

  async getAllowance(owner: string, spender: string): Promise<bigint> {
    try {
      return await this.contract.allowance(owner, spender);
    } catch (error: any) {
      console.error(`Error getting allowance for ${this.symbol || this.address}:`, error);
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }

  async getBalance(account: string): Promise<bigint> {
    try {
      return await this.contract.balanceOf(account);
    } catch (error: any) {
      console.error(`Error getting balance for ${this.symbol || this.address}:`, error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getDecimals(): Promise<number> {
    if (this.decimals !== null) return this.decimals;
    
    try {
      const decimals = await this.contract.decimals();
      this.decimals = decimals;
      return decimals;
    } catch (error: any) {
      console.error(`Error getting decimals for ${this.symbol || this.address}:`, error);
      throw new Error(`Failed to get decimals: ${error.message}`);
    }
  }

  async formatUnits(amount: bigint): Promise<string> {
    const decimals = await this.getDecimals();
    return formatUnits(amount, decimals);
  }

  async parseUnits(amount: string): Promise<bigint> {
    const decimals = await this.getDecimals();
    return parseUnits(amount, decimals);
  }
}