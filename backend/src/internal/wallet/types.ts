export type ChainId = "base" | "base-sepolia" | "taiko-hekla-testnet";

export enum WalletOperationType {
    TRANSFER = 'TRANSFER',
    SWAP = 'SWAP',
    INVEST = 'INVEST',
    CHECK_BALANCE = 'CHECK_BALANCE',
    CHECK_POSITIONS = 'CHECK_POSITIONS'
  }
  
  export interface WalletOperation {
    type: WalletOperationType;
    params: Record<string, any>;
  }

  export interface ChainConfig {
    rpcUrl: string;
    addresses: {
      CLPD: {
        address: string;
        decimals: number;
      };
      USDC?: {
        address: string;
        decimals: number;
      };
      POOL_USDC_CLPD?: string;
      AERO_SWAP?: string;
    };
  }