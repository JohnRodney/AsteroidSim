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
    this.scene.autoClear = false
    this.scene.autoClearDepthAndStencil = false
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
