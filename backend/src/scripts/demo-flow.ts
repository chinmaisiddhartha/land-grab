import { ethers } from 'ethers';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function demoFlow() {
  try {
    // Load contract ABIs
    const LandMarketABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../blockchain/artifacts/contracts/LandMarket.sol/LandMarket.json'), 'utf8')).abi;
    const LandTokenABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../blockchain/artifacts/contracts/LandToken.sol/LandToken.json'), 'utf8')).abi;
    
    // Contract addresses
    const LAND_MARKET_ADDRESS = process.env.LAND_MARKET_ADDRESS || '';
    const LAND_TOKEN_ADDRESS = process.env.LAND_TOKEN_ADDRESS || '';
    
    // RPC URL and private key
    const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || '';
    const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY || '';
    
    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(VERIFIER_PRIVATE_KEY, provider);
    
    // Contract instances
    const landMarketContract = new ethers.Contract(
      LAND_MARKET_ADDRESS,
      LandMarketABI,
      signer
    );
    
    const landTokenContract = new ethers.Contract(
      LAND_TOKEN_ADDRESS,
      LandTokenABI,
      provider
    );
    
    // Demo parameters
    const what3words = "index.home.raft"; // Use a different what3words address
    const userAddress = "0xABe2426574b11A7d8823Df110ab9De278982D753";
    const lat = "51.5075";
    const lng = "-0.1279";
    
    console.log("1. Requesting verification...");
    const requestTx = await landMarketContract.requestVerification(what3words);
    const requestReceipt = await requestTx.wait();
    console.log(`Request transaction: https://sepolia.etherscan.io/tx/${requestReceipt.hash}`);
    
    // Get the requestId from the event logs
    const requestEvent = requestReceipt.logs.find(
      (log: any) => landMarketContract.interface.parseLog(log)?.name === 'VerificationRequested'
    );
    const requestId = landMarketContract.interface.parseLog(requestEvent)?.args.requestId;
    console.log(`Request ID: ${requestId}`);
    
    console.log("2. Verifying and claiming land...");
    const claimTx = await landMarketContract.claimLandAfterVerification(
      requestId,
      what3words,
      lat,
      lng,
      userAddress
    );
    const claimReceipt = await claimTx.wait();
    console.log(`Claim transaction: https://sepolia.etherscan.io/tx/${claimReceipt.hash}`);
    
    // Check if land is claimed
    const isLandClaimed = await landTokenContract.isLandClaimed(what3words);
    console.log(`Land claimed: ${isLandClaimed}`);
    
    if (isLandClaimed) {
      const tokenId = await landTokenContract.getTokenId(what3words);
      const owner = await landTokenContract.ownerOf(tokenId);
      console.log(`Token ID: ${tokenId}`);
      console.log(`Owner: ${owner}`);
    }
    
    console.log("3. Releasing land...");
    // Create a new signer with the user's private key
    // For demo purposes, we'll use the same signer
    const releaseTx = await landMarketContract.releaseLand(what3words);
    const releaseReceipt = await releaseTx.wait();
    console.log(`Release transaction: https://sepolia.etherscan.io/tx/${releaseReceipt.hash}`);
    
    // Check if land is released
    const isStillClaimed = await landTokenContract.isLandClaimed(what3words);
    console.log(`Land still claimed: ${isStillClaimed}`);
    
    console.log("Demo completed successfully!");
  } catch (error) {
    console.error("Error in demo flow:", error);
  }
}

demoFlow();
