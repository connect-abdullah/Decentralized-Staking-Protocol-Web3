# Staking Protocol

A custom ERC20 staking protocol built with Solidity that implements **pre-funded, time-based reward emissions**.

Users stake one ERC20 token and earn another ERC20 token as rewards. Rewards are calculated based on staking duration and each user's share of the total staking pool.

---

## Run locally (single command)

From the repo root:

```bash
npm run dev
```

This starts a Hardhat node (if needed), deploys mock ERC20s + `StakingProtocol`, syncs the ABI into `frontend/src/abi/`, writes `frontend/.env.local`, and runs the Next.js app.

MetaMask setup:

* Network name: Hardhat Local
* RPC URL: `http://127.0.0.1:8545`
* Chain ID: `31337`
* Import Hardhat account #0 as the contract owner

ABI-only sync (after compile):

```bash
npm run sync-abi
```

The frontend never deploys contracts.

---

## Overview

The protocol separates **reward accounting** from **reward funding**.

The owner first deposits reward tokens into the staking contract and defines an emission duration.

```text
Reward Tokens + Duration
          ↓
      rewardRate
          ↓
       Time Passes
          ↓
    rewardPerToken
          ↓
    User Accounting
          ↓
    Accumulated Rewards
          ↓
        Claim
```

The contract does not mint reward tokens. It distributes tokens that have already been deposited into the reward pool.

---

## Key Features

* ERC20 token staking
* Separate staking and reward tokens
* Pre-funded reward pool
* Time-based reward emission
* Configurable reward duration
* Global `rewardPerToken` accounting
* Per-user reward checkpoints
* Partial withdrawals
* Full withdrawals
* Reward claiming
* Owner-controlled reward funding
* Fixed-point arithmetic using `1e18` precision
* Checks-Effects-Interactions pattern for reward claims

---

## Architecture

```text
                       Owner
                         |
                         | approve + addRewards()
                         v
                +-------------------+
                | Staking Contract  |
                |                   |
                | Reward Pool       |
                | rewardRate        |
                | periodFinish      |
                | rewardPerToken    |
                +---------+---------+
                          |
                          | stake()
                          |
              +-----------+-----------+
              |                       |
              v                       v
            Alice                    Bob
         100 tokens               300 tokens
              |                       |
              +-----------+-----------+
                          |
                          v
                  Reward Accounting
                          |
                          v
                   User Rewards
                          |
                          v
                    claimRewards()
                          |
                          v
                       User
```

---

## How It Works

### 1. Staking

A user calls:

```solidity
stake(uint256 amount)
```

The contract:

1. Updates the user's pending rewards.
2. Transfers staking tokens from the user.
3. Increases the user's `stakedAmount`.
4. Increases `totalStaked`.

The reward update happens **before** modifying the user's stake.

```text
updateReward()
      ↓
transferFrom()
      ↓
increase stake
```

This prevents newly deposited tokens from receiving rewards from previous periods.

---

### 2. Reward Funding

The owner calls:

```solidity
addRewards(uint256 rewardTokens, uint256 duration)
```

The owner must first approve the staking contract to spend the reward tokens.

The contract then calculates:

```text
rewardRate = rewardTokens / duration
```

Example:

```text
Reward Pool = 10,000 tokens
Duration    = 1,000 seconds

rewardRate = 10 tokens / second
```

The reward tokens remain inside the staking contract until users claim them.

---

## Reward Emission

Rewards are emitted according to time.

```text
rewardGenerated = elapsedTime × rewardRate
```

Example:

```text
rewardRate  = 10 tokens/second
elapsedTime = 60 seconds

rewardGenerated = 10 × 60
                = 600 tokens
```

These 600 tokens represent rewards generated for the **entire staking pool**.

They are then distributed according to each user's share of the pool.

---

## `rewardPerToken`

The protocol uses a cumulative global reward value:

```solidity
uint256 private rewardPerToken;
```

The increase is calculated conceptually as:

```text
rewardPerToken increase =
    elapsedTime × rewardRate × PRECISION
    -------------------------------------
              totalStaked
```

Where:

```solidity
uint256 constant PRECISION = 1e18;
```

### Example

Suppose:

```text
rewardRate  = 10
elapsedTime = 60
totalStaked = 100
```

Then:

```text
Total rewards = 10 × 60
              = 600
```

Since 100 tokens are staked:

```text
Reward per staked token = 600 / 100
                        = 6
```

The contract stores this using fixed-point precision:

```text
6 × 1e18
```

---

## User Reward Accounting

Each user has:

```solidity
struct User {
    uint256 stakedAmount;
    uint256 rewards;
    uint256 userRewardsPaid;
}
```

### `stakedAmount`

The user's current staking balance.

### `rewards`

The user's accumulated but unclaimed reward balance.

### `userRewardsPaid`

A checkpoint that records the global `rewardPerToken` value that the user has already been accounted for.

---

## Reward Checkpointing

Suppose:

```text
Global rewardPerToken = 100
Alice.userRewardsPaid = 60
```

Alice only needs to be credited for the difference:

```text
100 - 60 = 40
```

Her new reward is conceptually:

```text
newReward =
    (rewardPerToken - userRewardsPaid)
    × stakedAmount
    ----------------------------------
                PRECISION
```

Then:

```text
rewards += newReward
userRewardsPaid = rewardPerToken
```

The checkpoint moves forward so the same rewards are not counted twice.

---

## Example

Assume:

```text
rewardRate = 10 tokens/second
```

Alice stakes:

```text
100 tokens
```

For the first 10 seconds, Alice is the only staker.

```text
Generated rewards = 10 × 10
                  = 100
```

Alice receives:

```text
Alice = 100 rewards
```

Now Bob stakes another 100 tokens.

The pool becomes:

```text
Alice = 100
Bob   = 100
Total = 200
```

Another 10 seconds pass.

```text
New rewards = 10 × 10
            = 100
```

Both users now own 50% of the pool:

```text
Alice = 50
Bob   = 50
```

Total accumulated rewards:

```text
Alice = 150
Bob   = 50
```

Bob does not receive rewards generated before he joined.

---

## Why Reward Updates Happen Before Stake Changes

This ordering is critical.

### Staking

```text
updateReward()
      ↓
increase stakedAmount
```

### Withdrawal

```text
updateReward()
      ↓
decrease stakedAmount
```

For example, if Alice has 100 tokens staked and withdraws 50:

```text
100 tokens staked
       ↓
calculate rewards earned with 100
       ↓
reduce stake to 50
```

Without this ordering, historical rewards could be calculated using the user's new balance instead of their balance during the reward period.

---

## Claiming Rewards

Users call:

```solidity
claimRewards()
```

The flow is:

```text
1. updateReward(msg.sender)
2. Read accumulated rewards
3. Check rewards > 0
4. Reset user's reward balance
5. Transfer reward tokens
```

Conceptually:

```text
User
  |
  | claimRewards()
  v
Staking Contract
  |
  | Update accounting
  |
  | Reset rewards
  |
  | Transfer reward tokens
  v
User Wallet
```

The reward tokens are already available because the owner pre-funded the contract.

---

## Withdrawals

### Partial Withdrawal

```solidity
withdrawAmount(uint256 amount)
```

The contract:

```text
Update rewards
      ↓
Decrease user's stake
      ↓
Decrease totalStaked
      ↓
Transfer staking tokens
```

### Full Withdrawal

```solidity
withdrawAll()
```

The user's entire staking position is removed.

Reward accounting happens before setting the user's stake to zero.

---

## State Variables

```solidity
uint256 private totalStaked;
uint256 private rewardPerToken;

uint256 public rewardRate;
uint256 public lastUpdateTime;
uint256 public rewardDuration;
uint256 public periodFinish;

uint256 constant PRECISION = 1e18;
```

| Variable         | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `totalStaked`    | Total staking tokens deposited by all users       |
| `rewardPerToken` | Global cumulative reward accounting               |
| `rewardRate`     | Rewards emitted per second                        |
| `lastUpdateTime` | Last timestamp used for reward accounting         |
| `rewardDuration` | Duration of the current reward period             |
| `periodFinish`   | Timestamp when reward emission ends               |
| `PRECISION`      | Fixed-point precision for fractional calculations |

---

## Core Functions

| Function           | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `stake()`          | Deposit staking tokens                   |
| `addRewards()`     | Fund reward pool and configure emission  |
| `updateReward()`   | Update global and user reward accounting |
| `claimRewards()`   | Claim accumulated reward tokens          |
| `withdrawAmount()` | Withdraw part of a user's stake          |
| `withdrawAll()`    | Withdraw the complete staking position   |

---

## Security & Correctness

### Checks-Effects-Interactions

Reward claiming follows the basic CEI pattern:

```text
Checks
  ↓
Update accounting
  ↓
Reset reward balance
  ↓
External token transfer
```

The user's accounting balance is reset before the ERC20 transfer.

If the transfer fails, the transaction reverts and the state changes are reverted as well.

---

### ERC20 `approve()` + `transferFrom()`

Users must approve the staking contract before staking.

```text
User
  |
  | approve()
  v
Staking Contract
  |
  | transferFrom()
  v
Staking Contract
```

The owner uses the same mechanism when funding rewards:

```text
Owner
  |
  | approve()
  v
Staking Contract
  |
  | transferFrom()
  v
Reward Pool
```

---

# Reward Accounting vs Reward Funding

This is the core design concept of the project.

### Accounting

The contract calculates:

```text
How much has each user earned?
```

using:

```text
Time
+
rewardRate
+
totalStaked
+
rewardPerToken
+
userRewardsPaid
```

### Funding

The contract needs actual ERC20 tokens to pay those rewards.

```text
Owner
  ↓
Reward Tokens
  ↓
Staking Contract
  ↓
User Claims
```

Therefore:

```text
ACCOUNTING

Time
 ↓
Reward Rate
 ↓
Reward Per Token
 ↓
User Rewards


ASSET FUNDING

Owner
 ↓
Reward Token Pool
 ↓
User Claim
```

**Accounting determines what a user is owed.**

**Funding provides the actual tokens needed to pay them.**

---

# Reward Period

The protocol uses:

```solidity
rewardDuration
periodFinish
```

Example:

```text
Current timestamp = 10,000
Reward duration   = 1,000

periodFinish = 11,000
```

Rewards are emitted only until `periodFinish`.

This prevents the protocol from continuously generating rewards after the configured emission period.

---

# Current Design Limitations

This implementation is intentionally focused on learning the core staking mechanism.

A production implementation would need to handle additional cases, including:

* Adding rewards while an existing reward period is active
* Carrying over leftover rewards
* Changing reward rates safely
* Ensuring reward solvency
* Emergency withdrawal mechanisms
* Stronger access control
* Safe ERC20 wrappers
* Non-standard ERC20 behavior
* Fee-on-transfer tokens
* Multiple reward tokens
* Comprehensive unit tests
* Fuzz testing
* Invariant testing
* More robust reward-period management

---

# Core Mental Model

```text
WHO STAKES?
    ↓
stakedAmount

HOW MUCH IS STAKED?
    ↓
totalStaked

HOW FAST ARE REWARDS GENERATED?
    ↓
rewardRate

HOW MUCH TIME PASSED?
    ↓
currentTime - lastUpdateTime

HOW MANY REWARDS WERE GENERATED?
    ↓
elapsedTime × rewardRate

HOW ARE REWARDS DISTRIBUTED?
    ↓
rewardPerToken

WHERE DID THE USER START?
    ↓
userRewardsPaid

HOW MUCH HAS THE USER EARNED?
    ↓
rewards

WHERE DO THE ACTUAL TOKENS COME FROM?
    ↓
Pre-funded reward pool

HOW DOES THE USER RECEIVE THEM?
    ↓
claimRewards()
```

---

# Learning Goals

This project was built to understand the fundamentals behind DeFi staking systems:

* ERC20 token interactions
* `approve()` and `transferFrom()`
* Time-based reward emissions
* Fixed-point arithmetic
* Global reward accounting
* Per-user checkpoints
* Reward distribution
* Staking and withdrawal accounting
* Token funding vs accounting
* Checks-Effects-Interactions
* Smart contract state management

---

# Conclusion

This project implements a **pre-funded, time-based ERC20 staking system**.

The owner funds the reward pool and defines an emission period. The protocol then calculates rewards over time using `rewardRate` and distributes them among users based on their share of the total staked tokens.

The key architecture is:

```text
Reward Pool
     +
Reward Duration
     ↓
Reward Rate
     ↓
Time
     ↓
Reward Per Token
     ↓
User Checkpoint
     ↓
User Rewards
     ↓
Claim
```

The most important takeaway is the separation between **reward accounting** and **reward funding**.

The accounting system determines what users have earned, while the pre-funded reward pool provides the actual ERC20 tokens used to pay those rewards.
