// react
import { useEffect, useRef } from "react";

// abi
import aeroSwapCLPDABI from "@/constants/aero-swap-CLPD-abi.json";

// constants
import { addresses } from "@/constants/address";
import { CHAIN_SYMBOL, selectedChain } from "@/provider/config";

// wagmi
import { getAddress } from "viem";
import { useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export const useInvest = (
  _amount: bigint,
  _token: "CLPD" | "USDC",
  onSuccess?: () => void,
  refetch: boolean = false
) => {
  const contractAddress = getAddress(addresses[CHAIN_SYMBOL].investment);

  const simulate = useSimulateContract({
    address: contractAddress,
    chainId: selectedChain.id,
    abi: aeroSwapCLPDABI,
    functionName: _token === "CLPD" ? " investCLPDwithoutUSDC" : "investUSDCwithoutCLPD",
    args: [_amount],
    query: {
      enabled: _amount > 0 && refetch,
    },
  });

  console.log(simulate);

  const write = useWriteContract();

  const wait = useWaitForTransactionReceipt({
    hash: write.data,
    query: {
      meta: {
        successMessage: `Successfully swapped`,
      },
    },
  });

  const onSuccessExecuted = useRef(false);
  const lastTransactionHash = useRef<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    if (write.data && write.data !== lastTransactionHash.current) {
      lastTransactionHash.current = write.data;
      onSuccessExecuted.current = false;
    }
    if (wait.isSuccess && onSuccess && !onSuccessExecuted.current) {
      onSuccess();
      onSuccessExecuted.current = true;
    }
  }, [wait.isSuccess, onSuccess, write.data]);

  return {
    simulate,
    isLoading: write.isPending || wait.isLoading || (simulate.isPending && !simulate.isFetched),
    write,
    wait,
  };
};
