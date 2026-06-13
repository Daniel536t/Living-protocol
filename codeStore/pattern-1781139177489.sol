pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft/IERC20Permit.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract CommunityTipJar is ReentrancyGuard {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;

    // Mapping of wallet addresses to their vote status
    mapping(address => bool) public voted;

    // Mapping of contributor addresses to their deposit balances
    mapping(address => uint256) public deposits;

    // Mapping of contributor addresses to their vote counts
    mapping(address => uint256) public voteCounts;

    // Mapping of contributor addresses to their timelocked distribution status
    mapping(address => bool) public timelocked;

    // Counter for tracking the number of contributors
    Counters.Counter private _contributorCount;

    // Set of contributor addresses
    EnumerableSet.AddressSet private _contributors;

    // Mapping of contributor addresses to their vote status
    mapping(address => uint256) public contributorVotes;

    // Mapping of contributor addresses to their vote status
    mapping(address => uint256) public contributorVoteCounts;

    // Mapping of contributor addresses to their timelocked distribution status
    mapping(address => uint256) public contributorTimelocked;

    // Address of the SOL token
    address public immutable SOL_TOKEN;

    // Address of the contract owner
    address public immutable OWNER;

    // Mapping of week numbers to their corresponding timelocked distribution status
    mapping(uint256 => bool) public timelockedDistributions;

    // Event emitted when a contributor receives a deposit
    event Deposited(address indexed contributor, uint256 amount);

    // Event emitted when a contributor votes
    event Voted(address indexed contributor);

    // Event emitted when a contributor receives a timelocked distribution
    event TimelockedDistribution(address indexed contributor, uint256 amount);

    // Event emitted when the timelocked distribution is released
    event TimelockedDistributionReleased(uint256 week);

    // Constructor
    constructor(address _SOL_TOKEN) {
        SOL_TOKEN = _SOL_TOKEN;
        OWNER = msg.sender;
        _contributors.add(address(0));
    }

    // Modifier to check if the caller is the contract owner
    modifier onlyOwner() {
        require(msg.sender == OWNER, "Only the contract owner can call this function");
        _;
    }

    // Modifier to check if the caller has voted
    modifier onlyVoted() {
        require(voted[msg.sender], "You must vote before depositing");
        _;
    }

    // Modifier to check if the caller has not voted
    modifier onlyNotVoted() {
        require(!voted[msg.sender], "You have already voted");
        _;
    }

    // Function to deposit SOL into the community tip jar
    function deposit(uint256 _amount) public nonReentrant onlyNotVoted {
        require(_amount > 0, "Deposit amount must be greater than 0");
        deposits[msg.sender] += _amount;
        emit Deposited(msg.sender, _amount);
    }

    // Function to vote for a contributor
    function vote(address _contributor) public nonReentrant onlyVoted {
        require(_contributor != address(0), "Contributor address cannot be 0");
        require(_contributors.contains(_contributor), "Contributor is not in the community");
        voted[msg.sender] = false;
        voteCounts[_contributor]++;
        contributorVotes[_contributor] += 1;
        emit Voted(msg.sender);
    }

    // Function to set the timelocked distribution status for a contributor
    function setTimelocked(address _contributor, bool _timelocked) public onlyOwner {
        require(_contributor != address(0), "Contributor address cannot be 0");
        require(_contributors.contains(_contributor), "Contributor is not in the community");
        contributorTimelocked[_contributor] = _timelocked;
        timelockedDistributions[getWeekNumber()] = _timelocked;
        emit TimelockedDistribution(_contributor, _timelocked ? 0 : 1);
    }

    // Function to release the timelocked distribution
    function releaseTimelockedDistribution(uint256 _week) public onlyOwner {
        require(timelockedDistributions[_week], "Timelocked distribution is not set for this week");
        for (uint256 i = 0; i < _contributors.length(); i++) {
            address contributor = _contributors.at(i);
            if (contributorTimelocked[contributor]) {
                // Release the timelocked distribution to the contributor
                // Replace with actual logic to release the distribution
                emit TimelockedDistributionReleased(_week);
            }
        }
    }

    // Function to get the number of contributors
    function getContributorCount() public view returns (uint256) {
        return _contributorCount.current();
    }

    // Function to get the set of contributor addresses
    function getContributors() public view returns (address[] memory) {
        address[] memory contributors = new address[](_contributors.length());
        for (uint256 i = 0; i < _contributors.length(); i++) {
            contributors[i] = _contributors.at(i);
        }
        return contributors;
    }

    // Function to get the deposit balance of a contributor
    function getDepositBalance(address _contributor) public view returns (uint256) {
        return deposits[_contributor];
    }

    // Function to get the vote count of a contributor
    function getVoteCount(address _contributor) public view returns (uint256) {
        return voteCounts[_contributor];
    }

    // Function to get the timelocked distribution status of a contributor
    function getTimelockedDistribution(address _contributor) public view returns (bool) {
        return contributorTimelocked[_contributor];
    }

    // Function to get the week number
    function getWeekNumber() public view returns (uint256) {
        // Replace with actual logic to get the week number
        return 1;
    }
}