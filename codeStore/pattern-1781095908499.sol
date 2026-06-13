pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/SafeERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";
import "https://github.com/0xProject/0x-protocol-contracts/contracts/ERC20/ERC20.sol";
import "https://github.com/0xProject/0x-protocol-contracts/contracts/token/ERC721/ERC721.sol";
import "https://github.com/0xProject/0x-protocol-contracts/contracts/token/ERC721/SoulboundToken.sol";
import "https://github.com/0xProject/0x-protocol-contracts/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract DecentralizedIdentityVerification {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(address => mapping(uint256 => bool)) public tokenOwners;
    mapping(address => mapping(uint256 => bool)) public tokenRevoked;
    mapping(address => mapping(uint256 => bool)) public tokenVerified;
    mapping(address => mapping(uint256 => bool)) public tokenRevokedReason;

    mapping(address => mapping(uint256 => SoulboundToken)) public soulboundTokens;

    mapping(address => mapping(uint256 => uint256)) public proofVerification;

    mapping(address => mapping(uint256 => uint256)) public revokedProofs;

    mapping(address => mapping(uint256 => uint256)) public verifiedProofs;

    mapping(address => mapping(uint256 => uint256)) public revokedReasons;

    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    // Function to create a new soulbound token
    function createSoulboundToken(address _owner, uint256 _tokenId) public {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_tokenId != 0, "Token ID cannot be zero");

        _tokenIds.increment();

        uint256 id = _tokenIds.current();

        soulboundTokens[_owner][id] = SoulboundToken(_owner, _tokenId);

        tokenOwners[_owner][id] = true;
        tokenRevoked[_owner][id] = false;
        tokenVerified[_owner][id] = false;
        tokenRevokedReason[_owner][id] = 0;
    }

    // Function to verify a proof
    function verifyProof(address _owner, uint256 _tokenId, uint256 _proof) public {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_tokenId != 0, "Token ID cannot be zero");

        proofVerification[_owner][_tokenId] = _proof;

        tokenVerified[_owner][_tokenId] = true;
    }

    // Function to revoke a token
    function revokeToken(address _owner, uint256 _tokenId, uint256 _reason) public {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_tokenId != 0, "Token ID cannot be zero");

        tokenRevoked[_owner][_tokenId] = true;
        tokenRevokedReason[_owner][_tokenId] = _reason;

        revokedProofs[_owner][_tokenId] = proofVerification[_owner][_tokenId];
        revokedReasons[_owner][_tokenId] = _reason;
    }

    // Function to get the status of a token
    function getTokenStatus(address _owner, uint256 _tokenId) public view returns (bool, bool, bool, uint256) {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_tokenId != 0, "Token ID cannot be zero");

        bool isOwner = tokenOwners[_owner][_tokenId];
        bool isRevoked = tokenRevoked[_owner][_tokenId];
        bool isVerified = tokenVerified[_owner][_tokenId];
        uint256 reason = tokenRevokedReason[_owner][_tokenId];

        return (isOwner, isRevoked, isVerified, reason);
    }

    // Function to get the proof verification status
    function getProofVerificationStatus(address _owner, uint256 _tokenId) public view returns (uint256) {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_tokenId != 0, "Token ID cannot be zero");

        return proofVerification[_owner][_tokenId];
    }

    // Function to get the revoked proof status
    function getRevokedProofStatus(address _owner, uint256 _tokenId) public view returns (uint256) {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_tokenId != 0, "Token ID cannot be zero");

        return revokedProofs[_owner][_tokenId];
    }

    // Function to get the revoked reason status
    function getRevokedReasonStatus(address _owner, uint256 _tokenId) public view returns (uint256) {
        require(_owner != address(0), "Owner cannot be the zero address");
        require(_tokenId != 0, "Token ID cannot be zero");

        return revokedReasons[_owner][_tokenId];
    }
}

contract SoulboundToken {
    address public owner;
    uint256 public tokenId;

    constructor(address _owner, uint256 _tokenId) public {
        owner = _owner;
        tokenId = _tokenId;
    }

    // Function to get the owner of the soulbound token
    function getOwner() public view returns (address) {
        return owner;
    }

    // Function to get the token ID of the soulbound token
    function getTokenId() public view returns (uint256) {
        return tokenId;
    }
}