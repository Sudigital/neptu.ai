import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.ts",
  platform: "node",
  external: /^[^./]/,
  tsconfig: "tsconfig.json",
  output: {
    dir: "dist",
    format: "esm",
    cleanDir: true,
  },
});
