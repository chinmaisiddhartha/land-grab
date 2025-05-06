# LandGrab Backend

The backend service for the LandGrab platform, providing API endpoints for what3words integration and blockchain interaction.

## Features

- what3words API integration for converting coordinates to 3-word addresses and vice versa
- Mock service for development without a what3words API key
- Blockchain listener for monitoring contract events
- API endpoints for land claiming, releasing, and swapping

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Ethers.js for blockchain interaction
- Axios for API requests


## API Endpoints

### what3words API

- `GET /api/what3words/convert-to-3wa`: Convert coordinates to what3words address
  - Query parameters: `lat`, `lng`
  - Response: `{ words: string }`

- `GET /api/what3words/convert-to-coordinates`: Convert what3words address to coordinates
  - Query parameters: `words`
  - Response: `What3WordsSquare` object

- `GET /api/what3words/adjacent`: Get adjacent squares for a what3words address
  - Query parameters: `words`
  - Response: `{ adjacentSquares: string[] }`

- `GET /api/what3words/check-location`: Check if a user is at a specific location
  - Query parameters: `lat`, `lng`, `words`
  - Response: `{ isAtLocation: boolean }`

### Blockchain API

- `POST /api/blockchain/request-claim`: Request verification for land claiming
  - Body: `{ what3words: string, userAddress: string }`
  - Response: `{ success: boolean, requestId: string, what3words: string, userAddress: string }`

- `POST /api/blockchain/verify-claim`: Verify and claim land
  - Body: `{ requestId: string, what3words: string, userAddress: string, lat?: string, lng?: string }`
  - Response: `{ success: boolean, txHash: string }`

- `GET /api/blockchain/land-info/:what3words`: Get information about a land parcel
  - Response: `{ claimed: boolean, owner?: string, coordinates?: object, country?: string, nearestPlace?: string }`

- `POST /api/blockchain/release-land`: Release land
  - Body: `{ what3words: string }`
  - Response: `{ success: boolean, txHash: string }`

- `POST /api/blockchain/propose-swap`: Propose a land swap
  - Body: `{ myWhat3Words: string, receiverAddress: string, receiverWhat3Words: string }`
  - Response: `{ success: boolean, txHash: string }`

## Environment Variables

Create a `.env` file in the root directory with:

```
# what3words API configuration
WHAT3WORDS_API_KEY=your_api_key_here
USE_MOCK_SERVICE=true

# Blockchain configuration
LAND_TOKEN_ADDRESS=0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051
LAND_MARKET_ADDRESS=0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598
LAND_SWAP_ADDRESS=0x7A8aB0187eB080b66919f8166e0e91EB16667557
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key_here
VERIFIER_PRIVATE_KEY=your_private_key_here
ENABLE_BLOCKCHAIN_LISTENER=true
BLOCKCHAIN_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/your_alchemy_key_here

# Server configuration
PORT=3001
```

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Mock Service

The backend includes a mock service for the what3words API, which can be enabled by setting `USE_MOCK_SERVICE=true` in the `.env` file. This allows development without a what3words API key.

The mock service provides simulated responses for:
- Converting coordinates to what3words addresses
- Converting what3words addresses to coordinates
- Getting adjacent squares
- Checking user location

## Blockchain Interaction

The backend interacts with the blockchain using ethers.js. It connects to the deployed contracts on the Sepolia testnet and provides functions for:

- Requesting land claim verification
- Verifying and claiming land
- Releasing land
- Proposing land swaps

## Blockchain Listener

The backend includes a blockchain listener that monitors events from the LandGrab contracts. This can be enabled by setting `ENABLE_BLOCKCHAIN_LISTENER=true` in the `.env` file.

The listener monitors events such as:
- Land claimed
- Land released
- Swap proposed
- Swap accepted
- Swap cancelled

## Error Handling

The backend includes comprehensive error handling for:
- API errors
- Blockchain errors
- what3words API errors
- Validation errors

## Logging

The backend includes a custom logger middleware that logs:
- Request method and URL
- Query parameters
- Response status code
- Request duration

## Docker

The backend can be run in a Docker container using the provided Dockerfile:

```bash
# Build the Docker image
docker build -t landgrab-backend .

# Run the Docker container
docker run -p 3001:3001 landgrab-backend
```
