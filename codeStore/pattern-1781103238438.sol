pragma solidity ^0.8.20;

contract Celestial {
    // Mapping of celestial bodies to their respective types
    mapping (address => string) public celestialBodies;

    // Event emitted when a new celestial body is created
    event NewCelestialBody(address indexed creator, string celestialBody);

    // Event emitted when a celestial body is updated
    event UpdateCelestialBody(address indexed updater, string celestialBody);

    // Event emitted when a celestial body is deleted
    event DeleteCelestialBody(address indexed deleter, string celestialBody);

    // Modifier to check if the caller is the owner
    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Modifier to check if the caller has the necessary permissions
    modifier onlyAuthorized(address[] memory authorizedAddresses) {
        bool isAuthorized = false;
        for (uint i = 0; i < authorizedAddresses.length; i++) {
            if (msg.sender == authorizedAddresses[i]) {
                isAuthorized = true;
                break;
            }
        }
        require(isAuthorized, "Only authorized addresses can perform this action");
        _;
    }

    // Owner of the contract
    address public owner;

    // Mapping of celestial body types to their respective permissions
    mapping (string => address[]) public celestialBodyPermissions;

    // Mapping of celestial bodies to their respective permissions
    mapping (address => mapping (string => bool)) public celestialBodyAccess;

    // Constructor to set the owner and initialize the mappings
    constructor() public {
        owner = msg.sender;
        celestialBodyPermissions["star"] = [owner];
        celestialBodyPermissions["planet"] = [owner];
        celestialBodyPermissions["moon"] = [owner];
    }

    // Function to create a new celestial body
    function createCelestialBody(string memory celestialBody) public onlyAuthorized(celestialBodyPermissions[celestialBody]) {
        celestialBodies[msg.sender] = celestialBody;
        emit NewCelestialBody(msg.sender, celestialBody);
    }

    // Function to update an existing celestial body
    function updateCelestialBody(string memory celestialBody) public onlyAuthorized(celestialBodyPermissions[celestialBody]) {
        celestialBodies[msg.sender] = celestialBody;
        emit UpdateCelestialBody(msg.sender, celestialBody);
    }

    // Function to delete a celestial body
    function deleteCelestialBody(string memory celestialBody) public onlyAuthorized(celestialBodyPermissions[celestialBody]) {
        delete celestialBodies[msg.sender];
        emit DeleteCelestialBody(msg.sender, celestialBody);
    }

    // Function to grant permissions to an address for a celestial body type
    function grantPermission(address[] memory addresses, string memory celestialBody) public onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            celestialBodyPermissions[celestialBody].push(addresses[i]);
        }
    }

    // Function to revoke permissions from an address for a celestial body type
    function revokePermission(address[] memory addresses, string memory celestialBody) public onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            celestialBodyPermissions[celestialBody].remove(addresses[i]);
        }
    }

    // Function to check if an address has access to a celestial body
    function hasAccess(address[] memory addresses, string memory celestialBody) public view returns (bool) {
        for (uint i = 0; i < addresses.length; i++) {
            if (celestialBodyAccess[addresses[i]][celestialBody]) {
                return true;
            }
        }
        return false;
    }

    // Function to grant access to a celestial body for an address
    function grantAccess(address[] memory addresses, string memory celestialBody) public onlyAuthorized(celestialBodyPermissions[celestialBody]) {
        for (uint i = 0; i < addresses.length; i++) {
            celestialBodyAccess[addresses[i]][celestialBody] = true;
        }
    }

    // Function to revoke access to a celestial body for an address
    function revokeAccess(address[] memory addresses, string memory celestialBody) public onlyAuthorized(celestialBodyPermissions[celestialBody]) {
        for (uint i = 0; i < addresses.length; i++) {
            celestialBodyAccess[addresses[i]][celestialBody] = false;
        }
    }
}