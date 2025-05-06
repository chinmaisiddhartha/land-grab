import { Request, Response, NextFunction } from 'express';
import * as blockchainService from '../services/blockchain';
import * as what3wordsService from '../services/what3words';
import * as mockWhat3wordsService from '../services/mock-what3words';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Determine which service to use
const USE_MOCK_SERVICE = process.env.USE_MOCK_SERVICE === 'true';
const w3wService = USE_MOCK_SERVICE ? mockWhat3wordsService : what3wordsService;

// Load contract ABI from artifacts
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

// Create contract instances
const landTokenContract = LAND_TOKEN_ADDRESS 
  ? new ethers.Contract(LAND_TOKEN_ADDRESS, LAND_TOKEN_ABI, provider)
  : null;

const landMarketContract = LAND_MARKET_ADDRESS 
  ? new ethers.Contract(LAND_MARKET_ADDRESS, LAND_MARKET_ABI, provider)
  : null;

const landSwapContract = LAND_SWAP_ADDRESS 
  ? new ethers.Contract(LAND_SWAP_ADDRESS, LAND_SWAP_ABI, provider)
  : null;
  
export async function requestLandClaim(req: Request, res: Response, next: NextFunction) {
  try {
    const { what3words, userAddress } = req.body;
    
    if (!what3words || !userAddress) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    
    // Check if land is already claimed
    const isLandClaimed = await blockchainService.isLandClaimed(what3words);
    if (isLandClaimed) {
      return res.status(400).json({ error: 'Land already claimed' });
    }
    
    // Request verification on the blockchain
    const requestId = await blockchainService.requestVerification(what3words, userAddress);
    
    res.json({ 
      success: true,
      requestId,
      what3words,
      userAddress
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyAndClaimLand(req: Request, res: Response, next: NextFunction) {
  try {
    const { requestId, what3words, userAddress } = req.body;
    
    if (!requestId || !what3words || !userAddress) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    
    // Get coordinates for the what3words address
    const square = await w3wService.convertToCoordinates(what3words);
    const { lat, lng } = square.coordinates;
    
    // Verify user is at the location
    const userLat = parseFloat(req.body.lat || lat.toString());
    const userLng = parseFloat(req.body.lng || lng.toString());
    const isAtLocation = await w3wService.isUserAtLocation(
      userLat,
      userLng,
      what3words
    );
    
    if (!isAtLocation) {
      return res.status(400).json({ error: 'User is not at the specified location' });
    }
    
    // Claim land on blockchain
    const txHash = await blockchainService.verifyAndClaimLand(
      requestId,
      what3words,
      lat.toString(),
      lng.toString(),
      userAddress
    );
    
    res.json({ success: true, txHash });
  } catch (error) {
    next(error);
  }
}

export async function getLandInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { what3words } = req.params;
    
    if (!what3words) {
      return res.status(400).json({ error: 'Missing what3words parameter' });
    }
    
    // Try to get info from the blockchain directly first
    if (landTokenContract) {
      try {
        // Check if land is claimed
        const isClaimed = await landTokenContract.isLandClaimed(what3words);
        
        if (!isClaimed) {
          return res.json({ claimed: false });
        }
        
        // Get token ID
        const tokenId = await landTokenContract.getTokenId(what3words);
        
        // Get owner
        const owner = await landTokenContract.ownerOf(tokenId);
        
        // Get token URI
        const tokenURI = await landTokenContract.tokenURI(tokenId);
        
        // Get coordinates using the w3w service
        const square = await w3wService.convertToCoordinates(what3words);
        
        return res.json({
          claimed: true,
          tokenId: tokenId.toString(),
          owner,
          what3words,
          tokenURI,
          coordinates: square.coordinates,
          country: square.country,
          nearestPlace: square.nearestPlace
        });
      } catch (error) {
        console.error('Error getting land info from blockchain directly:', error);
        // Fall back to the service method if direct blockchain access fails
      }
    }
    
    // Fallback to the service method
    const isLandClaimed = await blockchainService.isLandClaimed(what3words);
    
    if (!isLandClaimed) {
      return res.json({ claimed: false });
    }
    
    const owner = await blockchainService.getLandOwner(what3words);
    
    // Get coordinates using the w3w service
    const square = await w3wService.convertToCoordinates(what3words);
    
    res.json({
      claimed: true,
      owner,
      coordinates: square.coordinates,
      country: square.country,
      nearestPlace: square.nearestPlace
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserLands(req: Request, res: Response, next: NextFunction) {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }
    
    console.log(`Getting lands for address: ${address}`);
    
    if (!landTokenContract) {
      console.error('Land token contract not initialized');
      return res.status(500).json({ error: 'Land token contract not initialized' });
    }
    
    try {
      // Get all Transfer events where the 'to' address is the user's address
      const filter = landTokenContract.filters.Transfer(null, address);
      const events = await landTokenContract.queryFilter(filter);
      
      console.log(`Found ${events.length} Transfer events for user ${address}`);
      
      // Process each event to get token details
      const lands = [];
      const processedTokenIds = new Set(); // To avoid duplicates
      
      for (const event of events) {
        try {
          if (!('args' in event)) continue;
          const tokenId = event.args.tokenId;
          
          // Skip if we've already processed this token or if the user no longer owns it
          if (processedTokenIds.has(tokenId.toString())) continue;
          
          // Check if the user still owns this token
          const currentOwner = await landTokenContract.ownerOf(tokenId);
          if (currentOwner.toLowerCase() !== address.toLowerCase()) continue;
          
          processedTokenIds.add(tokenId.toString());
          
          const what3words = await landTokenContract.getWhat3Words(tokenId);
          const tokenURI = await landTokenContract.tokenURI(tokenId);
          
          console.log(`Found token ${tokenId} with what3words ${what3words}`);
          
          // Get coordinates using the w3w service
          const square = await w3wService.convertToCoordinates(what3words);
          
          lands.push({
            tokenId: tokenId.toString(),
            what3words,
            tokenURI,
            coordinates: square.coordinates,
            country: square.country,
            nearestPlace: square.nearestPlace
          });
        } catch (error) {
          console.error(`Error processing token:`, error);
        }
      }
      
      console.log(`Returning ${lands.length} lands for user ${address}`);
      return res.json({ lands });
    } catch (error) {
      console.error('Error getting user lands:', error);
      return res.status(500).json({ 
        error: 'Error getting user lands', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  } catch (error) {
    console.error('Error in getUserLands:', error);
    next(error);
  }
}
export async function releaseLand(req: Request, res: Response, next: NextFunction) {
  try {
    const { what3words } = req.body;
    
    if (!what3words) {
      return res.status(400).json({ error: 'Missing what3words parameter' });
    }
    
    const txHash = await blockchainService.releaseLand(what3words);
    
    res.json({ success: true, txHash });
  } catch (error) {
    next(error);
  }
}
export async function isLandOwner(what3words: string, address: string): Promise<boolean> {
  try {
    if (!landTokenContract) {
      throw new Error('Land token contract is not initialized');
    }

    // First check if the land is claimed
    const isLandClaimed = await landTokenContract.isLandClaimed(what3words);
    if (!isLandClaimed) {
      return false;
    }
    
    // Get the token ID for the what3words address
    const tokenId = await landTokenContract.getTokenId(what3words);
    
    // Check if the address is the owner of the token
    const owner = await landTokenContract.ownerOf(tokenId);
    
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error(`Error checking if ${address} owns land at ${what3words}:`, error);
    return false;
  }
}
/**
 * Propose a swap between two lands
 */
export async function proposeSwap(
  myWhat3Words: string,
  receiverAddress: string,
  receiverWhat3Words: string,
  senderAddress?: string
) {
  try {
    console.log('Propose swap request:', { myWhat3Words, receiverAddress, receiverWhat3Words, senderAddress });
    
    if (!myWhat3Words || !receiverAddress || !receiverWhat3Words) {
      throw new Error('Missing parameters: myWhat3Words, receiverAddress, or receiverWhat3Words');
    }
    
    // Use the provided sender address or a default one
    const sender = senderAddress || process.env.DEFAULT_SENDER_ADDRESS;
    
    if (!sender) {
      throw new Error('No sender address provided and no default address configured');
    }
    
    // Check if the sender owns the land they want to swap
    const isOwner = await isLandOwner(myWhat3Words, sender);
    if (!isOwner) {
      throw new Error('You do not own this land');
    }
    
    // Check if the receiver owns the land they want to swap
    const isReceiverOwner = await isLandOwner(receiverWhat3Words, receiverAddress);
    if (!isReceiverOwner) {
      throw new Error('Receiver does not own the specified land');
    }
    
    // Propose the swap on the blockchain
    const txHash = await blockchainService.proposeSwap(
      myWhat3Words,
      receiverAddress,
      receiverWhat3Words
    );
    
    return { 
      success: true, 
      txHash,
      proposalId: txHash, // Use txHash as proposalId for simplicity
      message: 'Swap proposal submitted successfully'
    };
  } catch (error) {
    console.error('Error in proposeSwap:', error);
    throw error;
  }
}