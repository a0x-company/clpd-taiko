// react
import { useEffect, useMemo } from "react";
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

  const clpdBalanceFormatted = useMemo(() => {
    const formattedBalance =
      !clpdBalance.data || !clpdBalance.data[0]
        ? "0"
        : Number(formatUnits(clpdBalance.data?.[0]! as bigint, 18) || 0).toFixed(2);

    console.log("Formatted Balance:", formattedBalance);
    return formattedBalance;
  }, [clpdBalance.data]);

  return {
    clpdBalanceFormatted,
    refetch: clpdBalance.refetch,
    isLoading: clpdBalance.isLoading,
    error: clpdBalance.error,
  };
};
