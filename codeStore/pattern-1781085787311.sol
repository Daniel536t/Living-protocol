pragma solidity ^0.8.20;

contract LoyaltyProgram {
    // Mapping of addresses to their points balance
    mapping(address => uint256) public points;

    // Owner of the loyalty program
    address public owner;

    // Mapping of addresses to their loyalty levels
    mapping(address => uint256) public loyaltyLevels;

    // Event emitted when a user earns points
    event EarnedPoints(address indexed user, uint256 pointsEarned);

    // Event emitted when a user upgrades their loyalty level
    event UpgradedLoyalty(address indexed user, uint256 newLoyaltyLevel);

    // Event emitted when a user redeems their points
    event RedeemedPoints(address indexed user, uint256 pointsRedeemed);

    // Constructor to set the owner of the loyalty program
    constructor() {
        owner = msg.sender;
    }

    // Function to earn points
    function earnPoints(address user, uint256 pointsEarned) external {
        require(msg.sender == owner, "Only the owner can earn points");
        points[user] += pointsEarned;
        emit EarnedPoints(user, pointsEarned);
    }

    // Function to upgrade loyalty level
    function upgradeLoyalty(address user, uint256 newLoyaltyLevel) external {
        require(msg.sender == owner, "Only the owner can upgrade loyalty level");
        loyaltyLevels[user] = newLoyaltyLevel;
        emit UpgradedLoyalty(user, newLoyaltyLevel);
    }

    // Function to redeem points
    function redeemPoints(address user, uint256 pointsToRedeem) external {
        require(points[user] >= pointsToRedeem, "Insufficient points to redeem");
        points[user] -= pointsToRedeem;
        emit RedeemedPoints(user, pointsToRedeem);
    }

    // Function to get the points balance of a user
    function getPoints(address user) public view returns (uint256) {
        return points[user];
    }

    // Function to get the loyalty level of a user
    function getLoyaltyLevel(address user) public view returns (uint256) {
        return loyaltyLevels[user];
    }
}