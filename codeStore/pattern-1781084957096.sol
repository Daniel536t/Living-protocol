pragma solidity ^0.8.20;

contract StakingRewards {
    // Mapping of users to their staked balance
    mapping(address => uint256) public stakedBalances;

    // Mapping of users to their rewards balance
    mapping(address => uint256) public rewardsBalances;

    // Total staked balance
    uint256 public totalStaked;

    // Total rewards distributed
    uint256 public totalRewards;

    // Event emitted when a user stakes
    event Staked(address indexed user, uint256 amount);

    // Event emitted when a user unstakes
    event Unstaked(address indexed user, uint256 amount);

    // Event emitted when rewards are distributed
    event RewardsDistributed(address indexed user, uint256 amount);

    // Function to stake
    function stake(uint256 _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        stakedBalances[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    // Function to unstake
    function unstake(uint256 _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        require(stakedBalances[msg.sender] >= _amount, "Insufficient balance");
        stakedBalances[msg.sender] -= _amount;
        totalStaked -= _amount;
        emit Unstaked(msg.sender, _amount);
    }

    // Function to distribute rewards
    function distributeRewards() public {
        uint256 rewardRate = 0.05 ether; // 5% reward rate
        for (address user in stakedBalances) {
            uint256 staked = stakedBalances[user];
            uint256 rewards = staked * rewardRate;
            rewardsBalances[user] += rewards;
            totalRewards += rewards;
            emit RewardsDistributed(user, rewards);
        }
    }

    // Function to get staked balance of a user
    function getStakedBalance(address _user) public view returns (uint256) {
        return stakedBalances[_user];
    }

    // Function to get rewards balance of a user
    function getRewardsBalance(address _user) public view returns (uint256) {
        return rewardsBalances[_user];
    }

    // Function to get total staked balance
    function getTotalStaked() public view returns (uint256) {
        return totalStaked;
    }

    // Function to get total rewards distributed
    function getTotalRewards() public view returns (uint256) {
        return totalRewards;
    }
}