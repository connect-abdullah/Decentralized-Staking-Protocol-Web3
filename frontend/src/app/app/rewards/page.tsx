"use client";

import { ClaimPanel } from "@/components/ClaimPanel";
import { RewardPeriod } from "@/components/RewardPeriod";
import { StatBlock } from "@/components/StatBlock";
import { WalletGate } from "@/components/WalletGate";
import { useProtocolData } from "@/lib/protocol";

export default function RewardsPage() {
  const data = useProtocolData();

  return (
    <WalletGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
            Rewards
          </p>
          <h1 className="mt-2 text-4xl tracking-tight">Earnings</h1>
          <p className="muted mt-2 text-sm">
            Historical reward indexes are not available from this ABI. Session
            transaction results appear on the Activity page.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatBlock
            label="Staked"
            value={`${data.formatStaked} ${data.stkSymbol}`}
          />
          <StatBlock
            label="Earned (on-chain)"
            value={`${data.formatRewards} ${data.rwdSymbol}`}
          />
          <StatBlock
            label="Claimable"
            value={`${data.formatRewards} ${data.rwdSymbol}`}
          />
        </div>

        <RewardPeriod
          lastRewardTime={data.lastRewardTime}
          periodFinish={data.periodFinish}
          rewardRateLabel={`${data.formatRate} ${data.rwdSymbol}/s`}
        />

        <ClaimPanel />
      </div>
    </WalletGate>
  );
}
