pragma solidity ^0.8.20;

contract LoyaltyProgram {
    // Mapping of member addresses to their loyalty points
    mapping (address => uint256) public memberPoints;

    // Mapping of member addresses to their loyalty level
    mapping (address => uint256) public memberLevel;

    // Mapping of member addresses to their membership status
    mapping (address => bool) public isMember;

    // Event emitted when a member joins the loyalty program
    event MemberJoined(address indexed member);

    // Event emitted when a member earns loyalty points
    event PointsEarned(address indexed member, uint256 points);

    // Event emitted when a member levels up
    event MemberLevelUp(address indexed member, uint256 newLevel);

    // Event emitted when a member's membership status changes
    event MembershipStatusChanged(address indexed member, bool newStatus);

    // Constructor to initialize the loyalty program
    constructor() {
        // Initialize the loyalty program with the specified patterns
        // Pattern 1 (T): sha256:0x2
        // Pattern 2 (Loyalty Program Creation): sha256:0x4f2cfefb238eea65df606f3ce952cb1a54f4cc588a1716c7973db6ec7a246131
        // Pattern 3 (Loyalty Program Design): sha256:0xea8613bbee870af3717a720151fba9fb68615b424c931f59ea2766978ca0e576
    }

    // Function to join the loyalty program
    function join() public {
        require(!isMember[msg.sender], "Member already exists");
        memberPoints[msg.sender] = 0;
        memberLevel[msg.sender] = 1;
        isMember[msg.sender] = true;
        emit MemberJoined(msg.sender);
    }

    // Function to earn loyalty points
    function earnPoints(uint256 points) public {
        require(isMember[msg.sender], "Member does not exist");
        memberPoints[msg.sender] += points;
        emit PointsEarned(msg.sender, points);
    }

    // Function to level up
    function levelUp() public {
        require(isMember[msg.sender], "Member does not exist");
        require(memberPoints[msg.sender] >= 100, "Not enough points to level up");
        memberLevel[msg.sender]++;
        memberPoints[msg.sender] -= 100;
        emit MemberLevelUp(msg.sender, memberLevel[msg.sender]);
    }

    // Function to change membership status
    function changeMembershipStatus(bool newStatus) public {
        require(isMember[msg.sender], "Member does not exist");
        isMember[msg.sender] = newStatus;
        emit MembershipStatusChanged(msg.sender, newStatus);
    }

    // Function to get member points
    function getMemberPoints() public view returns (uint256) {
        return memberPoints[msg.sender];
    }

    // Function to get member level
    function getMemberLevel() public view returns (uint256) {
        return memberLevel[msg.sender];
    }

    // Function to get membership status
    function getMembershipStatus() public view returns (bool) {
        return isMember[msg.sender];
    }
}