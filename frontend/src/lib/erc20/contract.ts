import type { Abi } from "viem";
import artifact from "@/abi/erc20.json";

export const erc20Abi = artifact.abi as Abi;
