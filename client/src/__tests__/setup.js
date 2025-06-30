// Mock canvas for Babylon.js
global.HTMLCanvasElement.prototype.getContext = () => ({
  canvas: {},
  drawImage: () => {},
  getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  putImageData: () => {},
  createImageData: () => ({ data: new Uint8ClampedArray(4) }),
  setTransform: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {}
})

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor (url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null

    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) this.onopen()
    }, 0)
  }

  send (_data) {
    // Mock send
  }

  close (code, reason) {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose({ code, reason })
  }
}

WebSocket.CONNECTING = 0
WebSocket.OPEN = 1
WebSocket.CLOSING = 2
WebSocket.CLOSED = 3

// Mock performance API
global.performance = {
  now: () => Date.now()
}

// Mock document methods
Object.defineProperty(document, 'getElementById', {
  value: (id) => {
    const element = {
      id,
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild: () => {},
      removeChild: () => {},
      parentNode: null
    }
    return element
  }
})

// Mock window methods
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: {
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000'
  }
}
