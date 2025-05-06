import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Load ABI
    const artifactPath = path.resolve(__dirname, '../../../blockchain/artifacts/contracts', 'LandToken.sol', 'LandToken.json');
    console.log(`Loading ABI from ${artifactPath}`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Contract address
    const LAND_TOKEN_ADDRESS = process.env.LAND_TOKEN_ADDRESS;
    console.log(`Using LandToken address: ${LAND_TOKEN_ADDRESS}`);
    
    if (!LAND_TOKEN_ADDRESS) {
      throw new Error('LAND_TOKEN_ADDRESS not set in environment variables');
    }
    
    // Provider
    const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || process.env.BLOCKCHAIN_URL || 'https://eth-sepolia.g.alchemy.com/v2/etAgSXEhoVUUnhQoqJpDrFAJP_Q_6nO0';
    console.log(`Using RPC URL: ${RPC_URL}`);
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Create contract instance
    const landTokenContract = new ethers.Contract(LAND_TOKEN_ADDRESS, artifact.abi, provider);
    
    // Test basic contract calls
    console.log('Testing contract calls...');
    
    // Get name
    const name = await landTokenContract.name();
    console.log(`Contract name: ${name}`);
    
    // Get symbol
    const symbol = await landTokenContract.symbol();
    console.log(`Contract symbol: ${symbol}`);
    
    // Test addresses
    const testAddresses = [
      '0x4696D070c22F52Ca00cDE4C717Cbb3a488c5CF41',
      '0xABe2426574b11A7d8823Df110ab9De278982D753'
    ];
    
    for (const address of testAddresses) {
      console.log(`\nTesting address: ${address}`);
      
      // Get balance
      const balance = await landTokenContract.balanceOf(address);
      console.log(`Balance: ${balance.toString()}`);
      
      if (balance.toString() !== '0') {
        console.log('Fetching tokens...');
        
        for (let i = 0; i < balance; i++) {
          const tokenId = await landTokenContract.tokenOfOwnerByIndex(address, i);
          console.log(`Token ID at index ${i}: ${tokenId.toString()}`);
          
          const what3words = await landTokenContract.getWhat3Words(tokenId);
          console.log(`what3words: ${what3words}`);
        }
      } else {
        console.log('User has no tokens');
      }
    }
    
    console.log('\nContract connection verified successfully!');
  } catch (error) {
    console.error('Error verifying contract connection:', error);
  }
}

main();
