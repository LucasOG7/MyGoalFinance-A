module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],     // ✅ ya incluye lo necesario para expo-router
    plugins: [
      ['module-resolver', { alias: { '@': './' } }], // si usas alias '@/'
      // 'react-native-reanimated/plugin'             // si usas Reanimated, debe ir al final
    ],
  };
};
