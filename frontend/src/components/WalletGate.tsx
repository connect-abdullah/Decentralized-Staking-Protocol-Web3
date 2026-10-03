"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { useIsClient } from "@/lib/useIsClient";
import { useAccount } from "wagmi";

export function WalletGate({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  const { isConnected } = useAccount();

  if (!isClient) {
    return (
      <div className="surface h-40 animate-pulse" aria-hidden />
    );
  }

  if (!isConnected) {
    return (
      <section className="surface fade-in mx-auto max-w-xl p-8 text-center">
        <h2 className="text-2xl tracking-tight">Connect to continue</h2>
        <p className="muted mt-3 text-sm">
          Staking actions require an EVM-compatible wallet. Connect MetaMask to
          view your position and interact with the protocol.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectWallet />
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
