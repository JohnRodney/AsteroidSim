import { AsteroidSimulator } from './components/AsteroidSimulator.js'
import { UIManager } from './components/UIManager.js'
import { WebSocketService } from './services/WebSocketService.js'

class App {
  constructor () {
    this.simulator = null
    this.uiManager = null
    this.wsService = null
    this.isInitialized = false
  }

  async init () {
    try {
      console.log('Initializing Asteroid Belt Simulator...')

      // Initialize UI manager first
      this.uiManager = new UIManager()
      this.uiManager.showLoading('Initializing 3D scene...')

      // Initialize the 3D simulator
      this.simulator = new AsteroidSimulator()
      await this.simulator.init()

      // Initialize WebSocket service for real-time data
      this.wsService = new WebSocketService()
      this.wsService.onAsteroidData = (data) => {
        this.simulator.updateAsteroidData(data)
      }

      // Connect UI events
      this.connectUIEvents()

      // Hide loading screen
      this.uiManager.hideLoading()
      this.isInitialized = true

      console.log('Asteroid Belt Simulator initialized successfully')

      // Start the render loop
      this.simulator.startRenderLoop()
    } catch (error) {
      console.error('Failed to initialize application:', error)
      this.uiManager.showError(
        'Failed to initialize application: ' + error.message
      )
    }
  }

  connectUIEvents () {
    // Play/Pause button
    const playPauseBtn = document.getElementById('play-pause')
    playPauseBtn.addEventListener('click', () => {
      this.simulator.togglePause()
      playPauseBtn.textContent = this.simulator.isPaused ? 'Play' : 'Pause'
    })

    // Reset view button
    const resetViewBtn = document.getElementById('reset-view')
    resetViewBtn.addEventListener('click', () => {
      this.simulator.resetCamera()
    })

    // Time speed slider
    const timeSpeedSlider = document.getElementById('time-speed')
    const speedValue = document.getElementById('speed-value')
    timeSpeedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value)
      this.simulator.setTimeSpeed(speed)
      speedValue.textContent = speed + 'x'
    })

    // Update UI with simulator stats
    setInterval(() => {
      if (this.simulator) {
        const stats = this.simulator.getStats()
        this.uiManager.updateStats(stats)
      }
    }, 1000)
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  app.init()
})
