module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // NOTE: This must be last!
      'react-native-reanimated/plugin',
    ],
  };
};