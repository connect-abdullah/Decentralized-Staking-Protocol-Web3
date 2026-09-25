// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract StakingProtocol {
    uint256 private totalStaked;
    uint256 private rewardPerToken; 
    uint256 constant PRECISION = 1e18;
    IERC20 public stakingToken;
    IERC20 public rewardToken;
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
    }

    function stake(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");

        updateReward(msg.sender);
        bool success = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Staking failed");
        users[msg.sender].stakedAmount += amount;
        totalStaked += amount;
    }

    function addRewards(uint256 rewardTokens) public {
        require(rewardTokens > 0, "Amount must be greater than 0");
        require(msg.sender == owner, "Only owner can add rewards");
        require(totalStaked > 0, "No tokens staked");

        bool success = rewardToken.transferFrom(msg.sender, address(this), rewardTokens);
        require(success, "Adding rewards failed");
        uint256 newRewardAmount = (rewardTokens * PRECISION) / totalStaked;
        rewardPerToken += newRewardAmount;
    }

    function updateReward(address user) internal {
        User storage userData = users[user];
        uint256 newReward = ((rewardPerToken - userData.userRewardsPaid) * userData.stakedAmount) / PRECISION;
        userData.rewards += newReward;
        userData.userRewardsPaid = rewardPerToken;
    }

    function claimRewards() public {
        updateReward(msg.sender);
        uint256 rewardsToSend = users[msg.sender].rewards;
        require(rewardsToSend > 0, "No rewards to claim");
        users[msg.sender].rewards = 0; // Reset rewards to 0 before claiming
        bool success = rewardToken.transfer(msg.sender, rewardsToSend);
        require(success, "Claiming rewards failed");
    }
    
    
}