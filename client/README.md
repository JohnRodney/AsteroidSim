# Asteroid Belt Simulator - Frontend

This is the frontend component of the Asteroid Belt Simulator, built with Babylon.js for high-performance 3D rendering and real-time visualization of asteroid data.

## Features

- **3D Visualization**: Real-time rendering of asteroid belt using Babylon.js
- **Interactive Camera**: Arc-rotate camera with zoom, pan, and orbit controls
- **Real-time Updates**: WebSocket connection for live asteroid position updates
- **Performance Optimized**: Instanced rendering for thousands of asteroids
- **Responsive UI**: Modern interface with real-time statistics and controls
- **Time Control**: Adjustable simulation speed and pause/resume functionality

## Technology Stack

- **Babylon.js 6.47**: 3D rendering engine optimized for web browsers
- **Vite**: Fast build tool and development server
- **WebSocket**: Real-time communication with backend
- **ES6 Modules**: Modern JavaScript with import/export syntax

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── AsteroidSimulator.js    # Main 3D simulation engine
│   │   └── UIManager.js            # User interface management
│   ├── services/
│   │   └── WebSocketService.js     # Real-time communication
│   ├── utils/                      # Utility functions
│   ├── assets/                     # 3D models, textures, etc.
│   └── main.js                     # Application entry point
├── __tests__/                      # Test files
├── index.html                      # Main HTML file
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
└── README.md                       # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser with WebGL support

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Key Components

#### AsteroidSimulator

The core 3D rendering engine that:

- Manages the Babylon.js scene, camera, and lighting
- Handles asteroid instancing for performance
- Updates asteroid positions in real-time
- Provides camera controls and scene optimization

#### UIManager

Handles all user interface elements:

- Loading screens and error notifications
- Real-time statistics display
- Asteroid information panels
- Data formatting utilities

#### WebSocketService

Manages real-time communication:

- Connects to backend WebSocket server
- Handles automatic reconnection
- Processes incoming asteroid data
- Sends user commands to backend

### 3D Scene Features

- **Sun**: Central light source with emissive material
- **Asteroid Belt**: Visual ring representation
- **Asteroid Types**: C-type (dark), S-type (stony), M-type (metallic)
- **Instanced Rendering**: Efficient rendering of thousands of objects
- **Camera Controls**: Intuitive orbital navigation
- **Performance Monitoring**: Real-time FPS and statistics

### Asteroid Visualization

Asteroids are categorized by composition type with distinct visual characteristics:

- **C-type (Carbonaceous)**: Dark brown/black, low density (1.38 g/cm³)
- **S-type (Silicate)**: Light gray/brown, medium density (2.71 g/cm³)
- **M-type (Metallic)**: Metallic gray, high density (5.32 g/cm³)

### Performance Optimizations

- **Instanced Meshes**: Single draw calls for multiple asteroids
- **Level of Detail**: Simplified rendering for distant objects
- **Scene Freezing**: Optimized for static elements
- **Efficient Updates**: Minimal GPU state changes

## Testing

The project includes comprehensive tests for:

- UI formatting utilities
- WebSocket communication
- Component initialization
- Error handling

Run tests with:

```bash
npm test
```

## Configuration

### Vite Configuration

The `vite.config.js` includes:

- Development server proxy for API calls
- WebSocket proxy for real-time data
- Optimized dependency pre-bundling
- Source maps for debugging

### Environment Variables

- `VITE_API_URL`: Backend API URL (defaults to localhost:5000)
- `VITE_WS_URL`: WebSocket URL (defaults to localhost:5000/ws)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL 2.0 support for optimal performance.

## Contributing

1. Follow the existing code style (ESLint configuration)
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## Troubleshooting

### Common Issues

**WebGL not supported**: Check browser WebGL support at `webglreport.com`

**Performance issues**:

- Reduce asteroid count in development
- Check browser console for warnings
- Ensure hardware acceleration is enabled

**WebSocket connection fails**:

- Verify backend server is running
- Check network connectivity
- Review browser console for errors

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'asteroid-simulator'` in browser console.

## License

MIT License - see main project README for details.
