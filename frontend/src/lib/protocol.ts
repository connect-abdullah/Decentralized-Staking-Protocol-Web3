"use client";

import type { Address } from "viem";
import { formatTokenAmount } from "@/lib/utils";
import {
  useGlobalRewardIndexes,
  useLastRewardTime,
  usePeriodFinish,
  useRewardDuration,
  useRewardRate,
  useRewardToken,
  useSecondClock,
  useStakingOwner,
  useStakingToken,
  useUserPosition,
  useUserRewards,
  useUserStakedAmount,
} from "@/lib/staking/hooks";
import { previewClaimable, readRewardPosition } from "@/lib/staking/rewards";
import {
  useTokenBalance,
  useTokenDecimals,
  useTokenSymbol,
} from "@/lib/erc20/hooks";
import { useAccount } from "wagmi";
import { isOwnerAddress } from "@/lib/staking/gates";

export function useProtocolData() {
  const { address, isConnected, chainId } = useAccount();
  const ownerQuery = useStakingOwner();
  const stakingTokenQuery = useStakingToken();
  const rewardTokenQuery = useRewardToken();
  const rewardRateQuery = useRewardRate();
  const rewardDurationQuery = useRewardDuration();
  const periodFinishQuery = usePeriodFinish();
  const lastRewardTimeQuery = useLastRewardTime();
  const stakedQuery = useUserStakedAmount(address);
  const rewardsQuery = useUserRewards(address);
  const positionQuery = useUserPosition(address);
  const indexesQuery = useGlobalRewardIndexes();
  const now = useSecondClock();

  const stakingToken = stakingTokenQuery.data as Address | undefined;
  const rewardToken = rewardTokenQuery.data as Address | undefined;
  const owner = ownerQuery.data as Address | undefined;

  const stakingDecimals = useTokenDecimals(stakingToken);
  const rewardDecimals = useTokenDecimals(rewardToken);
  const stakingSymbol = useTokenSymbol(stakingToken);
  const rewardSymbol = useTokenSymbol(rewardToken);
  const walletStakeBalance = useTokenBalance(stakingToken, address);
  const walletRewardBalance = useTokenBalance(rewardToken, address);

  const stkDecimals = Number(stakingDecimals.data ?? 18);
  const rwdDecimals = Number(rewardDecimals.data ?? 18);
  const stkSymbol = (stakingSymbol.data as string | undefined) ?? "STK";
  const rwdSymbol = (rewardSymbol.data as string | undefined) ?? "RWD";

  const position = readRewardPosition(positionQuery.data);
  const rewardRate = rewardRateQuery.data as bigint | undefined;
  const periodFinish = periodFinishQuery.data as bigint | undefined;
  const lastRewardTime = lastRewardTimeQuery.data as bigint | undefined;
  const claimable =
    position &&
    indexesQuery.data &&
    rewardRate !== undefined &&
    periodFinish !== undefined &&
    lastRewardTime !== undefined &&
    now !== undefined
      ? previewClaimable({
          totalStaked: indexesQuery.data.totalStaked,
          rewardPerToken: indexesQuery.data.rewardPerToken,
          rewardRate,
          lastRewardTime,
          periodFinish,
          stakedAmount: position.stakedAmount,
          storedRewards: position.rewards,
          userRewardsPaid: position.userRewardsPaid,
          timestamp: now,
        })
      : undefined;

  const refetchAll = async () => {
    await Promise.all([
      ownerQuery.refetch(),
      stakingTokenQuery.refetch(),
      rewardTokenQuery.refetch(),
      rewardRateQuery.refetch(),
      rewardDurationQuery.refetch(),
      periodFinishQuery.refetch(),
      lastRewardTimeQuery.refetch(),
      stakedQuery.refetch(),
      rewardsQuery.refetch(),
      positionQuery.refetch(),
      indexesQuery.refetch(),
      walletStakeBalance.refetch(),
      walletRewardBalance.refetch(),
    ]);
  };

  return {
    address,
    isConnected,
    chainId,
    owner,
    isOwner: isOwnerAddress(address, owner),
    stakingToken,
    rewardToken,
    stkDecimals,
    rwdDecimals,
    stkSymbol,
    rwdSymbol,
    staked: stakedQuery.data as bigint | undefined,
    rewards: rewardsQuery.data as bigint | undefined,
    claimable,
    rewardRate,
    rewardDuration: rewardDurationQuery.data as bigint | undefined,
    periodFinish,
    lastRewardTime,
    walletStakeBalance: walletStakeBalance.data as bigint | undefined,
    walletRewardBalance: walletRewardBalance.data as bigint | undefined,
    formatStaked: formatTokenAmount(stakedQuery.data as bigint | undefined, stkDecimals),
    formatClaimable: formatTokenAmount(claimable, rwdDecimals),
    formatRate: formatTokenAmount(rewardRateQuery.data as bigint | undefined, rwdDecimals, 6),
    formatWalletStake: formatTokenAmount(
      walletStakeBalance.data as bigint | undefined,
      stkDecimals
    ),
    formatWalletReward: formatTokenAmount(
      walletRewardBalance.data as bigint | undefined,
      rwdDecimals
    ),
    refetchAll,
  };
}
