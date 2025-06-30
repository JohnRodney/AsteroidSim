export class UIManager {
  constructor () {
    this.loadingScreen = document.getElementById('loading-screen')
    this.loadingText = document.getElementById('loading-text')
    this.errorMessage = document.getElementById('error-message')
    this.asteroidCountElement = document.getElementById('asteroid-count')
    this.planetCountElement = document.getElementById('planet-count')
    this.totalMassElement = document.getElementById('total-mass')
    this.fpsElement = document.getElementById('fps')
    this.simulationDateElement = document.getElementById('simulation-date')
    this.connectionStatus = document.getElementById('connectionStatus')
    this.connectionText = document.getElementById('connectionText')
    this.syncBtn = document.getElementById('syncBtn')
    this.pauseBtn = document.getElementById('pauseBtn')
    this.resetBtn = document.getElementById('resetBtn')
    this.timeSpeedSlider = document.getElementById('timeSpeed')
    this.speedValue = document.getElementById('speedValue')

    // Navigation panel
    this.navigationPanel = null
    this.simulator = null // Reference to the simulator for zooming
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

    if (this.planetCountElement) {
      this.planetCountElement.textContent = stats.planetCount.toLocaleString()
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

  updateSimulationDate (date) {
    if (this.simulationDateElement) {
      this.simulationDateElement.textContent = date.toLocaleDateString()
    }
  }

  showPlanetInfo (planetKey, planet) {
    // Create a simple planet info display
    const planetData = planet.planetData
    const orbital = planetData.orbital

    // Calculate orbital period in days
    const orbitalPeriod = orbital.n ? 365.25 / orbital.n : 0

    const message = `${planetData.name}
Diameter: ${this.formatDistance(planetData.diameter)} km
Mass: ${this.formatMass(planetData.mass)}
Distance from Sun: ${(orbital.a * 149.6).toFixed(1)} million km
Orbital Period: ${orbitalPeriod.toFixed(1)} days
Eccentricity: ${orbital.e.toFixed(4)}
Inclination: ${orbital.i.toFixed(2)}°`

    this.showNotification(message, 'info')
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

  // Create navigation panel with planet and asteroid buttons
  createNavigationPanel (simulator) {
    this.simulator = simulator

    // Remove existing panel if it exists
    if (this.navigationPanel) {
      this.navigationPanel.remove()
    }

    // Create navigation panel container
    this.navigationPanel = document.createElement('div')
    this.navigationPanel.id = 'navigation-panel'
    this.navigationPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 250px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #444;
      border-radius: 8px;
      padding: 15px;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 1000;
      overflow-y: auto;
      backdrop-filter: blur(10px);
    `

    // Create header
    const header = document.createElement('h3')
    header.textContent = 'Navigation'
    header.style.cssText = `
      margin: 0 0 15px 0;
      color: #fff;
      font-size: 16px;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
    `
    this.navigationPanel.appendChild(header)

    // Create planets section
    const planetsSection = this.createSection('Planets', simulator.planetData)
    this.navigationPanel.appendChild(planetsSection)

    // Create asteroids section (if there are asteroids)
    if (simulator.asteroids && simulator.asteroids.size > 0) {
      const asteroidsSection = this.createSection(
        'Asteroids',
        simulator.asteroids
      )
      this.navigationPanel.appendChild(asteroidsSection)
    }

    // Add reset camera button
    const resetButton = document.createElement('button')
    resetButton.textContent = 'Reset Camera'
    resetButton.style.cssText = `
      width: 100%;
      padding: 10px;
      margin-top: 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `
    resetButton.onclick = () => simulator.resetCamera()
    this.navigationPanel.appendChild(resetButton)

    // Add to page
    document.body.appendChild(this.navigationPanel)
  }

  createSection (title, items) {
    const section = document.createElement('div')
    section.style.cssText = `
      margin-bottom: 20px;
    `

    const sectionTitle = document.createElement('h4')
    sectionTitle.textContent = title
    sectionTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: #ccc;
      font-size: 14px;
      font-weight: bold;
    `
    section.appendChild(sectionTitle)

    // Create scrollable container for items
    const itemsContainer = document.createElement('div')
    itemsContainer.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #333;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.3);
    `

    // Add items
    if (title === 'Planets') {
      Object.keys(items).forEach((planetKey) => {
        const planet = items[planetKey]
        const button = this.createItemButton(planet.name, planetKey, 'planet')
        itemsContainer.appendChild(button)
      })
    } else if (title === 'Asteroids') {
      items.forEach((asteroid, asteroidId) => {
        const button = this.createItemButton(
          asteroid.name || `Asteroid ${asteroidId}`,
          asteroidId,
          'asteroid'
        )
        itemsContainer.appendChild(button)
      })
    }

    section.appendChild(itemsContainer)
    return section
  }

  createItemButton (name, id, type) {
    const button = document.createElement('button')
    button.textContent = name
    button.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      margin: 2px 0;
      background: #333;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
      transition: background 0.2s;
    `

    button.onmouseover = () => {
      button.style.background = '#555'
    }

    button.onmouseout = () => {
      button.style.background = '#333'
    }

    button.onclick = () => {
      if (type === 'planet') {
        this.simulator.focusCameraOnPlanet(id)
      } else if (type === 'asteroid') {
        this.simulator.focusCameraOnAsteroid(
          this.simulator.asteroids.get(id).mesh
        )
      }
    }

    return button
  }

  // Update navigation panel with new data
  updateNavigationPanel () {
    if (this.navigationPanel && this.simulator) {
      this.createNavigationPanel(this.simulator)
    }
  }
}
