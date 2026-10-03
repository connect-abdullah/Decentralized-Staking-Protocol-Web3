"use client";

import { useEffect, useState } from "react";
import { Copy, LogOut, Wallet } from "lucide-react";
import { BaseError } from "viem";
import { useAccount, useConnect, useDisconnect, type Connector } from "wagmi";
import { useIsClient } from "@/lib/useIsClient";
import { cn, shortenAddress } from "@/lib/utils";
import { targetChain } from "@/lib/wagmi";

function connectMessage(error: Error) {
  const raw = error instanceof BaseError ? error.shortMessage : error.message;
  const text = raw.toLowerCase();
  if (text.includes("provider not found")) {
    return "No wallet detected. Install MetaMask or another injected wallet.";
  }
  if (text.includes("user rejected") || text.includes("user denied")) {
    return "Connection rejected in the wallet.";
  }
  if (text.includes("already pending") || text.includes("resource unavailable")) {
    return "A wallet request is already open. Check the MetaMask popup.";
  }
  return raw;
}

export function ConnectWallet({ className }: { className?: string }) {
  const isClient = useIsClient();
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connectAsync, isPending, error, reset } = useConnect();
  const { disconnect, disconnectAsync } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [localError, setLocalError] = useState<string>();

  useEffect(() => {
    const sync = () => setHasInjected(Boolean(window.ethereum));
    sync();
    window.addEventListener("ethereum#initialized", sync);
    return () => window.removeEventListener("ethereum#initialized", sync);
  }, []);

  async function onConnect(connector: Connector) {
    setLocalError(undefined);
    reset();
    try {
      await connectAsync({ connector });
    } catch (err) {
      const failure = err instanceof Error ? err : new Error("Could not connect.");
      const message = connectMessage(failure);
      if (!/already connected/i.test(message)) {
        setLocalError(message);
        return;
      }
      try {
        await disconnectAsync();
        await connectAsync({ connector });
      } catch (retryErr) {
        const retry =
          retryErr instanceof Error ? retryErr : new Error("Could not connect.");
        setLocalError(connectMessage(retry));
      }
    }
  }

  if (!isClient) {
    return (
      <div
        className={cn("btn btn-secondary h-11 w-40 animate-pulse", className)}
        aria-hidden
      />
    );
  }

  const wallets = connectors.filter((connector, _, all) => {
    if (connector.id === "injected" && all.some((item) => item.id !== "injected")) {
      return false;
    }
    return true;
  });

  const connectError =
    localError ?? (error ? connectMessage(error) : undefined);

  if (isConnected && address) {
    const onTarget = chainId === targetChain.id;
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <div className="surface flex items-center gap-2 px-3 py-2 text-sm">
          <Wallet size={16} className="text-[var(--violet)]" />
          <span className="font-[family-name:var(--font-mono)]">
            {shortenAddress(address)}
          </span>
          <span className="muted">·</span>
          <span className={onTarget ? "muted" : "text-[var(--warning)]"}>
            {onTarget ? targetChain.name : chainId ? `Chain ${chainId}` : "Wrong network"}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary px-3 py-2 text-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          aria-label="Copy address"
        >
          <Copy size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          className="btn btn-ghost px-3 py-2 text-sm"
          onClick={() => disconnect()}
        >
          <LogOut size={14} />
          Disconnect
        </button>
      </div>
    );
  }

  if (!hasInjected && wallets.every((wallet) => wallet.id === "injected")) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="muted text-sm">
          An EVM-compatible injected wallet (e.g. MetaMask) is required. Open
          this app in a browser where that wallet is installed.
        </p>
        <a
          className="btn btn-primary"
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {wallets.map((connector) => (
        <button
          key={connector.uid}
          type="button"
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => void onConnect(connector)}
        >
          <Wallet size={16} />
          {isPending
            ? "Connecting…"
            : connector.id === "injected"
              ? "Connect Wallet"
              : `Connect ${connector.name}`}
        </button>
      ))}
      {connectError ? (
        <p className="text-sm text-[var(--danger)]">{connectError}</p>
      ) : null}
    </div>
  );
}
