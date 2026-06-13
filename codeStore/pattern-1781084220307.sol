pragma solidity ^0.8.20;

// Import required libraries
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Define the Crowdfunding contract
contract Crowdfunding is ReentrancyGuard, Ownable {
    // Mapping of project IDs to their respective details
    mapping (uint256 => Project) public projects;

    // Mapping of project IDs to their respective token balances
    mapping (uint256 => mapping (address => uint256)) public projectTokenBalances;

    // Mapping of user IDs to their respective NFT balances
    mapping (address => mapping (uint256 => uint256)) public userNFTBalances;

    // Mapping of user IDs to their respective token balances
    mapping (address => mapping (uint256 => uint256)) public userTokenBalances;

    // Governance token contract address
    address public governanceTokenAddress;

    // NFT contract address
    address public nftContractAddress;

    // Event emitted when a new project is created
    event NewProject(uint256 projectId, address creator);

    // Event emitted when a user contributes to a project
    event Contribution(address user, uint256 projectId, uint256 amount);

    // Event emitted when a user receives NFT rewards
    event NFTRewards(address user, uint256 projectId, uint256 nftId);

    // Event emitted when a user receives governance tokens
    event GovernanceTokens(address user, uint256 projectId, uint256 amount);

    // Struct to represent a project
    struct Project {
        uint256 projectId;
        string name;
        string description;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 nftId;
    }

    // Function to create a new project
    function createProject(string memory _name, string memory _description, uint256 _targetAmount) public nonReentrant {
        // Generate a new project ID
        uint256 projectId = uint256(keccak256(abi.encodePacked(_name, _description)));

        // Create a new project
        projects[projectId] = Project(projectId, _name, _description, _targetAmount, 0, 0);

        // Emit the NewProject event
        emit NewProject(projectId, msg.sender);

        // Transfer governance tokens to the project creator
        SafeERC20(governanceTokenAddress).transferFrom(msg.sender, projectId, 1000);
    }

    // Function to contribute to a project
    function contribute(uint256 _projectId, uint256 _amount) public nonReentrant {
        // Get the project details
        Project storage project = projects[_projectId];

        // Check if the project exists
        require(project.projectId != 0, "Project does not exist");

        // Check if the contribution amount is valid
        require(_amount > 0, "Contribution amount must be greater than 0");

        // Increase the project's current amount
        project.currentAmount += _amount;

        // Transfer tokens to the project
        SafeERC20(governanceTokenAddress).transferFrom(msg.sender, _projectId, _amount);

        // Emit the Contribution event
        emit Contribution(msg.sender, _projectId, _amount);
    }

    // Function to distribute NFT rewards
    function distributeNFTRewards(uint256 _projectId) public nonReentrant {
        // Get the project details
        Project storage project = projects[_projectId];

        // Check if the project exists
        require(project.projectId != 0, "Project does not exist");

        // Distribute NFT rewards to contributors
        for (uint256 i = 0; i < project.currentAmount; i++) {
            // Generate a new NFT ID
            uint256 nftId = uint256(keccak256(abi.encodePacked(project.name, project.description)));

            // Increase the user's NFT balance
            userNFTBalances[msg.sender][nftId] += 1;

            // Emit the NFTRewards event
            emit NFTRewards(msg.sender, _projectId, nftId);
        }
    }

    // Function to distribute governance tokens
    function distributeGovernanceTokens(uint256 _projectId) public nonReentrant {
        // Get the project details
        Project storage project = projects[_projectId];

        // Check if the project exists
        require(project.projectId != 0, "Project does not exist");

        // Distribute governance tokens to contributors
        for (uint256 i = 0; i < project.currentAmount; i++) {
            // Increase the user's token balance
            userTokenBalances[msg.sender][_projectId] += 1;

            // Emit the GovernanceTokens event
            emit GovernanceTokens(msg.sender, _projectId, 1);
        }
    }

    // Function to get the project details
    function getProject(uint256 _projectId) public view returns (Project memory) {
        // Get the project details
        Project storage project = projects[_projectId];

        // Return the project details
        return project;
    }
}