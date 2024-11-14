import { createConfig, http } from "@wagmi/core";
import { base, baseSepolia } from "@wagmi/core/chains";
import { createClient } from "viem";

export const CHAIN_SYMBOL = "base";
export const selectedChain = base;

export const config = createConfig({
  chains: [base, baseSepolia],
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});
