export class WebSocketService {
  constructor () {
    this.ws = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.onAsteroidData = null
    this.onConnectionChange = null
    this.onError = null
    this.backendUrl = 'http://localhost:3001'
    this.wsUrl = 'ws://localhost:3001'
  }

  connect () {
    try {
      console.log('Connecting to WebSocket:', this.wsUrl)
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        if (this.onConnectionChange) {
          this.onConnectionChange(true)
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.isConnected = false
        if (this.onConnectionChange) {
          this.onConnectionChange(false)
        }
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (this.onError) {
          this.onError(error)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      if (this.onError) {
        this.onError(error)
      }
    }
  }

  handleMessage (data) {
    switch (data.type) {
    case 'asteroid_update':
      if (this.onAsteroidData) {
        this.onAsteroidData(data.payload)
      }
      break

    case 'asteroid_batch':
      if (this.onAsteroidData) {
        this.onAsteroidData(data.payload)
      }
      break

    case 'stats_update':
      // Handle stats updates
      break

    case 'error':
      console.error('Server error:', data.payload)
      if (this.onError) {
        this.onError(new Error(data.payload))
      }
      break

    default:
      console.log('Unknown message type:', data.type)
    }
  }

  attemptReconnect () {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      )
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  disconnect () {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    this.isConnected = false
  }

  send (data) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  // Request asteroid data from backend
  async fetchAsteroids (params = {}) {
    try {
      const queryParams = new URLSearchParams(params)
      const response = await fetch(
        `${this.backendUrl}/api/asteroids?${queryParams}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching asteroids:', error)
      throw error
    }
  }

  // Request asteroid statistics
  async fetchStats () {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/asteroids/stats/summary`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching stats:', error)
      throw error
    }
  }

  // Sync asteroid data from external APIs
  async syncAsteroidData () {
    try {
      const response = await fetch(`${this.backendUrl}/api/asteroids/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error syncing asteroid data:', error)
      throw error
    }
  }
}
