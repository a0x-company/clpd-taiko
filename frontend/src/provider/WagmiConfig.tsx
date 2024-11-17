import React from "react";
import { http } from "viem";
import { WagmiProvider, createConfig } from "wagmi";
import { base, baseSepolia, taikoHekla } from "wagmi/chains";

const isDevelopment = process.env.NODE_ENV === "development";
export const selectedChain = !isDevelopment ? base : base;
export const CHAIN_SYMBOL = !isDevelopment ? "base" : "base";

const config = createConfig({
  chains: [selectedChain, taikoHekla, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [taikoHekla.id]: http(),
  },
});

type WagmiConfigProps = {
  children: React.ReactNode;
};

const WagmiConfig: React.FC<WagmiConfigProps> = ({ children }) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};

export default WagmiConfig;
