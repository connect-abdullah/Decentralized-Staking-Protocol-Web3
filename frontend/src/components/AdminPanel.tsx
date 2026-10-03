"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { maxUint256 } from "viem";
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

export function AdminPanel() {
  const data = useProtocolData();
  const chainId = data.chainId;
  const { addActivity, updateActivity } = useActivity();
  const [rewardTokens, setRewardTokens] = useState("");
  const [duration, setDuration] = useState("604800");
  const [formError, setFormError] = useState<string>();
  const [mode, setMode] = useState<"approve" | "add">("add");
  const activityIdRef = useRef<string | undefined>(undefined);

  const allowance = useTokenAllowance(
    data.rewardToken,
    data.address,
    contractAddress
  );

  const onSuccess = useCallback(() => {
    void data.refetchAll();
    void allowance.refetch();
  }, [data, allowance]);

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

  const parsedRewards = (() => {
    try {
      return rewardTokens.trim()
        ? parseTokenAmount(rewardTokens, data.rwdDecimals)
        : 0n;
    } catch {
      return 0n;
    }
  })();

  const needsApprove =
    parsedRewards > 0n &&
    (allowance.data as bigint | undefined ?? 0n) < parsedRewards;

  const runApprove = () => {
    setFormError(undefined);
    write.reset();
    if (!requireWriteReady({ isConnected: data.isConnected, chainId, setFormError })) {
      return;
    }
    if (!data.isOwner) {
      setFormError("Only the contract owner can fund rewards.");
      return;
    }
    if (!data.rewardToken || !contractAddress) {
      setFormError("Reward token or contract address missing.");
      return;
    }
    setMode("approve");
    activityIdRef.current = addActivity({
      label: `Approve ${data.rwdSymbol}`,
      status: "pending",
    });
    write.writeContract(
      erc20Api.writes.approve(data.rewardToken, contractAddress, maxUint256)
    );
  };

  const runAddRewards = () => {
    setFormError(undefined);
    write.reset();
    if (!requireWriteReady({ isConnected: data.isConnected, chainId, setFormError })) {
      return;
    }
    if (!data.isOwner) {
      setFormError("Only the contract owner can fund rewards.");
      return;
    }
    let tokens: bigint;
    try {
      tokens = parseTokenAmount(rewardTokens, data.rwdDecimals);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Invalid reward amount.");
      return;
    }
    const durationSeconds = BigInt(duration.trim() || "0");
    if (tokens <= 0n) {
      setFormError("Reward amount must be greater than zero.");
      return;
    }
    if (durationSeconds <= 0n) {
      setFormError("Duration must be greater than zero.");
      return;
    }
    if (needsApprove) {
      setFormError("Approve the reward token before adding rewards.");
      return;
    }
    setMode("add");
    activityIdRef.current = addActivity({
      label: `Add rewards ${rewardTokens} ${data.rwdSymbol}`,
      status: "pending",
    });
    write.writeContract(
      withContract(stakingApi.writes.addRewards(tokens, durationSeconds))
    );
  };

  return (
    <div className="space-y-6">
      <section
        className="fade-in border p-6"
        style={{
          background: "var(--admin-bg)",
          borderColor: "var(--admin-border)",
        }}
      >
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--violet)]">
          Owner / Administration
        </p>
        <h2 className="mt-2 text-2xl tracking-tight">Protocol control room</h2>
        <p className="muted mt-2 text-sm">
          The owner funds the reward token. The contract sets the emission rate
          from the deposited amount and duration.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStat label="Reward rate" value={`${data.formatRate} / sec`} />
          <AdminStat
            label="Reward duration"
            value={
              data.rewardDuration !== undefined
                ? `${data.rewardDuration.toString()}s`
                : "—"
            }
          />
          <AdminStat
            label="Period finish"
            value={
              data.periodFinish
                ? new Date(Number(data.periodFinish) * 1000).toLocaleString()
                : "—"
            }
          />
          <AdminStat
            label="Last reward time"
            value={
              data.lastRewardTime
                ? new Date(Number(data.lastRewardTime) * 1000).toLocaleString()
                : "—"
            }
          />
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h3 className="text-xl">Add rewards</h3>
        <p className="muted text-sm">
          This deposits reward tokens into the staking contract and
          starts/updates the reward emission period according to the contract
          logic.
        </p>
        <label className="block space-y-2 text-sm">
          <span>Reward tokens</span>
          <input
            className="field"
            value={rewardTokens}
            onChange={(e) => setRewardTokens(e.target.value)}
            placeholder="1000"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span>Duration (seconds)</span>
          <input
            className="field"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="604800"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!writable || write.busy || !needsApprove}
            onClick={runApprove}
          >
            {write.busy && mode === "approve"
              ? write.statusLabel
              : `Approve ${data.rwdSymbol}`}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!writable || write.busy || needsApprove}
            onClick={runAddRewards}
          >
            {write.busy && mode === "add" ? write.statusLabel : "Add Rewards"}
          </button>
        </div>
      </section>

      {formError ? (
        <p className="text-sm text-[var(--danger)]">{formError}</p>
      ) : null}
      <TxStatus
        statusLabel={write.statusLabel}
        errorMessage={write.errorMessage}
        hash={write.hash}
      />
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--bg-elevated)] p-4">
      <p className="muted text-xs uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-2 break-all font-[family-name:var(--font-mono)] text-sm">
        {value}
      </p>
    </div>
  );
}
