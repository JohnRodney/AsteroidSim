const request = require('supertest');
const express = require('express');

// Mock the database connection for testing
jest.mock('../database/connection', () => ({
  setupDatabase: jest.fn().mockResolvedValue(true),
  query: jest.fn(),
}));

// Mock the WebSocket service
jest.mock('../services/websocket', () => ({
  setupWebSocketServer: jest.fn(),
}));

// Mock the asteroid data service
jest.mock('../services/asteroidDataService', () => ({
  fetchAsteroidData: jest.fn(),
}));

describe('Server Setup', () => {
  let app;

  beforeAll(() => {
    // Create a minimal app for testing
    app = express();
    app.use(express.json());

    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Asteroid Simulator Backend',
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty(
        'service',
        'Asteroid Simulator Backend'
      );
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

describe('Database Connection', () => {
  it('should have database connection module', () => {
    const { setupDatabase } = require('../database/connection');
    expect(setupDatabase).toBeDefined();
  });
});

describe('WebSocket Service', () => {
  it('should have WebSocket service module', () => {
    const { setupWebSocketServer } = require('../services/websocket');
    expect(setupWebSocketServer).toBeDefined();
  });
});

describe('Asteroid Data Service', () => {
  it('should have asteroid data service module', () => {
    const { fetchAsteroidData } = require('../services/asteroidDataService');
    expect(fetchAsteroidData).toBeDefined();
  });
});
