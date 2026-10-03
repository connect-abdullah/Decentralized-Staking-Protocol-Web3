"use client";

import { contractAddress } from "@/lib/staking/contract";

export function ConfigWarning() {
  if (contractAddress) return null;
  return (
    <div className="border-b border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm">
      <div className="mx-auto max-w-6xl">
        Contract address is not configured. Set{" "}
        <code className="font-[family-name:var(--font-mono)]">
          NEXT_PUBLIC_CONTRACT_ADDRESS
        </code>{" "}
        (run the root deploy script).
      </div>
    </div>
  );
}
