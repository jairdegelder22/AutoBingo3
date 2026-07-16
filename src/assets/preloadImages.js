import { Image } from 'react-native';
import { Asset } from 'expo-asset';
import { getAssetKey, uniqueAssets } from './preloadManifest';

const preloadedImageAssetKeys = new Set();
const preloadPromises = new Map();

export function isImageAssetPreloaded(source) {
  return preloadedImageAssetKeys.has(getAssetKey(source));
}

export function markImageAssetPreloaded(source) {
  preloadedImageAssetKeys.add(getAssetKey(source));
}

export async function preloadImageAssets(assets) {
  const uniquePendingAssets = uniqueAssets(assets)
    .filter((asset) => !isImageAssetPreloaded(asset));

  if (!uniquePendingAssets.length) {
    return;
  }

  const preloadKey = uniquePendingAssets.map(getAssetKey).join('|');

  if (!preloadPromises.has(preloadKey)) {
    preloadPromises.set(
      preloadKey,
      Asset.loadAsync(uniquePendingAssets)
        .then((loadedAssets) => Promise.all(
          loadedAssets
            .map((asset) => asset.localUri ?? asset.uri)
            .filter(Boolean)
            .map((uri) => Image.prefetch(uri).catch(() => false))
        ))
        .then(() => {
          uniquePendingAssets.forEach(markImageAssetPreloaded);
        })
        .finally(() => {
          preloadPromises.delete(preloadKey);
        })
    );
  }

  await preloadPromises.get(preloadKey);
}
