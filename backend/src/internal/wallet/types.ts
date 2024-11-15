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