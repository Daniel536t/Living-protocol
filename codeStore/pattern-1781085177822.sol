pragma solidity ^0.8.20;

contract StakingRewards {
    // Mapping to store the balance of each staker
    mapping(address => uint256) public balances;

    // Mapping to store the last time each staker claimed their reward
    mapping(address => uint256) public lastClaimed;

    // Total amount of rewards available
    uint256 public totalRewards;

    // Reward per block
    uint256 public rewardPerBlock;

    // Number of blocks between reward claims
    uint256 public blocksBetweenClaims;

    // Event emitted when a staker claims their reward
    event Claimed(address indexed staker, uint256 amount);

    // Event emitted when rewards are added
    event RewardsAdded(uint256 amount);

    // Event emitted when rewards are reduced
    event RewardsReduced(uint256 amount);

    // Function to add rewards
    function addRewards(uint256 _amount) public {
        totalRewards += _amount;
        emit RewardsAdded(_amount);
    }

    // Function to reduce rewards
    function reduceRewards(uint256 _amount) public {
        totalRewards -= _amount;
        emit RewardsReduced(_amount);
    }

    // Function to stake
    function stake(uint256 _amount) public {
        balances[msg.sender] += _amount;
    }

    // Function to claim reward
    function claimReward() public {
        require(balances[msg.sender] > 0, "You have no balance");
        require(block.timestamp - lastClaimed[msg.sender] >= blocksBetweenClaims, "You can't claim yet");

        uint256 reward = totalRewards / 100 * 5; // 5% of total rewards
        balances[msg.sender] -= reward;
        lastClaimed[msg.sender] = block.timestamp;

        emit Claimed(msg.sender, reward);
    }

    // Function to get balance
    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}