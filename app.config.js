const fs = require('fs');
const path = require('path');

/**
 * Android size options. The minify/shrink flags only apply to release
 * variants (preview, production); the development client is a debug build.
 */
function androidBuildProperties() {
  const props = {
    // R8: strip and shorten unused Java/Kotlin code.
    enableMinifyInReleaseBuilds: true,
    // Drop resources R8 proves unused. Requires minify.
    enableShrinkResourcesInReleaseBuilds: true,
  };

  // The preview profile ships a universal APK for internal installs, which
  // carries native libraries for every ABI. Real phones are ARM, so leave out
  // the x86 emulator ABIs there. Development keeps every ABI for emulators,
  // and production is an app bundle that Play already splits per device.
  if (process.env.EAS_BUILD_PROFILE === 'preview') {
    props.buildArchs = ['arm64-v8a', 'armeabi-v7a'];
  }

  return props;
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config: staticConfig }) => {
  // `staticConfig` is the `expo` object from app.json.
  const config = { ...staticConfig };

  // EAS file secret: GOOGLE_SERVICES_JSON is a file path on build runners.
  const secretPath = process.env.GOOGLE_SERVICES_JSON;
  const localPath = path.join(__dirname, 'google-services.json');
  config.android = { ...config.android };
  config.android.googleServicesFile =
    secretPath && fs.existsSync(secretPath)
      ? secretPath
      : fs.existsSync(localPath)
        ? localPath
        : config.android.googleServicesFile;

  config.plugins = [
    ...(config.plugins ?? []),
    ['expo-build-properties', { android: androidBuildProperties() }],
  ];

  return config;
};
