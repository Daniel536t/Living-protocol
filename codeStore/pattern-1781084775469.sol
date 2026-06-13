pragma solidity ^0.8.20;

contract StakingRewards {
    // Mapping of users to their stakes
    mapping(address => uint256) public stakes;

    // Mapping of users to their rewards
    mapping(address => uint256) public rewards;

    // Mapping of users to their loyalty levels
    mapping(address => uint256) public loyaltyLevels;

    // Event emitted when a user stakes
    event Staked(address indexed user, uint256 amount);

    // Event emitted when a user unstakes
    event Unstaked(address indexed user, uint256 amount);

    // Event emitted when a user earns rewards
    event RewardsEarned(address indexed user, uint256 amount);

    // Function to stake
    function stake(uint256 _amount) public {
        require(_amount > 0, "Staking amount must be greater than 0");
        stakes[msg.sender] += _amount;
        loyaltyLevels[msg.sender] += _amount;
        emit Staked(msg.sender, _amount);
    }

    // Function to unstake
    function unstake(uint256 _amount) public {
        require(_amount > 0, "Unstaking amount must be greater than 0");
        require(stakes[msg.sender] >= _amount, "Insufficient stake");
        stakes[msg.sender] -= _amount;
        loyaltyLevels[msg.sender] -= _amount;
        emit Unstaked(msg.sender, _amount);
    }

    // Function to calculate rewards
    function calculateRewards() public {
        uint256 loyaltyLevel = loyaltyLevels[msg.sender];
        uint256 rewardsAmount = loyaltyLevel * 10; // 10% of loyalty level
        rewards[msg.sender] += rewardsAmount;
        emit RewardsEarned(msg.sender, rewardsAmount);
    }

    // Function to get user's stake
    function getUserStake(address _user) public view returns (uint256) {
        return stakes[_user];
    }

    // Function to get user's rewards
    function getUserRewards(address _user) public view returns (uint256) {
        return rewards[_user];
    }

    // Function to get user's loyalty level
    function getUserLoyaltyLevel(address _user) public view returns (uint256) {
        return loyaltyLevels[_user];
    }
}