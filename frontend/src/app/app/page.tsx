"use client";

import { useState } from "react";
import Link from "next/link";
import { ClaimPanel } from "@/components/ClaimPanel";
import { ProtocolInfo } from "@/components/ProtocolInfo";
import { RewardPeriod } from "@/components/RewardPeriod";
import { StakePanel } from "@/components/StakePanel";
import { StatBlock } from "@/components/StatBlock";
import { WalletGate } from "@/components/WalletGate";
import { WithdrawPanel } from "@/components/WithdrawPanel";
import { useProtocolData } from "@/lib/protocol";

type Action = "stake" | "claim" | "withdraw";

export default function DashboardPage() {
  const data = useProtocolData();
  const [action, setAction] = useState<Action | null>(null);

  const toggle = (next: Action) => {
    setAction((current) => (current === next ? null : next));
  };

  return (
    <WalletGate>
      <div className="space-y-6">
        <div className="fade-in">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl tracking-tight">Your position</h1>
          <p className="muted mt-2 max-w-2xl text-sm">
            Staked amount, claimable rewards, and the active emission window.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <StatBlock
            label="Wallet STK"
            value={`${data.formatWalletStake} ${data.stkSymbol}`}
          />
          <StatBlock
            label="Wallet RWD"
            value={`${data.formatWalletReward} ${data.rwdSymbol}`}
          />
        </section>

        <RewardPeriod
          lastRewardTime={data.lastRewardTime}
          periodFinish={data.periodFinish}
          rewardRateLabel={`${data.formatRate} ${data.rwdSymbol}/s`}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <StatBlock
            label="Staked"
            value={`${data.formatStaked} ${data.stkSymbol}`}
          />
          <StatBlock
            label="Claimable"
            value={`${data.formatClaimable} ${data.rwdSymbol}`}
            hint="Grows until the period ends"
          />
        </div>

        <section className="surface fade-in p-6">
          <h2 className="text-xl tracking-tight">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={action === "stake" ? "btn btn-primary" : "btn btn-secondary"}
              aria-pressed={action === "stake"}
              onClick={() => toggle("stake")}
            >
              Stake
            </button>
            <button
              type="button"
              className={action === "claim" ? "btn btn-primary" : "btn btn-secondary"}
              aria-pressed={action === "claim"}
              onClick={() => toggle("claim")}
            >
              Claim rewards
            </button>
            <button
              type="button"
              className={action === "withdraw" ? "btn btn-primary" : "btn btn-secondary"}
              aria-pressed={action === "withdraw"}
              onClick={() => toggle("withdraw")}
            >
              Withdraw
            </button>
            {data.isOwner ? (
              <Link href="/app/admin" className="btn btn-secondary">
                Admin
              </Link>
            ) : null}
          </div>

          {action === "stake" ? (
            <div className="mt-6">
              <StakePanel />
            </div>
          ) : null}
          {action === "claim" ? (
            <div className="mt-6">
              <ClaimPanel />
            </div>
          ) : null}
          {action === "withdraw" ? (
            <div className="mt-6">
              <WithdrawPanel />
            </div>
          ) : null}
        </section>

        <ProtocolInfo />
      </div>
    </WalletGate>
  );
}
