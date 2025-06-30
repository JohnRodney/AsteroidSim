export class AsteroidInfoModal {
  constructor () {
    this.modal = null
    this.isVisible = false
    this.createModal()
  }

  createModal () {
    // Create modal container
    this.modal = document.createElement('div')
    this.modal.id = 'asteroid-info-modal'
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `

    // Create modal content
    const content = document.createElement('div')
    content.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `

    // Create header
    const header = document.createElement('div')
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
    `

    const titleContainer = document.createElement('div')
    titleContainer.style.cssText = `
      flex: 1;
    `

    const title = document.createElement('h2')
    title.id = 'asteroid-title'
    title.style.cssText = `
      margin: 0;
      color: #fff;
      font-size: 18px;
    `

    const focusIndicator = document.createElement('div')
    focusIndicator.textContent = '🎯 Camera Focused'
    focusIndicator.style.cssText = `
      font-size: 10px;
      color: #007acc;
      margin-top: 5px;
      font-weight: normal;
    `

    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `
    closeBtn.onclick = () => this.hide()

    titleContainer.appendChild(title)
    titleContainer.appendChild(focusIndicator)
    header.appendChild(titleContainer)
    header.appendChild(closeBtn)

    // Create content sections
    const sections = document.createElement('div')
    sections.id = 'asteroid-sections'

    content.appendChild(header)
    content.appendChild(sections)
    this.modal.appendChild(content)

    // Add to document
    document.body.appendChild(this.modal)

    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide()
      }
    })
  }

  show (asteroidData) {
    const title = document.getElementById('asteroid-title')
    const sections = document.getElementById('asteroid-sections')

    // Set title
    title.textContent =
      asteroidData.name || `Asteroid ${asteroidData.designation}`

    // Clear previous content
    sections.innerHTML = ''

    // Create sections
    this.createSection(
      sections,
      'Basic Information',
      this.formatBasicInfo(asteroidData)
    )
    this.createSection(
      sections,
      'Orbital Elements',
      this.formatOrbitalElements(asteroidData.orbital_elements)
    )
    this.createSection(
      sections,
      'Physical Properties',
      this.formatPhysicalProperties(asteroidData.physical_properties)
    )

    // Show modal
    this.modal.style.display = 'flex'
    this.isVisible = true
  }

  hide () {
    this.modal.style.display = 'none'
    this.isVisible = false
  }

  createSection (container, title, content) {
    const section = document.createElement('div')
    section.style.cssText = `
      margin-bottom: 20px;
    `

    const sectionTitle = document.createElement('h3')
    sectionTitle.textContent = title
    sectionTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: #007acc;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    `

    const sectionContent = document.createElement('div')
    sectionContent.innerHTML = content
    sectionContent.style.cssText = `
      font-size: 12px;
      line-height: 1.4;
    `

    section.appendChild(sectionTitle)
    section.appendChild(sectionContent)
    container.appendChild(section)
  }

  formatBasicInfo (asteroid) {
    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div><strong>Designation:</strong></div>
        <div>${asteroid.designation || 'N/A'}</div>
        <div><strong>Name:</strong></div>
        <div>${asteroid.name || 'N/A'}</div>
        <div><strong>Orbit Class:</strong></div>
        <div>${asteroid.orbit_class || 'N/A'}</div>
        <div><strong>ID:</strong></div>
        <div>${asteroid.id || 'N/A'}</div>
      </div>
    `
  }

  formatOrbitalElements (orbital) {
    if (!orbital) { return '<div style="color: #666;">No orbital data available</div>' }

    const elements = [
      { key: 'a', label: 'Semi-major axis', unit: 'AU' },
      { key: 'e', label: 'Eccentricity', unit: '' },
      { key: 'i', label: 'Inclination', unit: '°' },
      { key: 'q', label: 'Perihelion distance', unit: 'AU' },
      { key: 'w', label: 'Argument of perihelion', unit: '°' },
      { key: 'om', label: 'Longitude of ascending node', unit: '°' },
      { key: 'ma', label: 'Mean anomaly', unit: '°' },
      { key: 'per', label: 'Orbital period', unit: 'days' },
      { key: 'n', label: 'Mean motion', unit: '°/day' },
      { key: 'tp', label: 'Time of perihelion passage', unit: 'TDB' },
      { key: 'epoch', label: 'Epoch', unit: 'TDB' }
    ]

    let html =
      '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">'

    elements.forEach((element) => {
      const value = orbital[element.key]
      if (value !== undefined && value !== null) {
        html += `
          <div><strong>${element.label}:</strong></div>
          <div>${parseFloat(value).toFixed(6)}</div>
          <div style="color: #666;">${element.unit}</div>
        `
      }
    })

    html += '</div>'
    return html
  }

  formatPhysicalProperties (physical) {
    if (!physical) { return '<div style="color: #666;">No physical data available</div>' }

    const properties = [
      { key: 'diameter', label: 'Diameter', unit: 'km' },
      { key: 'h', label: 'Absolute magnitude (H)', unit: 'mag' },
      { key: 'albedo', label: 'Albedo', unit: '' },
      { key: 'density', label: 'Density', unit: 'g/cm³' },
      { key: 'rot_per', label: 'Rotation period', unit: 'hours' }
    ]

    let html =
      '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">'

    properties.forEach((prop) => {
      const value = physical[prop.key]
      if (value !== undefined && value !== null) {
        html += `
          <div><strong>${prop.label}:</strong></div>
          <div>${parseFloat(value).toFixed(4)}</div>
          <div style="color: #666;">${prop.unit}</div>
        `
      }
    })

    html += '</div>'
    return html
  }

  destroy () {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal)
    }
  }
}
