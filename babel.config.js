module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo automatically adds the react-native-worklets (Reanimated) plugin.
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@features': './src/features',
            '@shared': './src/shared',
            '@navigation': './src/navigation',
            '@assets': './assets',
          },
        },
      ],
    ],
    env: {
      production: {
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
      },
    },
  };
};
