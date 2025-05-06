import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../middleware/logger';
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
const LAND_SWAP_ABI = loadContractABI('LandSwap');

// Contract addresses
const LAND_TOKEN_ADDRESS = process.env.LAND_TOKEN_ADDRESS;
const LAND_MARKET_ADDRESS = process.env.LAND_MARKET_ADDRESS;
const LAND_SWAP_ADDRESS = process.env.LAND_SWAP_ADDRESS;

// Use WebSocket provider for better event handling
const WS_RPC_URL = process.env.BLOCKCHAIN_WS_URL || 'wss://eth-sepolia.g.alchemy.com/v2/etAgSXEhoVUUnhQoqJpDrFAJP_Q_6nO0';
const HTTP_RPC_URL = process.env.BLOCKCHAIN_RPC_URL || process.env.BLOCKCHAIN_URL || 'https://eth-sepolia.g.alchemy.com/v2/etAgSXEhoVUUnhQoqJpDrFAJP_Q_6nO0';

// Create providers with improved configuration
// WebSocket provider for events
const wsProvider = new ethers.WebSocketProvider(WS_RPC_URL);

// HTTP provider for transactions and queries
const provider = new ethers.JsonRpcProvider(HTTP_RPC_URL, undefined, {
  polling: true,
  pollingInterval: 4000,
  staticNetwork: true,
  cacheTimeout: -1, // Disable cache timeout
});

// Log provider connection
logger.info(`Using blockchain HTTP RPC URL: ${HTTP_RPC_URL}`);
logger.info(`Using blockchain WebSocket URL: ${WS_RPC_URL}`);

// Create contract instances for transactions and queries
const landTokenContract = LAND_TOKEN_ADDRESS 
  ? new ethers.Contract(LAND_TOKEN_ADDRESS, LAND_TOKEN_ABI, provider)
  : null;

const landMarketContract = LAND_MARKET_ADDRESS 
  ? new ethers.Contract(LAND_MARKET_ADDRESS, LAND_MARKET_ABI, provider)
  : null;

const landSwapContract = LAND_SWAP_ADDRESS 
  ? new ethers.Contract(LAND_SWAP_ADDRESS, LAND_SWAP_ABI, provider)
  : null;

// Create WebSocket contract instances for events
const wsLandTokenContract = LAND_TOKEN_ADDRESS 
  ? new ethers.Contract(LAND_TOKEN_ADDRESS, LAND_TOKEN_ABI, wsProvider)
  : null;

const wsLandMarketContract = LAND_MARKET_ADDRESS 
  ? new ethers.Contract(LAND_MARKET_ADDRESS, LAND_MARKET_ABI, wsProvider)
  : null;

const wsLandSwapContract = LAND_SWAP_ADDRESS 
  ? new ethers.Contract(LAND_SWAP_ADDRESS, LAND_SWAP_ABI, wsProvider)
  : null;

// Log contract addresses
logger.info(`LandToken address: ${LAND_TOKEN_ADDRESS || 'Not configured'}`);
logger.info(`LandMarket address: ${LAND_MARKET_ADDRESS || 'Not configured'}`);
logger.info(`LandSwap address: ${LAND_SWAP_ADDRESS || 'Not configured'}`);


// Set up event listeners using WebSocket provider
export function setupEventListeners() {
  if (!wsLandMarketContract) {
    logger.error('Cannot set up event listeners: LandMarket contract not configured');
    return;
  }

  // Handle WebSocket connection issues
  wsProvider.on('error', (error) => {
    logger.error('WebSocket provider error:', error);
    // Attempt to reconnect after a delay
    setTimeout(() => setupEventListeners(), 5000);
  });

  // Set up event listeners for LandMarket
  wsLandMarketContract.on('VerificationRequested', 
    (requestId, user, what3words) => {
      logger.info(`Verification requested: ${requestId} by ${user} for ${what3words}`);
      
      // Process directly with event handler
      eventHandler.handleVerificationRequest({
        requestId,
        user,
        what3words
      });
    }
  );

  wsLandMarketContract.on('LandClaimed', 
    (owner, tokenId, what3words) => {
      logger.info(`Land claimed: ${what3words} (Token #${tokenId}) by ${owner}`);
      
      // Process directly with event handler
      eventHandler.handleLandClaimed({
        owner,
        tokenId: tokenId.toString(),
        what3words
      });
    }
  );

  wsLandMarketContract.on('LandReleased', 
    (owner, tokenId, what3words) => {
      logger.info(`Land released: ${what3words} (Token #${tokenId}) by ${owner}`);
      
      // Process directly with event handler
      eventHandler.handleLandReleased({
        owner,
        tokenId: tokenId.toString(),
        what3words
      });
    }
  );

  // Set up event listeners for LandSwap
  if (wsLandSwapContract) {
    wsLandSwapContract.on('SwapProposed',
      (proposalId, proposer, proposerTokenId, receiver, receiverTokenId) => {
        logger.info(`Swap proposed: ${proposalId} by ${proposer} to ${receiver}`);
        
        // Process directly with event handler
        eventHandler.handleSwapProposed({
          proposalId,
          proposer,
          proposerTokenId: proposerTokenId.toString(),
          receiver,
          receiverTokenId: receiverTokenId.toString()
        });
      }
    );

    wsLandSwapContract.on('SwapAccepted',
      (proposalId) => {
        logger.info(`Swap accepted: ${proposalId}`);
        
        // Process directly with event handler
        eventHandler.handleSwapAccepted({
          proposalId
        });
      }
    );
  }

  logger.info('Blockchain event listeners set up successfully');
}
// Initialize the blockchain service
export function initBlockchainService() {
  setupEventListeners();
  logger.info('Blockchain service initialized');
}

// Check if land is claimed
export async function isLandClaimed(what3words: string): Promise<boolean> {
  if (!landTokenContract) {
    logger.error('LandToken contract not configured');
    throw new Error('LandToken contract not configured');
  }
  
  try {
    logger.debug(`Checking if land is claimed: ${what3words}`);
    return await (landTokenContract as any).isLandClaimed(what3words);
  } catch (error) {
    logger.error('Error checking if land is claimed:', error);
    throw error;
  }
}

// Get land owner
export async function getLandOwner(what3words: string): Promise<string> {
  if (!landTokenContract) {
    logger.error('LandToken contract not configured');
    throw new Error('LandToken contract not configured');
  }
  
  try {
    logger.debug(`Getting land owner for: ${what3words}`);
    // First get the token ID
    const tokenId = await (landTokenContract as any).getTokenId(what3words);
    logger.debug(`Token ID for ${what3words}: ${tokenId}`);
    
    // Then get the owner
    return await (landTokenContract as any).ownerOf(tokenId);
  } catch (error) {
    logger.error('Error getting land owner:', error);
    throw error;
  }
}

// Get land info (combined function for efficiency)
export async function getLandInfo(what3words: string): Promise<any> {
  if (!landTokenContract) {
    logger.error('LandToken contract not configured');
    throw new Error('LandToken contract not configured');
  }
  
  try {
    // Check if land is claimed
    const isClaimed = await (landTokenContract as any).isLandClaimed(what3words);
    
    if (!isClaimed) {
      return { isClaimed: false };
    }
    
    // Get token ID and owner
    const tokenId = await (landTokenContract as any).getTokenId(what3words);
    const owner = await (landTokenContract as any).ownerOf(tokenId);
    
    return {
      isClaimed: true,
      tokenId: tokenId.toString(),
      owner
    };
  } catch (error: any) {
    logger.error('Error getting land info:', error);
    // If the error is because the land is not claimed, return isClaimed: false
    if (error.message && error.message.includes('Land not claimed')) {
      return { isClaimed: false };
    }
    throw error;
  }
}

// Request verification for land claim
export async function requestVerification(what3words: string, userAddress: string): Promise<string> {
  if (!landMarketContract) {
    logger.error('LandMarket contract not configured');
    throw new Error('LandMarket contract not configured');
  }
  
  try {
    logger.debug(`Requesting verification for ${what3words} by ${userAddress}`);
    // This is a read-only simulation of the transaction
    // The actual transaction would be sent from the frontend
    const requestId = await (landMarketContract as any).callStatic.requestVerification(what3words, { from: userAddress });
    logger.debug(`Request ID: ${requestId}`);
    return requestId;
  } catch (error) {
    logger.error('Error requesting verification:', error);
    throw error;
  }
}

// Verify and claim land
export async function verifyAndClaimLand(
  requestId: string,
  what3words: string,
  lat: string,
  lng: string,
  userAddress: string
): Promise<string> {
  if (!landMarketContract) {
    logger.error('LandMarket contract not configured');
    throw new Error('LandMarket contract not configured');
  }
  
  try {
    logger.debug(`Verifying and claiming land for request ${requestId}`);
    // This would be called by the verifier (backend server)
    // We need a wallet with the verifier private key to sign this transaction
    
    // For testing purposes, you can use this to check if the transaction would succeed
    await (landMarketContract as any).callStatic.claimLandAfterVerification(
      requestId,
      what3words,
      lat,
      lng,
      userAddress
    );
    
    return 'Verification would succeed';
  } catch (error) {
    logger.error('Error verifying and claiming land:', error);
    throw error;
  }
}

// Release land
export async function releaseLand(what3words: string): Promise<string> {
  if (!landMarketContract) {
    logger.error('LandMarket contract not configured');
    throw new Error('LandMarket contract not configured');
  }
  
  try {
    logger.debug(`Simulating release land for: ${what3words}`);
    // This is a read-only simulation of the transaction
    // The actual transaction would be sent from the frontend
    const tx = await (landMarketContract as any).callStatic.releaseLand(what3words);
    return 'Transaction would succeed';
  } catch (error) {
    logger.error('Error releasing land:', error);
    throw error;
  }
}

// Propose swap
export async function proposeSwap(
  myWhat3Words: string,
  receiverAddress: string,
  receiverWhat3Words: string
): Promise<string> {
  if (!landSwapContract) {
    logger.error('LandSwap contract not configured');
    throw new Error('LandSwap contract not configured');
  }
  
  try {
    logger.debug(`Simulating propose swap: ${myWhat3Words} to ${receiverAddress} for ${receiverWhat3Words}`);
    // This is a read-only simulation of the transaction
    // The actual transaction would be sent from the frontend
    const tx = await (landSwapContract as any).callStatic.proposeSwap(
      myWhat3Words,
      receiverAddress,
      receiverWhat3Words
    );
    return 'Transaction would succeed';
  } catch (error) {
    logger.error('Error proposing swap:', error);
    throw error;
  }
}

// Get user lands
export async function getUserLands(address: string): Promise<any[]> {
  if (!landTokenContract) {
    logger.error('LandToken contract not configured');
    throw new Error('LandToken contract not configured');
  }
  
  try {
    logger.debug(`Getting lands for address: ${address}`);
    
    // Get balance of the user (number of tokens owned)
    const balance = await (landTokenContract as any).balanceOf(address);
    const balanceNumber = Number(balance);
    
    logger.debug(`User ${address} owns ${balanceNumber} lands`);
    
    if (balanceNumber === 0) {
      return [];
    }
    
    // Fetch all tokens owned by the user
    const lands = [];
    
    for (let i = 0; i < balanceNumber; i++) {
      try {
        // Get token ID at index i
        const tokenId = await (landTokenContract as any).tokenOfOwnerByIndex(address, i);
        logger.debug(`Token ID at index ${i}: ${tokenId}`);
        
        // Get what3words for this token
        const what3words = await (landTokenContract as any).getWhat3Words(tokenId);
        logger.debug(`what3words for token ${tokenId}: ${what3words}`);
        
        // Get token URI (metadata)
        const tokenURI = await (landTokenContract as any).tokenURI(tokenId);
        
        // Parse metadata from base64-encoded URI
        let metadata = {};
        if (tokenURI.startsWith('data:application/json;base64,')) {
          const base64Data = tokenURI.replace('data:application/json;base64,', '');
          const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
          metadata = JSON.parse(jsonString);
          logger.debug(`Metadata for token ${tokenId}: ${JSON.stringify(metadata)}`);
        }
        
        lands.push({
          tokenId: tokenId.toString(),
          what3words,
          metadata
        });
      } catch (error) {
        logger.error(`Error fetching token at index ${i}:`, error);
      }
    }
    
    return lands;
  } catch (error) {
    logger.error('Error getting user lands:', error);
    throw error;
  }
}

// Call this function when the server starts
initBlockchainService();
