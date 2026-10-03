import type { Address } from "viem";
import { erc20Abi } from "@/lib/erc20/contract";
import { targetChain } from "@/lib/wagmi";

export const erc20Api = {
  reads: {
    balanceOf: (token: Address, account: Address) => ({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [account] as const,
    }),
    allowance: (token: Address, owner: Address, spender: Address) => ({
      address: token,
      abi: erc20Abi,
      functionName: "allowance" as const,
      args: [owner, spender] as const,
    }),
    decimals: (token: Address) => ({
      address: token,
      abi: erc20Abi,
      functionName: "decimals" as const,
    }),
    symbol: (token: Address) => ({
      address: token,
      abi: erc20Abi,
      functionName: "symbol" as const,
    }),
  },
  writes: {
    approve: (token: Address, spender: Address, amount: bigint) => ({
      address: token,
      abi: erc20Abi,
      functionName: "approve" as const,
      args: [spender, amount] as const,
      chainId: targetChain.id,
    }),
  },
};