#!/bin/bash

# Check current mode
CURRENT_MODE=$(grep "USE_MOCK_SERVICE" .env | cut -d '=' -f2)

if [ "$CURRENT_MODE" = "true" ]; then
  # Switch to live mode
  echo "Switching to LIVE mode..."
  sed -i 's/USE_MOCK_SERVICE=true/USE_MOCK_SERVICE=false/g' .env
  sed -i 's/USE_MOCK_SERVICE=true/USE_MOCK_SERVICE=false/g' frontend/.env
  sed -i 's/USE_MOCK_SERVICE=true/USE_MOCK_SERVICE=false/g' backend/.env
  
  echo "IMPORTANT: Make sure to set your what3words API key in .env, frontend/.env, and backend/.env"
else
  # Switch to demo mode
  echo "Switching to DEMO mode..."
  sed -i 's/USE_MOCK_SERVICE=false/USE_MOCK_SERVICE=true/g' .env
  sed -i 's/USE_MOCK_SERVICE=false/USE_MOCK_SERVICE=true/g' frontend/.env
  sed -i 's/USE_MOCK_SERVICE=false/USE_MOCK_SERVICE=true/g' backend/.env
fi

echo "Mode switched successfully. Please restart the application for changes to take effect:"
echo "docker-compose down && docker-compose up -d"
