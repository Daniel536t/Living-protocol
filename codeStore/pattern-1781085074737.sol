pragma solidity ^0.8.20;

contract LoyaltyProgram {
    // Mapping to store user points
    mapping(address => uint256) public points;

    // Owner of the contract
    address public owner;

    // Event emitted when a user earns points
    event Earned(address indexed user, uint256 pointsEarned);

    // Event emitted when a user redeems points
    event Redeemed(address indexed user, uint256 pointsRedeemed);

    // Event emitted when the owner is changed
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    // Constructor to initialize the contract
    constructor() {
        owner = msg.sender;
    }

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Function to earn points
    function earn(address user, uint256 pointsToEarn) external onlyOwner {
        points[user] += pointsToEarn;
        emit Earned(user, pointsToEarn);
    }

    // Function to redeem points
    function redeem(address user, uint256 pointsToRedeem) external onlyOwner {
        require(points[user] >= pointsToRedeem, "Insufficient points");
        points[user] -= pointsToRedeem;
        emit Redeemed(user, pointsToRedeem);
    }

    // Function to change the owner
    function changeOwner(address newOwner) external onlyOwner {
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    // Function to get the total points of a user
    function getPoints(address user) public view returns (uint256) {
        return points[user];
    }
}