import path from "path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";

// Chunk size warning threshold (in KB)
const CHUNK_SIZE_WARNING_LIMIT = 8000;

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["images/logo.svg", "apple-touch-icon.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB
      },
      manifest: {
        name: "Neptu — Balinese Astrology AI",
        short_name: "Neptu",
        description:
          "Discover your cosmic potential with ancient Balinese astrology powered by AI on Solana.",
        theme_color: "#7c3aed",
        background_color: "#0a0a0b",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "@wallet-standard/app",
      "@wallet-standard/base",
      "@wallet-standard/features",
      "@wallet-standard/wallet",
      "@solana/wallet-standard-features",
    ],
  },
  optimizeDeps: {
    include: [
      "@solana-program/memo",
      "@wallet-standard/app",
      "@wallet-standard/base",
      "@wallet-standard/features",
      "@wallet-standard/wallet",
      "@solana/wallet-standard-features",
    ],
  },
  esbuild: false,
  build: {
    chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT,
  },
});
