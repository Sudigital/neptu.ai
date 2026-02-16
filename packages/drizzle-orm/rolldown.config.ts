import { defineConfig } from "rolldown";

export default defineConfig({
  input: {
    index: "src/index.ts",
    "schemas/index": "src/schemas/index.ts",
    "repositories/index": "src/repositories/index.ts",
    "services/index": "src/services/index.ts",
  },
  external: (id) =>
    !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("src"),
  output: { dir: "dist", format: "esm" },
});
