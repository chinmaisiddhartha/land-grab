import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import * as what3wordsService from './what3words';
import * as mockService from './mock-what3words';
import { eventHandler } from './event-handler';

dotenv.config();

// Load ABI from artifacts
function loadContractABI(contractName: string) {
  try {
    const artifactPath = path.resolve(__dirname, '../../../blockchain/artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.abi;
  } catch (error) {
    console.error(`Error loading ABI for ${contractName}:`, error);
    throw error;
  }
}

// Load contract ABIs
const LAND_TOKEN_ABI = loadContractABI('LandToken');
const LAND_MARKET_ABI = loadContractABI('LandMarket');

// Contract addresses
const LAND_TOKEN_ADDRESS = process.env.LAND_TOKEN_ADDRESS;
const LAND_MARKET_ADDRESS = process.env.LAND_MARKET_ADDRESS;

// Provider for connecting to the blockchain
let provider: ethers.JsonRpcProvider;

// Initialize provider based on environment
if (process.env.BLOCKCHAIN_RPC_URL) {
  // Use the RPC URL from the environment
  provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  console.log(`Using blockchain RPC URL: ${process.env.BLOCKCHAIN_RPC_URL}`);
} else {
  // Fallback to local for development
  provider = new ethers.JsonRpcProvider('http://localhost:8545');
  console.log('No blockchain RPC URL found, defaulting to local blockchain');
}

// Verifier wallet
const verifierPrivateKey = process.env.VERIFIER_PRIVATE_KEY;
let verifierWallet: ethers.Wallet | null = null;

if (verifierPrivateKey) {
  try {
    verifierWallet = new ethers.Wallet(verifierPrivateKey, provider);
    console.log(`Verifier wallet loaded: ${verifierWallet.address}`);
  } catch (error) {
    console.error('Error loading verifier wallet:', error);
  }
}

// Create contract instances
const landTokenContract = LAND_TOKEN_ADDRESS 
  ? new ethers.Contract(LAND_TOKEN_ADDRESS, LAND_TOKEN_ABI, provider)
  : null;

const landMarketContract = LAND_MARKET_ADDRESS 
  ? new ethers.Contract(LAND_MARKET_ADDRESS, LAND_MARKET_ABI, provider)
  : null;

// Determine which service to use
const USE_MOCK_SERVICE = process.env.USE_MOCK_SERVICE === 'true';
const service = USE_MOCK_SERVICE ? mockService : what3wordsService;

// Start listening for blockchain events
export async function startListening() {
  if (!landMarketContract) {
    console.error('Cannot start blockchain listener: Missing LandMarket contract address');
    return;
  }

  if (!verifierWallet) {
    console.error('Cannot start blockchain listener: Missing verifier private key');
    return;
  }

  try {
    // Check if we can connect to the blockchain
    try {
      const network = await provider.getNetwork();
      console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
    } catch (error) {
      console.error('Failed to connect to blockchain:', error);
      console.error('Please check your blockchain configuration in .env file');
      return;
    }

    console.log('Blockchain listener started successfully.');
    console.log(`Using ${USE_MOCK_SERVICE ? 'mock' : 'real'} What3Words service`);
    console.log(`Verifier address: ${verifierWallet.address}`);
    
    // Connect the contract to the verifier wallet for sending transactions
    const connectedMarketContract = landMarketContract.connect(verifierWallet) as any;
    
    // Listen for VerificationRequested events
    landMarketContract.on('VerificationRequested', async (requestId, user, what3words, event) => {
      console.log(`\n==== Verification Request Detected ====`);
      console.log(`Request ID: ${requestId}`);
      console.log(`User: ${user}`);
      console.log(`What3Words: ${what3words}`);
      console.log(`Block Number: ${event.log.blockNumber}`);
      console.log(`Transaction Hash: ${event.log.transactionHash}`);
      
      eventHandler.handleVerificationRequest({ requestId, user, what3words });

      try {
        // In mock mode, automatically approve all verification requests
        if (USE_MOCK_SERVICE) {
          console.log(`\nMock mode: Auto-approving verification for ${what3words}`);
          
          // Get coordinates for the what3words address
          let lat = "51.5074";  // Default London coordinates
          let lng = "-0.1278";
          
          try {
            const square = await service.convertToCoordinates(what3words);
            lat = square.coordinates.lat.toString();
            lng = square.coordinates.lng.toString();
            console.log(`Got coordinates: (${lat}, ${lng})`);
          } catch (error) {
            console.warn(`Could not get coordinates for ${what3words}, using defaults:`, error);
          }
          
          // Wait a few seconds to simulate verification process
          console.log(`Waiting 5 seconds to simulate verification process...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Claim the land on behalf of the user
          console.log(`\nClaiming land for ${user} at ${what3words} (${lat}, ${lng})`);
          
          try {
            // Check if the request still exists and hasn't been processed yet
            const requestExists = await landMarketContract.verificationRequests(requestId);
            if (!requestExists) {
              console.log(`Request ${requestId} no longer exists or has already been processed.`);
              return;
            }
            
            // Send the transaction
            const tx = await connectedMarketContract.claimLandAfterVerification(
              requestId,
              what3words,
              lat,
              lng,
              user,
              { gasLimit: 500000 }  // Set a higher gas limit to ensure transaction goes through
            );
            
            console.log(`Transaction sent: ${tx.hash}`);
            
            // Wait for transaction to be mined
            console.log(`Waiting for transaction to be mined...`);
            const receipt = await tx.wait();
            
            if (receipt) {
              console.log(`\n==== Land Claimed Successfully ====`);
              console.log(`Transaction hash: ${receipt.hash}`);
              console.log(`Gas used: ${receipt.gasUsed.toString()}`);
              console.log(`Block number: ${receipt.blockNumber}`);
            } else {
              console.log(`Transaction completed but receipt is null`);
            }
          } catch (error: any) {
            console.error(`\nError claiming land:`, error);
            
            // Try to extract more detailed error information
            if (error.reason) {
              console.error(`Reason: ${error.reason}`);
            }
            
            if (error.code) {
              console.error(`Error code: ${error.code}`);
            }
            
            if (error.error && error.error.message) {
              console.error(`Error message: ${error.error.message}`);
            }
          }
        } else {
          // In real mode, check if the user is at the location
          console.log(`\nReal mode: Checking if user is at location ${what3words}`);
          
          // This would involve additional logic to verify the user's location
          // For now, we'll just log that verification is needed
          console.log(`Manual verification needed for ${what3words} by ${user}`);
        }
      } catch (error) {
        console.error(`\nError processing verification request:`, error);
      }
    });
    
    // Listen for LandClaimed events
    landMarketContract.on('LandClaimed', (owner, tokenId, what3words, event) => {
      console.log(`\n==== Land Claimed Event ====`);
      console.log(`Owner: ${owner}`);
      console.log(`Token ID: ${tokenId.toString()}`);
      console.log(`What3Words: ${what3words}`);
      console.log(`Transaction Hash: ${event.log.transactionHash}`);
      
      eventHandler.handleLandClaimed({ owner: owner, tokenId: tokenId.toString(), what3words });
    });
    
    // Listen for LandReleased events
    landMarketContract.on('LandReleased', (owner, tokenId, what3words, event) => {
      console.log(`\n==== Land Released Event ====`);
      console.log(`Owner: ${owner}`);
      console.log(`Token ID: ${tokenId.toString()}`);
      console.log(`What3Words: ${what3words}`);
      console.log(`Transaction Hash: ${event.log.transactionHash}`);
      
      eventHandler.handleLandReleased({ owner: owner, tokenId: tokenId.toString(), what3words });
    });

    console.log('\nEvent listeners registered successfully. Waiting for events...');
  } catch (error) {
    console.error('Error starting blockchain listener:', error);
  }
}    
    console.log('\nEvent listeners registered successfully. Waiting for events...');
  try {
    // Add your try block code here
  } catch (error) {
      console.error('Error starting blockchain listener:', error);
    }
