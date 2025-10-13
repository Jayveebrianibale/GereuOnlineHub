const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg',
  // Fonts
  'ttf', 'otf', 'woff', 'woff2',
  // Other assets
  'mp3', 'mp4', 'wav', 'aac', 'm4a'
);

// Add support for source maps
config.serializer.customSerializer = require('metro/src/DeltaBundler/Serializers/baseJSBundle').baseJSBundle;

module.exports = config;
