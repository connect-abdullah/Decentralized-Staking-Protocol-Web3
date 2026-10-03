import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConnectWallet } from "@/components/ConnectWallet";
import { contractAddress } from "@/lib/staking/contract";
import { shortenAddress } from "@/lib/utils";

export default function LandingPage() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <p className="text-lg font-semibold tracking-tight">
          Stake<span className="text-[var(--violet)]">Protocol</span>
        </p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectWallet />
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[78vh] max-w-6xl items-center gap-10 px-4 pb-16 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="fade-in">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--violet)]">
            StakeProtocol
          </p>
          <h1 className="mt-4 max-w-xl text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Stake with clarity. Earn on a funded clock.
          </h1>
          <p className="muted mt-5 max-w-lg text-lg leading-relaxed">
            A pre-funded staking protocol where rewards come from deposited
            tokens—not inflation. See your position, emission window, and claims
            without guesswork.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="btn btn-primary">
              Open app
            </Link>
            <Link href="/app/stake" className="btn btn-secondary">
              Start staking
            </Link>
          </div>
          {contractAddress ? (
            <p className="muted mt-6 text-sm font-[family-name:var(--font-mono)]">
              Contract {shortenAddress(contractAddress, 6)}
            </p>
          ) : null}
        </div>

        <div
          className="fade-in relative min-h-[320px] overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(108,36,224,0.18),transparent_45%),linear-gradient(320deg,rgba(61,76,235,0.16),transparent_40%)]" />
          <div className="absolute inset-x-8 bottom-8 top-8 border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_40%,transparent)] p-6 backdrop-blur-[2px]">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--violet)]">
              Emission window
            </p>
            <p className="mt-6 font-[family-name:var(--font-mono)] text-4xl">
              02 : 14 : 32 : 19
            </p>
            <div className="mt-8 h-2 bg-[var(--bg-soft)]">
              <div className="h-full w-2/3 bg-[var(--violet)]" />
            </div>
            <p className="muted mt-4 text-sm">
              Time-bounded reward periods. On-chain rate. Transparent claims.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Funded rewards",
              body: "Owners deposit reward tokens and set a duration. Emission is finite and accountable.",
            },
            {
              title: "Position first",
              body: "Staked balance, claimable rewards, and period status surface before any action.",
            },
            {
              title: "Wallet native",
              body: "Injected EVM wallet only. Approve, stake, withdraw, and claim with clear transaction states.",
            },
          ].map((item) => (
            <article key={item.title} className="surface p-6">
              <h2 className="text-xl tracking-tight">{item.title}</h2>
              <p className="muted mt-3 text-sm leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
