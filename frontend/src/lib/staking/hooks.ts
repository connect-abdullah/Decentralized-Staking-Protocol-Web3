"use client";

import { useEffect } from "react";
import type { Address } from "viem";
import { BaseError } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { contractAddress } from "@/lib/staking/contract";
import { stakingApi } from "@/lib/staking/api";

export function useStakingOwner() {
  return useReadContract({
    ...stakingApi.reads.owner(),
    query: { enabled: Boolean(contractAddress) },
  });
}

export function useStakingToken() {
  return useReadContract({
    ...stakingApi.reads.stakingToken(),
    query: { enabled: Boolean(contractAddress) },
  });
}

export function useRewardToken() {
  return useReadContract({
    ...stakingApi.reads.rewardToken(),
    query: { enabled: Boolean(contractAddress) },
  });
}

export function useRewardRate() {
  return useReadContract({
    ...stakingApi.reads.rewardRate(),
    query: { enabled: Boolean(contractAddress) },
  });
}

export function useRewardDuration() {
  return useReadContract({
    ...stakingApi.reads.rewardDuration(),
    query: { enabled: Boolean(contractAddress) },
  });
}

export function usePeriodFinish() {
  return useReadContract({
    ...stakingApi.reads.periodFinish(),
    query: { enabled: Boolean(contractAddress) },
  });
}

export function useLastRewardTime() {
  return useReadContract({
    ...stakingApi.reads.lastRewardTime(),
    query: { enabled: Boolean(contractAddress) },
  });
}

export function useUserStakedAmount(user?: Address) {
  return useReadContract({
    ...stakingApi.reads.getUserStakedAmount(user ?? "0x0000000000000000000000000000000000000000"),
    args: user ? [user] : undefined,
    query: { enabled: Boolean(contractAddress && user) },
  });
}

export function useUserRewards(user?: Address) {
  return useReadContract({
    ...stakingApi.reads.getUserRewards(user ?? "0x0000000000000000000000000000000000000000"),
    args: user ? [user] : undefined,
    query: { enabled: Boolean(contractAddress && user) },
  });
}

export function useUserPosition(user?: Address) {
  return useReadContract({
    ...stakingApi.reads.users(user ?? "0x0000000000000000000000000000000000000000"),
    args: user ? [user] : undefined,
    query: { enabled: Boolean(contractAddress && user) },
  });
}

export function useConnectedAccount() {
  return useAccount();
}

export function useContractWrite(onSuccess?: () => void) {
  const write = useWriteContract();
  const hash = write.data;
  const receipt = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  });

  useEffect(() => {
    if (receipt.isSuccess) onSuccess?.();
  }, [receipt.isSuccess, onSuccess]);

  // TanStack Query v5 marks a receipt query with no hash as `isPending`
  // because it has never fetched. That is not a submitted transaction.
  const confirming = Boolean(hash) && !receipt.isSuccess && !receipt.isError;
  const busy = write.isPending || confirming;
  const failure = write.error ?? receipt.error;
  const errorMessage =
    failure instanceof BaseError ? failure.shortMessage : failure?.message;

  let statusLabel = "Idle";
  if (write.isPending) statusLabel = "Confirm in wallet…";
  else if (confirming) statusLabel = "Waiting for confirmation…";
  else if (receipt.isSuccess) statusLabel = "Confirmed";
  else if (failure) statusLabel = "Failed";

  return {
    ...write,
    receipt,
    busy,
    statusLabel,
    errorMessage,
    hash,
  };
}
