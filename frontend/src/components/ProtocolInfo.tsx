"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { contractAddress } from "@/lib/staking/contract";
import { useProtocolData } from "@/lib/protocol";
import { shortenAddress } from "@/lib/utils";

export function ProtocolInfo() {
  const data = useProtocolData();
  const [copied, setCopied] = useState<string>();

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(undefined), 1200);
  };

  const rows = [
    { key: "staking", label: "Staking token", value: data.stakingToken },
    { key: "reward", label: "Reward token", value: data.rewardToken },
    { key: "contract", label: "Staking contract", value: contractAddress },
    { key: "owner", label: "Owner", value: data.owner },
  ];

  return (
    <section className="surface fade-in p-6">
      <h2 className="text-xl tracking-tight">Protocol details</h2>
      <p className="muted mt-2 text-sm">
        Addresses are read from the contract. Token symbols/decimals come from
        standard ERC20 views when available.
      </p>
      <ul className="mt-5 space-y-3">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0"
          >
            <div>
              <p className="muted text-xs uppercase tracking-[0.12em]">
                {row.label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-sm">
                {row.value ? shortenAddress(row.value, 6) : "—"}
              </p>
            </div>
            {row.value ? (
              <button
                type="button"
                className="btn btn-secondary px-3 py-1.5 text-xs"
                onClick={() => void copy(row.value!, row.key)}
              >
                <Copy size={12} />
                {copied === row.key ? "Copied" : "Copy"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
