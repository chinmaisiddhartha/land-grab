import { Request, Response, NextFunction } from 'express';
import * as what3wordsService from '../services/what3words';
import * as mockService from '../services/mock-what3words';

// Determine which service to use based on environment variable
const USE_MOCK_SERVICE = process.env.USE_MOCK_SERVICE === 'true';
const service = USE_MOCK_SERVICE ? mockService : what3wordsService;

export async function convertToWhat3Words(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing lat or lng parameters' });
    }
    
    const words = await service.convertToWhat3Words(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );
    
    res.json({ words });
  } catch (error) {
    next(error);
  }
}

export async function convertToCoordinates(req: Request, res: Response, next: NextFunction) {
  try {
    const { words } = req.query;
    
    if (!words) {
      return res.status(400).json({ error: 'Missing words parameter' });
    }
    
    const square = await service.convertToCoordinates(words as string);
    
    res.json(square);
  } catch (error) {
    next(error);
  }
}

export async function getAdjacentSquares(req: Request, res: Response, next: NextFunction) {
  try {
    const { words } = req.query;
    
    if (!words) {
      return res.status(400).json({ error: 'Missing words parameter' });
    }
    
    const adjacentSquares = await service.getAdjacentSquares(words as string);
    
    res.json({ adjacentSquares });
  } catch (error) {
    next(error);
  }
}

export async function isUserAtLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, words } = req.query;
    
    if (!lat || !lng || !words) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    
    const isAtLocation = await service.isUserAtLocation(
      parseFloat(lat as string),
      parseFloat(lng as string),
      words as string
    );
    
    res.json({ isAtLocation });
  } catch (error) {
    next(error);
  }
}
