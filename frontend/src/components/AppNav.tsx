"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ConnectWallet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStakingOwner } from "@/lib/staking/hooks";
import { isOwnerAddress } from "@/lib/staking/gates";
import { cn } from "@/lib/utils";
import type { Address } from "viem";

const baseLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/stake", label: "Stake" },
  { href: "/app/rewards", label: "Rewards" },
  { href: "/app/withdraw", label: "Withdraw" },
  { href: "/app/activity", label: "Activity" },
];

export function AppNav() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: owner } = useStakingOwner();
  const ownerMode = isOwnerAddress(address, owner as Address | undefined);
  const [open, setOpen] = useState(false);

  const links = ownerMode
    ? [...baseLinks, { href: "/app/admin", label: "Admin" }]
    : baseLinks;

  return (
    <header className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Stake<span className="text-[var(--violet)]">Protocol</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "text-[var(--violet)]"
                    : "muted hover:text-[var(--text)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <ConnectWallet />
        </div>
        <button
          type="button"
          className="btn btn-secondary px-3 py-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-[var(--border)] px-4 py-4 md:hidden">
          <nav className="mb-4 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-2 py-2 text-sm",
                  pathname === link.href ? "text-[var(--violet)]" : "muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
            <ThemeToggle />
            <ConnectWallet />
          </div>
        </div>
      ) : null}
    </header>
  );
}
