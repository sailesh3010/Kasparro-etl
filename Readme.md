# Kasparro Backend & ETL Systems - Node TypeScript

## Setup (local)

1. Copy env:
   cp .env.example .env
   Set EXTERNAL_API_KEY and DATABASE_URL if needed.

2. Build & run locally:
   npm ci
   npm run build
   npm start

## Docker

1. Create `data/input.csv` sample CSV file (header row).
2. Start:
   make up
3. API:
   GET http://localhost:3000/data
   GET http://localhost:3000/health
   POST http://localhost:3000/trigger-etl

## Tests

npm run test
