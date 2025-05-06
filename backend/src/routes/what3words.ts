import { Router } from 'express';
import * as what3wordsController from '../controllers/what3words';

const router = Router();

// Log which service is being used
console.log(`Using ${process.env.USE_MOCK_SERVICE === 'true' ? 'mock' : 'real'} What3Words service`);

// Convert coordinates to what3words
router.get('/convert-to-3wa', what3wordsController.convertToWhat3Words);

// Convert what3words to coordinates
router.get('/convert-to-coordinates', what3wordsController.convertToCoordinates);

// Get adjacent squares
router.get('/adjacent', what3wordsController.getAdjacentSquares);

// Check if user is at location
router.get('/check-location', what3wordsController.isUserAtLocation);

export { router as what3wordsRoutes };
