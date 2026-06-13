pragma solidity ^0.8.20;

contract StakingSystem {
    // Mapping of user addresses to their balance of tokens
    mapping (address => uint256) public balances;

    // Mapping of user addresses to their staking status
    mapping (address => bool) public staking;

    // Event emitted when a user stakes tokens
    event Staked(address indexed user, uint256 amount);

    // Event emitted when a user unstakes tokens
    event Unstaked(address indexed user, uint256 amount);

    // Event emitted when a user claims rewards
    event RewardsClaimed(address indexed user, uint256 rewards);

    // Function to stake tokens
    function stake(uint256 _amount) public {
        // Check if the user has enough balance
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        // Update the user's balance
        balances[msg.sender] -= _amount;

        // Update the user's staking status
        staking[msg.sender] = true;

        // Emit the Staked event
        emit Staked(msg.sender, _amount);
    }

    // Function to unstake tokens
    function unstake(uint256 _amount) public {
        // Check if the user is staking
        require(staking[msg.sender], "Not staking");

        // Check if the user has enough balance
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        // Update the user's balance
        balances[msg.sender] += _amount;

        // Update the user's staking status
        staking[msg.sender] = false;

        // Emit the Unstaked event
        emit Unstaked(msg.sender, _amount);
    }

    // Function to claim rewards
    function claimRewards() public {
        // Check if the user is staking
        require(staking[msg.sender], "Not staking");

        // Calculate the rewards
        uint256 rewards = calculateRewards(msg.sender);

        // Update the user's balance
        balances[msg.sender] += rewards;

        // Emit the RewardsClaimed event
        emit RewardsClaimed(msg.sender, rewards);
    }

    // Function to calculate rewards
    function calculateRewards(address _user) internal returns (uint256) {
        // TO DO: implement the reward calculation logic
        return 0;
    }
}