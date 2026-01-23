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

> **📋 Prerequisites Checklist**
> 
> Before running the application in any mode, ensure you have:
> - ✅ Installed dependencies: `npm install`
> - ✅ **Placed the database backup file `threat_intel.db` in the `/backup` directory**
> 
> The database service requires the backup file to initialize properly.

### Development Mode (Local Node.js with Docker Services)

> **⚠️ IMPORTANT: Database Setup Required**
> 
> **Before starting the application, you must paste the SQLite database backup file `threat_intel.db` into the `/backup` directory in the project root.**
> 
> The database service will automatically initialize from this backup file on first startup.

1. **Prepare the database backup:**
   ```bash
   # Ensure the backup directory exists
   mkdir -p backup
   
   # Copy your threat_intel.db file to the backup directory
   cp /path/to/your/threat_intel.db ./backup/threat_intel.db
   ```

2. Start only Redis and SQLite database (without the app):
```bash
docker-compose up -d redis threat-intel-db
```

3. Start the development server locally:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

The Swagger documentation at `http://localhost:3000/api-docs`

### Production Mode (Local Node.js)

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

### Docker Mode (All Services in Docker)

> **⚠️ IMPORTANT: Database Setup Required**
> 
> **Before starting the Docker services, you must paste the SQLite database backup file `threat_intel.db` into the `/backup` directory in the project root.**
> 
> The database service will automatically initialize from this backup file on first startup.

To run the entire application stack in Docker:

1. **Prepare the database backup:**
   ```bash
   # Ensure the backup directory exists
   mkdir -p backup
   
   # Copy your threat_intel.db file to the backup directory
   cp /path/to/your/threat_intel.db ./backup/threat_intel.db
   ```

2. Start all services (including the Node.js app):
```bash
docker-compose up -d
```

2. To stop only the app container (keeping SQLite and Redis running):
```bash
docker-compose stop app
```

3. To start the app container again:
```bash
docker-compose start app
```

4. To view app logs:
```bash
docker-compose logs -f app
```

### Running Services Independently

**Start only SQLite and Redis (for local development):**
```bash
docker-compose up -d redis threat-intel-db
```

**Stop only the app container (keep SQLite and Redis running):**
```bash
docker-compose stop app
```

**Start only the app container:**
```bash
docker-compose start app
```

**Stop all services:**
```bash
docker-compose down
```

**Stop only SQLite and Redis (keep app running if it was started separately):**
```bash
docker-compose stop redis threat-intel-db
```

## Docker Services

The project includes Docker Compose configuration for running services:

### SQLite Database Service

- **Container**: `threat-intel-sqlite`
- **Service**: `threat-intel-db`
- **Purpose**: Manages the SQLite database with persistence
- **Volume**: `./sqlite` directory on host

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

### Node.js Application Service

- **Container**: `threat-intel-api`
- **Service**: `app`
- **Dockerfile**: `Dockerfile.app`
- **Port**: `3000` (configurable via `PORT` environment variable)
- **Features**:
  - Multi-stage build for optimized image size
  - Health checks configured
  - Connects to Redis and SQLite services
  - Can be stopped independently while keeping SQLite and Redis running

### Service Management

**Start all services:**
```bash
docker-compose up -d
```

**Start only SQLite and Redis (for local development):**
```bash
docker-compose up -d redis threat-intel-db
```

**Start only the app service:**
```bash
docker-compose up -d app
```

**Stop all services:**
```bash
docker-compose down
```

**Stop only the app (keep SQLite and Redis running):**
```bash
docker-compose stop app
```

**View service logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f redis
docker-compose logs -f threat-intel-db
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

##### Refer to arquitecture.md [architecture.md](./architecture.md) ❤️

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## License

ISC
