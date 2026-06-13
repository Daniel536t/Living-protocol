pragma solidity ^0.8.20;

contract StakingRewards {
    // Mapping of users to their staked amount
    mapping (address => uint) public stakedAmounts;

    // Mapping of users to their rewards
    mapping (address => uint) public rewards;

    // Mapping of users to their loyalty levels
    mapping (address => uint) public loyaltyLevels;

    // Event emitted when a user stakes tokens
    event Staked(address indexed user, uint amount);

    // Event emitted when a user unstakes tokens
    event Unstaked(address indexed user, uint amount);

    // Event emitted when a user receives rewards
    event RewardsReceived(address indexed user, uint rewards);

    // Event emitted when a user's loyalty level changes
    event LoyaltyLevelChanged(address indexed user, uint newLoyaltyLevel);

    // Function to stake tokens
    function stake(uint _amount) public {
        // Update the user's staked amount
        stakedAmounts[msg.sender] += _amount;

        // Emit the Staked event
        emit Staked(msg.sender, _amount);
    }

    // Function to unstake tokens
    function unstake(uint _amount) public {
        // Check if the user has enough staked tokens
        require(stakedAmounts[msg.sender] >= _amount, "Not enough staked tokens");

        // Update the user's staked amount
        stakedAmounts[msg.sender] -= _amount;

        // Emit the Unstaked event
        emit Unstaked(msg.sender, _amount);
    }

    // Function to calculate rewards
    function calculateRewards() public {
        // Get the user's staked amount
        uint stakedAmount = stakedAmounts[msg.sender];

        // Calculate the rewards based on the staked amount
        uint rewardsAmount = stakedAmount * 0.1; // 10% rewards

        // Update the user's rewards
        rewards[msg.sender] += rewardsAmount;

        // Emit the RewardsReceived event
        emit RewardsReceived(msg.sender, rewardsAmount);
    }

    // Function to update loyalty level
    function updateLoyaltyLevel() public {
        // Get the user's staked amount
        uint stakedAmount = stakedAmounts[msg.sender];

        // Calculate the loyalty level based on the staked amount
        uint loyaltyLevel = stakedAmount * 0.01; // 1% loyalty level per 100 staked tokens

        // Update the user's loyalty level
        loyaltyLevels[msg.sender] = loyaltyLevel;

        // Emit the LoyaltyLevelChanged event
        emit LoyaltyLevelChanged(msg.sender, loyaltyLevel);
    }
}