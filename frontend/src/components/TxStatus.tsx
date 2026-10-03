import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function TxStatus({
  statusLabel,
  errorMessage,
  hash,
  className,
}: {
  statusLabel: string;
  errorMessage?: string;
  hash?: `0x${string}`;
  className?: string;
}) {
  if (statusLabel === "Idle" && !errorMessage) return null;

  return (
    <div className={cn("surface p-4 text-sm", className)}>
      <p
        className={cn(
          statusLabel === "Failed" || errorMessage
            ? "text-[var(--danger)]"
            : statusLabel === "Confirmed"
              ? "text-[var(--success)]"
              : "text-[var(--text)]",
          (statusLabel.includes("wallet") || statusLabel.includes("confirmation")) &&
            "pulse-soft"
        )}
      >
        {errorMessage ?? statusLabel}
      </p>
      {hash ? (
        <p className="muted mt-2 break-all font-[family-name:var(--font-mono)] text-xs">
          Tx: {hash}
        </p>
      ) : null}
      {hash ? (
        <a
          className="mt-2 inline-flex items-center gap-1 text-[var(--violet)]"
          href={`https://etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            // Local Hardhat has no explorer; keep hash visible above.
            if (hash.startsWith("0x")) e.preventDefault();
          }}
        >
          <ExternalLink size={14} />
          View transaction hash
        </a>
      ) : null}
    </div>
  );
}
