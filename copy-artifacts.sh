#!/bin/bash

# Check if blockchain directory exists
if [ ! -d "blockchain" ]; then
  echo "Error: blockchain directory not found."
  echo "Please make sure you have the blockchain directory with your contract artifacts."
  exit 1
fi

# Create the artifacts directory structure if it doesn't exist
mkdir -p blockchain/artifacts/contracts/LandToken.sol
mkdir -p blockchain/artifacts/contracts/LandMarket.sol
mkdir -p blockchain/artifacts/contracts/LandSwap.sol

# Check if the source artifacts exist
if [ ! -f "blockchain/out/LandToken.sol/LandToken.json" ] || \
   [ ! -f "blockchain/out/LandMarket.sol/LandMarket.json" ] || \
   [ ! -f "blockchain/out/LandSwap.sol/LandSwap.json" ]; then
  echo "Error: Source contract artifacts are missing."
  echo "Please make sure you have compiled your contracts and have the following files:"
  echo "- blockchain/out/LandToken.sol/LandToken.json"
  echo "- blockchain/out/LandMarket.sol/LandMarket.json"
  echo "- blockchain/out/LandSwap.sol/LandSwap.json"
  exit 1
fi

# Copy the artifacts
echo "Copying artifacts..."
cp blockchain/out/LandToken.sol/LandToken.json blockchain/artifacts/contracts/LandToken.sol/
cp blockchain/out/LandMarket.sol/LandMarket.json blockchain/artifacts/contracts/LandMarket.sol/
cp blockchain/out/LandSwap.sol/LandSwap.json blockchain/artifacts/contracts/LandSwap.sol/

echo "Artifacts copied successfully!"
