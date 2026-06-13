pragma solidity ^0.8.20;

contract SimpleLogicSystem {
    // Mapping to store rules
    mapping(bytes32 => Rule) public rules;

    // Mapping to store user data
    mapping(address => UserData) public users;

    // Event emitted when a user's status changes
    event UserStatusChanged(address indexed user, bool status);

    // Event emitted when a rule is added or updated
    event RuleChanged(bytes32 indexed ruleHash, Rule rule);

    // Event emitted when a user's data is updated
    event UserDataChanged(address indexed user, UserData userData);

    // Struct to represent a rule
    struct Rule {
        bool enabled;
        bytes32 condition;
        bytes32 action;
    }

    // Struct to represent user data
    struct UserData {
        bool status;
        uint256 points;
    }

    // Function to add or update a rule
    function addOrUpdateRule(bytes32 _ruleHash, bool _enabled, bytes32 _condition, bytes32 _action) public {
        rules[_ruleHash] = Rule(_enabled, _condition, _action);
        emit RuleChanged(_ruleHash, rules[_ruleHash]);
    }

    // Function to update a user's data
    function updateUserData(address _user, bool _status, uint256 _points) public {
        users[_user].status = _status;
        users[_user].points = _points;
        emit UserDataChanged(_user, users[_user]);
    }

    // Function to check if a user meets a rule's condition
    function checkCondition(address _user, bytes32 _ruleHash) public view returns (bool) {
        Rule memory rule = rules[_ruleHash];
        if (rule.enabled) {
            // Implement condition logic here
            // For example, check if user has a certain number of points
            if (users[_user].points >= 100) {
                return true;
            }
        }
        return false;
    }

    // Function to apply a rule's action
    function applyAction(address _user, bytes32 _ruleHash) public {
        Rule memory rule = rules[_ruleHash];
        if (rule.enabled && checkCondition(_user, _ruleHash)) {
            // Implement action logic here
            // For example, grant user a certain status
            users[_user].status = true;
            emit UserStatusChanged(_user, users[_user].status);
        }
    }

    // Function to get a user's status
    function getUserStatus(address _user) public view returns (bool) {
        return users[_user].status;
    }
}