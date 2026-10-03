"use client";

import { StakePanel } from "@/components/StakePanel";
import { WalletGate } from "@/components/WalletGate";

export default function StakePage() {
  return (
    <WalletGate>
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
            Stake
          </p>
          <h1 className="mt-2 text-4xl tracking-tight">Deposit tokens</h1>
        </div>
        <StakePanel />
      </div>
    </WalletGate>
  );
}
