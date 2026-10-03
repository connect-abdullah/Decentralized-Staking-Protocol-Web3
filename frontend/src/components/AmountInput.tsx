"use client";

import { cn } from "@/lib/utils";

const PERCENTS = [25, 50, 75, 100] as const;

export function AmountInput({
  label,
  value,
  onChange,
  max,
  symbol,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: bigint;
  symbol?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        {max !== undefined ? (
          <span className="muted text-xs font-[family-name:var(--font-mono)]">
            Available: {formatPreview(max)} {symbol ?? ""}
          </span>
        ) : null}
      </div>
      <input
        className="field"
        inputMode="decimal"
        placeholder="0.0"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {max !== undefined && max > 0n ? (
        <div className="flex flex-wrap gap-2">
          {PERCENTS.map((pct) => (
            <button
              key={pct}
              type="button"
              className={cn("btn btn-secondary px-3 py-1.5 text-xs")}
              disabled={disabled}
              onClick={() => {
                const amount = (max * BigInt(pct)) / 100n;
                onChange(formatPreview(amount));
              }}
            >
              {pct === 100 ? "MAX" : `${pct}%`}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatPreview(value: bigint) {
  const whole = value / 10n ** 18n;
  const frac = value % 10n ** 18n;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole}.${fracStr.slice(0, 6)}`;
}
