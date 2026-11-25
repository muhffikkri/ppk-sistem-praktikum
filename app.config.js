const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = () => {
  const config = { ...appJson.expo };

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

  return { expo: config };
};
