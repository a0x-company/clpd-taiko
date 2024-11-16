export interface BridgeEvent {
    id: string;
    block_number: number;
    timestamp: string;
    transactionHash: string;
    contractId: string;
    user: string;
    amount: string;
    chain: string;
  }
  
  export interface TokenMintedEvent {
    id: string;
    block_number: number;
    timestamp: string;
    transactionHash: string;
    contractId: string;
    agent: string;
    user: string;
    amount: string;
  }
  
  export interface TokenBurnedEvent {
    id: string;
    block_number: number;
    timestamp: string;
    transactionHash: string;
    contractId: string;
    user: string;
    amount: string;
  }
  
  export interface MultichainResponse {
    chains: {
      [chainName: string]: ChainData;
    };
  }
  
  export interface ChainData {
    totalSupply: string;
    events: {
      bridges: BridgeEvent[];
      minted: TokenMintedEvent[];
      burned: TokenBurnedEvent[];
    };
  }