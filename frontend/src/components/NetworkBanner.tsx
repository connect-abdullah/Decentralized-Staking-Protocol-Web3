"use client";

import { AlertTriangle } from "lucide-react";
import { BaseError } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { useIsClient } from "@/lib/useIsClient";
import { targetChain } from "@/lib/wagmi";

export function NetworkBanner() {
  const isClient = useIsClient();
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();

  const wrongNetwork = isClient && isConnected && chainId !== targetChain.id;

  if (!wrongNetwork) return null;

  const switchError =
    error instanceof BaseError ? error.shortMessage : error?.message;

  return (
    <div className="border-b border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="text-[var(--warning)]" />
            Wrong network. Switch to {targetChain.name} (chain {targetChain.id}) to
            use the protocol.
          </p>
          {switchError ? (
            <p className="mt-1 text-sm text-[var(--danger)]">{switchError}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-primary py-2 text-sm"
          disabled={isPending}
          onClick={() => switchChain({ chainId: targetChain.id })}
        >
          {isPending ? "Switching…" : `Switch to ${targetChain.name}`}
        </button>
      </div>
    </div>
  );
}
