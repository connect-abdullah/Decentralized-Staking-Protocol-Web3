"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { maxUint256 } from "viem";
import { AmountInput } from "@/components/AmountInput";
import { TxStatus } from "@/components/TxStatus";
import { erc20Api } from "@/lib/erc20/api";
import { useTokenAllowance } from "@/lib/erc20/hooks";
import { useProtocolData } from "@/lib/protocol";
import { stakingApi, withContract } from "@/lib/staking/api";
import { contractAddress } from "@/lib/staking/contract";
import { canWrite, requireWriteReady } from "@/lib/staking/gates";
import { useContractWrite } from "@/lib/staking/hooks";
import { parseTokenAmount } from "@/lib/utils";
import { useActivity } from "@/providers/activity_provider";

export function StakePanel() {
  const data = useProtocolData();
  const chainId = data.chainId;
  const { addActivity, updateActivity } = useActivity();
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string>();
  const [mode, setMode] = useState<"approve" | "stake">("stake");
  const activityIdRef = useRef<string | undefined>(undefined);

  const allowance = useTokenAllowance(
    data.stakingToken,
    data.address,
    contractAddress
  );

  const onSuccess = useCallback(() => {
    void data.refetchAll();
    void allowance.refetch();
    if (mode === "stake") setAmount("");
  }, [data, allowance, mode]);

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

  const parsedAmount = (() => {
    try {
      return amount.trim() ? parseTokenAmount(amount, data.stkDecimals) : 0n;
    } catch {
      return 0n;
    }
  })();

  const needsApprove =
    Boolean(data.stakingToken && contractAddress) &&
    parsedAmount > 0n &&
    (allowance.data as bigint | undefined ?? 0n) < parsedAmount;

  const runApprove = () => {
    setFormError(undefined);
    write.reset();
    if (!requireWriteReady({ isConnected: data.isConnected, chainId, setFormError })) {
      return;
    }
    if (!data.stakingToken || !contractAddress) {
      setFormError("Token or contract address missing.");
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
    setMode("approve");
    activityIdRef.current = addActivity({
      label: `Approve ${data.stkSymbol}`,
      status: "pending",
    });
    write.writeContract(
      erc20Api.writes.approve(data.stakingToken, contractAddress, maxUint256)
    );
  };

  const runStake = () => {
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
    if (
      data.walletStakeBalance !== undefined &&
      value > data.walletStakeBalance
    ) {
      setFormError("Insufficient token balance.");
      return;
    }
    if (needsApprove) {
      setFormError("Approve the staking token before staking.");
      return;
    }
    setMode("stake");
    activityIdRef.current = addActivity({
      label: `Stake ${amount} ${data.stkSymbol}`,
      status: "pending",
    });
    write.writeContract(withContract(stakingApi.writes.stake(value)));
  };

  return (
    <section className="surface fade-in space-y-5 p-6">
      <div>
        <h2 className="text-2xl tracking-tight">Stake tokens</h2>
        <p className="muted mt-2 text-sm">
          Approve the staking contract, then stake. Approval and stake are
          separate transactions.
        </p>
      </div>

      <AmountInput
        label="Amount"
        value={amount}
        onChange={setAmount}
        max={data.walletStakeBalance}
        symbol={data.stkSymbol}
        disabled={write.busy}
      />

      {amount.trim() ? (
        <p className="text-sm">
          You will stake:{" "}
          <span className="font-[family-name:var(--font-mono)]">
            {amount} {data.stkSymbol}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!writable || write.busy || !needsApprove}
          onClick={runApprove}
        >
          {write.busy && mode === "approve"
            ? write.statusLabel
            : `Approve ${data.stkSymbol}`}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!writable || write.busy || needsApprove || !amount.trim()}
          onClick={runStake}
        >
          {write.busy && mode === "stake" ? write.statusLabel : "Stake Tokens"}
        </button>
      </div>

      {needsApprove ? (
        <p className="muted text-sm">
          Allowance is insufficient. Approve {data.stkSymbol} first.
        </p>
      ) : null}

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
