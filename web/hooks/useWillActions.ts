"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { REGISTRY_ADDRESS } from "@/lib/somnia";
import { CHECK_IN_REGISTRY_ABI } from "@/lib/abi";

export function useCreateWill() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const createWill = (
    beneficiaries: `0x${string}`[],
    shares: bigint[],
    interval: bigint,
    initialDepositEth?: string
  ) => {
    const value =
      initialDepositEth && parseFloat(initialDepositEth) > 0
        ? parseEther(initialDepositEth)
        : undefined;

    writeContract({
      address: REGISTRY_ADDRESS,
      abi: CHECK_IN_REGISTRY_ABI,
      functionName: "createWill",
      args: [beneficiaries, shares, interval],
      ...(value ? { value } : {}),
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return { createWill, hash, isPending, isConfirming, isConfirmed, error };
}

export function useImAlive() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const imAlive = () => {
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: CHECK_IN_REGISTRY_ABI,
      functionName: "imAlive",
      args: [],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return { imAlive, hash, isPending, isConfirming, isConfirmed, error };
}

export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const deposit = (ethAmount: string) => {
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: CHECK_IN_REGISTRY_ABI,
      functionName: "deposit",
      args: [],
      value: parseEther(ethAmount),
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return { deposit, hash, isPending, isConfirming, isConfirmed, error };
}

export function useCancelWill() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const cancelWill = () => {
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: CHECK_IN_REGISTRY_ABI,
      functionName: "cancelWill",
      args: [],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return { cancelWill, hash, isPending, isConfirming, isConfirmed, error };
}
