pragma solidity ^0.8.20;

contract VaultSystem {
    // Mapping of user addresses to their vaults
    mapping(address => Vault[]) public userVaults;

    // Mapping of vault IDs to their corresponding vaults
    mapping(uint256 => Vault) public vaults;

    // Event emitted when a user creates a new vault
    event VaultCreated(uint256 vaultId, address user);

    // Event emitted when a user adds a new item to their vault
    event ItemAdded(uint256 vaultId, uint256 itemId);

    // Event emitted when a user removes an item from their vault
    event ItemRemoved(uint256 vaultId, uint256 itemId);

    // Event emitted when a user updates an item in their vault
    event ItemUpdated(uint256 vaultId, uint256 itemId);

    // Event emitted when a user deletes their vault
    event VaultDeleted(uint256 vaultId);

    // Structure representing a vault
    struct Vault {
        uint256 id;
        address owner;
        mapping(uint256 => Item) items;
    }

    // Structure representing an item in a vault
    struct Item {
        uint256 id;
        string name;
        string description;
    }

    // Function to create a new vault
    function createVault() public {
        // Generate a unique vault ID
        uint256 vaultId = uint256(keccak256(abi.encodePacked(block.timestamp)));

        // Create a new vault
        Vault memory newVault = Vault(vaultId, msg.sender, new mapping(uint256 => Item));

        // Store the new vault in the vaults mapping
        vaults[vaultId] = newVault;

        // Store the new vault in the user's vaults mapping
        userVaults[msg.sender].push(newVault);

        // Emit the VaultCreated event
        emit VaultCreated(vaultId, msg.sender);
    }

    // Function to add a new item to a vault
    function addItem(uint256 vaultId, string memory name, string memory description) public {
        // Get the vault from the vaults mapping
        Vault storage vault = vaults[vaultId];

        // Create a new item
        Item memory newItem = Item(uint256(keccak256(abi.encodePacked(block.timestamp))), name, description);

        // Add the new item to the vault's items mapping
        vault.items[vault.items.length] = newItem;

        // Emit the ItemAdded event
        emit ItemAdded(vaultId, uint256(keccak256(abi.encodePacked(block.timestamp))));
    }

    // Function to remove an item from a vault
    function removeItem(uint256 vaultId, uint256 itemId) public {
        // Get the vault from the vaults mapping
        Vault storage vault = vaults[vaultId];

        // Remove the item from the vault's items mapping
        delete vault.items[itemId];

        // Emit the ItemRemoved event
        emit ItemRemoved(vaultId, itemId);
    }

    // Function to update an item in a vault
    function updateItem(uint256 vaultId, uint256 itemId, string memory name, string memory description) public {
        // Get the vault from the vaults mapping
        Vault storage vault = vaults[vaultId];

        // Get the item from the vault's items mapping
        Item storage item = vault.items[itemId];

        // Update the item's name and description
        item.name = name;
        item.description = description;

        // Emit the ItemUpdated event
        emit ItemUpdated(vaultId, itemId);
    }

    // Function to delete a vault
    function deleteVault(uint256 vaultId) public {
        // Get the vault from the vaults mapping
        Vault storage vault = vaults[vaultId];

        // Remove the vault from the vaults mapping
        delete vaults[vaultId];

        // Remove the vault from the user's vaults mapping
        for (uint256 i = 0; i < userVaults[msg.sender].length; i++) {
            if (userVaults[msg.sender][i].id == vaultId) {
                userVaults[msg.sender].length--;
            }
        }

        // Emit the VaultDeleted event
        emit VaultDeleted(vaultId);
    }
}