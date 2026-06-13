pragma solidity ^0.8.20;

contract RewardPool {
    // Mapping of addresses to their rewards
    mapping (address => uint256) public rewards;

    // Event emitted when a user receives a reward
    event RewardReceived(address indexed user, uint256 reward);

    // Function to add a reward to the pool
    function addReward(address user, uint256 reward) public {
        rewards[user] += reward;
        emit RewardReceived(user, reward);
    }

    // Function to withdraw a reward from the pool
    function withdrawReward(address user) public {
        uint256 reward = rewards[user];
        rewards[user] = 0;
        // Transfer the reward to the user
        // (this is a placeholder, you would replace this with the actual transfer logic)
        // payable(user).transfer(reward);
    }

    // Function to get the total reward pool
    function getTotalReward() public view returns (uint256) {
        uint256 totalReward = 0;
        for (address user in rewards) {
            totalReward += rewards[user];
        }
        return totalReward;
    }
}