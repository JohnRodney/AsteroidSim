import { WebSocketService } from '../services/WebSocketService.js'

describe('WebSocketService', () => {
  let wsService

  beforeEach(() => {
    wsService = new WebSocketService()
  })

  afterEach(() => {
    if (wsService.ws) {
      wsService.disconnect()
    }
  })

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(wsService.isConnected).toBe(false)
      expect(wsService.reconnectAttempts).toBe(0)
      expect(wsService.maxReconnectAttempts).toBe(5)
      expect(wsService.reconnectDelay).toBe(1000)
    })
  })

  describe('connect', () => {
    test('should create WebSocket connection', () => {
      wsService.connect()
      expect(wsService.ws).toBeDefined()
      expect(wsService.ws.url).toBe('ws://localhost:3002')
    })

    test('should handle connection open', (done) => {
      wsService.onConnectionChange = (connected) => {
        if (connected) {
          expect(connected).toBe(true)
          expect(wsService.isConnected).toBe(true)
          expect(wsService.reconnectAttempts).toBe(0)
          done()
        }
      }
      wsService.connect()
      // Manually trigger onopen for the mock
      if (wsService.ws.onopen) wsService.ws.onopen()
    })
  })

  describe('message handling', () => {
    test('should handle asteroid update messages', (done) => {
      const testData = { id: '123', name: 'Test Asteroid' }
      wsService.onAsteroidData = (data) => {
        expect(data).toEqual(testData)
        done()
      }
      wsService.handleMessage({ type: 'asteroid_update', payload: testData })
    })
    test('should handle asteroid batch messages', (done) => {
      const testData = [{ id: '123', name: 'Test Asteroid' }]
      wsService.onAsteroidData = (data) => {
        expect(data).toEqual(testData)
        done()
      }
      wsService.handleMessage({ type: 'asteroid_batch', payload: testData })
    })
  })

  describe('sending messages', () => {
    test('should send messages when connected', () => {
      wsService.connect()
      if (wsService.ws.onopen) wsService.ws.onopen()
      // Mock the send method
      const mockSend = jest.fn()
      wsService.ws.send = mockSend
      wsService.send({ type: 'test', payload: {} })
      expect(mockSend).toHaveBeenCalledWith('{"type":"test","payload":{}}')
    })

    test('should not send messages when disconnected', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      wsService.send({ type: 'test', payload: {} })
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket not connected, cannot send message'
      )
      consoleSpy.mockRestore()
    })
  })

  describe('disconnection and reconnection', () => {
    test('should handle disconnection', (done) => {
      wsService.onConnectionChange = (connected) => {
        if (!connected) {
          expect(wsService.isConnected).toBe(false)
          done()
        }
      }
      wsService.connect()
      if (wsService.ws.onopen) wsService.ws.onopen()
      setTimeout(() => {
        wsService.disconnect()
      }, 10)
    })

    test.skip('should attempt reconnection on unexpected close', (done) => {
      // TODO: Fix this test to work reliably with the new reconnect logic and mock WebSocket
      wsService.reconnectAttempts = 0
      wsService.maxReconnectAttempts = 1
      wsService.connect()
      if (wsService.ws.onopen) wsService.ws.onopen()
      wsService.ws.onclose({ code: 1006, reason: 'Connection lost' })
      setTimeout(() => {
        expect(wsService.reconnectAttempts).toBe(1)
        done()
      }, 100)
    })
  })
})
