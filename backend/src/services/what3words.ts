import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.WHAT3WORDS_API_KEY;
const BASE_URL = 'https://api.what3words.com/v3';
const MAX_RETRIES = 3;

// function to check API key before making requests
function validateApiKey() {
  if (!API_KEY) {
    throw new Error('WHAT3WORDS_API_KEY is not defined in environment variables');
  }
}

if (!API_KEY) {
  console.warn('WHAT3WORDS_API_KEY is not defined in environment variables');
}

export interface What3WordsCoordinates {
  lat: number;
  lng: number;
}

export interface What3WordsSquare {
  country: string;
  square: {
    southwest: What3WordsCoordinates;
    northeast: What3WordsCoordinates;
  };
  nearestPlace: string;
  coordinates: What3WordsCoordinates;
  words: string;
  language: string;
  map: string;
}

/**
 * Helper function to handle API requests with retries
 */
async function makeApiRequest<T>(url: string, params: any, retries = MAX_RETRIES): Promise<T> {
  try {
    validateApiKey();
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle rate limiting (429) with retries
      if (error.response?.status === 429 && retries > 0) {
        // Wait for a second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return makeApiRequest(url, params, retries - 1);
      }
      
      // Handle payment required error (402)
      if (error.response?.status === 402) {
        console.error('What3Words API quota exceeded or payment required:', error.response.data);
        throw new Error('What3Words API quota exceeded or payment required. Please check your subscription plan.');
      }
      
      // Handle other API errors
      if (error.response) {
        console.error('What3Words API error:', error.response.status, error.response.data);
        throw new Error(`What3Words API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.error('Error making API request:', error);
    throw error;
  }
}

/**
 * Convert coordinates to what3words address
 */
export async function convertToWhat3Words(lat: number, lng: number): Promise<string> {
  try {
    const data = await makeApiRequest<any>(`${BASE_URL}/convert-to-3wa`, {
      coordinates: `${lat},${lng}`,
      key: API_KEY
    });
    
    return data.words;
  } catch (error) {
    console.error('Error converting coordinates to what3words:', error);
    throw error;
  }
}

/**
 * Convert what3words address to coordinates
 */
export async function convertToCoordinates(words: string): Promise<What3WordsSquare> {
  try {
    return await makeApiRequest<What3WordsSquare>(`${BASE_URL}/convert-to-coordinates`, {
      words,
      key: API_KEY
    });
  } catch (error) {
    console.error('Error converting what3words to coordinates:', error);
    throw error;
  }
}

/**
 * Get adjacent squares for a what3words address
 */
export async function getAdjacentSquares(words: string): Promise<string[]> {
  try {
    // First get the coordinates of the original square
    const square = await convertToCoordinates(words);
    const { lat, lng } = square.coordinates;
    
    // Define offsets for the 8 adjacent squares (in degrees)
    // This is an approximation - 3m x 3m square is roughly 0.00003 degrees at the equator
    const offset = 0.00003;
    const offsets = [
      { lat: offset, lng: 0 },         // North
      { lat: offset, lng: offset },    // Northeast
      { lat: 0, lng: offset },         // East
      { lat: -offset, lng: offset },   // Southeast
      { lat: -offset, lng: 0 },        // South
      { lat: -offset, lng: -offset },  // Southwest
      { lat: 0, lng: -offset },        // West
      { lat: offset, lng: -offset }    // Northwest
    ];
    
    // Get the what3words addresses for all adjacent squares
    const adjacentPromises = offsets.map(({ lat: latOffset, lng: lngOffset }) => 
      convertToWhat3Words(lat + latOffset, lng + lngOffset)
    );
    
    return await Promise.all(adjacentPromises);
  } catch (error) {
    console.error('Error getting adjacent squares:', error);
    throw error;
  }
}

/**
 * Check if a user is physically present at a what3words location
 */
export async function isUserAtLocation(userLat: number, userLng: number, words: string): Promise<boolean> {
  try {
    const square = await convertToCoordinates(words);
    const { southwest, northeast } = square.square;
    
    // Check if user coordinates are within the square
    return (
      userLat >= southwest.lat &&
      userLat <= northeast.lat &&
      userLng >= southwest.lng &&
      userLng <= northeast.lng
    );
  } catch (error) {
    console.error('Error checking user location:', error);
    throw error;
  }
}
