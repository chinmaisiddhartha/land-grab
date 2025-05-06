// Contract addresses
// the verified contract addresses on sepolia test net 
export const LAND_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LAND_TOKEN_ADDRESS || '0x3d550Bef105d71DDeB9184A9b0EB3Dde7567C051';
export const LAND_MARKET_ADDRESS = process.env.NEXT_PUBLIC_LAND_MARKET_ADDRESS || '0x19FcA6112B6C4ced0f09Db315F14B8B0ddEE8598';
export const LAND_SWAP_ADDRESS = process.env.NEXT_PUBLIC_LAND_SWAP_ADDRESS || '0x7A8aB0187eB080b66919f8166e0e91EB16667557';

// Import ABIs from local files
import LandTokenABI from '../abi/LandToken.json';
import LandMarketABI from '../abi/LandMarket.json';
import LandSwapABI from '../abi/LandSwap.json';

// Export ABIs
export const LAND_TOKEN_ABI = LandTokenABI;
export const LAND_MARKET_ABI = LandMarketABI;
export const LAND_SWAP_ABI = LandSwapABI;



