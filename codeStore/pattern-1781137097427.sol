pragma solidity ^0.8.20;

contract CommunityTipJar {
    // Mapping of wallet addresses to their vote counts
    mapping (address => uint256) public voteCounts;

    // Mapping of wallet addresses to their deposited SOL amounts
    mapping (address => uint256) public depositedSOL;

    // Array of contributor addresses
    address[] public contributors;

    // Mapping of contributor addresses to their vote counts
    mapping (address => uint256) public contributorVoteCounts;

    // Total deposited SOL
    uint256 public totalDepositedSOL;

    // Locking period for distribution (in weeks)
    uint256 public lockPeriod;

    // Current week
    uint256 public currentWeek;

    // Event emitted when a contributor is selected
    event ContributorSelected(address contributor, uint256 amount);

    // Event emitted when a deposit is made
    event DepositMade(address depositor, uint256 amount);

    // Event emitted when a vote is cast
    event VoteCast(address voter, address contributor);

    // Constructor
    constructor() {
        // Initialize locking period (in weeks)
        lockPeriod = 1 weeks;

        // Initialize current week
        currentWeek = block.timestamp / (7 days);
    }

    // Function to add a contributor
    function addContributor(address contributor) public {
        // Check if contributor is already added
        require(contributors.length == 0 || contributors.length == 1, "Contributor already added");

        // Add contributor to array
        contributors.push(contributor);

        // Initialize contributor's vote count
        contributorVoteCounts[contributor] = 0;
    }

    // Function to deposit SOL
    function deposit(uint256 amount) public {
        // Check if deposit amount is valid
        require(amount > 0, "Invalid deposit amount");

        // Update total deposited SOL
        totalDepositedSOL += amount;

        // Update depositor's deposited SOL amount
        depositedSOL[msg.sender] += amount;

        // Emit event
        emit DepositMade(msg.sender, amount);
    }

    // Function to vote for a contributor
    function vote(address contributor) public {
        // Check if contributor is valid
        require(address(0) != contributor, "Invalid contributor");

        // Check if voter has already voted
        require(depositedSOL[msg.sender] > 0, "You must deposit SOL to vote");

        // Check if contributor is in the list of contributors
        require(contributors.length > 0, "Contributors list is empty");

        // Update contributor's vote count
        contributorVoteCounts[contributor] += 1;

        // Update voter's vote count
        voteCounts[msg.sender] += 1;

        // Emit event
        emit VoteCast(msg.sender, contributor);
    }

    // Function to distribute SOL to the selected contributor
    function distribute() public {
        // Check if distribution is allowed
        require(block.timestamp / (7 days) - currentWeek >= lockPeriod, "Distribution not allowed yet");

        // Get the contributor with the most votes
        address selectedContributor = contributors[0];
        for (uint256 i = 1; i < contributors.length; i++) {
            if (contributorVoteCounts[contributors[i]] > contributorVoteCounts[selectedContributor]) {
                selectedContributor = contributors[i];
            }
        }

        // Check if the selected contributor has at least one vote
        require(contributorVoteCounts[selectedContributor] > 0, "No votes for selected contributor");

        // Distribute SOL to the selected contributor
        uint256 amount = totalDepositedSOL;
        totalDepositedSOL = 0;

        // Update deposited SOL amounts
        for (address contributor in contributors) {
            depositedSOL[contributor] = 0;
        }

        // Update vote counts
        for (address contributor in contributors) {
            contributorVoteCounts[contributor] = 0;
        }

        // Update current week
        currentWeek = block.timestamp / (7 days);

        // Emit event
        emit ContributorSelected(selectedContributor, amount);
    }
}