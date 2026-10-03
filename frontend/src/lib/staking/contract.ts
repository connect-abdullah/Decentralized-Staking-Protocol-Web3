import type { Abi, Address } from "viem";
import { getAddress, isAddress } from "viem";
import artifact from "@/abi/StakingProtocol.json";

export const contractAbi = artifact.abi as Abi;

const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

export const contractAddress: Address | undefined = isAddress(raw)
  ? getAddress(raw)
  : undefined;
