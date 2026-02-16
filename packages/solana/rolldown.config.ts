import { defineConfig } from "rolldown";

export default defineConfig({
  input: {
    index: "src/index.ts",
    client: "src/client.ts",
    "token/index": "src/token/index.ts",
  },
  external: (id) =>
    !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("src"),
  output: { dir: "dist", format: "esm" },
});
