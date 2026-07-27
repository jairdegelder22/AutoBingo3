const appJson = require('./app.json');

const TEST_ANDROID_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const DEFAULT_ANDROID_ADMOB_APP_ID = 'ca-app-pub-5873918058071695~4181685485';
const DEFAULT_IOS_ADMOB_APP_ID = 'ca-app-pub-5873918058071695~2488958739';

const useRealAds = process.env.EXPO_PUBLIC_ADMOB_USE_REAL_ADS === 'true';
const androidAdMobAppId =
  useRealAds
    ? process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? DEFAULT_ANDROID_ADMOB_APP_ID
    : TEST_ANDROID_ADMOB_APP_ID;
const iosAdMobAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? DEFAULT_IOS_ADMOB_APP_ID;

function withGoogleMobileAdsPlugin(plugins = []) {
  return plugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads') {
      return [
        'react-native-google-mobile-ads',
        {
          ...plugin[1],
          androidAppId: androidAdMobAppId,
          iosAppId: iosAdMobAppId,
        },
      ];
    }

    return plugin;
  });
}

module.exports = () => {
  const expo = appJson.expo;

  return {
    ...expo,
    plugins: withGoogleMobileAdsPlugin(expo.plugins),
    'react-native-google-mobile-ads': {
      ...expo['react-native-google-mobile-ads'],
      android_app_id: androidAdMobAppId,
      ios_app_id: iosAdMobAppId,
    },
  };
};
