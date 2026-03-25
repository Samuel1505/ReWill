"use client";

import { useReadContract } from "wagmi";
import { REGISTRY_ADDRESS } from "@/lib/somnia";
import { CHECK_IN_REGISTRY_ABI } from "@/lib/abi";
import type { Will } from "@/types";

export function useWill(address: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: CHECK_IN_REGISTRY_ABI,
    functionName: "getWill",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const will = data as Will | undefined;

  return {
    will: will?.active ? will : undefined,
    rawWill: will,
    isLoading,
    error,
    refetch,
  };
}
