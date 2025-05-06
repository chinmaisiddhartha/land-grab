import { ethers } from 'ethers';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function manualClaim() {
  // Load contract ABIs
  const LandMarketABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../blockchain/artifacts/contracts/LandMarket.sol/LandMarket.json'), 'utf8')).abi;
  
  // Contract addresses
  const LAND_MARKET_ADDRESS = process.env.LAND_MARKET_ADDRESS || '';
  
  // RPC URL and private key
  const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
  const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY || '';
  
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(VERIFIER_PRIVATE_KEY, provider);
  
  // Contract instance
  const landMarketContract = new ethers.Contract(
    LAND_MARKET_ADDRESS,
    LandMarketABI,
    signer
  );
  
  // Parameters
  const requestId = "0x8c4c5aa4f499d7bb2d3f94e841655ecf36bff811add1ab353b8c4b16022c2859";
  const what3words = "filled.count.soap";
  const lat = "51.520847";
  const lng = "-0.195521";
  const userAddress = "0xABe2426574b11A7d8823Df110ab9De278982D753";
  
  try {
    console.log("Attempting to claim land manually...");
    console.log(`Signer address: ${await signer.getAddress()}`);
    console.log(`Contract address: ${LAND_MARKET_ADDRESS}`);
    
    // Call the contract
    const tx = await landMarketContract.claimLandAfterVerification(
      requestId,
      what3words,
      lat,
      lng,
      userAddress
    );
    
    console.log(`Transaction submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed: ${receipt.hash}`);
  } catch (error) {
    console.error("Error claiming land manually:", error);
  }
}

manualClaim().catch(console.error);
