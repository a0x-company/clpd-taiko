import { Log, Interface, Provider } from 'ethers';
import { TaikoHeklaTestnetService } from './services/hekla';
import { SepoliaService } from './services/sepolia';
import { MultichainResponse, BridgeEvent, TokenMintedEvent, TokenBurnedEvent, ChainData } from './types';
import { CLPD_TOKEN_ABI } from '@internal/constants/abis'; // Asegúrate de proporcionar la ruta correcta al ABI

export class MultichainService {
  private heklaService: TaikoHeklaTestnetService;
  private sepoliaService: SepoliaService;
  private interface: Interface;

  constructor() {
    this.heklaService = new TaikoHeklaTestnetService();
    this.sepoliaService = new SepoliaService();
    this.interface = new Interface(CLPD_TOKEN_ABI);
  }

  /**
   * Obtiene el timestamp de un bloque dado.
   * @param provider Proveedor de ethers para interactuar con la blockchain.
   * @param blockNumber Número del bloque.
   * @returns Timestamp en formato ISO.
   */
  private async getTimestamp(provider: Provider, blockNumber: number): Promise<string> {
    const block = await provider.getBlock(blockNumber) || { timestamp: 0 };
    return new Date(block.timestamp * 1000).toISOString();
  }

  /**
   * Mapea un Log a BridgeEvent.
   * @param log Log de ethers.
   * @param chain Nombre de la cadena.
   * @param provider Proveedor de ethers para obtener el timestamp.
   * @returns Objeto BridgeEvent.
   */
  private async mapLogToBridgeEvent(log: Log, chain: string, provider: Provider): Promise<BridgeEvent> {
    const parsedLog = this.interface.parseLog(log) || { args: { user: '', amount: 0, from: '', toBridge: '' } };
    const timestamp = await this.getTimestamp(provider, log.blockNumber);

    return {
      id: log.transactionHash,
      block_number: log.blockNumber,
      timestamp,
      transactionHash: log.transactionHash,
      contractId: log.address,
      user: parsedLog.args.user,
      amount: parsedLog.args.amount.toString(),
      chain,
    };
  }

  /**
   * Mapea un Log a TokenMintedEvent.
   * @param log Log de ethers.
   * @param chain Nombre de la cadena.
   * @param provider Proveedor de ethers para obtener el timestamp.
   * @returns Objeto TokenMintedEvent.
   */
  private async mapLogToTokenMintedEvent(log: Log, chain: string, provider: Provider): Promise<TokenMintedEvent> {
    const parsedLog = this.interface.parseLog(log) || { args: { agent: '', user: '', amount: 0, from: '', toBridge: '' } };
    const timestamp = await this.getTimestamp(provider, log.blockNumber);

    return {
      id: log.transactionHash,
      block_number: log.blockNumber,
      timestamp,
      transactionHash: log.transactionHash,
      contractId: log.address,
      agent: parsedLog.args.agent,
      user: parsedLog.args.user,
      amount: parsedLog.args.amount.toString(),
    };
  }

  /**
   * Mapea un Log a TokenBurnedEvent.
   * @param log Log de ethers.
   * @param chain Nombre de la cadena.
   * @param provider Proveedor de ethers para obtener el timestamp.
   * @returns Objeto TokenBurnedEvent.
   */
  private async mapLogToTokenBurnedEvent(log: Log, chain: string, provider: Provider): Promise<TokenBurnedEvent> {
    const parsedLog = this.interface.parseLog(log) || { args: { user: '', amount: 0, from: '', toBridge: '' } };
    const timestamp = await this.getTimestamp(provider, log.blockNumber);

    return {
      id: log.transactionHash,
      block_number: log.blockNumber,
      timestamp,
      transactionHash: log.transactionHash,
      contractId: log.address,
      user: parsedLog.args.user,
      amount: parsedLog.args.amount.toString(),
    };
  }

  /**
   * Obtiene los eventos recientes y el total de suministro de todas las cadenas configuradas.
   */
  async getAllRecentData(): Promise<MultichainResponse> {
    try {
      const [heklaData, sepoliaData] = await Promise.all([
        this.heklaService.getRecentEvents(),
        this.sepoliaService.getRecentEvents(),
      ]);

      // Obtener proveedores de cada servicio para obtener el timestamp
      const heklaProvider = await this.heklaService.getProvider();

      // Mapear eventos de HeKlaTestnet
      const heklaBridges = await Promise.all(
        heklaData.bridges.map(log => this.mapLogToBridgeEvent(log, 'HeKlaTestnet', heklaProvider))
      );
      const heklaMinted = await Promise.all(
        heklaData.minted.map(log => this.mapLogToTokenMintedEvent(log, 'HeKlaTestnet', heklaProvider))
      );
      const heklaBurned = await Promise.all(
        heklaData.burned.map(log => this.mapLogToTokenBurnedEvent(log, 'HeKlaTestnet', heklaProvider))
      );

      const response: MultichainResponse = {
        chains: {
          HeKlaTestnet: {
            totalSupply: heklaData.totalSupply,
            events: {
              bridges: heklaBridges,
              minted: heklaMinted,
              burned: heklaBurned,
            },
          },
          Sepolia: {
            totalSupply: sepoliaData.totalSupply,
            events: {
              bridges: sepoliaData.bridges,
              minted: sepoliaData.minted,
              burned: sepoliaData.burned,
            },
          },
        },
      };

      return response;
    } catch (error) {
      console.error('❌ Error al obtener datos de múltiples cadenas:', error);
      throw error;
    }
  }
}