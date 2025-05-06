interface What3WordsCoordinates {
  lat: number;
  lng: number;
}

interface What3WordsSquare {
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

// Function to generate deterministic but varied coordinates based on the input string
function generateCoordinatesFromString(input: string): What3WordsCoordinates {
  // Use a simple hash function to generate a number from the string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use the hash to generate latitude and longitude
  // Latitude range: -90 to 90
  // Longitude range: -180 to 180
  const lat = (Math.abs(hash % 18000) / 100) - 90;
  const lng = (Math.abs((hash >> 16) % 36000) / 100) - 180;
  
  return { lat, lng };
}

/**
 * Convert coordinates to what3words address (mock implementation)
 */
export async function convertToWhat3Words(lat: number, lng: number): Promise<string> {
  // Mock implementation that doesn't call the API
  // For testing, just return a fixed value based on coordinates
  const latStr = lat.toFixed(6);
  const lngStr = lng.toFixed(6);
  return `mock.${latStr}.${lngStr}`.replace(/\./g, '-');
}

/**
 * Convert what3words address to coordinates (mock implementation)
 */
export async function convertToCoordinates(words: string): Promise<What3WordsSquare> {
  // Generate coordinates based on the input words for more realistic behavior
  const coords = generateCoordinatesFromString(words);
  
  // Create a small square around the coordinates
  const offset = 0.000003; // Approximately 3 meters at the equator
  
  return {
    country: "US",
    square: {
      southwest: { 
        lat: coords.lat - offset, 
        lng: coords.lng - offset 
      },
      northeast: { 
        lat: coords.lat + offset, 
        lng: coords.lng + offset 
      }
    },
    nearestPlace: "Mock Location",
    coordinates: coords,
    words: words,
    language: "en",
    map: `https://w3w.co/${words.replace(/\./g, '-')}`
  };
}

/**
 * Get adjacent squares for a what3words address (mock implementation)
 */
export async function getAdjacentSquares(words: string): Promise<string[]> {
  // Get the coordinates for the original words
  const square = await convertToCoordinates(words);
  const { lat, lng } = square.coordinates;
  
  // Define offsets for the 8 adjacent squares
  const offset = 0.00003; // Approximately 3 meters at the equator
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
  
  // Generate adjacent words
  return offsets.map((o, i) => {
    const newLat = lat + o.lat;
    const newLng = lng + o.lng;
    return `${words}-adjacent-${i+1}`;
  });
}

/**
 * Check if a user is physically present at a what3words location (mock implementation)
 */
export async function isUserAtLocation(userLat: number, userLng: number, words: string): Promise<boolean> {
  // Get the coordinates for the words
  const square = await convertToCoordinates(words);
  const { southwest, northeast } = square.square;
  
  // Check if user coordinates are within the square
  return (
    userLat >= southwest.lat &&
    userLat <= northeast.lat &&
    userLng >= southwest.lng &&
    userLng <= northeast.lng
  );
}
