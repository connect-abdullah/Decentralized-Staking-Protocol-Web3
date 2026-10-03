import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");
const frontendEnvPath = resolve(rootDir, "frontend/.env.local");

const MINT_AMOUNT = 1_000_000n * 10n ** 18n;

const { ethers, networkName } = await network.create();

const [deployer, user] = await ethers.getSigners();

console.log(`Deploying to ${networkName}...`);
console.log(`Deployer (owner): ${deployer.address}`);

const stakingToken = await ethers.deployContract("MockERC20", [
  "Stake Token",
  "STK",
]);
await stakingToken.waitForDeployment();
const stakingTokenAddress = await stakingToken.getAddress();
console.log(`Staking token: ${stakingTokenAddress}`);

const rewardToken = await ethers.deployContract("MockERC20", [
  "Reward Token",
  "RWD",
]);
await rewardToken.waitForDeployment();
const rewardTokenAddress = await rewardToken.getAddress();
console.log(`Reward token:  ${rewardTokenAddress}`);

const staking = await ethers.deployContract("StakingProtocol", [
  stakingTokenAddress,
  rewardTokenAddress,
]);
await staking.waitForDeployment();
const stakingAddress = await staking.getAddress();
console.log(`StakingProtocol: ${stakingAddress}`);

await (await stakingToken.mint(deployer.address, MINT_AMOUNT)).wait();
await (await rewardToken.mint(deployer.address, MINT_AMOUNT)).wait();

if (user) {
  await (await stakingToken.mint(user.address, MINT_AMOUNT)).wait();
  console.log(`Minted STK to secondary account: ${user.address}`);
}

const envContents = [
  "NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545",
  `NEXT_PUBLIC_CONTRACT_ADDRESS=${stakingAddress}`,
  "",
].join("\n");

const frontendDir = dirname(frontendEnvPath);
if (!existsSync(frontendDir)) {
  mkdirSync(frontendDir, { recursive: true });
}
writeFileSync(frontendEnvPath, envContents, "utf8");
console.log(`Wrote ${frontendEnvPath}`);

console.log("\nMetaMask setup:");
console.log("  Network: Hardhat Local");
console.log("  RPC URL: http://127.0.0.1:8545");
console.log("  Chain ID: 31337");
console.log("  Currency: ETH");
console.log(`  Import Hardhat account #0 as owner: ${deployer.address}`);
console.log("Deployment successful.");
