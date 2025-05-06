import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const router = Router();

// Get current mode (real or mock)
router.get('/mode', (req: Request, res: Response) => {
  const useMockService = process.env.USE_MOCK_SERVICE === 'true';
  const enableBlockchainListener = process.env.ENABLE_BLOCKCHAIN_LISTENER === 'true';
  
  res.json({
    useMockService,
    enableBlockchainListener,
    isDemoMode: useMockService && enableBlockchainListener
  });
});

// Toggle mode (admin only - in a real app, this would be protected)
router.post('/toggle-mode', (req: Request, res: Response) => {
  try {
    const currentMode = process.env.USE_MOCK_SERVICE === 'true';
    const newMode = !currentMode;
    
    // Update the environment variable in memory
    process.env.USE_MOCK_SERVICE = newMode.toString();
    
    // In a real app, we need to to persist this change to the .env file
    // This is a simplified example for demo purpose
    const envPath = path.resolve(__dirname, '../../.env');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      // If .env doesn't exist, create it
      envContent = '';
    }
    
    // Update or add the USE_MOCK_SERVICE variable
    if (envContent.includes('USE_MOCK_SERVICE=')) {
      envContent = envContent.replace(
        /USE_MOCK_SERVICE=(true|false)/,
        `USE_MOCK_SERVICE=${newMode}`
      );
    } else {
      envContent += `\nUSE_MOCK_SERVICE=${newMode}`;
    }
    
    // Write back to the .env file
    fs.writeFileSync(envPath, envContent);
    
    res.json({ 
      success: true, 
      message: `Mode switched to ${newMode ? 'mock' : 'real'} service`,
      useMockService: newMode,
      enableBlockchainListener: process.env.ENABLE_BLOCKCHAIN_LISTENER === 'true',
      isDemoMode: newMode && process.env.ENABLE_BLOCKCHAIN_LISTENER === 'true'
    });
  } catch (error) {
    console.error('Error toggling mode:', error);
    res.status(500).json({ error: 'Failed to toggle mode' });
  }
});

export { router as settingsRoutes };
