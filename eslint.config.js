// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const reactNativePlugin = require('eslint-plugin-react-native');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    plugins: {
      'react-native': reactNativePlugin,
    },
    ignores: ['dist/*', '.expo/*'],
    rules: {
      'react-native/no-raw-text': 'error',
    },
  },
]);
