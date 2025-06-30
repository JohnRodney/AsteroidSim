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
  }

  connect () {
    try {
      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = window.location.port || (protocol === 'wss:' ? '443' : '80')
      const wsUrl = `${protocol}//${host}:${port}/ws`

      console.log('Connecting to WebSocket:', wsUrl)

      this.ws = new WebSocket(wsUrl)

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
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.isConnected = false
        if (this.onConnectionChange) {
          this.onConnectionChange(false)
        }

        // Attempt to reconnect if not a normal closure
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (this.onError) {
          this.onError(error)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      if (this.onError) {
        this.onError(error)
      }
    }
  }

  scheduleReconnect () {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(
      `Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`
    )

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect()
      }
    }, delay)
  }

  handleMessage (data) {
    switch (data.type) {
    case 'asteroid_data':
      if (this.onAsteroidData) {
        this.onAsteroidData(data.payload)
      }
      break

    case 'asteroid_update':
      if (this.onAsteroidData) {
        this.onAsteroidData(data.payload)
      }
      break

    case 'simulation_state':
      // Handle simulation state updates
      console.log('Simulation state update:', data.payload)
      break

    case 'error':
      console.error('Server error:', data.payload)
      if (this.onError) {
        this.onError(new Error(data.payload))
      }
      break

    default:
      console.log('Unknown message type:', data.type, data)
    }
  }

  send (message) {
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        if (this.onError) {
          this.onError(error)
        }
      }
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  requestAsteroidData () {
    this.send({
      type: 'request_asteroid_data',
      payload: {}
    })
  }

  requestSimulationState () {
    this.send({
      type: 'request_simulation_state',
      payload: {}
    })
  }

  setTimeSpeed (speed) {
    this.send({
      type: 'set_time_speed',
      payload: { speed }
    })
  }

  pauseSimulation () {
    this.send({
      type: 'pause_simulation',
      payload: {}
    })
  }

  resumeSimulation () {
    this.send({
      type: 'resume_simulation',
      payload: {}
    })
  }

  disconnect () {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
      this.isConnected = false
    }
  }

  isReady () {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN
  }
}
