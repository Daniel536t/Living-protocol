pragma solidity ^0.8.20;

contract LoyaltyProgram {
    // Mapping of user addresses to their loyalty points
    mapping(address => uint) public points;

    // Owner of the loyalty program
    address public owner;

    // Mapping of user addresses to their loyalty tiers
    mapping(address => uint) public tiers;

    // Event emitted when a user earns points
    event EarnedPoints(address user, uint points);

    // Event emitted when a user upgrades their tier
    event UpgradedTier(address user, uint tier);

    // Event emitted when a user downgrades their tier
    event DowngradedTier(address user, uint tier);

    // Constructor sets the owner of the loyalty program
    constructor() {
        owner = msg.sender;
    }

    // Modifier to check if the caller is the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Function to earn points by a user
    function earn(address user, uint pointsToAdd) public onlyOwner {
        // Check if the user already has points
        require(points[user] != 0, "User has not earned any points yet");

        // Add points to the user's balance
        points[user] += pointsToAdd;

        // Emit the EarnedPoints event
        emit EarnedPoints(user, pointsToAdd);
    }

    // Function to upgrade a user's tier
    function upgradeTier(address user, uint newTier) public onlyOwner {
        // Check if the user's current tier is less than the new tier
        require(tiers[user] < newTier, "User's current tier is already higher than the new tier");

        // Update the user's tier
        tiers[user] = newTier;

        // Emit the UpgradedTier event
        emit UpgradedTier(user, newTier);
    }

    // Function to downgrade a user's tier
    function downgradeTier(address user, uint newTier) public onlyOwner {
        // Check if the user's current tier is greater than the new tier
        require(tiers[user] > newTier, "User's current tier is already lower than the new tier");

        // Update the user's tier
        tiers[user] = newTier;

        // Emit the DowngradedTier event
        emit DowngradedTier(user, newTier);
    }

    // Function to get a user's points balance
    function getPoints(address user) public view returns (uint) {
        return points[user];
    }

    // Function to get a user's tier
    function getTier(address user) public view returns (uint) {
        return tiers[user];
    }
}