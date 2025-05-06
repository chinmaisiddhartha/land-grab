import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LandGrabModule = buildModule("LandGrabModule", (m) => {
  // Get the verifier address from parameters or use a default
  const verifierAddress = m.getParameter("verifierAddress", "0x0000000000000000000000000000000000000000");

  // Deploy the LandToken contract
  const landToken = m.contract("LandToken");

  // Deploy the LandMarket contract with the LandToken address and verifier address
  const landMarket = m.contract("LandMarket", [landToken, verifierAddress]);

  // Deploy the LandSwap contract with the LandToken address
  const landSwap = m.contract("LandSwap", [landToken]);

  // Authorize the LandMarket and LandSwap contracts to mint/burn tokens
  // We'll set up these calls but not return them
  m.call(landToken, "authorizeContract", [landMarket]);
  m.call(landToken, "authorizeContract", [landSwap]);

  // Only return the contract deployment futures, not the call futures
  return { landToken, landMarket, landSwap };
});

export default LandGrabModule;
