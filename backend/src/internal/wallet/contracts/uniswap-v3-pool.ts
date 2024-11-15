import { ethers } from "ethers";
import { ContractService } from "@internal/ethereum/contract-service";
import { POOL_CONTRACT_ABI } from "@internal/constants/abis";

export class UniswapV3LiquidityPoolContract {
  private readonly contract: ethers.Contract;

  constructor(
    public readonly address: string,
    private readonly contractService: ContractService
  ) {
    this.contract = new ethers.Contract(
      address,
      POOL_CONTRACT_ABI,
      contractService.jsonRpcProvider
    );
  }

  async getReserves(): Promise<[bigint, bigint]> {
    try {
      const reserves = await this.contract.getReserves();
      return [reserves[0], reserves[1]];
    } catch (error: any) {
      console.error(`Error getting reserves for pool ${this.address}:`, error);
      throw new Error(`Failed to get reserves: ${error.message}`);
    }
  }

  async getTotalSupply(): Promise<bigint> {
    try {
      return await this.contract.totalSupply();
    } catch (error: any) {
      console.error(`Error getting total supply for pool ${this.address}:`, error);
      throw new Error(`Failed to get total supply: ${error.message}`);
    }
  }

  async getBalance(account: string): Promise<bigint> {
    try {
      return await this.contract.balanceOf(account);
    } catch (error: any) {
      console.error(`Error getting balance for pool ${this.address}:`, error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
}