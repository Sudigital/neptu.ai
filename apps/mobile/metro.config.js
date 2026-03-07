const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve packages from monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Force single copies of critical packages (root node_modules = react 19.1.0)
const rootModules = path.resolve(monorepoRoot, "node_modules");
config.resolver.extraNodeModules = {
  react: path.resolve(rootModules, "react"),
  "react-native": path.resolve(rootModules, "react-native"),
  "react-native-reanimated": path.resolve(
    rootModules,
    "react-native-reanimated"
  ),
};

// Block web/expo duplicate react from being crawled into mobile bundle
config.resolver.blockList = [
  /apps\/web\/node_modules\/react\/.*/,
  /apps\/web\/node_modules\/react-dom\/.*/,
  /@expo\/cli\/static\/canary-full\/node_modules\/react\/.*/,
];

module.exports = config;
