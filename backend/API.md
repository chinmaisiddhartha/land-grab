# Backend API Documentation

## Blockchain Endpoints

### Land Claim
- POST /api/blockchain/request-claim
  - Request body: { "what3words": "string", "userAddress": "string" }
  - Response: { "success": true, "requestId": "string" }

- POST /api/blockchain/verify-claim
  - Request body: { "requestId": "string", "what3words": "string", "lat": "string", "lng": "string", "userAddress": "string" }
  - Response: { "result": "string" }

### Land Info
- GET /api/blockchain/land-info/:what3words
  - Response: { "isClaimed": boolean, "tokenId": "string", "owner": "string" }

### Land Management
- POST /api/blockchain/release-land
  - Request body: { "what3words": "string" }
  - Response: { "result": "string" }

- POST /api/blockchain/propose-swap
  - Request body: { "myWhat3Words": "string", "receiverAddress": "string", "receiverWhat3Words": "string" }
  - Response: { "result": "string" }

### User Lands
- GET /api/blockchain/user-lands/:address
  - Response: { "lands": [] }

## What3Words Endpoints

- GET /api/what3words/convert-to-3wa
  - Query params: lat, lng
  - Response: { "words": "string" }

- GET /api/what3words/convert-to-coordinates
  - Query params: words
  - Response: { "coordinates": { "lat": number, "lng": number }, ... }

- GET /api/what3words/adjacent
  - Query params: words
  - Response: { "adjacentSquares": ["string", ...] }

- GET /api/what3words/check-location
  - Query params: lat, lng, words
  - Response: { "isAtLocation": boolean }
