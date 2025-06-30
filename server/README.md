# Asteroid Simulator Server

Backend server for the Asteroid Belt Simulator application.

## Features

- **Express.js REST API** for asteroid data access
- **PostgreSQL Database** with JSONB support for flexible data storage
- **WebSocket Server** for real-time asteroid position updates
- **Data Integration** with JPL SBDB API and Asterank
- **Orbital Propagation** using JavaScript astrodynamics libraries

## Technology Stack

- **Node.js** with Express.js framework
- **PostgreSQL** with JSONB data type
- **WebSocket** (ws library) for real-time communication
- **Axios** for external API integration

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp env.example .env
# Edit .env with your database credentials
```

3. Set up PostgreSQL database:

```bash
# Create database
createdb asteroid_simulator

# Run migrations
npm run db:migrate
```

4. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Asteroids

- `GET /api/asteroids` - Get all asteroids with filtering
- `GET /api/asteroids/:id` - Get specific asteroid by ID
- `GET /api/asteroids/stats/summary` - Get asteroid belt statistics
- `POST /api/asteroids/sync` - Sync data from external APIs

### Query Parameters

- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)
- `composition_type` - Filter by composition (C-type, S-type, M-type)
- `min_diameter` - Minimum diameter filter
- `max_diameter` - Maximum diameter filter

## WebSocket API

Connect to `ws://localhost:3001` for real-time updates.

### Message Types

#### Subscribe to Asteroids

```json
{
  "type": "subscribe_asteroids",
  "asteroid_ids": ["1", "2", "3"],
  "update_frequency": 1000
}
```

#### Request Positions

```json
{
  "type": "request_asteroid_positions",
  "asteroid_ids": ["1", "2", "3"],
  "timestamp": "2025-01-01T00:00:00Z"
}
```

#### Simulation Control

```json
{
  "type": "simulation_control",
  "action": "start|stop|set_update_frequency",
  "parameters": {
    "frequency": 1000
  }
}
```

## Database Schema

The `asteroids` table uses JSONB for flexible storage:

```sql
CREATE TABLE asteroids (
    id TEXT PRIMARY KEY,
    designation TEXT NOT NULL,
    name TEXT,
    orbit_class TEXT,
    orbital_elements JSONB,
    physical_properties JSONB,
    last_updated TIMESTAMP,
    created_at TIMESTAMP
);
```

## Data Sources

- **JPL SBDB API** - High-precision orbital elements
- **Asterank** - Physical properties and composition data

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Database Operations

```bash
npm run db:migrate  # Run migrations
npm run db:seed     # Seed with sample data
```

## Environment Variables

See `env.example` for all available configuration options.
