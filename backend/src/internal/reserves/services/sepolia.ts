import client from '../apolloClient';
import { ERC20TokenContract } from '../../wallet/contracts/erc20-token';
import { ContractService } from '@internal/ethereum/contract-service';
import { GET_RECENT_BRIDGES, GET_RECENT_TOKENS_BURNED, GET_RECENT_TOKENS_MINTED } from '../querys';
import { ethers } from 'ethers';

export class SepoliaService {
  private erc20Contract: ERC20TokenContract;

  constructor() {
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
    console.log('🔧 RPC_URL:', rpcUrl);
    if (!rpcUrl) {
      throw new Error("❌ La variable de entorno RPC_URL no está definida.");
    }
    const contractService = new ContractService(rpcUrl);
    this.erc20Contract = new ERC20TokenContract(
      "0xe2C6D205F0EF4A215B66B25437BbC5C8d59525FE",
      contractService
    );
    console.log('🔧 CLPDTokenContract inicializado con éxito.');
  }

  async getProvider() {
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
    console.log('🔧 Obteniendo proveedor con RPC_URL:', rpcUrl);
    if (!rpcUrl) {
      throw new Error("❌ La variable de entorno RPC_URL no está definida.");
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log('🔧 Proveedor inicializado:', provider);
    return provider;
  }

  async getRecentEvents() {
    console.log('🔄 Iniciando la obtención de eventos recientes de Sepolia.');
    try {
      console.log('🔄 Ejecutando consultas GraphQL para obtener eventos recientes.');
      const [bridgesResult, mintedResult, burnedResult] = await Promise.all([
        client.query({ query: GET_RECENT_BRIDGES }),
        client.query({ query: GET_RECENT_TOKENS_MINTED }),
        client.query({ query: GET_RECENT_TOKENS_BURNED })
      ]);

      console.log('✅ Resultados de consultas recibidos.');

      console.log('📊 Processing Bridges:', bridgesResult.data.tokensBridges);
      console.log('📊 Processing Tokens Minted:', mintedResult.data.tokensMinteds);
      console.log('📊 Processing Tokens Burned:', burnedResult.data.tokensBurneds);

      const bridges = bridgesResult.data.tokensBridges;
      const minted = mintedResult.data.tokensMinteds;
      const burned = burnedResult.data.tokensBurneds;

      const totalSupply = await this.erc20Contract.getTotalSupply();
      console.log('📈 Total Supply obtenida:', totalSupply.toString());

      const response = {
        bridges,
        minted,
        burned,
        totalSupply: totalSupply.toString(),
      };

      console.log('✅ Datos procesados correctamente:', response);

      return response;
    } catch (error: unknown) {
      console.error('❌ Error al obtener eventos recientes de Sepolia:', error);
      throw error;
    }
  }
}