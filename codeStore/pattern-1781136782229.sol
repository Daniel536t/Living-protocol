pragma solidity ^0.8.20;

contract StakingRewardSystem {
    // Mapping of stakers to their balance and rewards
    mapping (address => Staker) public stakers;

    // Event emitted when a staker's balance or reward changes
    event BalanceChanged(address indexed staker, uint256 balance);
    event RewardChanged(address indexed staker, uint256 reward);

    // Staker struct
    struct Staker {
        uint256 balance;
        uint256 reward;
    }

    // Function to stake tokens
    function stake(uint256 amount) public {
        // Check if the sender has enough balance
        require(msg.sender.balance >= amount, "Insufficient balance");

        // Update the sender's balance and reward
        stakers[msg.sender].balance += amount;
        stakers[msg.sender].reward += calculateReward(amount);

        // Emit events
        emit BalanceChanged(msg.sender, stakers[msg.sender].balance);
        emit RewardChanged(msg.sender, stakers[msg.sender].reward);
    }

    // Function to calculate reward based on the amount staked
    function calculateReward(uint256 amount) internal pure returns (uint256) {
        // Simple reward calculation: 10% of the staked amount
        return amount * 10 / 100;
    }

    // Function to withdraw tokens
    function withdraw(uint256 amount) public {
        // Check if the sender has enough balance
        require(stakers[msg.sender].balance >= amount, "Insufficient balance");

        // Update the sender's balance and reward
        stakers[msg.sender].balance -= amount;
        stakers[msg.sender].reward -= calculateReward(amount);

        // Emit events
        emit BalanceChanged(msg.sender, stakers[msg.sender].balance);
        emit RewardChanged(msg.sender, stakers[msg.sender].reward);
    }

    // Function to get the staker's balance
    function getBalance(address staker) public view returns (uint256) {
        return stakers[staker].balance;
    }

    // Function to get the staker's reward
    function getReward(address staker) public view returns (uint256) {
        return stakers[staker].reward;
    }
}