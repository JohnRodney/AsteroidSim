import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  ArcRotateCamera,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Animation,
  CircleEase,
  EasingFunction
} from '@babylonjs/core'

export class AsteroidSimulator {
  constructor () {
    this.canvas = null
    this.engine = null
    this.scene = null
    this.camera = null
    this.light = null
    this.sun = null
    this.asteroids = new Map()
    this.asteroidInstances = new Map()
    this.planets = new Map()
    this.isPaused = false
    this.timeSpeed = 1.0
    this.simulationDate = new Date() // Start from current date
    this.stats = {
      fps: 0,
      asteroidCount: 0,
      planetCount: 0,
      totalMass: 0
    }
    this.frameCount = 0
    this.lastTime = 0
    this.onAsteroidClick = null // Callback for asteroid clicks
    this.currentAsteroidPath = null
    this.followTarget = null // Current target being followed
    this.followMode = false // Whether camera is in follow mode

    // Real planet data with orbital elements (JPL HORIZONS, epoch 2024-01-01)
    this.planetData = {
      mercury: {
        name: 'Mercury',
        designation: '1',
        diameter: 4879.4, // km
        mass: 3.3011e23, // kg
        color: new Color3(0.7, 0.7, 0.7),
        orbital: {
          a: 0.387098, // AU
          e: 0.20563,
          i: 7.00487, // degrees
          om: 48.33167, // degrees
          w: 77.45645, // degrees
          ma: 252.25084, // degrees
          n: 4.092334436, // degrees/day
          epoch: 2460100.5
        }
      },
      venus: {
        name: 'Venus',
        designation: '2',
        diameter: 12103.6, // km
        mass: 4.8675e24, // kg
        color: new Color3(0.9, 0.8, 0.6),
        orbital: {
          a: 0.723332,
          e: 0.006773,
          i: 3.39471,
          om: 76.68069,
          w: 131.53298,
          ma: 181.97973,
          n: 1.602130136,
          epoch: 2460100.5
        }
      },
      earth: {
        name: 'Earth',
        designation: '3',
        diameter: 12742.0, // km
        mass: 5.97237e24, // kg
        color: new Color3(0.3, 0.6, 0.9),
        orbital: {
          a: 1.0, // Semi-major axis (AU)
          e: 0.016709, // Eccentricity
          i: 0.00005, // Inclination (degrees)
          om: 0.0, // Longitude of ascending node (degrees)
          w: 102.94719, // Argument of pericenter (degrees)
          ma: 357.529, // Mean anomaly at epoch (degrees)
          n: 0.9856, // Mean motion (degrees/day)
          epoch: 2450800.5
        }
      },
      mars: {
        name: 'Mars',
        designation: '4',
        diameter: 6779.0, // km
        mass: 6.4171e23, // kg
        color: new Color3(0.8, 0.4, 0.3),
        orbital: {
          a: 1.523679,
          e: 0.093405,
          i: 1.85061,
          om: 49.57854,
          w: 336.04137,
          ma: 355.45332,
          n: 0.524020776,
          epoch: 2460100.5
        }
      },
      jupiter: {
        name: 'Jupiter',
        designation: '5',
        diameter: 139820.0, // km
        mass: 1.8982e27, // kg
        color: new Color3(0.8, 0.7, 0.5),
        orbital: {
          a: 5.202561,
          e: 0.048498,
          i: 1.3053,
          om: 100.55615,
          w: 14.72848,
          ma: 34.40438,
          n: 0.0830853,
          epoch: 2460100.5
        }
      },
      saturn: {
        name: 'Saturn',
        designation: '6',
        diameter: 116460.0, // km
        mass: 5.6834e26, // kg
        color: new Color3(0.9, 0.8, 0.6),
        orbital: {
          a: 9.554747,
          e: 0.054509,
          i: 2.48446,
          om: 113.71504,
          w: 92.43194,
          ma: 49.94432,
          n: 0.033444228,
          epoch: 2460100.5
        }
      },
      uranus: {
        name: 'Uranus',
        designation: '7',
        diameter: 25600.0, // km (equatorial diameter)
        mass: 8.681e25, // kg
        color: new Color3(0.6, 0.8, 0.9),
        orbital: {
          a: 19.21814,
          e: 0.047318,
          i: 0.77464,
          om: 74.22988,
          w: 170.96424,
          ma: 313.23218,
          n: 0.011728734,
          epoch: 2460100.5
        }
      },
      neptune: {
        name: 'Neptune',
        designation: '8',
        diameter: 24764.0, // km
        mass: 1.02413e26, // kg
        color: new Color3(0.4, 0.6, 0.9),
        orbital: {
          a: 30.110387,
          e: 0.008606,
          i: 1.77004,
          om: 131.72169,
          w: 44.97135,
          ma: 304.88003,
          n: 0.006022609,
          epoch: 2460100.5
        }
      }
    }
  }

  async init () {
    // Get the canvas element
    this.canvas = document.getElementById('renderCanvas')
    if (!this.canvas) {
      throw new Error('Canvas element not found')
    }

    // Create Babylon.js engine
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    })

    // Create scene
    this.scene = new Scene(this.engine)

    // Set dark background for better asteroid visibility
    this.scene.clearColor = new Color3(0, 0, 0)

    // Setup camera
    this.setupCamera()

    // Setup lighting
    this.setupLighting()

    // Create the Sun
    this.createSun()

    // Create planets with real orbital elements
    this.createPlanets()

    // Create asteroid belt representation
    this.createAsteroidBelt()

    // Create navigation panel
    if (this.uiManager) {
      this.uiManager.createNavigationPanel(this)
    }

    // Setup scene optimizations
    this.setupOptimizations()

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize()
    })

    // Setup click detection
    this.setupClickHandling()

    // Add console command for testing
    window.focusJupiter = () => this.focusOnJupiter()
    console.log('To focus on Jupiter, run: focusJupiter()')

    console.log('3D scene initialized successfully')
  }

  async loadRealAsteroidData () {
    try {
      console.log('🔄 Loading real asteroid data from backend...')

      // Fetch asteroid data from backend
      const response = await fetch(
        'http://localhost:3002/api/asteroids?limit=100'
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data.length > 0) {
        console.log(`📊 Loaded ${data.data.length} real asteroids`)
        this.createRealAsteroids(data.data)
      } else {
        console.log('No real asteroid data available, using placeholders')
        this.createPlaceholderAsteroids()
      }
    } catch (error) {
      console.error('Error loading real asteroid data:', error)
      console.log('Falling back to placeholder asteroids')
      this.createPlaceholderAsteroids()
    }
  }

  createRealAsteroids (asteroidData) {
    // Clear existing placeholder asteroids
    this.clearAsteroids()

    // Create base geometries for different asteroid types
    const asteroidTypes = {
      'C-type': { color: new Color3(0.3, 0.2, 0.1), density: 1.38 },
      'S-type': { color: new Color3(0.7, 0.6, 0.5), density: 2.71 },
      'M-type': { color: new Color3(0.8, 0.7, 0.6), density: 5.32 }
    }

    // Create base meshes for each type
    Object.keys(asteroidTypes).forEach((type) => {
      const baseMesh = MeshBuilder.CreateSphere(
        `asteroid_${type}`,
        { diameter: 1 },
        this.scene
      )

      const material = new StandardMaterial(`material_${type}`, this.scene)
      material.diffuseColor = asteroidTypes[type].color
      material.specularColor = new Color3(0.1, 0.1, 0.1)

      baseMesh.material = material
      baseMesh.setEnabled(false) // Hide the base mesh

      this.asteroidInstances.set(type, {
        baseMesh,
        instances: [],
        count: 0
      })
    })

    // Create instances for each real asteroid
    asteroidData.forEach((asteroid) => {
      this.createRealAsteroidInstance(asteroid)
    })

    console.log(
      `✅ Created ${this.stats.asteroidCount} real asteroid instances`
    )
  }

  createRealAsteroidInstance (asteroid) {
    const physical = asteroid.physical_properties || {}
    const orbital = asteroid.orbital_elements || {}

    // Determine asteroid type based on composition
    let type = 'C-type' // Default
    if (physical.composition_type) {
      type = physical.composition_type
    } else if (physical.albedo) {
      // Estimate type based on albedo
      const albedo = parseFloat(physical.albedo)
      if (albedo > 0.2) type = 'S-type'
      else if (albedo > 0.1) type = 'M-type'
      else type = 'C-type'
    }

    const asteroidData = this.asteroidInstances.get(type)
    if (!asteroidData) return

    // Calculate initial position from orbital elements
    const position = this.calculateAsteroidPosition(orbital)

    // Calculate size based on diameter or default
    let scale = 0.5
    if (physical.diameter) {
      scale = Math.max(0.1, Math.min(2.0, parseFloat(physical.diameter) / 100))
    }

    const instance = asteroidData.baseMesh.createInstance(
      `asteroid_${asteroid.designation || asteroid.id}`
    )

    instance.position = position
    instance.scaling = new Vector3(scale, scale, scale)

    // Add some random rotation
    instance.rotation = new Vector3(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    )

    // Store asteroid data with the instance
    instance.asteroidData = asteroid
    instance.orbitalElements = orbital
    instance.creationTime = Date.now()

    asteroidData.instances.push(instance)
    asteroidData.count++

    this.stats.asteroidCount++

    // Update total mass if available
    if (physical.mass) {
      this.stats.totalMass += parseFloat(physical.mass)
    }
  }

  calculateAsteroidPosition (orbital, timeOffset = 0) {
    // Full Keplerian orbital mechanics
    const a = parseFloat(orbital.a) || 1.0 // Semi-major axis in AU
    const e = parseFloat(orbital.e) || 0.0 // Eccentricity
    const i = (parseFloat(orbital.i) * Math.PI) / 180 || 0 // Inclination (convert to radians)
    const omega = (parseFloat(orbital.om) * Math.PI) / 180 || 0 // Longitude of ascending node
    const w = (parseFloat(orbital.w) * Math.PI) / 180 || 0 // Argument of pericenter
    const n = parseFloat(orbital.n) || 0.1 // Mean motion (degrees/day)
    const M0 = (parseFloat(orbital.ma) * Math.PI) / 180 || 0 // Mean anomaly at epoch

    // Convert AU to scene units (1 AU = 50 scene units)
    const sceneScale = 50

    // Calculate time since epoch (in days)
    const timeScale = 0.001 // 1 simulation second = 0.001 real days
    const currentTime = Date.now() * timeScale + timeOffset
    const daysSinceEpoch = currentTime

    // Calculate current mean anomaly
    const M = M0 + ((n * Math.PI) / 180) * daysSinceEpoch // Convert n to radians/day

    // Solve Kepler's equation for eccentric anomaly (E)
    let E = M // Initial guess
    for (let iter = 0; iter < 5; iter++) {
      E = M + e * Math.sin(E)
    }

    // Calculate true anomaly (ν)
    const nu = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2))

    // Calculate radius vector
    const r = a * (1 - e * Math.cos(E))

    // Calculate position in orbital plane
    const xOrbital = r * Math.cos(nu)
    const yOrbital = r * Math.sin(nu)

    // Apply orbital orientation transformations
    // 1. Rotate by argument of pericenter (w) - rotation in orbital plane
    const x1 = xOrbital * Math.cos(w) - yOrbital * Math.sin(w)
    const y1 = xOrbital * Math.sin(w) + yOrbital * Math.cos(w)

    // 2. Apply inclination transformation
    const x2 = x1
    const y2 = y1 * Math.cos(i)
    const z2 = y1 * Math.sin(i)

    // 3. Apply longitude of ascending node transformation (rotation around Z axis)
    const x = x2 * Math.cos(omega) - y2 * Math.sin(omega)
    const y = x2 * Math.sin(omega) + y2 * Math.cos(omega)
    const z = z2

    // Scale to scene units
    return new Vector3(x * sceneScale, y * sceneScale, z * sceneScale)
  }

  clearAsteroids () {
    // Remove all existing asteroid instances
    this.asteroidInstances.forEach((asteroidData) => {
      asteroidData.instances.forEach((instance) => {
        instance.dispose()
      })
      asteroidData.instances = []
      asteroidData.count = 0
    })

    this.stats.asteroidCount = 0
    this.stats.totalMass = 0
  }

  setupCamera () {
    // Create an arc rotate camera for orbital viewing
    this.camera = new ArcRotateCamera(
      'camera',
      0, // alpha (rotation around Y axis)
      Math.PI / 3, // beta (rotation around X axis)
      100, // radius (distance from target)
      Vector3.Zero(),
      this.scene
    )

    // Set camera limits and behavior
    this.camera.lowerRadiusLimit = 10
    this.camera.upperRadiusLimit = 5000 // Increased significantly to see entire solar system
    this.camera.lowerBetaLimit = 0.1
    this.camera.upperBetaLimit = Math.PI - 0.1
    this.camera.wheelDeltaPercentage = 0.005 // Reduced for finer zoom control
    this.camera.panningSensibility = 1000
    this.camera.attachControl(this.canvas, true)

    // Disable follow mode when user interacts with camera
    this.camera.onViewMatrixChangedObservable.add(() => {
      if (this.followMode) {
        this.followMode = false
        this.followTarget = null
      }
    })

    // Set initial camera position for better overview
    this.camera.setPosition(new Vector3(0, 100, 200))
    this.camera.setTarget(Vector3.Zero())
  }

  setupLighting () {
    // Create hemispheric light for ambient lighting
    this.light = new HemisphericLight(
      'light',
      new Vector3(0, 1, 0),
      this.scene
    )
    this.light.intensity = 0.3
    this.light.groundColor = new Color3(0.1, 0.1, 0.2)

    // Add directional light from the Sun
    const sunLight = new HemisphericLight(
      'sunLight',
      new Vector3(0, 0, 1),
      this.scene
    )
    sunLight.intensity = 0.7
    sunLight.diffuse = new Color3(1, 0.95, 0.8)
  }

  createSun () {
    // Create a simple sphere for the Sun
    this.sun = MeshBuilder.CreateSphere('sun', { diameter: 5 }, this.scene)

    // Create sun material
    const sunMaterial = new StandardMaterial('sunMaterial', this.scene)
    sunMaterial.emissiveColor = new Color3(1, 0.8, 0.4)
    sunMaterial.diffuseColor = new Color3(1, 0.9, 0.6)

    this.sun.material = sunMaterial
    this.sun.position = Vector3.Zero()
  }

  createPlanets () {
    console.log('Creating planets with real orbital elements...')

    // Use the full planet data with real orbital elements
    Object.keys(this.planetData).forEach((planetKey) => {
      const planetInfo = this.planetData[planetKey]

      // Calculate initial position from orbital elements
      const position = this.calculateAsteroidPosition(planetInfo.orbital)

      // Create planet mesh
      const planet = MeshBuilder.CreateSphere(
        `planet_${planetKey}`,
        { diameter: 1 },
        this.scene
      )

      // Scale planet based on real diameter (but keep reasonable visual size)
      let scale = Math.max(4.0, Math.min(15.0, planetInfo.diameter / 6000))

      // Special scaling for outer planets to make them more visible
      if (planetKey === 'jupiter') {
        scale = Math.max(12.0, scale * 2.0)
      } else if (planetKey === 'saturn') {
        scale = Math.max(10.0, scale * 1.8)
      } else if (planetKey === 'uranus') {
        scale = Math.max(8.0, scale * 1.5)
      } else if (planetKey === 'neptune') {
        scale = Math.max(8.0, scale * 1.5)
      }
      planet.scaling = new Vector3(scale, scale, scale)

      // Create planet material
      const material = new StandardMaterial(
        `planet_material_${planetKey}`,
        this.scene
      )
      material.diffuseColor = planetInfo.color
      material.specularColor = new Color3(0.1, 0.1, 0.1)

      // Add some emissive glow for planets
      material.emissiveColor = planetInfo.color.scale(0.1)

      planet.material = material
      planet.position = position

      // Store planet data
      planet.planetData = planetInfo
      planet.orbitalElements = planetInfo.orbital
      planet.creationTime = Date.now()

      // Add to planets map
      this.planets.set(planetKey, planet)

      this.stats.planetCount++

      console.log(
        `Created ${planetInfo.name} at position:`,
        position.toString(),
        `scale: ${scale}, diameter: ${
          planetInfo.diameter
        }km, distance: ${position.length()}, planetKey: ${planetKey}`
      )
    })

    console.log(`✅ Created ${this.stats.planetCount} planets`)

    // Create orbital paths for all planets
    this.createAllPlanetOrbitalPaths()
  }

  createAllPlanetOrbitalPaths () {
    console.log('Creating orbital paths for all planets...')

    // Use the full planet data with real orbital elements
    Object.keys(this.planetData).forEach((planetKey) => {
      const planetInfo = this.planetData[planetKey]
      this.createPlanetOrbitalPath(planetInfo, planetKey)
    })
  }

  createPlanetOrbitalPath (planetInfo, planetKey) {
    const orbital = planetInfo.orbital

    // Create orbital paths with full Keplerian mechanics
    const sceneScale = 50
    const points = []
    const numPoints = 100
    const a = parseFloat(orbital.a) || 1.0
    const e = parseFloat(orbital.e) || 0.0
    const i = (parseFloat(orbital.i) * Math.PI) / 180 || 0
    const omega = (parseFloat(orbital.om) * Math.PI) / 180 || 0
    const w = (parseFloat(orbital.w) * Math.PI) / 180 || 0

    for (let j = 0; j <= numPoints; j++) {
      const angle = (j / numPoints) * Math.PI * 2

      // Calculate position on ellipse
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle))

      // Calculate position in orbital plane
      const xOrbital = r * Math.cos(angle)
      const yOrbital = r * Math.sin(angle)

      // Apply orbital orientation transformations (same as planet positioning)
      // 1. Rotate by argument of pericenter (w) - rotation in orbital plane
      const x1 = xOrbital * Math.cos(w) - yOrbital * Math.sin(w)
      const y1 = xOrbital * Math.sin(w) + yOrbital * Math.cos(w)

      // 2. Apply inclination transformation
      const x2 = x1
      const y2 = y1 * Math.cos(i)
      const z2 = y1 * Math.sin(i)

      // 3. Apply longitude of ascending node transformation (rotation around Z axis)
      const x = x2 * Math.cos(omega) - y2 * Math.sin(omega)
      const y = x2 * Math.sin(omega) + y2 * Math.cos(omega)
      const z = z2

      // Scale to scene units
      points.push(new Vector3(x * sceneScale, y * sceneScale, z * sceneScale))
    }

    // Create the orbital path mesh
    const path = MeshBuilder.CreateLines(
      `orbital_path_${planetKey}`,
      { points },
      this.scene
    )

    // Create path material with planet-specific color
    const pathMaterial = new StandardMaterial(
      `path_material_${planetKey}`,
      this.scene
    )
    pathMaterial.emissiveColor = planetInfo.color.scale(0.4)
    pathMaterial.alpha = 0.7
    path.material = pathMaterial

    console.log(
      `Created full orbital path for ${planetInfo.name} (e=${orbital.e}, i=${orbital.i}°, Ω=${orbital.om}°, ω=${orbital.w}°)`
    )
  }

  createAsteroidBelt () {
    // No orbital paths for now - starting fresh
    console.log('Asteroid belt placeholder - no orbital paths')
  }

  createPlaceholderAsteroids () {
    // Create a few placeholder asteroids for testing the system
    const asteroidTypes = [
      { name: 'C-type', color: new Color3(0.3, 0.2, 0.1), density: 1.38 },
      { name: 'S-type', color: new Color3(0.7, 0.6, 0.5), density: 2.71 },
      { name: 'M-type', color: new Color3(0.8, 0.7, 0.6), density: 5.32 }
    ]

    // Create base geometries for each asteroid type
    asteroidTypes.forEach((type) => {
      const baseMesh = MeshBuilder.CreateSphere(
        `asteroid_${type.name}`,
        {
          diameter: 0.5 + Math.random() * 0.5
        },
        this.scene
      )

      const material = new StandardMaterial(
        `material_${type.name}`,
        this.scene
      )
      material.diffuseColor = type.color
      material.specularColor = new Color3(0.1, 0.1, 0.1)

      baseMesh.material = material
      baseMesh.setEnabled(false) // Hide the base mesh

      // Store for instancing
      this.asteroidInstances.set(type.name, {
        baseMesh,
        instances: [],
        count: 0
      })
    })

    // Create some test instances
    for (let i = 0; i < 50; i++) {
      const type =
        asteroidTypes[Math.floor(Math.random() * asteroidTypes.length)]
      const angle = Math.random() * Math.PI * 2
      const radius = 50 + Math.random() * 100
      const height = (Math.random() - 0.5) * 20

      const position = new Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )

      this.createAsteroidInstance(
        type.name,
        position,
        Math.random() * 0.5 + 0.2
      )
    }
  }

  createAsteroidInstance (type, position, scale) {
    const asteroidData = this.asteroidInstances.get(type)
    if (!asteroidData) return

    const instance = asteroidData.baseMesh.createInstance(
      `asteroid_${type}_${asteroidData.count}`
    )
    instance.position = position
    instance.scaling = new Vector3(scale, scale, scale)

    // Add some random rotation
    instance.rotation = new Vector3(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    )

    asteroidData.instances.push(instance)
    asteroidData.count++

    this.stats.asteroidCount++
  }

  setupOptimizations () {
    // Enable scene optimizations
    this.scene.freezeActiveMeshes()

    // Set up level of detail (LOD) for distant objects
    this.scene.useRightHandedSystem = false

    // Optimize for performance
    this.scene.autoClear = true
    this.scene.autoClearDepthAndStencil = true
  }

  startRenderLoop () {
    this.engine.runRenderLoop(() => {
      if (!this.isPaused) {
        this.update()
      }
      this.scene.render()
      this.updateStats()
    })
  }

  update () {
    // Update asteroid positions based on proper orbital mechanics
    const deltaTime = (this.engine.getDeltaTime() * this.timeSpeed) / 1000

    // Advance simulation date based on time speed
    // 1 unit of timeSpeed = 1 day per second
    const daysToAdvance = (deltaTime * this.timeSpeed) / 86400 // Convert to days
    this.simulationDate.setTime(
      this.simulationDate.getTime() + daysToAdvance * 24 * 60 * 60 * 1000
    )

    // Update planet positions using proper orbital mechanics
    this.planets.forEach((planet) => {
      if (planet.orbitalElements) {
        // Calculate time offset since creation
        const timeOffset = (Date.now() - planet.creationTime) * 0.001 // Convert to days

        // Calculate new position using proper orbital mechanics
        const newPosition = this.calculateAsteroidPosition(
          planet.orbitalElements,
          timeOffset
        )
        planet.position = newPosition

        // Add slow rotation to the planet itself (not orbital motion)
        planet.rotate(Vector3.Up(), deltaTime * 0.05)
      }
    })

    // Update asteroid positions using proper orbital mechanics
    this.asteroidInstances.forEach((asteroidData) => {
      asteroidData.instances.forEach((instance) => {
        if (instance.orbitalElements) {
          // Calculate time offset since creation
          const timeOffset = (Date.now() - instance.creationTime) * 0.001 // Convert to days

          // Calculate new position using proper orbital mechanics
          const newPosition = this.calculateAsteroidPosition(
            instance.orbitalElements,
            timeOffset
          )
          instance.position = newPosition

          // Add slow rotation to the asteroid itself (not orbital motion)
          instance.rotate(Vector3.Up(), deltaTime * 0.1)
        }
      })
    })

    // Update camera to follow target if in follow mode
    if (this.followMode && this.followTarget && this.camera) {
      this.updateCameraFollow()
    }
  }

  updateCameraFollow () {
    // Keep camera focused on the target as it moves, but allow user control
    const targetPosition = this.followTarget.position

    // Only update the camera target (what it's looking at), not the position
    // This keeps the planet in view but allows user to zoom and rotate
    // Use smooth interpolation to avoid jarring movements
    const currentTarget = this.camera.target
    const newTarget = Vector3.Lerp(currentTarget, targetPosition, 0.1)
    this.camera.target = newTarget
  }

  updateStats () {
    this.frameCount++
    const currentTime = performance.now()

    if (currentTime - this.lastTime >= 1000) {
      this.stats.fps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastTime)
      )
      this.frameCount = 0
      this.lastTime = currentTime
    }
  }

  togglePause () {
    this.isPaused = !this.isPaused
  }

  setTimeSpeed (speed) {
    this.timeSpeed = speed
  }

  resetCamera () {
    // Disable follow mode when resetting camera
    this.followMode = false
    this.followTarget = null

    this.focusCameraOnOverview()
  }

  focusCameraOnOverview () {
    if (!this.camera) return

    // Default overview position
    const overviewAlpha = 0
    const overviewBeta = Math.PI / 3 // 60 degrees elevation
    const overviewRadius = 500 // Increased from 50 to see entire solar system
    const overviewTarget = new Vector3(0, 0, 0)

    // Create smooth camera animation back to overview
    const frameRate = 60
    const duration = 2 // 2 seconds
    const totalFrames = frameRate * duration

    // Alpha animation (camera rotation around target)
    const alphaAnimation = new Animation(
      'cameraAlpha',
      'alpha',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )

    const alphaKeys = []
    alphaKeys.push({ frame: 0, value: this.camera.alpha })
    alphaKeys.push({ frame: totalFrames, value: overviewAlpha })
    alphaAnimation.setKeys(alphaKeys)

    // Beta animation (camera elevation)
    const betaAnimation = new Animation(
      'cameraBeta',
      'beta',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )

    const betaKeys = []
    betaKeys.push({ frame: 0, value: this.camera.beta })
    betaKeys.push({ frame: totalFrames, value: overviewBeta })
    betaAnimation.setKeys(betaKeys)

    // Radius animation (camera distance)
    const radiusAnimation = new Animation(
      'cameraRadius',
      'radius',
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )

    const radiusKeys = []
    radiusKeys.push({ frame: 0, value: this.camera.radius })
    radiusKeys.push({ frame: totalFrames, value: overviewRadius })
    radiusAnimation.setKeys(radiusKeys)

    // Target animation (camera target point)
    const targetAnimation = new Animation(
      'cameraTarget',
      'target',
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )

    const targetKeys = []
    targetKeys.push({ frame: 0, value: this.camera.target.clone() })
    targetKeys.push({ frame: totalFrames, value: overviewTarget })
    targetAnimation.setKeys(targetKeys)

    // Set easing function for smooth motion
    const easingFunction = new CircleEase()
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT)

    alphaAnimation.setEasingFunction(easingFunction)
    betaAnimation.setEasingFunction(easingFunction)
    radiusAnimation.setEasingFunction(easingFunction)
    targetAnimation.setEasingFunction(easingFunction)

    // Stop any existing camera animations
    this.scene.stopAnimation(this.camera)

    // Start the new animations
    this.scene.beginDirectAnimation(
      this.camera,
      [alphaAnimation, betaAnimation, radiusAnimation, targetAnimation],
      0,
      totalFrames
    )
  }

  getStats () {
    return { ...this.stats }
  }

  getSimulationDate () {
    return new Date(this.simulationDate)
  }

  updateAsteroidData (data) {
    // This will be implemented when we connect to the backend
    // For now, just log the data
    console.log('Received asteroid data:', data)
  }

  dispose () {
    if (this.scene) {
      this.scene.dispose()
    }
    if (this.engine) {
      this.engine.dispose()
    }
  }

  setupClickHandling () {
    this.scene.onPointerDown = (_evt) => {
      const pickResult = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY
      )

      if (pickResult.hit) {
        const hitMesh = pickResult.pickedMesh

        // Check if clicked on a planet
        for (const [planetKey, planet] of this.planets) {
          if (hitMesh === planet) {
            console.log(`Planet clicked: ${planetKey}`)
            this.uiManager.showPlanetInfo(planetKey, planet)
            this.focusCameraOnPlanet(planetKey)
            return
          }
        }

        // Check if clicked on an asteroid
        for (const [, asteroid] of this.asteroids) {
          if (hitMesh === asteroid.mesh) {
            this.handleAsteroidClick(asteroid)
            return
          }
        }
      }
    }

    // Add hover effects
    this.scene.onPointerMove = (_evt) => {
      const pickResult = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY
      )

      // Reset all asteroid materials
      this.asteroidInstances.forEach((asteroidData) => {
        asteroidData.instances.forEach((instance) => {
          if (instance.material && instance.material.emissiveColor) {
            instance.material.emissiveColor = new Color3(0, 0, 0)
          }
        })
      })

      // Reset all planet materials
      this.planets.forEach((planet) => {
        if (planet.material && planet.material.emissiveColor) {
          planet.material.emissiveColor = planet.planetData.color.scale(0.1)
        }
      })

      // Highlight hovered object
      if (pickResult.hit && pickResult.pickedMesh) {
        if (
          pickResult.pickedMesh.asteroidData ||
          pickResult.pickedMesh.planetData
        ) {
          if (
            pickResult.pickedMesh.material &&
            pickResult.pickedMesh.material.emissiveColor
          ) {
            if (pickResult.pickedMesh.planetData) {
              // Planets have a base emissive color, enhance it
              pickResult.pickedMesh.material.emissiveColor =
                pickResult.pickedMesh.planetData.color.scale(0.3)
            } else {
              pickResult.pickedMesh.material.emissiveColor = new Color3(
                0.2,
                0.2,
                0.2
              )
            }
          }
          this.canvas.style.cursor = 'pointer'
        } else {
          this.canvas.style.cursor = 'default'
        }
      } else {
        this.canvas.style.cursor = 'default'
      }
    }
  }

  focusCameraOnPlanet (planetKey) {
    const planet = this.planets.get(planetKey)
    if (!planet) return

    // Calculate camera position to focus on the planet
    const planetPosition = planet.position
    const distance = Math.max(20, planetPosition.length() * 0.3) // 30% of planet's distance from Sun

    // Set camera to look at the planet
    this.camera.target = planetPosition
    this.camera.radius = distance

    // Don't enable follow mode - let user control camera
    this.followMode = false
    this.followTarget = null

    console.log(
      `Focused camera on ${planetKey} at position:`,
      planetPosition.toString()
    )
  }

  // Method to focus on Jupiter specifically
  focusOnJupiter () {
    this.focusCameraOnPlanet('jupiter')
  }

  focusCameraOnAsteroid (asteroidMesh) {
    if (!asteroidMesh) return

    // Calculate camera position to focus on the asteroid
    const asteroidPosition = asteroidMesh.position
    const distance = Math.max(20, asteroidPosition.length() * 0.3) // 30% of asteroid's distance from Sun

    // Set camera to look at the asteroid
    this.camera.target = asteroidPosition
    this.camera.radius = distance

    // Don't enable follow mode - let user control camera
    this.followMode = false
    this.followTarget = null

    console.log(
      'Focused camera on asteroid at position:',
      asteroidPosition.toString()
    )
  }

  handleAsteroidClick (asteroid) {
    // Show asteroid info modal
    this.uiManager.showAsteroidInfo(asteroid)

    // Focus camera on asteroid
    this.focusCameraOnAsteroid(asteroid)
  }

  hideAsteroidOrbitalPath () {
    // No orbital paths for now
  }

  showAsteroidOrbitalPath (_asteroid) {
    // No orbital paths for now
  }
}
