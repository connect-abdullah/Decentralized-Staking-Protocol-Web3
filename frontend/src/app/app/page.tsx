"use client";

import Link from "next/link";
import { ProtocolInfo } from "@/components/ProtocolInfo";
import { RewardPeriod } from "@/components/RewardPeriod";
import { StatBlock } from "@/components/StatBlock";
import { WalletGate } from "@/components/WalletGate";
import { useProtocolData } from "@/lib/protocol";

export default function DashboardPage() {
  const data = useProtocolData();

  return (
    <WalletGate>
      <div className="space-y-6">
        <div className="fade-in">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl tracking-tight">Your position</h1>
          <p className="muted mt-2 max-w-2xl text-sm">
            Staked amount, on-chain rewards, and the active emission window—read
            directly from the staking contract.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock
            label="Staked"
            value={`${data.formatStaked} ${data.stkSymbol}`}
          />
          <StatBlock
            label="On-chain rewards"
            value={`${data.formatRewards} ${data.rwdSymbol}`}
            hint="From getUserRewards"
          />
          <StatBlock
            label="Claimable"
            value={`${data.formatRewards} ${data.rwdSymbol}`}
          />
          <StatBlock
            label="Reward rate"
            value={`${data.formatRate} ${data.rwdSymbol}/s`}
          />
        </div>

        <RewardPeriod
          lastRewardTime={data.lastRewardTime}
          periodFinish={data.periodFinish}
          rewardRateLabel={`${data.formatRate} ${data.rwdSymbol}/s`}
        />

        <section className="surface fade-in p-6">
          <h2 className="text-xl tracking-tight">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/app/stake" className="btn btn-primary">
              Stake
            </Link>
            <Link href="/app/rewards" className="btn btn-secondary">
              Claim rewards
            </Link>
            <Link href="/app/withdraw" className="btn btn-secondary">
              Withdraw
            </Link>
            {data.isOwner ? (
              <Link href="/app/admin" className="btn btn-secondary">
                Admin
              </Link>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatBlock
            label="Wallet STK"
            value={`${data.formatWalletStake} ${data.stkSymbol}`}
          />
          <StatBlock
            label="Wallet RWD"
            value={`${data.formatWalletReward} ${data.rwdSymbol}`}
          />
          <StatBlock
            label="Reward duration"
            value={
              data.rewardDuration !== undefined
                ? `${data.rewardDuration.toString()}s`
                : "—"
            }
          />
        </section>

        <ProtocolInfo />
      </div>
    </WalletGate>
  );
}
