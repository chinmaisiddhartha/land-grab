# LandGrab - Web3 Land Ownership Platform

LandGrab is a decentralized application that allows users to claim, trade, and manage ownership of real-world land parcels using what3words addresses. The platform uses blockchain technology to ensure secure and transparent land ownership records.

## Quick Links

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [Blockchain Documentation](./blockchain/README.md)

## Deployed Contracts (Sepolia Testnet)

The smart contracts are deployed and verified on the Sepolia testnet:

- **LandToken**: [0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051](https://sepolia.etherscan.io/address/0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051)
- **LandMarket**: [0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598](https://sepolia.etherscan.io/address/0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598)
- **LandSwap**: [0x7A8aB0187eB080b66919f8166e0e91EB16667557](https://sepolia.etherscan.io/address/0x7A8aB0187eB080b66919f8166e0e91EB16667557)


## Example Transactions

Here are some example transactions performed with our application:

- **Land Claim**: [View Transaction](https://sepolia.etherscan.io/tx/0x0a8acc07af8722832636c59984104d1ebbc9eb94ae25c51f940940f31d207a6b)
- **Land Release**: [View Transaction](https://sepolia.etherscan.io/tx/0xed6dcf745d5522f679e3b5c13ec4a9f2b6f737300fb74d0898ad917c5bbaf321)
- **Land Swap**: [View Transaction](https://sepolia.etherscan.io/tx/0x33098617b7dda794092a77a67ad6b78d14f4ee26aa27d561c971137927e1ad41)


## Demo Mode vs. Live Mode

The application can run in two modes:

### Demo Mode (Default)
- `USE_MOCK_SERVICE=true`: The what3words API calls are mocked
- `ENABLE_BLOCKCHAIN_LISTENER=true`: Location verification is bypassed
- Blockchain interactions use the deployed Sepolia contracts

### Live Mode
- `USE_MOCK_SERVICE=false`: Real what3words API calls (requires API key)
- `ENABLE_BLOCKCHAIN_LISTENER=true`: Real blockchain interactions
- Requires a what3words API key

## Quick Start

### Prerequisites

- Node.js (v16+) and npm/yarn
- what3words API key (for live mode only)

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/land-grab.git
   cd land-grab
   ```

2. Start the application:
   ```bash
   docker-compose up
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Manual Setup

1. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install && cd ..

   # Frontend
   cd frontend && npm install && cd ..
   ```

2. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

3. In a new terminal, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Configuration

### Environment Variables

Create a `.env` file in the root directory with:

```
# Mode configuration
USE_MOCK_SERVICE=true
ENABLE_BLOCKCHAIN_LISTENER=true

# what3words API key (required for live mode)
WHAT3WORDS_API_KEY=your_api_key_here

# Contract addresses (Sepolia testnet)
LAND_TOKEN_ADDRESS=0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051
LAND_MARKET_ADDRESS=0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598
LAND_SWAP_ADDRESS=0x7A8aB0187eB080b66919f8166e0e91EB16667557
```

## Switching Between Demo and Live Mode

To switch to live mode, update the `.env` file:

```
USE_MOCK_SERVICE=false
```

