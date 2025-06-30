const WebSocket = require('ws');
const { query } = require('../database/connection');

let wss = null;
let simulationInterval = null;

const setupWebSocketServer = (server) => {
  wss = new WebSocket.Server({ server });

  console.log('🔌 WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    console.log(`🔗 New WebSocket connection from ${req.socket.remoteAddress}`);

    // Send initial connection confirmation
    ws.send(
      JSON.stringify({
        type: 'connection',
        message: 'Connected to Asteroid Simulator WebSocket',
        timestamp: new Date().toISOString(),
      })
    );

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString(),
          })
        );
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Start simulation update loop
  startSimulationUpdates();
};

const handleWebSocketMessage = (ws, data) => {
  switch (data.type) {
  case 'subscribe_asteroids':
    handleAsteroidSubscription(ws, data);
    break;
  case 'request_asteroid_positions':
    handlePositionRequest(ws, data);
    break;
  case 'simulation_control':
    handleSimulationControl(ws, data);
    break;
  default:
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        timestamp: new Date().toISOString(),
      })
    );
  }
};

const handleAsteroidSubscription = async (ws, data) => {
  try {
    const { asteroid_ids, update_frequency = 1000 } = data;

    // Store subscription info on the WebSocket object
    ws.asteroidSubscription = {
      asteroidIds: asteroid_ids || [],
      updateFrequency: update_frequency,
      lastUpdate: Date.now(),
    };

    ws.send(
      JSON.stringify({
        type: 'subscription_confirmed',
        asteroid_ids,
        update_frequency,
        timestamp: new Date().toISOString(),
      })
    );

    console.log(
      `📡 Client subscribed to ${asteroid_ids?.length || 'all'} asteroids`
    );
  } catch (error) {
    console.error('Error handling asteroid subscription:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Failed to process subscription',
        timestamp: new Date().toISOString(),
      })
    );
  }
};

const handlePositionRequest = async (ws, data) => {
  try {
    const { asteroid_ids, timestamp: _timestamp } = data;

    // Get current positions for requested asteroids
    const positions = await calculateAsteroidPositions(
      asteroid_ids,
      _timestamp
    );

    ws.send(
      JSON.stringify({
        type: 'asteroid_positions',
        data: positions,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Error handling position request:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Failed to calculate positions',
        timestamp: new Date().toISOString(),
      })
    );
  }
};

const handleSimulationControl = (ws, data) => {
  const { action, parameters } = data;

  switch (action) {
  case 'start':
    startSimulationUpdates();
    break;
  case 'stop':
    stopSimulationUpdates();
    break;
  case 'set_update_frequency':
    if (ws.asteroidSubscription) {
      ws.asteroidSubscription.updateFrequency = parameters.frequency;
    }
    break;
  default:
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Unknown simulation control action',
        timestamp: new Date().toISOString(),
      })
    );
  }

  ws.send(
    JSON.stringify({
      type: 'simulation_control_response',
      action,
      success: true,
      timestamp: new Date().toISOString(),
    })
  );
};

const startSimulationUpdates = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  simulationInterval = setInterval(async () => {
    await broadcastAsteroidUpdates();
  }, 1000); // Update every second

  console.log('🚀 Simulation updates started');
};

const stopSimulationUpdates = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('⏹️ Simulation updates stopped');
  }
};

const broadcastAsteroidUpdates = async () => {
  if (!wss || wss.clients.size === 0) return;

  try {
    // Get all connected clients with active subscriptions
    const clientsWithSubscriptions = Array.from(wss.clients).filter(
      (client) =>
        client.readyState === WebSocket.OPEN && client.asteroidSubscription
    );

    if (clientsWithSubscriptions.length === 0) return;

    // Calculate current positions for all subscribed asteroids
    const allAsteroidIds = new Set();
    clientsWithSubscriptions.forEach((client) => {
      client.asteroidSubscription.asteroidIds.forEach((id) =>
        allAsteroidIds.add(id)
      );
    });

    const positions = await calculateAsteroidPositions(
      Array.from(allAsteroidIds)
    );

    // Send updates to each client based on their subscription
    clientsWithSubscriptions.forEach((client) => {
      const subscription = client.asteroidSubscription;
      const now = Date.now();

      // Check if it's time to send an update to this client
      if (now - subscription.lastUpdate >= subscription.updateFrequency) {
        const clientPositions =
          subscription.asteroidIds.length > 0
            ? positions.filter((pos) =>
              subscription.asteroidIds.includes(pos.id)
            )
            : positions;

        client.send(
          JSON.stringify({
            type: 'asteroid_positions_update',
            data: clientPositions,
            timestamp: new Date().toISOString(),
          })
        );

        subscription.lastUpdate = now;
      }
    });
  } catch (error) {
    console.error('Error broadcasting asteroid updates:', error);
  }
};

const calculateAsteroidPositions = async (
  asteroidIds = [],
  _timestamp = null
) => {
  try {
    // For now, return basic position data
    // This will be enhanced with actual orbital propagation in future features
    const sql = `
      SELECT id, designation, name, orbital_elements, physical_properties
      FROM asteroids 
      WHERE orbit_class = 'Main-belt Asteroid'
      ${asteroidIds.length > 0 ? 'AND id = ANY($1)' : ''}
      LIMIT 100
    `;

    const params = asteroidIds.length > 0 ? [asteroidIds] : [];
    const result = await query(sql, params);

    // Transform to position format (placeholder for now)
    return result.rows.map((asteroid) => ({
      id: asteroid.id,
      designation: asteroid.designation,
      name: asteroid.name,
      position: { x: 0, y: 0, z: 0 }, // Will be calculated with orbital propagation
      velocity: { x: 0, y: 0, z: 0 }, // Will be calculated with orbital propagation
      orbital_elements: asteroid.orbital_elements,
      physical_properties: asteroid.physical_properties,
    }));
  } catch (error) {
    console.error('Error calculating asteroid positions:', error);
    return [];
  }
};

const getWebSocketServer = () => wss;

module.exports = {
  setupWebSocketServer,
  getWebSocketServer,
  startSimulationUpdates,
  stopSimulationUpdates,
};
