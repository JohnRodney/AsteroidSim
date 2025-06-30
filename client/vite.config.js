import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "@babylonjs/core",
      "@babylonjs/gui",
      "@babylonjs/loaders",
      "@babylonjs/materials",
    ],
  },
});
