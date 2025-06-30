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

      // Load real asteroid data
      this.uiManager.showLoading('Loading asteroid data...')
      await this.simulator.loadRealAsteroidData()

      // Connect to WebSocket for real-time updates
      this.wsService.connect()

      // Hide loading screen
      this.uiManager.hideLoading()
      this.isInitialized = true

      console.log('Asteroid Belt Simulator initialized successfully')

      // Start the render loop
      this.simulator.startRenderLoop()

      // Start stats update loop
      this.startStatsUpdate()
    } catch (error) {
      console.error('Failed to initialize application:', error)
      this.uiManager.showError(
        'Failed to initialize application: ' + error.message
      )
    }
  }

  connectUIEvents () {
    // Time speed control
    const timeSpeedSlider = document.getElementById('timeSpeed')
    const speedValue = document.getElementById('speedValue')

    if (timeSpeedSlider && speedValue) {
      timeSpeedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value)
        this.simulator.setTimeSpeed(speed)
        speedValue.textContent = speed + 'x'
      })
    }

    // Pause/Resume button
    const pauseBtn = document.getElementById('pauseBtn')
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.simulator.togglePause()
        const isPaused = this.simulator.isPaused
        this.uiManager.setPauseButtonState(isPaused)
      })
    }

    // Reset camera button
    const resetBtn = document.getElementById('resetBtn')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.simulator.resetCamera()
      })
    }

    // Sync data button
    const syncBtn = document.getElementById('syncBtn')
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        try {
          this.uiManager.setSyncButtonLoading(true)
          this.uiManager.showLoading('Syncing asteroid data...')

          const result = await this.wsService.syncAsteroidData()
          console.log('Sync result:', result)

          // Reload asteroid data after sync
          await this.simulator.loadRealAsteroidData()

          this.uiManager.showLoading('Data synced successfully!')
          setTimeout(() => {
            this.uiManager.hideLoading()
          }, 2000)
        } catch (error) {
          console.error('Error syncing data:', error)
          this.uiManager.showError('Failed to sync data: ' + error.message)
        } finally {
          this.uiManager.setSyncButtonLoading(false)
        }
      })
    }

    // WebSocket connection status
    if (this.wsService) {
      this.wsService.onConnectionChange = (isConnected) => {
        this.uiManager.updateConnectionStatus(isConnected)
      }
    }
  }

  startStatsUpdate () {
    // Update UI stats every second
    setInterval(() => {
      if (this.isInitialized && this.simulator) {
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
