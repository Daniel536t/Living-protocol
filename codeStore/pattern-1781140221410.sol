pragma solidity ^0.8.20;

contract BuildProof {
    // Mapping to store patterns
    mapping (bytes32 => bool) public patterns;

    // Event emitted when a new pattern is added
    event PatternAdded(bytes32 _pattern);

    // Event emitted when a build is initiated
    event BuildInitiated(bytes32 _pattern);

    // Function to add a new pattern
    function addPattern(bytes32 _pattern) public {
        patterns[_pattern] = true;
        emit PatternAdded(_pattern);
    }

    // Function to initiate a build
    function initiateBuild(bytes32 _pattern) public {
        require(patterns[_pattern], "Pattern does not exist");
        emit BuildInitiated(_pattern);
    }

    // Function to check if a pattern exists
    function checkPattern(bytes32 _pattern) public view returns (bool) {
        return patterns[_pattern];
    }

    // Function to get the patterns
    function getPatterns() public view returns (bytes32[] memory) {
        bytes32[] memory patternArray = new bytes32[](patterns.length);
        uint index = 0;
        for (bytes32 pattern in patterns) {
            if (pattern != 0) {
                patternArray[index] = pattern;
                index++;
            }
        }
        return patternArray;
    }
}