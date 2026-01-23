# Threat Intelligence API

A comprehensive REST API for threat intelligence analysis, providing endpoints to investigate malicious indicators, threat actors, campaigns, and their relationships.

## Features

- **Indicators Management**: Search and retrieve detailed information about threat indicators (IPs, domains, URLs, hashes)
- **Campaigns Analysis**: Get campaign indicators with timeline visualization
- **Dashboard Statistics**: High-level statistics and summaries
- **SQLite Database**: Lightweight, file-based database for threat intelligence data
- **Redis Caching**: High-performance caching layer for improved response times
- **RESTful API**: Clean, well-documented REST endpoints
- **Swagger Documentation**: Interactive API documentation

## Tech Stack

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **SQLite** (better-sqlite3) for data persistence
- **Redis** (ioredis) for caching
- **Swagger/OpenAPI** for API documentation

## Prerequisites

- Node.js (v20 or higher)
- npm (comes with Node.js)
- Docker and Docker Compose (for running Redis and SQLite database)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/reyesdiego/threat-intel-sqlite
cd threat-intel-sqlite
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
# Create .env file if needed
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```
---
## Running the Application

### Development Mode

1. Database 💥

#### ⚠️ Paste the SQLite Database Backup threat_intel.db into the /backup directory

2. Start Redis and SQLite database using Docker Compose:
```bash
docker-compose up -d &
```

3. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

The Swagger documentation at `http://localhost:3000/api-docs`

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## Docker Services

The project includes Docker Compose configuration for running supporting services:

### SQLite Database Service

- **Container**: `threat-intel-sqlite`
- **Service**: `threat-intel-db`
- **Purpose**: Manages the SQLite database with persistence

### Redis Service

- **Container**: `threat-intel-redis`
- **Service**: `redis`
- **Image**: `redis:7-alpine`
- **Port**: `6379` (configurable via `REDIS_PORT` environment variable)
- **Persistence**: Data persisted in Docker volume `redis-data`
- **Features**:
  - AOF (Append Only File) persistence enabled
  - Health checks configured
  - Automatic reconnection handling

To start all services:
```bash
docker-compose up -d
```

To stop all services:
```bash
docker-compose down
```

To view Redis logs:
```bash
docker-compose logs redis
```

## Redis Configuration

Redis is configured through environment variables:

- `REDIS_HOST`: Redis server hostname (default: `localhost`)
- `REDIS_PORT`: Redis server port (default: `6379`)
- `REDIS_PASSWORD`: Redis password (optional, default: `undefined`)
- `REDIS_DB`: Redis database number (default: `0`)

The Redis client is configured with:
- Automatic reconnection with exponential backoff
- Connection health monitoring
- Graceful shutdown handling
- Error logging

### Using Redis in Your Code

Import the Redis client:

```typescript
import redis from '../data/database/redis';

// Example: Set a value
await redis.set('key', 'value');

// Example: Get a value
const value = await redis.get('key');

// Example: Set with expiration
await redis.setex('key', 3600, 'value'); // expires in 1 hour

// Example: Check if key exists
const exists = await redis.exists('key');
```

## API Documentation

Once the server is running, access the interactive API documentation at:

- **Swagger UI**: `http://localhost:3000/api-docs`

## API Endpoints

### Indicators

- `GET /api/indicators/:id` - Get detailed indicator information
- `GET /api/indicators/search` - Search and filter indicators

### Campaigns

- `GET /api/campaigns/:id/indicators` - Get campaign indicators with timeline

### Dashboard

- `GET /api/dashboard/summary` - Get dashboard summary statistics

## Project Structure

```
threat-intel-sqlite/
├── src/
│   ├── __tests__/              # Test setup and configuration
│   │   └── setup.ts           # Jest test setup (console suppression)
│   ├── api/                    # API layer
│   │   ├── errors/             # Custom HTTP error classes
│   │   │   └── http-errors.ts
│   │   ├── middleware/        # Express middleware
│   │   │   └── no-cache.ts    # HTTP cache control middleware
│   │   ├── routes/            # API route handlers
│   │   │   ├── __tests__/     # Route integration tests
│   │   │   │   └── campaigns.test.ts
│   │   │   ├── campaigns.ts   # Campaign endpoints
│   │   │   ├── dashboard.ts   # Dashboard endpoints
│   │   │   ├── indicators.ts  # Indicator endpoints
│   │   │   └── index.ts       # Route initialization
│   │   └── server.ts          # Express server setup
│   └── data/                   # Data access layer
│       ├── campaigns.ts        # Campaign data queries
│       ├── dashboard.ts         # Dashboard data queries
│       ├── indicators.ts        # Indicator data queries
│       └── database/           # Database clients
│           ├── db.ts          # SQLite database client
│           └── redis.ts        # Redis client
├── backup/                     # Database backup files
├── docker-compose.yml          # Docker services configuration
├── docker-entrypoint.sh        # SQLite container entrypoint
├── Dockerfile                  # SQLite database container
├── jest.config.js              # Jest test configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## License

ISC
