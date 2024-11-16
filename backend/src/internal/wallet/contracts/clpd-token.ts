import { Contract } from 'ethers';
import { ContractService } from '@internal/ethereum/contract-service';
import { CLPD_TOKEN_ABI } from '@internal/constants/abis';
import { Log } from 'ethers';

export class CLPDTokenContract {
  private contract: Contract;

  constructor(address: string, contractService: ContractService) {
    console.log('🔧 Inicializando CLPDTokenContract con la dirección:', address);
    this.contract = new Contract(address, CLPD_TOKEN_ABI, contractService.getProvider());
    console.log('🔧 CLPDTokenContract inicializado correctamente.');
  }

  async getEvents(eventName: string, fromBlock: number, toBlock: number) {
    console.log(`🔄 Intentando obtener eventos: ${eventName} desde el bloque ${fromBlock} hasta el ${toBlock}`);
    if (!this.contract.filters[eventName]) {
      throw new Error(`❌ El evento ${eventName} no existe en el contrato.`);
    }
    console.log(`✅ Evento ${eventName} encontrado en los filtros del contrato.`);
    const filter = this.contract.filters[eventName]();
    console.log('🔧 Filtro de evento creado:', filter);
    const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
    console.log(`✅ Se obtuvieron ${events.length} eventos de ${eventName}.`);
    return events;
  }

  async getTotalSupply(): Promise<string> {
    console.log('🔄 Obteniendo el totalSupply del contrato.');
    const totalSupply = await this.contract.totalSupply();
    console.log('✅ totalSupply obtenido:', totalSupply.toString());
    return totalSupply.toString();
  }
}