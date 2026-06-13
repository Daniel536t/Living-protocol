pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/Script.sol";

contract GovernanceToken {
    // Mapping of addresses to their token balances
    mapping(address => uint256) public tokenBalances;

    // Mapping of addresses to their voting powers
    mapping(address => uint256) public votingPowers;

    // Total supply of tokens
    uint256 public totalSupply;

    // Event emitted when a new token is minted
    event NewToken(address indexed to, uint256 amount);

    // Event emitted when a token is transferred
    event TokenTransferred(address indexed from, address indexed to, uint256 amount);

    // Event emitted when voting power is updated
    event VotingPowerUpdated(address indexed account, uint256 newPower);

    // Event emitted when a proposal is created
    event ProposalCreated(address indexed creator, string description, uint256 votingPowerRequired);

    // Event emitted when a vote is cast
    event VoteCast(address indexed voter, uint256 proposalId, bool support);

    // Mapping of proposal IDs to their details
    mapping(uint256 => Proposal) public proposals;

    // Mapping of voter addresses to their votes
    mapping(address => mapping(uint256 => bool)) public votes;

    // Array of proposal IDs
    uint256[] public proposalIds;

    // Struct representing a proposal
    struct Proposal {
        address creator;
        string description;
        uint256 votingPowerRequired;
        uint256 votingPowerCast;
        bool decision;
    }

    // Modifier to check if the caller has sufficient balance
    modifier hasSufficientBalance(uint256 amount) {
        require(tokenBalances[msg.sender] >= amount, "Insufficient balance");
        _;
    }

    // Modifier to check if the caller has sufficient voting power
    modifier hasSufficientVotingPower(uint256 proposalId, uint256 amount) {
        require(votingPowers[msg.sender] >= amount, "Insufficient voting power");
        _;
    }

    // Function to mint new tokens
    function mint(address to, uint256 amount) public {
        require(to != address(0), "Cannot mint to the zero address");
        tokenBalances[to] += amount;
        totalSupply += amount;
        emit NewToken(to, amount);
    }

    // Function to transfer tokens
    function transfer(address to, uint256 amount) public hasSufficientBalance(amount) {
        tokenBalances[msg.sender] -= amount;
        tokenBalances[to] += amount;
        emit TokenTransferred(msg.sender, to, amount);
    }

    // Function to update voting power
    function updateVotingPower(uint256 newPower) public {
        votingPowers[msg.sender] = newPower;
        emit VotingPowerUpdated(msg.sender, newPower);
    }

    // Function to create a new proposal
    function createProposal(string memory description, uint256 votingPowerRequired) public {
        uint256 proposalId = proposalIds.length++;
        proposals[proposalId].creator = msg.sender;
        proposals[proposalId].description = description;
        proposals[proposalId].votingPowerRequired = votingPowerRequired;
        proposals[proposalId].votingPowerCast = 0;
        emit ProposalCreated(msg.sender, description, votingPowerRequired);
    }

    // Function to cast a vote
    function castVote(uint256 proposalId, bool support) public hasSufficientVotingPower(proposalId, 1) {
        require(proposalId < proposalIds.length, "Proposal ID does not exist");
        proposals[proposalId].votingPowerCast += 1;
        votes[msg.sender][proposalId] = support;
        emit VoteCast(msg.sender, proposalId, support);
    }

    // Function to decide on a proposal
    function decide(uint256 proposalId) public {
        require(proposalId < proposalIds.length, "Proposal ID does not exist");
        uint256 votingPowerCast = proposals[proposalId].votingPowerCast;
        uint256 votingPowerRequired = proposals[proposalId].votingPowerRequired;
        if (votingPowerCast >= votingPowerRequired) {
            proposals[proposalId].decision = true;
        } else {
            proposals[proposalId].decision = false;
        }
    }
}