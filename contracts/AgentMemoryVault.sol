// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentMemoryVault {
    struct ContractPattern {
        string patternId;
        string name;
        string description;
        string codeTemplate;
        string[] semanticTags;
        string[] features;
        uint256 successCount;
        uint256 createdAt;
        address creatorAgent;
        mapping(address => bool) delegatedAgents;
    }

    address public owner;
    uint256 public patternCount;
    mapping(string => ContractPattern) private patterns;
    mapping(uint256 => string) private patternIndex;
    mapping(address => string[]) public agentContributions;
    mapping(address => mapping(string => bool)) public agentAccess;

    event PatternStored(string indexed patternId, address indexed creatorAgent, string name);
    event PatternAccessed(string indexed patternId, address indexed agent);
    event PatternUpdated(string indexed patternId, uint256 newSuccessCount);
    event AccessDelegated(string indexed patternId, address indexed from, address indexed to);
    event AccessRevoked(string indexed patternId, address indexed from, address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier patternExists(string memory _patternId) {
        require(bytes(patterns[_patternId].patternId).length > 0, "Pattern not found");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function storePattern(
        string memory _patternId,
        string memory _name,
        string memory _description,
        string memory _codeTemplate,
        string[] memory _semanticTags,
        string[] memory _features
    ) external {
        require(bytes(patterns[_patternId].patternId).length == 0, "Pattern already exists");
        ContractPattern storage p = patterns[_patternId];
        p.patternId = _patternId;
        p.name = _name;
        p.description = _description;
        p.codeTemplate = _codeTemplate;
        p.semanticTags = _semanticTags;
        p.features = _features;
        p.successCount = 1;
        p.createdAt = block.timestamp;
        p.creatorAgent = msg.sender;
        p.delegatedAgents[msg.sender] = true;
        patternIndex[patternCount] = _patternId;
        patternCount++;
        agentContributions[msg.sender].push(_patternId);
        agentAccess[msg.sender][_patternId] = true;
        emit PatternStored(_patternId, msg.sender, _name);
    }

    function getPattern(string memory _patternId)
        external view patternExists(_patternId)
        returns (
            string memory name,
            string memory description,
            string memory codeTemplate,
            string[] memory semanticTags,
            string[] memory features,
            uint256 successCount,
            address creatorAgent
        )
    {
        ContractPattern storage p = patterns[_patternId];
        require(p.delegatedAgents[msg.sender], "Access denied");
        return (p.name, p.description, p.codeTemplate, p.semanticTags, p.features, p.successCount, p.creatorAgent);
    }

    function searchByTags(string[] memory _tags, uint256 _maxResults)
        external view
        returns (string[] memory matchedIds, uint256[] memory scores)
    {
        matchedIds = new string[](_maxResults);
        scores = new uint256[](_maxResults);
        uint256 resultCount = 0;
        for (uint256 i = 0; i < patternCount && resultCount < _maxResults; i++) {
            string memory pid = patternIndex[i];
            ContractPattern storage p = patterns[pid];
            if (!p.delegatedAgents[msg.sender]) continue;
            uint256 matchScore = _calculateTagMatch(p.semanticTags, _tags);
            if (matchScore > 0) {
                matchedIds[resultCount] = pid;
                scores[resultCount] = matchScore;
                resultCount++;
            }
        }
        assembly {
            mstore(matchedIds, resultCount)
            mstore(scores, resultCount)
        }
    }

    function recordSuccess(string memory _patternId) external patternExists(_patternId) {
        ContractPattern storage p = patterns[_patternId];
        require(p.delegatedAgents[msg.sender], "Access denied");
        p.successCount++;
        emit PatternUpdated(_patternId, p.successCount);
    }

    function delegateAccess(string memory _patternId, address _toAgent) external patternExists(_patternId) {
        ContractPattern storage p = patterns[_patternId];
        require(p.delegatedAgents[msg.sender], "You lack access to delegate");
        require(!p.delegatedAgents[_toAgent], "Agent already has access");
        p.delegatedAgents[_toAgent] = true;
        agentAccess[_toAgent][_patternId] = true;
        agentContributions[_toAgent].push(_patternId);
        emit AccessDelegated(_patternId, msg.sender, _toAgent);
    }

    function revokeAccess(string memory _patternId, address _agent) external patternExists(_patternId) {
        ContractPattern storage p = patterns[_patternId];
        require(p.creatorAgent == msg.sender, "Only creator can revoke");
        require(_agent != p.creatorAgent, "Cannot revoke creator");
        p.delegatedAgents[_agent] = false;
        agentAccess[_agent][_patternId] = false;
        emit AccessRevoked(_patternId, msg.sender, _agent);
    }

    function hasAccess(address _agent, string memory _patternId) external view returns (bool) {
        return patterns[_patternId].delegatedAgents[_agent];
    }

    function getAgentPatterns(address _agent) external view returns (string[] memory) {
        return agentContributions[_agent];
    }

    function _calculateTagMatch(string[] memory patternTags, string[] memory queryTags)
        internal pure returns (uint256)
    {
        uint256 score = 0;
        for (uint256 i = 0; i < queryTags.length; i++) {
            for (uint256 j = 0; j < patternTags.length; j++) {
                if (keccak256(abi.encodePacked(patternTags[j])) == keccak256(abi.encodePacked(queryTags[i]))) {
                    score++;
                }
            }
        }
        return score;
    }
}
