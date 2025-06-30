import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  ArcRotateCamera,
  MeshBuilder,
  StandardMaterial,
  Color3
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
    this.isPaused = false
    this.timeSpeed = 1.0
    this.stats = {
      fps: 0,
      asteroidCount: 0,
      totalMass: 0
    }
    this.frameCount = 0
    this.lastTime = 0
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

    // Create asteroid belt representation
    this.createAsteroidBelt()

    // Setup scene optimizations
    this.setupOptimizations()

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize()
    })

    console.log('3D scene initialized successfully')
  }

  async loadRealAsteroidData () {
    try {
      console.log('🔄 Loading real asteroid data from backend...')

      // Fetch asteroid data from backend
      const response = await fetch(
        'http://localhost:3001/api/asteroids?limit=100'
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

    // Calculate position from orbital elements
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

    asteroidData.instances.push(instance)
    asteroidData.count++

    this.stats.asteroidCount++

    // Update total mass if available
    if (physical.mass) {
      this.stats.totalMass += parseFloat(physical.mass)
    }
  }

  calculateAsteroidPosition (orbital) {
    // Simplified position calculation based on orbital elements
    // In a real implementation, this would use proper orbital mechanics

    const a = parseFloat(orbital.a) || 2.5 // Semi-major axis in AU
    const e = parseFloat(orbital.e) || 0.1 // Eccentricity
    const i = parseFloat(orbital.i) || 0 // Inclination
    const omega = parseFloat(orbital.om) || 0 // Longitude of ascending node
    const w = parseFloat(orbital.w) || 0 // Argument of pericenter
    const M = parseFloat(orbital.ma) || 0 // Mean anomaly

    // Convert AU to scene units (1 AU = 50 scene units)
    const sceneScale = 50

    // Simplified position calculation
    const radius = a * sceneScale * (1 - e * Math.cos(M))
    const angle = M + w + omega

    const x = radius * Math.cos(angle) * Math.cos(i)
    const z = radius * Math.sin(angle) * Math.cos(i)
    const y = radius * Math.sin(i)

    return new Vector3(x, y, z)
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
    this.camera.upperRadiusLimit = 1000
    this.camera.lowerBetaLimit = 0.1
    this.camera.upperBetaLimit = Math.PI - 0.1
    this.camera.wheelDeltaPercentage = 0.01
    this.camera.panningSensibility = 1000
    this.camera.attachControl(this.canvas, true)

    // Set initial camera position for asteroid belt view
    this.camera.setPosition(new Vector3(0, 50, 100))
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

  createAsteroidBelt () {
    // Create a visual representation of the asteroid belt
    // This will be replaced with actual asteroid data later

    // Create belt ring for visual reference
    const beltRing = MeshBuilder.CreateTorus(
      'beltRing',
      {
        diameter: 200,
        thickness: 0.5,
        tessellation: 100
      },
      this.scene
    )

    const beltMaterial = new StandardMaterial('beltMaterial', this.scene)
    beltMaterial.emissiveColor = new Color3(0.2, 0.2, 0.3)
    beltMaterial.alpha = 0.3
    beltRing.material = beltMaterial

    // Create some placeholder asteroids for testing
    this.createPlaceholderAsteroids()
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
    // Update asteroid positions based on time
    const deltaTime = (this.engine.getDeltaTime() * this.timeSpeed) / 1000

    // Rotate asteroids around the sun
    this.asteroidInstances.forEach((asteroidData) => {
      asteroidData.instances.forEach((instance) => {
        const angle = deltaTime * 0.1 // Slow rotation
        const radius = instance.position.length()
        const currentAngle = Math.atan2(
          instance.position.z,
          instance.position.x
        )
        const newAngle = currentAngle + angle

        instance.position.x = Math.cos(newAngle) * radius
        instance.position.z = Math.sin(newAngle) * radius

        // Add some rotation to the asteroid itself
        instance.rotate(Vector3.Up(), deltaTime * 0.5)
      })
    })
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
    this.camera.setPosition(new Vector3(0, 50, 100))
    this.camera.setTarget(Vector3.Zero())
  }

  getStats () {
    return { ...this.stats }
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
}
