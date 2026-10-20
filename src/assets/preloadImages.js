import { Image, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { getAssetKey, uniqueAssets } from './preloadManifest';

const preloadedImageAssetKeys = new Set();
const preloadPromises = new Map();
const ASSET_LOAD_BATCH_SIZE = Platform.OS === 'android' ? 12 : 48;

export function isImageAssetPreloaded(source) {
  return preloadedImageAssetKeys.has(getAssetKey(source));
}

export function markImageAssetPreloaded(source) {
  preloadedImageAssetKeys.add(getAssetKey(source));
}

function waitForNextPreloadBatch() {
  return new Promise((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 16 : 0));
}

async function loadAssetBatches(assets) {
  const loadedAssets = [];

  for (let index = 0; index < assets.length; index += ASSET_LOAD_BATCH_SIZE) {
    const batch = assets.slice(index, index + ASSET_LOAD_BATCH_SIZE);
    loadedAssets.push(...await Asset.loadAsync(batch));

    if (index + ASSET_LOAD_BATCH_SIZE < assets.length) {
      await waitForNextPreloadBatch();
    }
  }

  return loadedAssets;
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
      loadAssetBatches(uniquePendingAssets)
        .then((loadedAssets) => Promise.all(
          loadedAssets
            .map((asset) => asset.localUri ?? asset.uri)
            .filter(Boolean)
            .filter(() => Platform.OS !== 'android')
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
