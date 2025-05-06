# LandGrab Dapp

The blockchain component of the LandGrab app provides smart contracts for land ownership, claiming, and trading using what3words addresses.

## Smart Contracts

### LandToken.sol
An ERC721 token representing ownership of what3words land squares.

Key Features:

Minting and burning of land tokens
Storage of what3words addresses and coordinates
Authorization system for contract interactions
Base64-encoded metadata generation for each token

Key Functions:

// Authorize a contract to mint/burn tokens
function authorizeContract(address contractAddress) external onlyOwner;

// Mint a new token representing a land square
function mint(address to, string memory what3words, string memory lat, string memory lng) external onlyAuthorized returns (uint256);

// Burn a token representing a land square
function burn(uint256 tokenId) external onlyAuthorized;

// Check if a land is claimed
function isLandClaimed(string memory what3words) public view returns (bool);

// Get the token ID for a what3words address
function getTokenId(string memory what3words) public view returns (uint256);

// Get the what3words address for a token ID
function getWhat3Words(uint256 tokenId) public view returns (string memory);

### LandMarket.sol

Handles the claiming and releasing of land parcels.

Key Features:

Location verification request system
Land claiming after verification by a trusted verifier
Land releasing (returning to unclaimed state)
User deletion with automatic land release

Key Functions:

// Request verification for claiming land
function requestVerification(string memory what3words) external returns (bytes32);

// Claim land after verification
function claimLandAfterVerification(bytes32 requestId, string memory what3words, string memory lat, string memory lng, address user) external;

// Release land
function releaseLand(string memory what3words) external;

// Delete user and release all their lands
function deleteUser() external;

### LandSwap.sol

Enables land trading between users and implements a surrounding land takeover mechanism.

Key Features:

Land swap proposal system
Surrounding land takeover mechanism (claim land surrounded by your parcels)
Swap acceptance and cancellation


Key Functions:


- Propose a swap of land between users
function proposeSwap(string memory myWhat3Words, address receiver, string memory receiverWhat3Words) external returns (bytes32);


- Accept a swap proposal
function acceptSwap(bytes32 proposalId) external;


- Cancel a swap proposal
function cancelSwap(bytes32 proposalId) external;


- Check if a land is surrounded by lands owned by a single user
function isLandSurrounded(string memory centralWhat3Words, string[] memory surroundingWhat3Words) public view returns (bool);

- Take over a surrounded land
function takeoverSurroundedLand(string memory centralWhat3Words, string[] memory surroundingWhat3Words) external;


## Development Tools

The project uses both Hardhat and Foundry for development, testing, and deployment:

Hardhat: JavaScript-based development environment


Foundry: Rust-based development environment with Forge (testing), Cast (transactions), and Anvil (local node)


Slither: Static analysis tool for security auditing


```blockchain/
├── contracts/           # Smart contracts
│   ├── LandToken.sol
│   ├── LandMarket.sol
│   └── LandSwap.sol
├── test/                # Hardhat tests
│   ├── LandToken.test.ts
│   ├── LandMarket.test.ts
│   └── LandSwap.test.ts
├── test/                # Foundry tests
│   ├── LandToken.t.sol
│   ├── LandMarket.t.sol
│   └── LandSwap.t.sol
├── script/              # Deployment scripts
│   └── deploy.ts
├── ignition/            # Hardhat Ignition deployment modules
│   └── modules/LandGrab.ts
├── artifacts/           # Compiled contract artifacts
├── out/                 # Foundry output
├── hardhat.config.ts    # Hardhat configuration
├── foundry.toml         # Foundry configuration
└── slither.config.json  # Slither configuration
```

## Development 

Prerequisites
- Node.js (v16+)
- npm or yarn
- Foundry (forge, cast, anvil)
- Python 3.x (for Slither)

### Installation

```
# Install Node.js dependencies
npm install

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Foundry Commands

```# Build contracts
forge build

# Clean build artifacts
forge clean

# Run tests
forge test

# Run tests with verbose output
forge test -vvv

# Run a specific test
forge test --match-contract LandTokenTest -vvv

# Deploy contracts

forge script script/Deploy.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast

# Interact with deployed contracts
cast call <CONTRACT_ADDRESS> "isLandClaimed(string)" "filled.count.soap" --rpc-url <RPC_URL>

# Start a local node
anvil
```

## Slither Static Analysis

```# Install Slither
pip3 install slither-analyzer

# Run Slither on all contracts
slither .

# Run Slither on a specific contract
slither contracts/LandToken.sol

# Run Slither with a specific detector
slither . --detect reentrancy-eth
```

## Hardhat Commands 

```# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run a specific test
npx hardhat test test/LandToken.test.ts

# Deploy contracts to local network
npx hardhat run scripts/deploy.ts

# Deploy contracts to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Start a local node
npx hardhat node

# Deploy using Ignition
npx hardhat ignition deploy ignition/modules/LandGrab.ts

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Security Considerations

These contracts implement several security best practices:

- Access Control: Using OpenZeppelin's Ownable pattern and custom authorization


- Checks-Effects-Interactions Pattern: To prevent reentrancy attacks
Input Validation: Thorough validation of all inputs


- Event Emission: Events for all important state changes


- Reentrancy Guard: Using OpenZeppelin's ReentrancyGuard for critical functions

## Gas Optimization

The contracts include several gas optimizations:

- Storage Packing: Efficient storage layout

- Minimal Storage: Using mappings instead of arrays where possible

- Function Visibility: Appropriate visibility modifiers
- Memory vs Storage: Careful use of memory and storage variables

- Solidity Optimizer: Enabled with 200 runs
