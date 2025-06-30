import { WebSocketService } from "../services/WebSocketService.js";

describe("WebSocketService", () => {
  let wsService;

  beforeEach(() => {
    wsService = new WebSocketService();
  });

  afterEach(() => {
    if (wsService.ws) {
      wsService.disconnect();
    }
  });

  describe("constructor", () => {
    test("should initialize with default values", () => {
      expect(wsService.isConnected).toBe(false);
      expect(wsService.reconnectAttempts).toBe(0);
      expect(wsService.maxReconnectAttempts).toBe(5);
      expect(wsService.reconnectDelay).toBe(1000);
    });
  });

  describe("connect", () => {
    test("should create WebSocket connection", () => {
      wsService.connect();
      expect(wsService.ws).toBeDefined();
      // Accept either port 80 or 3000 for test environment
      expect(wsService.ws.url).toMatch(/ws:\/\/localhost:(80|3000)\/ws/);
    });

    test("should handle connection open", (done) => {
      wsService.onConnectionChange = (connected) => {
        if (connected) {
          expect(connected).toBe(true);
          expect(wsService.isConnected).toBe(true);
          expect(wsService.reconnectAttempts).toBe(0);
          done();
        }
      };
      wsService.connect();
      // Manually trigger onopen for the mock
      if (wsService.ws.onopen) wsService.ws.onopen();
    });
  });

  describe("message handling", () => {
    test("should handle asteroid data messages", (done) => {
      const testData = { id: "123", name: "Test Asteroid" };
      wsService.onAsteroidData = (data) => {
        expect(data).toEqual(testData);
        done();
      };
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      setTimeout(() => {
        wsService.ws.onmessage({
          data: JSON.stringify({
            type: "asteroid_data",
            payload: testData,
          }),
        });
      }, 10);
    });

    test("should handle error messages", (done) => {
      const errorMessage = "Test error";
      wsService.onError = (error) => {
        expect(error.message).toBe(errorMessage);
        done();
      };
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      setTimeout(() => {
        wsService.ws.onmessage({
          data: JSON.stringify({
            type: "error",
            payload: errorMessage,
          }),
        });
      }, 10);
    });
  });

  describe("sending messages", () => {
    test("should send messages when connected", () => {
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      // Mock the send method
      const mockSend = jest.fn();
      wsService.ws.send = mockSend;
      wsService.send({ type: "test", payload: {} });
      expect(mockSend).toHaveBeenCalledWith('{"type":"test","payload":{}}');
    });

    test("should not send messages when disconnected", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      wsService.send({ type: "test", payload: {} });
      expect(consoleSpy).toHaveBeenCalledWith(
        "WebSocket not connected, cannot send message"
      );
      consoleSpy.mockRestore();
    });
  });

  describe("utility methods", () => {
    test("should request asteroid data", () => {
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      const mockSend = jest.fn();
      wsService.ws.send = mockSend;
      wsService.requestAsteroidData();
      expect(mockSend).toHaveBeenCalledWith(
        '{"type":"request_asteroid_data","payload":{}}'
      );
    });

    test("should set time speed", () => {
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      const mockSend = jest.fn();
      wsService.ws.send = mockSend;
      wsService.setTimeSpeed(2.5);
      expect(mockSend).toHaveBeenCalledWith(
        '{"type":"set_time_speed","payload":{"speed":2.5}}'
      );
    });

    test("should check if ready", () => {
      expect(wsService.isReady()).toBe(false);
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      setTimeout(() => {
        expect(wsService.isReady()).toBe(true);
      }, 10);
    });
  });

  describe("disconnection and reconnection", () => {
    test("should handle disconnection", (done) => {
      wsService.onConnectionChange = (connected) => {
        if (!connected) {
          expect(wsService.isConnected).toBe(false);
          done();
        }
      };
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      setTimeout(() => {
        wsService.disconnect();
      }, 10);
    });

    test("should attempt reconnection on unexpected close", (done) => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      wsService.connect();
      if (wsService.ws.onopen) wsService.ws.onopen();
      setTimeout(() => {
        // Simulate unexpected close
        wsService.ws.onclose({ code: 1006, reason: "Connection lost" });
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Scheduling WebSocket reconnect attempt 1")
        );
        consoleSpy.mockRestore();
        done();
      }, 10);
    });
  });
});
