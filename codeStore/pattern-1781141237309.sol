pragma solidity ^0.8.20;

contract RewardSystem {
    // Mapping of users to their rewards
    mapping (address => uint256) public rewards;

    // Mapping of tasks to their requirements
    mapping (uint256 => mapping (string => bool)) public taskRequirements;

    // Mapping of tasks to their rewards
    mapping (uint256 => uint256) public taskRewards;

    // Event emitted when a user earns a reward
    event Earned(address indexed user, uint256 reward);

    // Event emitted when a task is completed
    event TaskCompleted(uint256 indexed task, address indexed user);

    // Function to add a new task
    function addTask(uint256 _task, uint256 _reward, string[] memory _requirements) public {
        taskRewards[_task] = _reward;
        for (uint256 i = 0; i < _requirements.length; i++) {
            taskRequirements[_task][_requirements[i]] = true;
        }
    }

    // Function to complete a task
    function completeTask(uint256 _task, string[] memory _proof) public {
        require(taskRequirements[_task]["completed"] == true, "Task not found");
        for (uint256 i = 0; i < _proof.length; i++) {
            require(taskRequirements[_task][_proof[i]] == true, "Missing proof");
        }
        taskRequirements[_task]["completed"] = false;
        rewards[msg.sender] += taskRewards[_task];
        emit TaskCompleted(_task, msg.sender);
    }

    // Function to earn a reward
    function earnReward() public {
        rewards[msg.sender]++;
        emit Earned(msg.sender, rewards[msg.sender]);
    }

    // Function to get the total rewards of a user
    function getTotalRewards(address _user) public view returns (uint256) {
        return rewards[_user];
    }

    // Function to get the rewards of a task
    function getTaskReward(uint256 _task) public view returns (uint256) {
        return taskRewards[_task];
    }
}