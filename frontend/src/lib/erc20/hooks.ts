"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { erc20Api } from "@/lib/erc20/api";

export function useTokenBalance(token?: Address, account?: Address) {
  return useReadContract({
    ...erc20Api.reads.balanceOf(
      token ?? "0x0000000000000000000000000000000000000000",
      account ?? "0x0000000000000000000000000000000000000000"
    ),
    args:
      token && account
        ? [account]
        : undefined,
    query: { enabled: Boolean(token && account) },
  });
}

export function useTokenAllowance(
  token?: Address,
  owner?: Address,
  spender?: Address
) {
  return useReadContract({
    ...erc20Api.reads.allowance(
      token ?? "0x0000000000000000000000000000000000000000",
      owner ?? "0x0000000000000000000000000000000000000000",
      spender ?? "0x0000000000000000000000000000000000000000"
    ),
    args: token && owner && spender ? [owner, spender] : undefined,
    query: { enabled: Boolean(token && owner && spender) },
  });
}

export function useTokenDecimals(token?: Address) {
  return useReadContract({
    ...erc20Api.reads.decimals(
      token ?? "0x0000000000000000000000000000000000000000"
    ),
    query: { enabled: Boolean(token) },
  });
}

export function useTokenSymbol(token?: Address) {
  return useReadContract({
    ...erc20Api.reads.symbol(
      token ?? "0x0000000000000000000000000000000000000000"
    ),
    query: { enabled: Boolean(token) },
  });
}
