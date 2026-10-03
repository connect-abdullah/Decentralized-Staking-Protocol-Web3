"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AmountInput } from "@/components/AmountInput";
import { TxStatus } from "@/components/TxStatus";
import { useProtocolData } from "@/lib/protocol";
import { stakingApi, withContract } from "@/lib/staking/api";
import { canWrite, requireWriteReady } from "@/lib/staking/gates";
import { useContractWrite } from "@/lib/staking/hooks";
import { formatTokenAmount, parseTokenAmount } from "@/lib/utils";
import { useActivity } from "@/providers/activity_provider";

export function WithdrawPanel() {
  const data = useProtocolData();
  const chainId = data.chainId;
  const { addActivity, updateActivity } = useActivity();
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string>();
  const [mode, setMode] = useState<"amount" | "all">("amount");
  const activityIdRef = useRef<string | undefined>(undefined);

  const onSuccess = useCallback(() => {
    void data.refetchAll();
    setAmount("");
  }, [data]);

  const write = useContractWrite(onSuccess);

  useEffect(() => {
    if (!activityIdRef.current) return;
    if (write.hash) {
      updateActivity(activityIdRef.current, { hash: write.hash });
    }
    if (write.receipt.isSuccess) {
      updateActivity(activityIdRef.current, { status: "confirmed" });
    }
    if (write.error || write.receipt.error) {
      updateActivity(activityIdRef.current, { status: "failed" });
    }
  }, [
    write.hash,
    write.receipt.isSuccess,
    write.receipt.error,
    write.error,
    updateActivity,
  ]);

  const writable = canWrite({
    isConnected: data.isConnected,
    chainId,
  });

  const remaining =
    data.staked !== undefined && amount.trim()
      ? (() => {
          try {
            const value = parseTokenAmount(amount, data.stkDecimals);
            return data.staked > value ? data.staked - value : 0n;
          } catch {
            return undefined;
          }
        })()
      : undefined;

  const runWithdrawAmount = () => {
    setFormError(undefined);
    write.reset();
    if (!requireWriteReady({ isConnected: data.isConnected, chainId, setFormError })) {
      return;
    }
    let value: bigint;
    try {
      value = parseTokenAmount(amount, data.stkDecimals);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Invalid amount.");
      return;
    }
    if (value <= 0n) {
      setFormError("Amount must be greater than zero.");
      return;
    }
    if (data.staked === undefined || data.staked === 0n) {
      setFormError("No tokens staked.");
      return;
    }
    if (value > data.staked) {
      setFormError("Insufficient staked amount.");
      return;
    }
    setMode("amount");
    activityIdRef.current = addActivity({
      label: `Withdraw ${amount} ${data.stkSymbol}`,
      status: "pending",
    });
    write.writeContract(withContract(stakingApi.writes.withdrawAmount(value)));
  };

  const runWithdrawAll = () => {
    setFormError(undefined);
    write.reset();
    if (!requireWriteReady({ isConnected: data.isConnected, chainId, setFormError })) {
      return;
    }
    if (data.staked === undefined || data.staked === 0n) {
      setFormError("No tokens staked.");
      return;
    }
    setMode("all");
    activityIdRef.current = addActivity({
      label: `Withdraw all ${data.stkSymbol}`,
      status: "pending",
    });
    write.writeContract(withContract(stakingApi.writes.withdrawAll()));
  };

  return (
    <section className="surface fade-in space-y-5 p-6">
      <div>
        <h2 className="text-2xl tracking-tight">Withdraw</h2>
        <p className="muted mt-2 text-sm">
          Staked balance:{" "}
          <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">
            {data.formatStaked} {data.stkSymbol}
          </span>
        </p>
      </div>

      <AmountInput
        label="Withdraw amount"
        value={amount}
        onChange={setAmount}
        max={data.staked}
        symbol={data.stkSymbol}
        disabled={write.busy}
      />

      {remaining !== undefined ? (
        <p className="muted text-sm">
          Remaining after withdrawal:{" "}
          <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">
            {formatTokenAmount(remaining, data.stkDecimals)} {data.stkSymbol}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!writable || write.busy || !amount.trim()}
          onClick={runWithdrawAmount}
        >
          {write.busy && mode === "amount" ? write.statusLabel : "Withdraw"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!writable || write.busy || !data.staked}
          onClick={runWithdrawAll}
        >
          {write.busy && mode === "all" ? write.statusLabel : "Withdraw All"}
        </button>
      </div>

      {formError ? (
        <p className="text-sm text-[var(--danger)]">{formError}</p>
      ) : null}
      <TxStatus
        statusLabel={write.statusLabel}
        errorMessage={write.errorMessage}
        hash={write.hash}
      />
    </section>
  );
}
