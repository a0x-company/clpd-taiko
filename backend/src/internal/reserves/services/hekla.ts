import { CLPDTokenContract } from '../../wallet/contracts/clpd-token';
import { ContractService } from '@internal/ethereum/contract-service';
import { ethers } from 'ethers';

export class TaikoHeklaTestnetService {
  private clpdTokenContract: CLPDTokenContract;

  constructor() {
    const rpcUrl = process.env.HEKLA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("❌ La variable de entorno HEKLA_RPC_URL no está definida.");
    }

    const contractService = new ContractService(rpcUrl);
    this.clpdTokenContract = new CLPDTokenContract(
      "0x53c04d5FC9F8d5c4f3C45B4da6617868ECEaF636",
      contractService
    );
  }

  async getProvider() {
    const rpcUrl = process.env.HEKLA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("❌ La variable de entorno HEKLA_RPC_URL no está definida.");
    }
    return new ethers.JsonRpcProvider(rpcUrl);
  }
  
  async getRecentEvents() {
    try {
      const provider = await this.getProvider();
      const latestBlock = await provider.getBlockNumber();
      const numberOfBlocks = 100000;
      const fromBlock = Math.max(latestBlock - numberOfBlocks, 0);
      const toBlock = latestBlock;

      const [bridges, minted, burned] = await Promise.all([
        this.clpdTokenContract.getEvents('TokensBridge', fromBlock, toBlock),
        this.clpdTokenContract.getEvents('TokensMinted', fromBlock, toBlock),
        this.clpdTokenContract.getEvents('TokensBurned', fromBlock, toBlock)
      ]);

      const totalSupply = await this.clpdTokenContract.getTotalSupply();

      return {
        bridges,
        minted,
        burned,
        totalSupply: totalSupply.toString(),
      };
    } catch (error) {
      console.error('❌ Error al obtener eventos recientes de Taiko-Hekla-Testnet:', error);
      throw error;
    }
  }
}