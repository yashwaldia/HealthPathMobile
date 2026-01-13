const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// DISABLE package exports - fixes expo-file-system/legacy resolution
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
