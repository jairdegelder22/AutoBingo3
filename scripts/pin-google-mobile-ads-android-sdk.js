const fs = require('fs');
const path = require('path');

const PACKAGE_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-google-mobile-ads',
  'package.json',
);
const ANDROID_MODULE_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-google-mobile-ads',
  'android',
  'src',
  'main',
  'java',
  'io',
  'invertase',
  'googlemobileads',
  'ReactNativeGoogleMobileAdsModule.kt',
);
const ANDROID_COMMON_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-google-mobile-ads',
  'android',
  'src',
  'main',
  'java',
  'io',
  'invertase',
  'googlemobileads',
  'ReactNativeGoogleMobileAdsCommon.java',
);
const PINNED_ANDROID_GOOGLE_MOBILE_ADS_VERSION = '24.8.0';

if (!fs.existsSync(PACKAGE_PATH)) {
  process.exit(0);
}

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));

if (!packageJson.sdkVersions?.android?.googleMobileAds) {
  process.exit(0);
}

packageJson.sdkVersions.android.googleMobileAds = PINNED_ANDROID_GOOGLE_MOBILE_ADS_VERSION;
fs.writeFileSync(PACKAGE_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(
  `Pinned react-native-google-mobile-ads Android Google Mobile Ads SDK to ${PINNED_ANDROID_GOOGLE_MOBILE_ADS_VERSION}`,
);

if (fs.existsSync(ANDROID_MODULE_PATH)) {
  let moduleSource = fs.readFileSync(ANDROID_MODULE_PATH, 'utf8');
  moduleSource = moduleSource.replace(
    "import com.google.android.gms.ads.AgeRestrictedTreatment\n",
    '',
  );
  moduleSource = moduleSource.replace(
    /\n    if \(requestConfiguration\.hasKey\("ageRestrictedTreatment"\)\) \{[\s\S]*?\n    \}\n(?=\n    if \(requestConfiguration\.hasKey\("tagForChildDirectedTreatment"\)\))/,
    '',
  );
  fs.writeFileSync(ANDROID_MODULE_PATH, moduleSource);
  console.log('Removed Android ageRestrictedTreatment calls for Google Mobile Ads SDK 24.x');
}

if (fs.existsSync(ANDROID_COMMON_PATH)) {
  let commonSource = fs.readFileSync(ANDROID_COMMON_PATH, 'utf8');
  commonSource = commonSource.replace(
    /      if \("LARGE_ANCHORED_ADAPTIVE_BANNER"\.equals\(preDefinedAdSize\)\) \{\n        return AdSize\.getLargeAnchoredAdaptiveBannerAdSize\(reactViewGroup\.getContext\(\), adWidth\);\n      \}\n/,
    '',
  );
  fs.writeFileSync(ANDROID_COMMON_PATH, commonSource);
  console.log('Removed Android large anchored adaptive banner call for Google Mobile Ads SDK 24.x');
}
