// react
import { useMemo } from "react";
// viem
import { erc20Abi, formatUnits, zeroAddress } from "viem";
// wagmi
import { useReadContracts } from "wagmi";
// constants
import { addresses } from "@/constants/address";
import clpdTaikoABI from "@/constants/CLPD-taiko-abi.json";

// provider
import { selectedChain } from "@/provider/WagmiConfig";
import { taikoHekla } from "viem/chains";

export const useCLPDBalance = ({
  address,
  chainId,
  _chainName,
}: {
  address: `0x${string}` | undefined;
  chainId?: number;
  _chainName?: string;
}) => {
  const chainName = _chainName ?? selectedChain.name.toLowerCase();
  console.log("Fetching balance for address:", address);
  console.log("chainName", chainName);
  /* CLPD Balance */
  const clpdBalance = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: addresses[chainName].CLPD.address,
        abi: chainId === taikoHekla.id ? clpdTaikoABI : erc20Abi,
        functionName: "balanceOf",
        args: [address ?? zeroAddress],
        chainId: chainId ?? selectedChain.id,
      },
      {
        address: addresses[chainName].CLPD.address,
        abi: chainId === taikoHekla.id ? clpdTaikoABI : erc20Abi,
        functionName: "decimals",
        chainId: chainId ?? selectedChain.id,
      },
    ],
  });
  console.log("clpdBalance", clpdBalance);
  const clpdBalanceFormatted = useMemo(() => {
    if (!clpdBalance.data || !clpdBalance.data[0]) return "0";
    return Number(formatUnits(clpdBalance.data?.[0]! as bigint, 18) || 0).toFixed(2);
  }, [clpdBalance.data]);

  return { clpdBalanceFormatted, refetch: clpdBalance.refetch };
};
