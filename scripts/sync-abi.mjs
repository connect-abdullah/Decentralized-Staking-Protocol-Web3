import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const artifactPath = resolve(
  rootDir,
  "backend/artifacts/contracts/StakingProtocol.sol/StakingProtocol.json"
);
const outPath = resolve(rootDir, "frontend/src/abi/StakingProtocol.json");
const erc20OutPath = resolve(rootDir, "frontend/src/abi/erc20.json");

if (!existsSync(artifactPath)) {
  console.error(
    `ABI sync failed: artifact not found at ${artifactPath}. Run hardhat compile first.`
  );
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
if (!Array.isArray(artifact.abi)) {
  console.error("ABI sync failed: artifact.abi is missing or not an array.");
  process.exit(1);
}

const outDir = dirname(outPath);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

writeFileSync(outPath, `${JSON.stringify({ abi: artifact.abi }, null, 2)}\n`, "utf8");
console.log(`Synced StakingProtocol ABI → ${outPath}`);

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
];

writeFileSync(
  erc20OutPath,
  `${JSON.stringify({ abi: erc20Abi }, null, 2)}\n`,
  "utf8"
);
console.log(`Wrote minimal ERC20 ABI → ${erc20OutPath}`);
