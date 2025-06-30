export class UIManager {
  constructor () {
    this.loadingScreen = document.getElementById('loading-screen')
    this.loadingText = document.getElementById('loading-text')
    this.errorMessage = document.getElementById('error-message')
    this.asteroidCountElement = document.getElementById('asteroid-count')
    this.totalMassElement = document.getElementById('total-mass')
    this.fpsElement = document.getElementById('fps')
    this.connectionStatus = document.getElementById('connectionStatus')
    this.connectionText = document.getElementById('connectionText')
    this.syncBtn = document.getElementById('syncBtn')
    this.pauseBtn = document.getElementById('pauseBtn')
    this.resetBtn = document.getElementById('resetBtn')
    this.timeSpeedSlider = document.getElementById('timeSpeed')
    this.speedValue = document.getElementById('speedValue')
  }

  showLoading (message = 'Loading...') {
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'flex'
      if (this.loadingText) {
        this.loadingText.textContent = message
      }
    }
  }

  hideLoading () {
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'none'
    }
  }

  showError (message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message
      this.errorMessage.style.display = 'block'

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideError()
      }, 5000)
    }
  }

  hideError () {
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none'
    }
  }

  showNotification (message, type = 'info') {
    // Create notification
    const notificationDiv = document.createElement('div')
    const bgColor =
      type === 'success'
        ? 'rgba(0, 255, 0, 0.9)'
        : type === 'warning'
          ? 'rgba(255, 165, 0, 0.9)'
          : 'rgba(0, 123, 255, 0.9)'

    notificationDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 1000;
      max-width: 300px;
      word-wrap: break-word;
    `
    notificationDiv.textContent = message

    document.body.appendChild(notificationDiv)

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notificationDiv.parentNode) {
        notificationDiv.parentNode.removeChild(notificationDiv)
      }
    }, 3000)
  }

  updateConnectionStatus (isConnected, isConnecting = false) {
    if (this.connectionStatus && this.connectionText) {
      if (isConnecting) {
        this.connectionStatus.className = 'status-indicator status-connecting'
        this.connectionText.textContent = 'Connecting...'
      } else if (isConnected) {
        this.connectionStatus.className = 'status-indicator status-connected'
        this.connectionText.textContent = 'Connected'
      } else {
        this.connectionStatus.className =
          'status-indicator status-disconnected'
        this.connectionText.textContent = 'Disconnected'
      }
    }
  }

  updateStats (stats) {
    if (this.asteroidCountElement) {
      this.asteroidCountElement.textContent =
        stats.asteroidCount.toLocaleString()
    }

    if (this.totalMassElement) {
      this.totalMassElement.textContent = this.formatMass(stats.totalMass)
    }

    if (this.fpsElement) {
      this.fpsElement.textContent = stats.fps
    }
  }

  formatMass (mass) {
    if (mass === 0) return '0 kg'

    if (mass >= 1e24) {
      return (mass / 1e24).toFixed(2) + ' Yg'
    } else if (mass >= 1e21) {
      return (mass / 1e21).toFixed(2) + ' Zg'
    } else if (mass >= 1e18) {
      return (mass / 1e18).toFixed(2) + ' Eg'
    } else if (mass >= 1e15) {
      return (mass / 1e15).toFixed(2) + ' Pg'
    } else if (mass >= 1e12) {
      return (mass / 1e12).toFixed(2) + ' Tg'
    } else if (mass >= 1e9) {
      return (mass / 1e9).toFixed(2) + ' Gg'
    } else if (mass >= 1e6) {
      return (mass / 1e6).toFixed(2) + ' Mg'
    } else if (mass >= 1e3) {
      return (mass / 1e3).toFixed(2) + ' kg'
    } else {
      return mass.toFixed(2) + ' g'
    }
  }

  formatDistance (distance) {
    if (distance === 0) return '0 km'

    if (distance >= 1e9) {
      return (distance / 1e9).toFixed(2) + ' Gm'
    } else if (distance >= 1e6) {
      return (distance / 1e6).toFixed(2) + ' Mm'
    } else if (distance >= 1e3) {
      return (distance / 1e3).toFixed(2) + ' km'
    } else {
      return distance.toFixed(2) + ' m'
    }
  }

  formatTime (seconds) {
    if (seconds === 0) return '0 s'

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  setSyncButtonLoading (isLoading) {
    if (this.syncBtn) {
      if (isLoading) {
        this.syncBtn.textContent = 'Syncing...'
        this.syncBtn.disabled = true
      } else {
        this.syncBtn.textContent = 'Sync Data'
        this.syncBtn.disabled = false
      }
    }
  }

  setPauseButtonState (isPaused) {
    if (this.pauseBtn) {
      this.pauseBtn.textContent = isPaused ? 'Resume' : 'Pause'
    }
  }

  updateSpeedValue (speed) {
    if (this.speedValue) {
      this.speedValue.textContent = speed + 'x'
    }
  }

  createInfoPanel (asteroidData) {
    // Create detailed info panel for asteroid selection
    const panel = document.createElement('div')
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      min-width: 300px;
      z-index: 20;
    `

    panel.innerHTML = `
      <h3>${asteroidData.name || asteroidData.designation}</h3>
      <div style="margin: 10px 0;">
        <strong>Type:</strong> ${asteroidData.orbit_class || 'Unknown'}<br>
        <strong>Composition:</strong> ${
  asteroidData.composition_type || 'Unknown'
}<br>
        <strong>Diameter:</strong> ${this.formatDistance(
    asteroidData.diameter || 0
  )}<br>
        <strong>Mass:</strong> ${this.formatMass(asteroidData.mass || 0)}<br>
        <strong>Distance from Sun:</strong> ${this.formatDistance(
    asteroidData.distance || 0
  )}<br>
        <strong>Orbital Period:</strong> ${this.formatTime(
    asteroidData.orbital_period || 0
  )}
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: #333;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Close</button>
    `

    document.body.appendChild(panel)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel)
      }
    }, 10000)
  }

  showLoadingProgress (progress, message) {
    if (this.loadingScreen) {
      const messageElement = this.loadingScreen.querySelector('p')
      if (messageElement) {
        messageElement.textContent = `${message} (${Math.round(progress)}%)`
      }
    }
  }
}
