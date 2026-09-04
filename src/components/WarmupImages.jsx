import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import {
  getAssetKey,
  uniqueAssets,
} from '../assets/preloadManifest';
import {
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
  const resolvedBatchSize = Platform.OS === 'android'
    ? Math.min(batchSize, 8)
    : batchSize;
  const batchIntervalMs = Platform.OS === 'android' ? 32 : 16;

  useEffect(() => {
    readyKeysRef.current = new Set();
    readyCalledRef.current = false;
    setBatchLimit(resolvedBatchSize);
  }, [keySignature, resolvedBatchSize, stableAssets]);

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

        return Math.min(stableAssets.length, current + resolvedBatchSize);
      });
    }, batchIntervalMs);

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
  }, [active, batchIntervalMs, onReady, resolvedBatchSize, stableAssets, timeoutMs]);

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
      {stableAssets.slice(0, batchLimit).map((source, index) => (
        <Image
          key={`${getAssetKey(source)}:${index}`}
          source={source}
          resizeMode="contain"
          fadeDuration={0}
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
    left: -10000,
    top: -10000,
    width: 128,
    height: 128,
    opacity: 0,
    overflow: 'hidden',
    zIndex: 0,
    elevation: 0,
  },
  image: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default memo(WarmupImages);
