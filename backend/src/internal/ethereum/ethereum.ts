import { RPC_URL } from "@internal/config";
import { ethers } from "ethers";

export class EthereumService {
  public provider = new ethers.JsonRpcProvider(RPC_URL);

  async getSigner(privateKey: string): Promise<ethers.Wallet> {
    return new ethers.Wallet(privateKey, this.provider);
  }
}
