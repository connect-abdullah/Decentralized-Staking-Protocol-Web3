"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { BaseError } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { contractAddress } from "@/lib/staking/contract";
import { stakingApi } from "@/lib/staking/api";
import { targetChain } from "@/lib/wagmi";

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

export function useSecondClock() {
  const [now, setNow] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    const tick = () => setNow(BigInt(Math.floor(Date.now() / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

/** Slots 0 and 1 are totalStaked and rewardPerToken in StakingProtocol. */
export function useGlobalRewardIndexes() {
  const client = usePublicClient({ chainId: targetChain.id });

  return useQuery({
    queryKey: ["staking", "reward-indexes", contractAddress],
    enabled: Boolean(client && contractAddress),
    refetchInterval: 4_000,
    queryFn: async () => {
      if (!client || !contractAddress) {
        throw new Error("Staking contract is not configured.");
      }
      const [totalRaw, perTokenRaw] = await Promise.all([
        client.getStorageAt({ address: contractAddress, slot: "0x0" }),
        client.getStorageAt({ address: contractAddress, slot: "0x1" }),
      ]);
      return {
        totalStaked: BigInt(totalRaw ?? "0x0"),
        rewardPerToken: BigInt(perTokenRaw ?? "0x0"),
      };
    },
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
