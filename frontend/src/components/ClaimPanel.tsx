"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TxStatus } from "@/components/TxStatus";
import { useProtocolData } from "@/lib/protocol";
import { stakingApi, withContract } from "@/lib/staking/api";
import { canWrite, requireWriteReady } from "@/lib/staking/gates";
import { useContractWrite } from "@/lib/staking/hooks";
import { useActivity } from "@/providers/activity_provider";

export function ClaimPanel() {
  const data = useProtocolData();
  const chainId = data.chainId;
  const { addActivity, updateActivity } = useActivity();
  const [formError, setFormError] = useState<string>();
  const activityIdRef = useRef<string | undefined>(undefined);

  const onSuccess = useCallback(() => {
    void data.refetchAll();
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

  const staked = data.staked ?? 0n;
  const checkpoint = data.rewards ?? 0n;
  const rewardRate = data.rewardRate ?? 0n;
  const positionReady = data.staked !== undefined && data.rewardRate !== undefined;
  // getUserRewards is only the last checkpoint. Accrual is written on claim,
  // and a local chain does not move block.timestamp until that transaction.
  const canClaim =
    writable &&
    !write.busy &&
    positionReady &&
    staked > 0n &&
    (checkpoint > 0n || rewardRate > 0n);

  const runClaim = () => {
    setFormError(undefined);
    write.reset();
    if (!requireWriteReady({ isConnected: data.isConnected, chainId, setFormError })) {
      return;
    }
    if (staked <= 0n) {
      setFormError("Stake tokens before claiming rewards.");
      return;
    }
    if (checkpoint <= 0n && rewardRate <= 0n) {
      setFormError("No rewards available.");
      return;
    }

    activityIdRef.current = addActivity({
      label: `Claim ${data.rwdSymbol} rewards`,
      status: "pending",
    });
    write.writeContract(withContract(stakingApi.writes.claimRewards()));
  };

  return (
    <section className="surface fade-in space-y-5 p-6">
      <div>
        <p className="muted text-xs uppercase tracking-[0.14em]">
          On-chain rewards
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-mono)] text-4xl tracking-tight">
          {data.formatRewards} {data.rwdSymbol}
        </h2>
        <p className="muted mt-3 text-sm">
          This balance is the last on-chain checkpoint. Claiming updates it
          through the new block and transfers the rewards.
        </p>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        disabled={!canClaim}
        onClick={runClaim}
      >
        {write.busy ? write.statusLabel : "Claim Rewards"}
      </button>

      {positionReady && staked <= 0n ? (
        <p className="muted text-sm">Stake tokens before claiming rewards.</p>
      ) : null}

      {canClaim && checkpoint <= 0n ? (
        <p className="muted text-sm">
          The checkpoint is still zero because no block has passed since you
          staked. Claim Rewards writes the earnings and sends them to your wallet.
        </p>
      ) : null}

      {write.statusLabel === "Confirmed" ? (
        <div className="fade-in border border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-4 text-sm">
          Claim successful. Reward tokens were transferred to your wallet.
        </div>
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
