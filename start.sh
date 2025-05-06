#!/bin/bash

# Check if artifacts are available
./check-artifacts.sh
if [ $? -ne 0 ]; then
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed. Please install Docker and Docker Compose."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "Docker Compose is not installed. Please install Docker Compose."
  exit 1
fi

# Check if environment files exist, create them if they don't
if [ ! -f ".env" ]; then
  echo "Creating root .env file..."
  cat > .env << EOF
# Mode configuration
USE_MOCK_SERVICE=true
ENABLE_BLOCKCHAIN_LISTENER=true

# what3words API key (required for live mode)
WHAT3WORDS_API_KEY=your_api_key_here

# Alchemy API key
ALCHEMY_API_KEY=your_alchemy_key_here

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Etherscan API key
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Verifier private key
VERIFIER_PRIVATE_KEY=your_private_key_here

# Contract addresses (Sepolia testnet)
LAND_TOKEN_ADDRESS=0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051
LAND_MARKET_ADDRESS=0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598
LAND_SWAP_ADDRESS=0x7A8aB0187eB080b66919f8166e0e91EB16667557
EOF
fi

if [ ! -f "frontend/.env" ]; then
  echo "Creating frontend/.env file..."
  cat > frontend/.env << EOF
NEXT_PUBLIC_LAND_TOKEN_ADDRESS=0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051
NEXT_PUBLIC_LAND_MARKET_ADDRESS=0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598
NEXT_PUBLIC_LAND_SWAP_ADDRESS=0x7A8aB0187eB080b66919f8166e0e91EB16667557
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_METADATA_URL=http://localhost:3000
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key_here
APP_MODE=development
USE_MOCK_SERVICE=true
ENABLE_BLOCKCHAIN_LISTENER=true
EOF
fi

if [ ! -f "backend/.env" ]; then
  echo "Creating backend/.env file..."
  cat > backend/.env << EOF
WHAT3WORDS_API_KEY=your_api_key_here
USE_MOCK_SERVICE=true
ETHERSCAN_API_KEY=your_etherscan_api_key_here
LAND_TOKEN_ADDRESS=0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051
LAND_MARKET_ADDRESS=0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598
LAND_SWAP_ADDRESS=0x7A8aB0187eB080b66919f8166e0e91EB16667557
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key_here
VERIFIER_PRIVATE_KEY=your_private_key_here
ENABLE_BLOCKCHAIN_LISTENER=true
BLOCKCHAIN_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/your_alchemy_key_here
EOF
fi

# Start the application
echo "Starting the application..."
docker-compose up --build -d

echo "Application started successfully!"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:3001"
echo ""
echo "To view logs, run: docker-compose logs -f"
echo "To stop the application, run: docker-compose down"
