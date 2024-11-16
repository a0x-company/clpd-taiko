export interface BridgeRequest {
  userAddress: string;
  networkIn: "baseSepolia" | "taikoHekla";
  networkOut: "baseSepolia" | "taikoHekla";
  amount: number;
}

export interface NetworkConfig {
  rpc: string;
  contractAddress: string;
  abi: any;
  minGasLimit: string;
  isEncrypted: boolean;
}

export interface ValidatedBridgeRequest extends BridgeRequest {
  decryptedKey: string;
}
