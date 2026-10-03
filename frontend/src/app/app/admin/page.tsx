"use client";

import { AdminPanel } from "@/components/AdminPanel";
import { WalletGate } from "@/components/WalletGate";
import { useProtocolData } from "@/lib/protocol";

export default function AdminPage() {
  const data = useProtocolData();

  return (
    <WalletGate>
      {!data.isOwner ? (
        <section className="surface fade-in mx-auto max-w-xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
            Owner only
          </p>
          <h1 className="mt-3 text-3xl tracking-tight">Unauthorized</h1>
          <p className="muted mt-3 text-sm">
            Administration is available only to the address returned by the
            contract&apos;s `owner()` function.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
              Admin
            </p>
            <h1 className="mt-2 text-4xl tracking-tight">Owner controls</h1>
          </div>
          <AdminPanel />
        </div>
      )}
    </WalletGate>
  );
}
