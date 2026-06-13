pragma solidity ^0.8.20;

contract StakingRewardSystem {
    // Mapping of users to their staking balance
    mapping (address => uint) public stakingBalances;

    // Mapping of users to their loyalty level
    mapping (address => uint) public loyaltyLevels;

    // Event emitted when a user stakes tokens
    event Stake(address indexed user, uint amount);

    // Event emitted when a user unstakes tokens
    event Unstake(address indexed user, uint amount);

    // Event emitted when a user receives a reward
    event Reward(address indexed user, uint amount);

    // Function to stake tokens
    function stake(uint _amount) public {
        require(_amount > 0, "Amount must be greater than zero");
        stakingBalances[msg.sender] += _amount;
        emit Stake(msg.sender, _amount);
    }

    // Function to unstake tokens
    function unstake(uint _amount) public {
        require(_amount > 0, "Amount must be greater than zero");
        require(stakingBalances[msg.sender] >= _amount, "Insufficient balance");
        stakingBalances[msg.sender] -= _amount;
        emit Unstake(msg.sender, _amount);
    }

    // Function to calculate loyalty level
    function calculateLoyaltyLevel() public {
        uint totalStaked = stakingBalances[msg.sender];
        if (totalStaked >= 100 ether) {
            loyaltyLevels[msg.sender] = 3;
        } else if (totalStaked >= 10 ether) {
            loyaltyLevels[msg.sender] = 2;
        } else {
            loyaltyLevels[msg.sender] = 1;
        }
    }

    // Function to reward users based on their loyalty level
    function reward() public {
        require(loyaltyLevels[msg.sender] > 0, "User must have a loyalty level");
        uint rewardAmount;
        if (loyaltyLevels[msg.sender] == 1) {
            rewardAmount = 1 ether;
        } else if (loyaltyLevels[msg.sender] == 2) {
            rewardAmount = 5 ether;
        } else {
            rewardAmount = 10 ether;
        }
        stakingBalances[msg.sender] += rewardAmount;
        emit Reward(msg.sender, rewardAmount);
    }

    // Function to get user's staking balance
    function getStakingBalance(address _user) public view returns (uint) {
        return stakingBalances[_user];
    }

    // Function to get user's loyalty level
    function getLoyaltyLevel(address _user) public view returns (uint) {
        return loyaltyLevels[_user];
    }
}