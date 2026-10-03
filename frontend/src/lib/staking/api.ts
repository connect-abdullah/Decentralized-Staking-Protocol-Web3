import type { Address } from "viem";
import { contractAbi, contractAddress } from "@/lib/staking/contract";
import { targetChain } from "@/lib/wagmi";

const base = { address: contractAddress, abi: contractAbi } as const;

export const stakingApi = {
  reads: {
    owner: () => ({ ...base, functionName: "owner" as const }),
    stakingToken: () => ({ ...base, functionName: "stakingToken" as const }),
    rewardToken: () => ({ ...base, functionName: "rewardToken" as const }),
    rewardRate: () => ({ ...base, functionName: "rewardRate" as const }),
    rewardDuration: () => ({
      ...base,
      functionName: "rewardDuration" as const,
    }),
    periodFinish: () => ({ ...base, functionName: "periodFinish" as const }),
    lastRewardTime: () => ({
      ...base,
      functionName: "lastRewardTime" as const,
    }),
    users: (user: Address) => ({
      ...base,
      functionName: "users" as const,
      args: [user] as const,
    }),
    getUserStakedAmount: (user: Address) => ({
      ...base,
      functionName: "getUserStakedAmount" as const,
      args: [user] as const,
    }),
    getUserRewards: (user: Address) => ({
      ...base,
      functionName: "getUserRewards" as const,
      args: [user] as const,
    }),
  },
  writes: {
    stake: (amount: bigint) => ({
      ...base,
      functionName: "stake" as const,
      args: [amount] as const,
      chainId: targetChain.id,
    }),
    withdrawAmount: (amount: bigint) => ({
      ...base,
      functionName: "withdrawAmount" as const,
      args: [amount] as const,
      chainId: targetChain.id,
    }),
    withdrawAll: () => ({
      ...base,
      functionName: "withdrawAll" as const,
      chainId: targetChain.id,
    }),
    claimRewards: () => ({
      ...base,
      functionName: "claimRewards" as const,
      chainId: targetChain.id,
    }),
    addRewards: (rewardTokens: bigint, duration: bigint) => ({
      ...base,
      functionName: "addRewards" as const,
      args: [rewardTokens, duration] as const,
      chainId: targetChain.id,
    }),
  },
};

export function withContract<T extends { address: Address | undefined }>(
  call: T
): T & { address: Address } {
  if (!call.address) throw new Error("Contract address is not configured.");
  return { ...call, address: call.address };
}
