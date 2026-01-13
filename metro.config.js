const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to use classic resolution for legacy paths
// This is required for the /legacy import to work correctly in SDK 54
config.resolver.unstable_enablePackageExports = false;

// REMOVED: The extraNodeModules block is no longer needed and was causing the crash
// config.resolver.extraNodeModules = { ... }

module.exports = config;