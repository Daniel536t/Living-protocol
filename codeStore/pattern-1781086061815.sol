pragma solidity ^0.8.20;

contract LoyaltyProgram {
    // Mapping of user addresses to their loyalty points
    mapping(address => uint) public loyaltyPoints;

    // Event emitted when a user earns loyalty points
    event EarnedLoyaltyPoints(address indexed user, uint points);

    // Event emitted when a user redeems loyalty points
    event RedeemedLoyaltyPoints(address indexed user, uint points);

    // Function to earn loyalty points
    function earnLoyaltyPoints(address user, uint points) public {
        loyaltyPoints[user] += points;
        emit EarnedLoyaltyPoints(user, points);
    }

    // Function to redeem loyalty points
    function redeemLoyaltyPoints(address user, uint points) public {
        require(loyaltyPoints[user] >= points, "Insufficient loyalty points");
        loyaltyPoints[user] -= points;
        emit RedeemedLoyaltyPoints(user, points);
    }

    // Function to get a user's loyalty points
    function getLoyaltyPoints(address user) public view returns (uint) {
        return loyaltyPoints[user];
    }
}