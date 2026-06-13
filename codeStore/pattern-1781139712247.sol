pragma solidity ^0.8.20;

contract SimpleLogicSystem {
    // Mapping of patterns to their corresponding logic
    mapping(bytes32 => bool) public patterns;

    // Mapping of pattern names to their corresponding hashes
    mapping(string => bytes32) public patternNames;

    // Event emitted when a pattern is added or updated
    event PatternUpdated(bytes32 indexed pattern, bool value);

    // Event emitted when a pattern is added or updated
    event PatternNameUpdated(string indexed patternName, bytes32 indexed hash);

    // Function to add or update a pattern
    function updatePattern(bytes32 _pattern, bool _value) public {
        patterns[_pattern] = _value;
        emit PatternUpdated(_pattern, _value);
    }

    // Function to add or update a pattern name
    function updatePatternName(string memory _patternName, bytes32 _hash) public {
        patternNames[_patternName] = _hash;
        emit PatternNameUpdated(_patternName, _hash);
    }

    // Function to get the value of a pattern
    function getPatternValue(bytes32 _pattern) public view returns (bool) {
        return patterns[_pattern];
    }

    // Function to get the hash of a pattern name
    function getPatternNameHash(string memory _patternName) public view returns (bytes32) {
        return patternNames[_patternName];
    }
}

contract PatternLogic {
    // Mapping of pattern hashes to their corresponding logic
    mapping(bytes32 => bool) public logic;

    // Function to update the logic of a pattern
    function updateLogic(bytes32 _pattern, bool _value) public {
        logic[_pattern] = _value;
    }

    // Function to get the logic of a pattern
    function getLogic(bytes32 _pattern) public view returns (bool) {
        return logic[_pattern];
    }
}

contract PatternManager {
    // Mapping of pattern names to their corresponding hashes
    mapping(string => bytes32) public patternNames;

    // Function to add or update a pattern name
    function updatePatternName(string memory _patternName, bytes32 _hash) public {
        patternNames[_patternName] = _hash;
    }

    // Function to get the hash of a pattern name
    function getPatternNameHash(string memory _patternName) public view returns (bytes32) {
        return patternNames[_patternName];
    }
}