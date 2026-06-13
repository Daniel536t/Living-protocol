pragma solidity ^0.8.20;

contract HousingServerReward {
    // Mapping of user addresses to their reward balances
    mapping(address => uint256) public rewardBalances;

    // Total reward tokens available
    uint256 public totalRewardTokens = 1000000;

    // Event emitted when a user claims their reward
    event RewardClaimed(address indexed user, uint256 amount);

    // Event emitted when the reward balance is updated
    event RewardBalanceUpdated(address indexed user, uint256 newBalance);

    // Function to claim a reward
    function claimReward() public {
        // Check if the user has a reward balance
        require(rewardBalances[msg.sender] > 0, "User has no reward balance");

        // Calculate the reward amount
        uint256 rewardAmount = rewardBalances[msg.sender];

        // Update the user's reward balance
        rewardBalances[msg.sender] = 0;

        // Emit the RewardClaimed event
        emit RewardClaimed(msg.sender, rewardAmount);

        // Transfer the reward amount to the user
        payable(msg.sender).transfer(rewardAmount);
    }

    // Function to update a user's reward balance
    function updateRewardBalance(address user, uint256 newBalance) public {
        // Only the contract owner can update the reward balance
        require(msg.sender == owner(), "Only the contract owner can update the reward balance");

        // Update the user's reward balance
        rewardBalances[user] = newBalance;

        // Emit the RewardBalanceUpdated event
        emit RewardBalanceUpdated(user, newBalance);
    }

    // Function to add reward tokens to the total supply
    function addRewardTokens(uint256 amount) public {
        // Only the contract owner can add reward tokens
        require(msg.sender == owner(), "Only the contract owner can add reward tokens");

        // Update the total reward tokens
        totalRewardTokens += amount;
    }

    // Function to get the contract owner
    function owner() public view returns (address) {
        // The contract owner is the address that deployed the contract
        return msg.sender;
    }
}