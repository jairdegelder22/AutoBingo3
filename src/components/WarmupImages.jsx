import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  getAssetKey,
  uniqueAssets,
} from '../assets/preloadManifest';
import {
  isImageAssetPreloaded,
  markImageAssetPreloaded,
  preloadImageAssets,
} from '../assets/preloadImages';

function WarmupImages({
  assets = [],
  active = true,
  onReady,
  timeoutMs = null,
  batchSize = 24,
  imageSize = 96,
}) {
  const [batchLimit, setBatchLimit] = useState(batchSize);
  const readyKeysRef = useRef(new Set());
  const readyCalledRef = useRef(false);
  const stableAssets = useMemo(() => uniqueAssets(assets), [assets]);
  const assetKeys = useMemo(() => stableAssets.map(getAssetKey), [stableAssets]);
  const keySignature = assetKeys.join('|');

  useEffect(() => {
    readyKeysRef.current = new Set(
      stableAssets
        .filter(isImageAssetPreloaded)
        .map(getAssetKey)
    );
    readyCalledRef.current = false;
    setBatchLimit(batchSize);
  }, [batchSize, keySignature, stableAssets]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let cancelled = false;

    preloadImageAssets(stableAssets).catch(() => {});

    const batchTimer = setInterval(() => {
      setBatchLimit((current) => {
        if (current >= stableAssets.length) {
          clearInterval(batchTimer);
          return current;
        }

        return Math.min(stableAssets.length, current + batchSize);
      });
    }, 16);

    const fallbackTimer = typeof timeoutMs === 'number'
      ? setTimeout(() => {
          if (!cancelled && !readyCalledRef.current) {
            readyCalledRef.current = true;
            onReady?.();
          }
        }, timeoutMs)
      : null;

    if (!stableAssets.length && !readyCalledRef.current) {
      readyCalledRef.current = true;
      onReady?.();
    }

    return () => {
      cancelled = true;
      clearInterval(batchTimer);
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [active, batchSize, onReady, stableAssets, timeoutMs]);

  function markReady(source) {
    const key = getAssetKey(source);
    readyKeysRef.current.add(key);
    markImageAssetPreloaded(source);

    if (
      readyKeysRef.current.size >= stableAssets.length
      && !readyCalledRef.current
    ) {
      readyCalledRef.current = true;
      onReady?.();
    }
  }

  if (!active || !stableAssets.length) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      {stableAssets.slice(0, batchLimit).map((source) => (
        <Image
          key={getAssetKey(source)}
          source={source}
          resizeMode="contain"
          fadeDuration={0}
          onLoad={() => markReady(source)}
          onLoadEnd={() => markReady(source)}
          onError={() => markReady(source)}
          style={[
            styles.image,
            {
              width: imageSize,
              height: imageSize,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 96,
    height: 96,
    opacity: 0.01,
    overflow: 'hidden',
    zIndex: 0,
  },
  image: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default memo(WarmupImages);
