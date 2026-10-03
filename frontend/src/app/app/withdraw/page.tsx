"use client";

import { WalletGate } from "@/components/WalletGate";
import { WithdrawPanel } from "@/components/WithdrawPanel";

export default function WithdrawPage() {
  return (
    <WalletGate>
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
            Withdraw
          </p>
          <h1 className="mt-2 text-4xl tracking-tight">Exit position</h1>
        </div>
        <WithdrawPanel />
      </div>
    </WalletGate>
  );
}
