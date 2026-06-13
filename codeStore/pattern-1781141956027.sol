pragma solidity ^0.8.20;

contract ElectricalComponentReward {
    // Mapping to store the rewards for each electrical component
    mapping(address => mapping(string => uint256)) public rewards;

    // Event emitted when a reward is claimed
    event RewardClaimed(address indexed user, string component, uint256 amount);

    // Event emitted when a new reward is added
    event NewRewardAdded(address indexed user, string component, uint256 amount);

    // Function to add a new reward for an electrical component
    function addReward(address user, string memory component, uint256 amount) public {
        rewards[user][component] = amount;
        emit NewRewardAdded(user, component, amount);
    }

    // Function to claim a reward for an electrical component
    function claimReward(address user, string memory component) public {
        require(rewards[user][component] > 0, "Reward does not exist");
        uint256 rewardAmount = rewards[user][component];
        rewards[user][component] = 0;
        payable(user).transfer(rewardAmount);
        emit RewardClaimed(user, component, rewardAmount);
    }

    // Function to get the total rewards for an electrical component
    function getTotalRewards(address user, string memory component) public view returns (uint256) {
        return rewards[user][component];
    }
}