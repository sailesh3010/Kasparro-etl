FROM node:18-alpine

WORKDIR /app

# Dependency files
COPY package.json package-lock.json* ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy static data (CSV)
COPY data /data

# Copy source code only (cleaner)
COPY src ./src

# Build TypeScript
RUN npm run build

# Cloud Run uses PORT=8080
EXPOSE 8080

# Start the app ONLY
CMD ["node", "dist/index.js"]
