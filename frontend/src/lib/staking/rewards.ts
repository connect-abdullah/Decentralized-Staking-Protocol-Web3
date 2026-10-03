const PRECISION = 10n ** 18n;

export type RewardPosition = {
  stakedAmount: bigint;
  rewards: bigint;
  userRewardsPaid: bigint;
};

type PositionResult = {
  stakedAmount?: bigint;
  rewards?: bigint;
  userRewardsPaid?: bigint;
  0?: bigint;
  1?: bigint;
  2?: bigint;
};

export function readRewardPosition(data: unknown): RewardPosition | undefined {
  if (data == null || typeof data !== "object") return undefined;
  const row = data as PositionResult;
  const stakedAmount = row.stakedAmount ?? row[0];
  const rewards = row.rewards ?? row[1];
  const userRewardsPaid = row.userRewardsPaid ?? row[2];
  if (
    typeof stakedAmount !== "bigint" ||
    typeof rewards !== "bigint" ||
    typeof userRewardsPaid !== "bigint"
  ) {
    return undefined;
  }
  return { stakedAmount, rewards, userRewardsPaid };
}

/**
 * Same accounting as StakingProtocol.updateReward, evaluated at `timestamp`
 * instead of the latest block. Local Hardhat only moves block.timestamp when
 * a transaction is mined, so the UI passes the current time.
 */
export function previewClaimable(input: {
  totalStaked: bigint;
  rewardPerToken: bigint;
  rewardRate: bigint;
  lastRewardTime: bigint;
  periodFinish: bigint;
  stakedAmount: bigint;
  storedRewards: bigint;
  userRewardsPaid: bigint;
  timestamp: bigint;
}): bigint {
  let currentRewardPerToken = input.rewardPerToken;

  if (
    input.totalStaked > 0n &&
    input.periodFinish > input.lastRewardTime &&
    input.timestamp > input.lastRewardTime
  ) {
    const applicableTime =
      input.timestamp < input.periodFinish ? input.timestamp : input.periodFinish;
    if (applicableTime > input.lastRewardTime) {
      const elapsed = applicableTime - input.lastRewardTime;
      currentRewardPerToken +=
        (elapsed * input.rewardRate * PRECISION) / input.totalStaked;
    }
  }

  if (currentRewardPerToken < input.userRewardsPaid) return input.storedRewards;

  const pending =
    ((currentRewardPerToken - input.userRewardsPaid) * input.stakedAmount) /
    PRECISION;
  return input.storedRewards + pending;
}
