import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { what3wordsRoutes } from './routes/what3words';
import { blockchainRoutes } from './routes/blockchain';
import { settingsRoutes } from './routes/settings';
import { apiLogger } from './middleware/logger';
import { startListening } from './services/blockchian-listener';

// Load contract addresses from JSON file
try {
  const contractAddresses = require('./config/contract-addresses.json');
  process.env.LAND_TOKEN_ADDRESS = contractAddresses.landToken;
  process.env.LAND_MARKET_ADDRESS = contractAddresses.landMarket;
  process.env.LAND_SWAP_ADDRESS = contractAddresses.landSwap;
  process.env.VERIFIER_ADDRESS = contractAddresses.verifier;
  console.log('Loaded contract addresses from config file');
} catch (error) {
  console.warn('Could not load contract addresses from config file:', error);
}

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3001;

// Add debug request logging
app.use((req, res, next) => {
  console.log(`[DEBUG] Received request: ${req.method} ${req.url}`);
  next();
});

// Middleware
// Update CORS configuration in index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(apiLogger);

// Routes
app.use('/api/what3words', what3wordsRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  // more specific error messages based on error type
  if (err.message && err.message.includes('API_KEY')) {
    return res.status(500).json({ error: 'API key configuration error. Please check server configuration.' });
  }
  
  if (err.response && err.response.status === 402) {
    return res.status(402).json({ 
      error: 'What3Words API quota exceeded or payment required. Please check your subscription plan.' 
    });
  }
  
  // Handle blockchain-specific errors
  if (err.message && err.message.includes('execution reverted')) {
    return res.status(400).json({ error: 'Blockchain transaction failed: ' + err.message });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the blockchain listener if enabled
if (process.env.ENABLE_BLOCKCHAIN_LISTENER === 'true') {
  console.log('Starting blockchain listener...');
  startListening();
} else {
  console.log('Blockchain listener is disabled. Set ENABLE_BLOCKCHAIN_LISTENER=true to enable it.');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
