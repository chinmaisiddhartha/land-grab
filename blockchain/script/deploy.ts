import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying LandGrab contracts...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy LandToken
  console.log("Deploying LandToken...");
  const LandToken = await ethers.getContractFactory("LandToken");
  const landToken = await LandToken.deploy();
  await landToken.waitForDeployment();
  const landTokenAddress = await landToken.getAddress();
  console.log("LandToken deployed to:", landTokenAddress);
  
  // Deploy LandMarket with the backend address as verifier
  // In a real scenario, this would be the backend's wallet address
  console.log("Deploying LandMarket...");
  const verifierAddress = process.env.VERIFIER_ADDRESS || deployer.address;
  const LandMarket = await ethers.getContractFactory("LandMarket");
  const landMarket = await LandMarket.deploy(landTokenAddress, verifierAddress);
  await landMarket.waitForDeployment();
  const landMarketAddress = await landMarket.getAddress();
  console.log("LandMarket deployed to:", landMarketAddress);
  
  // Deploy LandSwap
  console.log("Deploying LandSwap...");
  const LandSwap = await ethers.getContractFactory("LandSwap");
  const landSwap = await LandSwap.deploy(landTokenAddress);
  await landSwap.waitForDeployment();
  const landSwapAddress = await landSwap.getAddress();
  console.log("LandSwap deployed to:", landSwapAddress);
  
  // Authorize LandMarket and LandSwap to mint/burn tokens
  console.log("Authorizing contracts...");
  const authTx1 = await landToken.authorizeContract(landMarketAddress);
  await authTx1.wait();
  console.log("LandMarket authorized");
  
  const authTx2 = await landToken.authorizeContract(landSwapAddress);
  await authTx2.wait();
  console.log("LandSwap authorized");
  
  // Save contract addresses to a file that can be read by the backend
  const addresses = {
    landToken: landTokenAddress,
    landMarket: landMarketAddress,
    landSwap: landSwapAddress,
    verifier: verifierAddress
  };
  
  const addressesDir = path.join(__dirname, "../../backend/src/config");
  if (!fs.existsSync(addressesDir)) {
    fs.mkdirSync(addressesDir, { recursive: true });
  }
  
  const addressesPath = path.join(addressesDir, "contract-addresses.json");
  fs.writeFileSync(
    addressesPath,
    JSON.stringify(addresses, null, 2)
  );
  console.log(`Contract addresses saved to ${addressesPath}`);
  
  // Also create a .env file with the addresses for the backend
  const envContent = `
# Blockchain Configuration
LAND_TOKEN_ADDRESS=${landTokenAddress}
LAND_MARKET_ADDRESS=${landMarketAddress}
LAND_SWAP_ADDRESS=${landSwapAddress}
BLOCKCHAIN_RPC_URL=http://localhost:8545
`;

  const envPath = path.join(__dirname, "../../backend/.env.blockchain");
  fs.writeFileSync(envPath, envContent);
  console.log(`Environment variables saved to ${envPath}`);
  
  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
