pragma solidity ^0.8.20;

contract FreelanceMarketplace {
    // Mapping of client IDs to their profiles
    mapping (address => Client) public clients;
    
    // Mapping of freelancer IDs to their profiles
    mapping (address => Freelancer) public freelancers;
    
    // Mapping of job IDs to their details
    mapping (uint256 => Job) public jobs;
    
    // Mapping of proposal IDs to their details
    mapping (uint256 => Proposal) public proposals;
    
    // Mapping of payment IDs to their details
    mapping (uint256 => Payment) public payments;
    
    // Mapping of dispute IDs to their details
    mapping (uint256 => Dispute) public disputes;
    
    // Event emitted when a new job is posted
    event JobPosted(address client, uint256 jobId, string description);
    
    // Event emitted when a proposal is submitted
    event ProposalSubmitted(address freelancer, uint256 proposalId, uint256 jobId);
    
    // Event emitted when a payment is made
    event PaymentMade(address client, address freelancer, uint256 paymentId, uint256 amount);
    
    // Event emitted when a dispute is raised
    event DisputeRaised(address client, address freelancer, uint256 disputeId);
    
    // Event emitted when a dispute is resolved
    event DisputeResolved(address client, address freelancer, uint256 disputeId);
    
    // Event emitted when a payment is released to the freelancer
    event PaymentReleased(address client, address freelancer, uint256 paymentId);
    
    // Event emitted when a payment is refunded to the client
    event PaymentRefunded(address client, address freelancer, uint256 paymentId);
    
    // Event emitted when a proposal is accepted
    event ProposalAccepted(address client, address freelancer, uint256 proposalId);
    
    // Event emitted when a proposal is rejected
    event ProposalRejected(address client, address freelancer, uint256 proposalId);
    
    // Event emitted when a freelancer's payment is released
    event FreelancerPaymentReleased(address freelancer, uint256 paymentId);
    
    // Event emitted when a client's payment is refunded
    event ClientPaymentRefunded(address client, uint256 paymentId);
    
    // Event emitted when a job is completed
    event JobCompleted(address client, address freelancer, uint256 jobId);
    
    // Event emitted when a job is canceled
    event JobCanceled(address client, address freelancer, uint256 jobId);
    
    // Event emitted when a freelancer's profile is updated
    event FreelancerProfileUpdated(address freelancer, string name, string bio);
    
    // Event emitted when a client's profile is updated
    event ClientProfileUpdated(address client, string name, string bio);
    
    // Event emitted when a job's details are updated
    event JobUpdated(address client, uint256 jobId, string description);
    
    // Event emitted when a proposal's details are updated
    event ProposalUpdated(address freelancer, uint256 proposalId, string description);
    
    // Event emitted when a payment's details are updated
    event PaymentUpdated(address client, address freelancer, uint256 paymentId, uint256 amount);
    
    // Event emitted when a dispute's details are updated
    event DisputeUpdated(address client, address freelancer, uint256 disputeId, string description);
    
    // Struct to represent a client
    struct Client {
        address id;
        string name;
        string bio;
        uint256 balance;
    }
    
    // Struct to represent a freelancer
    struct Freelancer {
        address id;
        string name;
        string bio;
        uint256 balance;
    }
    
    // Struct to represent a job
    struct Job {
        address clientId;
        uint256 jobId;
        string description;
        uint256 deadline;
    }
    
    // Struct to represent a proposal
    struct Proposal {
        address freelancerId;
        uint256 proposalId;
        uint256 jobId;
        string description;
        uint256 amount;
    }
    
    // Struct to represent a payment
    struct Payment {
        address clientId;
        address freelancerId;
        uint256 paymentId;
        uint256 amount;
        bool released;
    }
    
    // Struct to represent a dispute
    struct Dispute {
        address clientId;
        address freelancerId;
        uint256 disputeId;
        string description;
        bool resolved;
    }
    
    // Function to create a new client
    function createClient(address id, string memory name, string memory bio) public {
        clients[id] = Client(id, name, bio, 0);
    }
    
    // Function to create a new freelancer
    function createFreelancer(address id, string memory name, string memory bio) public {
        freelancers[id] = Freelancer(id, name, bio, 0);
    }
    
    // Function to post a new job
    function postJob(address clientId, uint256 jobId, string memory description, uint256 deadline) public {
        jobs[jobId] = Job(clientId, jobId, description, deadline);
        emit JobPosted(clientId, jobId, description);
    }
    
    // Function to submit a proposal
    function submitProposal(address freelancerId, uint256 proposalId, uint256 jobId, string memory description, uint256 amount) public {
        proposals[proposalId] = Proposal(freelancerId, proposalId, jobId, description, amount);
        emit ProposalSubmitted(freelancerId, proposalId, jobId);
    }
    
    // Function to make a payment
    function makePayment(address clientId, address freelancerId, uint256 paymentId, uint256 amount) public {
        payments[paymentId] = Payment(clientId, freelancerId, paymentId, amount, false);
        emit PaymentMade(clientId, freelancerId, paymentId, amount);
    }
    
    // Function to raise a dispute
    function raiseDispute(address clientId, address freelancerId, uint256 disputeId, string memory description) public {
        disputes[disputeId] = Dispute(clientId, freelancerId, disputeId, description, false);
        emit DisputeRaised(clientId, freelancerId, disputeId);
    }
    
    // Function to resolve a dispute
    function resolveDispute(uint256 disputeId) public {
        disputes[disputeId].resolved = true;
        emit DisputeResolved(disputes[disputeId].clientId, disputes[disputeId].freelancerId, disputeId);
    }
    
    // Function to release a payment to the freelancer
    function releasePayment(uint256 paymentId) public {
        payments[paymentId].released = true;
        emit PaymentReleased(payments[paymentId].clientId, payments[paymentId].freelancerId, paymentId);
    }
    
    // Function to refund a payment to the client
    function refundPayment(uint256 paymentId) public {
        payments[paymentId].released = false;
        emit PaymentRefunded(payments[paymentId].clientId, payments[paymentId].freelancerId, paymentId);
    }
    
    // Function to accept a proposal
    function acceptProposal(uint256 proposalId) public {
        proposals[proposalId].amount = proposals[proposalId].amount * 90 / 100;
        emit ProposalAccepted(proposals[proposalId].freelancerId, proposals[proposalId].clientId, proposalId);
    }
    
    // Function to reject a proposal
    function rejectProposal(uint256 proposalId) public {
        emit ProposalRejected(proposals[proposalId].freelancerId, proposals[proposalId].clientId, proposalId);
    }
    
    // Function to update a freelancer's profile
    function updateFreelancerProfile(address freelancerId, string memory name, string memory bio) public {
        freelancers[freelancerId].name = name;
        freelancers[freelancerId].bio = bio;
        emit FreelancerProfileUpdated(freelancerId, name, bio);
    }
    
    // Function to update a client's profile
    function updateClientProfile(address clientId, string memory name, string memory bio) public {
        clients[clientId].name = name;
        clients[clientId].bio = bio;
        emit ClientProfileUpdated(clientId, name, bio);
    }
    
    // Function to update a job's details
    function updateJob(uint256 jobId, string memory description, uint256 deadline) public {
        jobs[jobId].description = description;
        jobs[jobId].deadline = deadline;
        emit JobUpdated(jobs[jobId].clientId, jobId, description);
    }
    
    // Function to update a proposal's details
    function updateProposal(uint256 proposalId, string memory description, uint256 amount) public {
        proposals[proposalId].description = description;
        proposals[proposalId].amount = amount;
        emit ProposalUpdated(proposals[proposalId].freelancerId, proposalId, description);
    }
    
    // Function to update a payment's details
    function updatePayment(uint256 paymentId, uint256 amount) public {
        payments[paymentId].amount = amount;
        emit PaymentUpdated(payments[paymentId].clientId, payments[paymentId].freelancerId, paymentId, amount);
    }
    
    // Function to update a dispute's details
    function updateDispute(uint256 disputeId, string memory description) public {
        disputes[disputeId].description = description;
        emit DisputeUpdated(disputes[disputeId].clientId, disputes[disputeId].freelancerId, disputeId, description);
    }
}