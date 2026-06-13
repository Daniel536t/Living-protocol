pragma solidity ^0.8.20;

contract BugBounty {
    // Mapping of project addresses to bounty details
    mapping (address => Bounty) public bounties;

    // Mapping of hunter addresses to reputation scores
    mapping (address => uint) public reputations;

    // Multisig of reviewer addresses
    address[] public reviewers;

    // Event emitted when a bounty is created
    event BountyCreated(address indexed project, uint amount);

    // Event emitted when a proof-of-fix is submitted
    event ProofSubmitted(address indexed hunter, address indexed project, uint amount);

    // Event emitted when a payout is approved
    event PayoutApproved(address indexed hunter, address indexed project, uint amount);

    // Event emitted when a hunter's reputation is updated
    event ReputationUpdated(address indexed hunter, uint newReputation);

    // Event emitted when a hunter is slashed for a false claim
    event Slashed(address indexed hunter, uint amount);

    // Bounty struct
    struct Bounty {
        address project;
        uint amount;
        uint challengePeriod;
        uint payoutPeriod;
        bool active;
    }

    // Function to create a new bounty
    function createBounty(address _project, uint _amount, uint _challengePeriod, uint _payoutPeriod) public {
        bounties[_project] = Bounty(_project, _amount, _challengePeriod, _payoutPeriod, true);
        emit BountyCreated(_project, _amount);
    }

    // Function to submit a proof-of-fix
    function submitProof(address _project, uint _amount) public {
        require(bounties[_project].active, "Bounty is not active");
        require(reputations[msg.sender] > 0, "Hunter has no reputation");
        bounties[_project].active = false;
        emit ProofSubmitted(msg.sender, _project, _amount);
    }

    // Function to approve a payout
    function approvePayout(address _hunter, address _project, uint _amount) public {
        require(reviewers.length > 0, "No reviewers");
        require(bounties[_project].active == false, "Bounty is active");
        require(bounties[_project].payoutPeriod <= block.timestamp, "Payout period has not passed");
        bounties[_project].project.transfer(_hunter, _amount);
        reputations[_hunter]++;
        emit PayoutApproved(_hunter, _project, _amount);
    }

    // Function to update a hunter's reputation
    function updateReputation(address _hunter, uint _newReputation) public {
        require(reviewers.length > 0, "No reviewers");
        reputations[_hunter] = _newReputation;
        emit ReputationUpdated(_hunter, _newReputation);
    }

    // Function to slash a hunter for a false claim
    function slashHunter(address _hunter, uint _amount) public {
        require(reviewers.length > 0, "No reviewers");
        reputations[_hunter]--;
        emit Slashed(_hunter, _amount);
    }

    // Function to add a reviewer
    function addReviewer(address _reviewer) public {
        reviewers.push(_reviewer);
    }

    // Function to remove a reviewer
    function removeReviewer(address _reviewer) public {
        for (uint i = 0; i < reviewers.length; i++) {
            if (reviewers[i] == _reviewer) {
                delete reviewers[i];
            }
        }
    }
}