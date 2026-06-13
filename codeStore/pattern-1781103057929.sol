pragma solidity ^0.8.20;

contract LoyaltyProgram {
    // Mapping of customer addresses to their loyalty points
    mapping(address => uint256) public loyaltyPoints;

    // Event emitted when a customer earns loyalty points
    event EarnedLoyaltyPoints(address customer, uint256 points);

    // Event emitted when a customer redeems loyalty points
    event RedeemedLoyaltyPoints(address customer, uint256 points);

    // Function to earn loyalty points
    function earnLoyaltyPoints(uint256 _points) public {
        loyaltyPoints[msg.sender] += _points;
        emit EarnedLoyaltyPoints(msg.sender, _points);
    }

    // Function to redeem loyalty points
    function redeemLoyaltyPoints(uint256 _points) public {
        require(loyaltyPoints[msg.sender] >= _points, "Insufficient loyalty points");
        loyaltyPoints[msg.sender] -= _points;
        emit RedeemedLoyaltyPoints(msg.sender, _points);
    }

    // Function to get a customer's loyalty points
    function getLoyaltyPoints(address _customer) public view returns (uint256) {
        return loyaltyPoints[_customer];
    }
}