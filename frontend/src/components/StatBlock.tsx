import { cn } from "@/lib/utils";

export function StatBlock({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("surface fade-in p-5", className)}>
      <p className="muted text-xs uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-2xl tracking-tight">
        {value}
      </p>
      {hint ? <p className="muted mt-2 text-sm">{hint}</p> : null}
    </div>
  );
}
