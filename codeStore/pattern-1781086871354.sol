pragma solidity ^0.8.20;

contract LoyaltyProgram {
    // Mapping to store customer balances
    mapping(address => uint256) public customerBalances;

    // Mapping to store customer loyalty levels
    mapping(address => uint256) public customerLoyaltyLevels;

    // Event emitted when a customer earns points
    event EarnedPoints(address indexed customer, uint256 points);

    // Event emitted when a customer redeems points
    event RedeemedPoints(address indexed customer, uint256 points);

    // Event emitted when a customer's loyalty level changes
    event LoyaltyLevelChanged(address indexed customer, uint256 loyaltyLevel);

    // Function to earn points
    function earnPoints(uint256 _points) public {
        // Check if the customer has a balance
        require(customerBalances[msg.sender] > 0, "Customer has no balance");

        // Update the customer's balance
        customerBalances[msg.sender] += _points;

        // Emit the earned points event
        emit EarnedPoints(msg.sender, _points);
    }

    // Function to redeem points
    function redeemPoints(uint256 _points) public {
        // Check if the customer has enough points
        require(customerBalances[msg.sender] >= _points, "Insufficient points");

        // Update the customer's balance
        customerBalances[msg.sender] -= _points;

        // Update the customer's loyalty level
        updateLoyaltyLevel();

        // Emit the redeemed points event
        emit RedeemedPoints(msg.sender, _points);
    }

    // Function to update the customer's loyalty level
    function updateLoyaltyLevel() public {
        // Calculate the loyalty level based on the customer's balance
        uint256 loyaltyLevel = calculateLoyaltyLevel(customerBalances[msg.sender]);

        // Update the customer's loyalty level
        customerLoyaltyLevels[msg.sender] = loyaltyLevel;

        // Emit the loyalty level changed event
        emit LoyaltyLevelChanged(msg.sender, loyaltyLevel);
    }

    // Function to calculate the loyalty level
    function calculateLoyaltyLevel(uint256 _balance) internal pure returns (uint256) {
        // Define the loyalty levels and their corresponding balances
        uint256[] memory loyaltyLevels = [100, 500, 1000, 5000, 10000];
        uint256[] memory loyaltyBalances = [1, 2, 3, 4, 5];

        // Iterate through the loyalty levels to find the corresponding balance
        for (uint256 i = 0; i < loyaltyLevels.length; i++) {
            if (_balance >= loyaltyLevels[i]) {
                return loyaltyBalances[i];
            }
        }

        // Return the default loyalty level
        return 1;
    }
}