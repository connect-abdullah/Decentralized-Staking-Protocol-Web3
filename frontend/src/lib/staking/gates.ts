import type { Address } from "viem";
import { contractAddress } from "@/lib/staking/contract";
import { targetChain } from "@/lib/wagmi";

export function isOnTargetChain(chainId: number | undefined) {
  return chainId === targetChain.id;
}

export function canWrite(params: {
  isConnected: boolean;
  chainId: number | undefined;
}) {
  return Boolean(
    params.isConnected && isOnTargetChain(params.chainId) && contractAddress
  );
}

export function requireWriteReady(params: {
  isConnected: boolean;
  chainId: number | undefined;
  setFormError: (message: string) => void;
}) {
  if (!contractAddress) {
    params.setFormError("Contract address is not configured.");
    return false;
  }
  if (!params.isConnected) {
    params.setFormError("Connect a wallet first.");
    return false;
  }
  if (!isOnTargetChain(params.chainId)) {
    params.setFormError("Switch to the correct network to send transactions.");
    return false;
  }
  return true;
}

export function isOwnerAddress(
  connected: Address | undefined,
  owner: Address | undefined
) {
  if (!connected || !owner) return false;
  return connected.toLowerCase() === owner.toLowerCase();
}
