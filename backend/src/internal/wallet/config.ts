import { BASE_ADDRESS , BASE_SEPOLIA_ADDRESS, TAIKO_HEKLA_ADDRESS} from "@internal/constants/address";
import { ChainConfig, ChainId } from "../wallet/types";
import { config } from "@internal";

export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  "base": {
    rpcUrl: config.RPC_URL || "",
    addresses: BASE_ADDRESS
  },
  "base-sepolia": {
    rpcUrl: config.BASE_SEPOLIA_RPC_URL || "",
    addresses: BASE_SEPOLIA_ADDRESS
  },
  "taiko-hekla-testnet": {
    rpcUrl: config.HEKLA_RPC_URL || "",
    addresses: TAIKO_HEKLA_ADDRESS
  }
};