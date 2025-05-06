import dotenv from 'dotenv';
import * as blockchainService from '../services/blockchain';

dotenv.config();

async function testConnection() {
  try {
    // Test a simple read operation
    const isLandClaimed = await blockchainService.isLandClaimed('filled.count.soap');
    console.log('Is land claimed:', isLandClaimed);
    
    console.log('Connection to blockchain successful!');
  } catch (error) {
    console.error('Error connecting to blockchain:', error);
  }
}

testConnection();
