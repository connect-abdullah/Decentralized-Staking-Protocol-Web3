"use client";

import { WalletGate } from "@/components/WalletGate";
import { useActivity } from "@/providers/activity_provider";

export default function ActivityPage() {
  const { items } = useActivity();

  return (
    <WalletGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--violet)]">
            Activity
          </p>
          <h1 className="mt-2 text-4xl tracking-tight">Session transactions</h1>
          <p className="muted mt-2 text-sm">
            Local session activity only—not indexed on-chain history.
          </p>
        </div>

        <section className="surface fade-in">
          {items.length === 0 ? (
            <p className="muted p-6 text-sm">
              No transactions in this session yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-5">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="muted mt-1 text-xs">
                      {new Date(item.at).toLocaleString()}
                    </p>
                    {item.hash ? (
                      <p className="muted mt-2 break-all font-[family-name:var(--font-mono)] text-xs">
                        {item.hash}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={
                      item.status === "confirmed"
                        ? "text-[var(--success)]"
                        : item.status === "failed"
                          ? "text-[var(--danger)]"
                          : "text-[var(--warning)]"
                    }
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </WalletGate>
  );
}
