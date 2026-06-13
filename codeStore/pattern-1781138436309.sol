pragma solidity ^0.8.20;

contract Swap {
    // Mapping of tokens to their respective prices
    mapping(address => uint256) public tokenPrices;

    // Event emitted when a swap is executed
    event SwapExecuted(address from, address to, uint256 amount);

    // Function to add a new token and its price
    function addToken(address _token, uint256 _price) public {
        tokenPrices[_token] = _price;
    }

    // Function to update the price of an existing token
    function updateTokenPrice(address _token, uint256 _newPrice) public {
        tokenPrices[_token] = _newPrice;
    }

    // Function to swap tokens
    function swap(address fromToken, address toToken, uint256 amount) public {
        // Check if the fromToken and toToken are valid
        require(tokenPrices[fromToken] > 0, "Invalid fromToken");
        require(tokenPrices[toToken] > 0, "Invalid toToken");

        // Calculate the amount of toToken to receive
        uint256 toTokenAmount = amount * tokenPrices[toToken] / tokenPrices[fromToken];

        // Emit the SwapExecuted event
        emit SwapExecuted(fromToken, toToken, toTokenAmount);

        // Transfer the toToken to the user
        // (This is a placeholder, you would replace this with the actual transfer logic)
        // transfer(toToken, msg.sender, toTokenAmount);
    }
}