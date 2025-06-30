export class UIManager {
  constructor () {
    this.loadingScreen = document.getElementById('loading-screen')
    this.asteroidCountElement = document.getElementById('asteroid-count')
    this.totalMassElement = document.getElementById('total-mass')
    this.fpsElement = document.getElementById('fps')
  }

  showLoading (message = 'Loading...') {
    if (this.loadingScreen) {
      const messageElement = this.loadingScreen.querySelector('p')
      if (messageElement) {
        messageElement.textContent = message
      }
      this.loadingScreen.classList.remove('hidden')
    }
  }

  hideLoading () {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('hidden')
    }
  }

  showError (message) {
    // Create error notification
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 1000;
      max-width: 300px;
      word-wrap: break-word;
    `
    errorDiv.textContent = message

    document.body.appendChild(errorDiv)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv)
      }
    }, 5000)
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

    const units = [
      { value: 1e24, symbol: 'Yg' },
      { value: 1e21, symbol: 'Zg' },
      { value: 1e18, symbol: 'Eg' },
      { value: 1e15, symbol: 'Pg' },
      { value: 1e12, symbol: 'Tg' },
      { value: 1e9, symbol: 'Gg' },
      { value: 1e6, symbol: 'Mg' },
      { value: 1e3, symbol: 'kg' },
      { value: 1, symbol: 'g' }
    ]

    for (const unit of units) {
      if (mass >= unit.value) {
        return (mass / unit.value).toFixed(2) + ' ' + unit.symbol
      }
    }

    return mass.toFixed(2) + ' g'
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

  formatDistance (distance) {
    if (distance === 0) return '0 km'

    if (distance >= 1e9) {
      return (distance / 1e9).toFixed(2) + ' billion km'
    } else if (distance >= 1e6) {
      return (distance / 1e6).toFixed(2) + ' million km'
    } else if (distance >= 1e3) {
      return (distance / 1e3).toFixed(2) + ' thousand km'
    }

    return distance.toFixed(2) + ' km'
  }

  formatTime (seconds) {
    if (seconds === 0) return '0 days'

    const days = seconds / (24 * 60 * 60)
    const years = days / 365.25

    if (years >= 1) {
      return years.toFixed(2) + ' years'
    }

    return days.toFixed(1) + ' days'
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
