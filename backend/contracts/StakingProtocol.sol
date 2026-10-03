// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract StakingProtocol {
    // Staking Variables
    uint256 private totalStaked; // total amount of tokens staked
    uint256 private rewardPerToken; // reward per token staked
    uint256 constant PRECISION = 1e18; // precision for the reward calculations

    // Reward Accounting Variables
    uint256 public rewardRate; // reward tokens generated per second
    uint256 public lastRewardTime; // last time we updated reward accounting
    uint256 public rewardDuration; // how long this reward program lasts
    uint256 public periodFinish; // timestamp when this reward program ends

    // Token Addresses
    IERC20 public stakingToken; // the token being staked
    IERC20 public rewardToken; // the token being rewarded
    address public owner;

    struct User{
        uint256 stakedAmount;
        uint256 rewards;
        uint256 userRewardsPaid;
    }

    mapping(address => User) public users;

    constructor(address _stakingToken, address _rewardToken){
        totalStaked = 0;
        rewardPerToken = 0;

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);

        owner = msg.sender;

        lastRewardTime = block.timestamp;
    }

    function stake(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");

        updateReward(msg.sender);
        bool success = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Staking failed");
        users[msg.sender].stakedAmount += amount;
        totalStaked += amount;
    }

    // function to add rewards to the staking contract by the owner
    // it calculates the reward rate based on the reward tokens and duration
    function addRewards(uint256 rewardTokens, uint256 duration) public {
        require(msg.sender == owner, "Only owner can add rewards");
        require(rewardTokens > 0, "Reward amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
    
        bool success = rewardToken.transferFrom(
            msg.sender,
            address(this),
            rewardTokens
        );
        require(success, "Adding rewards failed");
    
        rewardRate = rewardTokens / duration;
        rewardDuration = duration;
        lastRewardTime = block.timestamp;
        periodFinish = block.timestamp + duration;
    }

    function updateReward(address user) internal {
        // get the correct time for the reward calculation, below periodFinish
        uint256 applicableTime = block.timestamp < periodFinish ? block.timestamp : periodFinish;
        // 1. Global Accounting for rewards
        if (totalStaked > 0) {
            uint256 elapsedTime = applicableTime - lastRewardTime;
            // recalculate reward per token
            rewardPerToken +=
                (elapsedTime * rewardRate * PRECISION)
                / totalStaked;
        }
    
        lastRewardTime = applicableTime;
    
        // 2. User Accounting for rewards
        User storage userData = users[user];
        // calculate new reward for the user
        uint256 newReward = ((rewardPerToken - userData.userRewardsPaid) * userData.stakedAmount) / PRECISION;
        userData.rewards += newReward;
        userData.userRewardsPaid = rewardPerToken;
    }

    function claimRewards() public {
        updateReward(msg.sender);

        require(users[msg.sender].rewards > 0, "No rewards to claim");
        require(users[msg.sender].stakedAmount > 0, "No tokens staked");

        uint256 rewardsToSend = users[msg.sender].rewards;
        users[msg.sender].rewards = 0; // Reset rewards to 0 before claiming
        bool success = rewardToken.transfer(msg.sender, rewardsToSend);
        require(success, "Claiming rewards failed");
    }

    function withdrawAmount(uint256 amount) public {
        require(users[msg.sender].stakedAmount > 0, "No tokens staked");
        require(amount > 0, "Amount must be greater than 0");
        require(users[msg.sender].stakedAmount >= amount, "Insufficient staked amount" );

        updateReward(msg.sender);
        users[msg.sender].stakedAmount -= amount;
        totalStaked -= amount;
        bool success = stakingToken.transfer(msg.sender, amount);
        require(success, "Withdrawing tokens failed");
    }

    function withdrawAll() public {
        require(users[msg.sender].stakedAmount > 0, "No tokens staked");

        updateReward(msg.sender);
        uint256 amount = users[msg.sender].stakedAmount;
        users[msg.sender].stakedAmount = 0;
        totalStaked -= amount;
        bool success = stakingToken.transfer(msg.sender, amount);
        require(success, "Withdrawing tokens failed");
    }
    
    function getUserStakedAmount(address user) public view returns (uint256) {
        return users[user].stakedAmount;
    }

    function getUserRewards(address user) public view returns (uint256) {
        return users[user].rewards;
    }
    

}



// Two Important Concepts:
// 1. ACCOUNTING:  
// time → rewardRate → rewardPerToken → user reward

// 2. ASSET FUNDING
// actual rewardToken → staking contract → users