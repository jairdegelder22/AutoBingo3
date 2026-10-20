import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Asset } from 'expo-asset';
import { getResponsiveMetrics } from '../utils/responsive';

const POPUP_PANEL_IMAGE = require('../../assets/images/ui/popups/popup-menu-panel.png');
const POPUP_PANEL_ASPECT_RATIO = 1402 / 1122;
let popupPanelAssetLoaded = false;
let popupPanelAssetPromise = null;

function preloadPopupPanelAsset() {
  if (popupPanelAssetLoaded) {
    return Promise.resolve();
  }

  if (!popupPanelAssetPromise) {
    popupPanelAssetPromise = Asset.loadAsync(POPUP_PANEL_IMAGE).then(() => {
      popupPanelAssetLoaded = true;
    });
  }

  return popupPanelAssetPromise;
}

export default function PopupPanel({
  title,
  children,
  actions,
  actionsStyle,
  fontFamily,
  compact = false,
  style,
}) {
  const { width, height } = useWindowDimensions();
  const metrics = getResponsiveMetrics(width, height);
  const { isTablet, tabletScale } = metrics;
  const popupTextScale = isTablet ? Math.min(tabletScale, 1.28) : metrics.fontScale;
  const maxPanelWidth = compact
    ? metrics.s(380, 320, isTablet ? 590 : 380)
    : metrics.s(430, 340, isTablet ? 680 : 430);
  const [assetReady, setAssetReady] = useState(popupPanelAssetLoaded);
  const [imageReady, setImageReady] = useState(false);
  const contentReady = assetReady && imageReady;

  useEffect(() => {
    let mounted = true;

    preloadPopupPanelAsset().then(() => {
      if (mounted) {
        setAssetReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ImageBackground
      source={POPUP_PANEL_IMAGE}
      resizeMode="contain"
      onLoad={() => setImageReady(true)}
      style={[
        styles.panel,
        compact && styles.panelCompact,
        { maxWidth: maxPanelWidth },
        style,
      ]}
      imageStyle={styles.panelImage}
    >
      <View
        pointerEvents={contentReady ? 'auto' : 'none'}
        style={[
          styles.content,
          compact && styles.contentCompact,
          !contentReady && styles.contentHidden,
        ]}
      >
        {title ? (
          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
              isTablet && {
                fontSize: (compact ? 32 : 38) * popupTextScale,
                lineHeight: (compact ? 39 : 46) * popupTextScale,
                marginBottom: metrics.s(18),
              },
              { fontFamily },
            ]}
          >
            {title}
          </Text>
        ) : null}
        {typeof children === 'string' ? (
          <Text
            style={[
              styles.message,
              compact && styles.messageCompact,
              isTablet && {
                fontSize: (compact ? 22 : 25) * popupTextScale,
                lineHeight: (compact ? 30 : 34) * popupTextScale,
              },
              { fontFamily },
            ]}
          >
            {children}
          </Text>
        ) : children}
        {actions ? (
          <View
            style={[
              styles.actions,
              isTablet && {
                marginTop: metrics.s(32),
                transform: [{ translateY: metrics.s(20) }],
              },
              actionsStyle,
            ]}
          >
            {actions}
          </View>
        ) : null}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    maxWidth: 430,
    aspectRatio: POPUP_PANEL_ASPECT_RATIO,
  },
  panelCompact: {
    maxWidth: 380,
  },
  panelImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '13%',
    paddingTop: '12%',
    paddingBottom: '10%',
  },
  contentCompact: {
    paddingHorizontal: '14%',
    paddingTop: '12%',
    paddingBottom: '10%',
  },
  contentHidden: {
    opacity: 0,
  },
  title: {
    fontSize: 27,
    lineHeight: 32,
    color: '#17364A',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 29,
  },
  message: {
    fontSize: 17,
    lineHeight: 23,
    color: '#315266',
    textAlign: 'center',
  },
  messageCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
  },
});
