pragma solidity ^0.8.20;

contract StakingRewards {
    // Mapping of user addresses to their stakes
    mapping (address => uint) public stakes;

    // Mapping of user addresses to their rewards
    mapping (address => uint) public rewards;

    // Total amount of rewards available
    uint public totalRewards;

    // Total amount of stakes
    uint public totalStakes;

    // Event emitted when a user stakes
    event Stake(address indexed user, uint amount);

    // Event emitted when a user unstakes
    event Unstake(address indexed user, uint amount);

    // Event emitted when rewards are distributed
    event DistributeRewards(address indexed user, uint amount);

    // Function to stake
    function stake(uint _amount) public {
        stakes[msg.sender] += _amount;
        totalStakes += _amount;
        emit Stake(msg.sender, _amount);
    }

    // Function to unstake
    function unstake(uint _amount) public {
        require(stakes[msg.sender] >= _amount, "Insufficient stake");
        stakes[msg.sender] -= _amount;
        totalStakes -= _amount;
        emit Unstake(msg.sender, _amount);
    }

    // Function to distribute rewards
    function distributeRewards() public {
        for (address user in stakes) {
            uint reward = stakes[user] * totalRewards / totalStakes;
            rewards[user] += reward;
            emit DistributeRewards(user, reward);
        }
    }

    // Function to set total rewards
    function setTotalRewards(uint _totalRewards) public {
        totalRewards = _totalRewards;
    }

    // Function to get user rewards
    function getUserRewards(address _user) public view returns (uint) {
        return rewards[_user];
    }
}