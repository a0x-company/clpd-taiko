import { ethers, formatUnits } from "ethers";
import { ContractService } from "@internal/ethereum/contract-service";
import { AERO_SWAP_CLPD_ABI } from "@internal/constants/abis";

export class UniswapRouterContract {
  private readonly contract: ethers.Contract;

  constructor(
    public readonly address: string,
    { jsonRpcProvider }: ContractService
  ) {
    this.contract = new ethers.Contract(
      address,
      AERO_SWAP_CLPD_ABI,
      jsonRpcProvider
    );
  }

  async getAmountOut(
    amountIn: bigint,
    tokenIn: string,
    tokenOut: string
  ): Promise<bigint> {
    try {
      return await this.contract.getAmountOut(amountIn, tokenIn, tokenOut);
    } catch (error: any) {
      console.error(`Error getting amount out:`, error);
      throw new Error(`Failed to get amount out: ${error.message}`);
    }
  }

  async getPriceOfCLPDInUSDC(): Promise<number> {
    try {
      const price = await this.contract.getPriceOfCLPDInUSDC();
      return Number(formatUnits(price, 6)); 
    } catch (error: any) {
      console.error(`Error getting CLPD price:`, error);
      throw new Error(`Failed to get CLPD price: ${error.message}`);
    }
  }

  async getPriceOfUSDCInCLPD(): Promise<number> {
    try {
      const price = await this.contract.getPriceOfUSDCInCLPD();
      return Number(formatUnits(price, 18)); 
    } catch (error: any) {
      console.error(`Error getting USDC price:`, error);
      throw new Error(`Failed to get USDC price: ${error.message}`);
    }
  }
}