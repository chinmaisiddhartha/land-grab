import { Router } from 'express';
import * as blockchainController from '../controllers/blockchain.controller';

const router = Router();

// Debug logging
console.log('Initializing blockchain routes');
console.log('Available controller methods:', Object.keys(blockchainController));

// Land claim endpoints
router.post('/request-claim', blockchainController.requestLandClaim);
router.post('/verify-claim', blockchainController.verifyAndClaimLand);

// Land info endpoint
router.get('/land-info/:what3words', blockchainController.getLandInfo);

// Land management endpoints
router.post('/release-land', blockchainController.releaseLand);
router.post('/propose-swap', async (req, res) => {
  const { myWhat3Words, receiverAddress, receiverWhat3Words } = req.body;
  try {
    // Pass only the first three required parameters to match the function signature
    const result = await blockchainController.proposeSwap(
      myWhat3Words, 
      receiverAddress, 
      receiverWhat3Words
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get lands owned by a user
router.get('/user-lands/:address', blockchainController.getUserLands);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Blockchain API is working!' });
});

export { router as blockchainRoutes };
