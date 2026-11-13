// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const reactNativePlugin = require('eslint-plugin-react-native');

module.exports = defineConfig([
  { ignores: ['dist/**', '.expo/**', 'node_modules/**'] },
  expoConfig,
  prettierConfig,
  {
    plugins: {
      'react-native': reactNativePlugin,
    },
    rules: {
      'react-native/no-raw-text': 'error',
    },
  },
]);
