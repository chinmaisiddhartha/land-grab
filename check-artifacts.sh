#!/bin/bash

# Check if blockchain/artifacts directory exists
if [ ! -d "blockchain/artifacts" ]; then
  echo "Error: blockchain/artifacts directory not found."
  echo "Creating the directory structure..."
  mkdir -p blockchain/artifacts/contracts
  echo "Please copy your contract artifacts to the blockchain/artifacts directory."
  echo "You need at least:"
  echo "- blockchain/artifacts/contracts/LandToken.sol/LandToken.json"
  echo "- blockchain/artifacts/contracts/LandMarket.sol/LandMarket.json"
  echo "- blockchain/artifacts/contracts/LandSwap.sol/LandSwap.json"
  exit 1
fi

# Check if specific artifact files exist
if [ ! -f "blockchain/artifacts/contracts/LandToken.sol/LandToken.json" ] || \
   [ ! -f "blockchain/artifacts/contracts/LandMarket.sol/LandMarket.json" ] || \
   [ ! -f "blockchain/artifacts/contracts/LandSwap.sol/LandSwap.json" ]; then
  echo "Error: Required contract artifacts are missing."
  echo "Please make sure you have the following files:"
  echo "- blockchain/artifacts/contracts/LandToken.sol/LandToken.json"
  echo "- blockchain/artifacts/contracts/LandMarket.sol/LandMarket.json"
  echo "- blockchain/artifacts/contracts/LandSwap.sol/LandSwap.json"
  exit 1
fi

echo "All required contract artifacts are present."
echo "You can proceed with running the application."
