"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";

export function RewardPeriod({
  lastRewardTime,
  periodFinish,
  rewardRateLabel,
}: {
  lastRewardTime?: bigint;
  periodFinish?: bigint;
  rewardRateLabel: string;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const start = lastRewardTime !== undefined ? Number(lastRewardTime) : 0;
  const end = periodFinish !== undefined ? Number(periodFinish) : 0;
  const active = end > 0 && now < end;
  const ended = end > 0 && now >= end;
  const remaining = active ? end - now : 0;
  const countdown = formatCountdown(remaining);
  const duration = Math.max(1, end - start);
  const elapsed = Math.min(duration, Math.max(0, now - start));
  const progress = end > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  return (
    <section className="surface fade-in p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="muted text-xs uppercase tracking-[0.14em]">
            Reward Period
          </p>
          <h2 className="mt-2 text-2xl tracking-tight">
            {ended ? "Reward period ended" : active ? "Emission active" : "No active period"}
          </h2>
          <p className="muted mt-2 text-sm">Reward rate: {rewardRateLabel}</p>
        </div>
        <div className="text-right">
          <p className="muted text-xs uppercase tracking-[0.14em]">Ends in</p>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-2xl tabular-nums">
            {active ? countdown.label : "00 : 00 : 00 : 00"}
          </p>
          <p className="muted mt-1 text-xs">D &nbsp; H &nbsp; M &nbsp; S</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="relative h-2 overflow-hidden bg-[var(--bg-soft)]">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--violet)] transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="muted mt-3 flex justify-between text-xs font-[family-name:var(--font-mono)]">
          <span>
            Started{" "}
            {start
              ? new Date(start * 1000).toLocaleString()
              : "—"}
          </span>
          <span>
            Ends{" "}
            {end ? new Date(end * 1000).toLocaleString() : "—"}
          </span>
        </div>
      </div>
    </section>
  );
}
