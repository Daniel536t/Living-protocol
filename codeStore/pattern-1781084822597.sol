pragma solidity ^0.8.20;

contract StakingRewards {
    // Mapping to store the balance of each user
    mapping (address => uint) public balances;

    // Mapping to store the stakes of each user
    mapping (address => uint) public stakes;

    // Mapping to store the rewards of each user
    mapping (address => uint) public rewards;

    // Event emitted when a user stakes
    event Staked(address indexed user, uint amount);

    // Event emitted when a user unstakes
    event Unstaked(address indexed user, uint amount);

    // Event emitted when a user claims rewards
    event RewardsClaimed(address indexed user, uint amount);

    // Function to stake
    function stake(uint _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        balances[msg.sender] += _amount;
        stakes[msg.sender] += _amount;
        emit Staked(msg.sender, _amount);
    }

    // Function to unstake
    function unstake(uint _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender] >= _amount, "Insufficient stakes");
        balances[msg.sender] -= _amount;
        stakes[msg.sender] -= _amount;
        emit Unstaked(msg.sender, _amount);
    }

    // Function to claim rewards
    function claimRewards() public {
        uint reward = calculateRewards(msg.sender);
        rewards[msg.sender] += reward;
        emit RewardsClaimed(msg.sender, reward);
    }

    // Function to calculate rewards
    function calculateRewards(address _user) internal returns (uint) {
        // Implement your reward calculation logic here
        // For example:
        uint balance = balances[_user];
        uint stake = stakes[_user];
        uint reward = balance * stake / 100; // 1% reward
        return reward;
    }
}