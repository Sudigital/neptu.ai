import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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
  ],
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["@solana-program/memo", "@privy-io/react-auth"],
  },
  build: {
    chunkSizeWarningLimit: 2500, // Suppress warning for large chunks (Privy, Solana libs)
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress annotation warnings from Privy library
        if (
          warning.code === "INVALID_ANNOTATION" &&
          warning.message.includes("@privy-io")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
