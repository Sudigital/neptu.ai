import eslintConfig from "@neptu/eslint-config/index.js";

export default [
  {
    ignores: ["**/.wrangler/**", "**/dist/**"],
  },
  ...eslintConfig,
];
