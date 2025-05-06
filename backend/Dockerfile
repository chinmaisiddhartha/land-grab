FROM node:18-alpine

WORKDIR /app

# Install build dependencies including Python
RUN apk add --no-cache python3 make g++ gcc

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Make sure the artifacts directory exists
RUN mkdir -p /app/blockchain/artifacts

# Expose the port
EXPOSE 3001

# Start the application in development mode
CMD ["npm", "run", "dev"]
