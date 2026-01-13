const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable unstable package exports support
config.resolver.unstable_enablePackageExports = true;

module.exports = config;