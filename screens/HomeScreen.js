import { BackHandler, Animated, Easing, Image, ImageBackground, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import * as Haptics from '../src/settings/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import CircularReveal from '../components/CircularReveal';
import AnimatedBackButton from '../src/components/AnimatedBackButton';
import GlossyButton from '../src/components/GlossyButton';
import PopupPanel from '../src/components/PopupPanel';
import ThemeCarousel from '../src/components/ThemeCarousel';
import { PLAYER_FUTURE_SKIN_IMAGE, PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import { getThemeCardImage, getThemeDetailBackgroundImage, THEME_LOCK_OVERLAY_OVERVIEW_IMAGE } from '../assets/images/theme-cards/themeCardImages';
import { createGameConfig, DEFAULT_ZICHTBAARHEID, SKIN_OPTIONS } from './gameFlowConfig';
import { THEMES } from './themeCatalog';
import { getThemeIcons } from './themeIcons';
import { decodeLobbyCode, normalizeLobbyCode } from '../src/utils/lobbyCode';
import { checkOnlineConnection, getLobbySnapshot } from '../src/services/liveLobbyService';
import PremiumPaywallModal from '../src/premium/PremiumPaywallModal';
import { usePremium } from '../src/premium/PremiumContext';
import { getResponsiveMetrics } from '../src/utils/responsive';

const PLAY_BUTTON_IMAGE = require('../assets/images/home-online-button.png');
const ONLINE_YELLOW_CAR = require('../assets/images/online-car-yellow.png');
const ONLINE_BLUE_CAR = require('../assets/images/online-car-blue.png');
const ONLINE_GREEN_CAR = require('../assets/images/online-car-green.png');
const HOST_LOCK_CHAINS_IMAGE = require('../assets/images/host-lock-chains.png');
const HOST_LOCK_PADLOCK_IMAGE = require('../assets/images/host-lock-padlock.png');
const JOIN_LICENSE_PLATE_IMAGE = require('../assets/images/license-plates/dutch-join-plate-cropped.png');
const MAIN_MENU_PREMIUM_CROWN_IMAGE = require('../assets/images/premium/main-menu-premium-crown.png');
const SKIN_ROAD_BACKGROUND = require('../assets/images/backgrounds/skin-road-background.png');
const THEME_ROAD_BACKGROUND = require('../assets/images/backgrounds/theme-road-scroll-background-v4.png');
const PLAYER_POLITIE_IMAGE = require('../assets/images/players/player-politie.png');
const PLAYER_BRANDWEER_IMAGE = require('../assets/images/players/player-brandweer.png');
const PLAYER_AMBULANCE_IMAGE = require('../assets/images/players/player-ambulance.png');
const PLAYER_TAXI_IMAGE = require('../assets/images/players/player-taxi.png');
const PLAYER_HARTJES_IMAGE = require('../assets/images/players/player-hartjes.png');
const PLAYER_VLAMMEN_IMAGE = require('../assets/images/players/player-vlammen.png');
const PLAYER_GOUD_IMAGE = require('../assets/images/players/player-goud.png');
const PLAYER_ZILVER_IMAGE = require('../assets/images/players/player-zilver.png');
const PLAYER_BRONS_IMAGE = require('../assets/images/players/player-brons.png');
const PLAYER_KERST_IMAGE = require('../assets/images/players/player-kerst.png');
const PLAYER_KOE_IMAGE = require('../assets/images/players/player-koe.png');
const PLAYER_REGENBOOG_IMAGE = require('../assets/images/players/player-regenboog.png');
const PLAYER_HOND_IMAGE = require('../assets/images/players/player-hond.png');
const PLAYER_KAT_IMAGE = require('../assets/images/players/player-kat.png');
const CHALLENGE_SKIN_LOCK_IMAGE = require('../assets/images/players/challenge-skin-lock.png');
const NAV_ICON_IMAGES = {
  palette: {
    selected: require('../assets/images/nav-icons/nav-palette.png'),
    unselected: require('../assets/images/nav-icons/nav-palette.png'),
  },
  house: {
    selected: require('../assets/images/nav-icons/nav-home.png'),
    unselected: require('../assets/images/nav-icons/nav-home.png'),
  },
  checkerboard: {
    selected: require('../assets/images/nav-icons/nav-cards.png'),
    unselected: require('../assets/images/nav-icons/nav-cards.png'),
  },
};
const SKIN_ROAD_IMAGE_RATIO = 1920 / 819;
const SKIN_ROAD_REPEAT_COUNT = 2;
const SKIN_ROAD_ZOOM = 1.28;
const HOME_ACTION_HORIZONTAL_PADDING = 20;
const HOME_ACTION_GAP = 14;
const ONLINE_RED_GRADIENT = ['#f57070', '#e03030', '#c01818', '#9e0f0f'];
const ONLINE_RED_OUTLINE = '#6b0e0e';
const HOME_ACTION_COLLAPSED_HEIGHT = 122;
const HOME_ACTION_EXPANDED_HEIGHT = 236;
const ONLINE_CAR_JUMP_DELAYS = [0, 230, 460];
const SKIN_SHOP_TILE_IMAGE_WIDTH_RATIO = 1.38;
const SKIN_INSPECT_MOVING_IMAGE_WIDTH_RATIO = 1.32;
const SKIN_SHOP_TILE_IMAGE_HEIGHT = 140;
const SKIN_SHOP_CAR_BOB_DISTANCE = 6;
const SKIN_SHOP_CAR_BOB_DURATION = 1750;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const HOME_SCREEN_PRELOAD_ASSETS = [
  require('../assets/homepage.png'),
  require('../assets/logo.png'),
  PLAY_BUTTON_IMAGE,
  ONLINE_YELLOW_CAR,
  ONLINE_BLUE_CAR,
  ONLINE_GREEN_CAR,
  HOST_LOCK_CHAINS_IMAGE,
  HOST_LOCK_PADLOCK_IMAGE,
  JOIN_LICENSE_PLATE_IMAGE,
  MAIN_MENU_PREMIUM_CROWN_IMAGE,
  SKIN_ROAD_BACKGROUND,
  THEME_ROAD_BACKGROUND,
  THEME_LOCK_OVERLAY_OVERVIEW_IMAGE,
  PLAYER_POLITIE_IMAGE,
  PLAYER_BRANDWEER_IMAGE,
  PLAYER_AMBULANCE_IMAGE,
  PLAYER_TAXI_IMAGE,
  PLAYER_HARTJES_IMAGE,
  PLAYER_VLAMMEN_IMAGE,
  PLAYER_GOUD_IMAGE,
  PLAYER_ZILVER_IMAGE,
  PLAYER_BRONS_IMAGE,
  PLAYER_KERST_IMAGE,
  PLAYER_KOE_IMAGE,
  PLAYER_REGENBOOG_IMAGE,
  PLAYER_HOND_IMAGE,
  PLAYER_KAT_IMAGE,
  CHALLENGE_SKIN_LOCK_IMAGE,
  PLAYER_FUTURE_SKIN_IMAGE,
  ...Object.values(NAV_ICON_IMAGES).flatMap((variants) => Object.values(variants)),
  ...Object.values(PLAYER_IMAGES),
];
const HOME_TAB_HOME = 'home';
const HOME_TAB_SKINSHOP = 'skinshop';
const HOME_TAB_THEMECARDS = 'themecards';

const SKIN_LABELS = {
  rood: 'Rood',
  blauw: 'Blauw',
  groen: 'Groen',
  geel: 'Geel',
  oranje: 'Oranje',
  paars: 'Paars',
  roze: 'Roze',
  lichtblauw: 'Lichtblauw',
  zwart: 'Zwart',
  wit: 'Wit',
};

const NAV_ITEMS = [
  { key: HOME_TAB_SKINSHOP, label: 'Skinshop', icon: 'palette', accent: '#FF8C42' },
  { key: HOME_TAB_HOME, label: 'Home', icon: 'house', accent: '#C8F122', center: true },
  { key: HOME_TAB_THEMECARDS, label: 'Kaarten', icon: 'checkerboard', accent: '#F2C94C' },
];

const STANDARD_SKIN_SHOP_ITEMS = SKIN_OPTIONS.map((skin) => ({
  id: skin,
  label: SKIN_LABELS[skin] ?? skin,
  color: PLAYER_HEX[skin] ?? '#FFFFFF',
  image: PLAYER_IMAGES[skin],
  premium: false,
  unlockType: 'free',
}));

const CHALLENGE_SKIN_SHOP_ITEMS = [
  {
    id: 'politie',
    label: 'Politie',
    color: '#1A5EA8',
    image: PLAYER_POLITIE_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Speel 5 potjes in de modus Klassiek.',
  },
  {
    id: 'brandweer',
    label: 'Brandweer',
    color: '#E03030',
    image: PLAYER_BRANDWEER_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Maak een bingo binnen 10 minuten.',
  },
  {
    id: 'ambulance',
    label: 'Ambulance',
    color: '#E5F312',
    image: PLAYER_AMBULANCE_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Speel samen een online potje.',
  },
  {
    id: 'taxi',
    label: 'Taxi',
    color: '#F5C400',
    image: PLAYER_TAXI_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Join een online potje met een lobbycode.',
  },
  {
    id: 'hartjes',
    label: 'Hartjes',
    color: '#E8589E',
    image: PLAYER_HARTJES_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Speel 3 potjes samen op hetzelfde apparaat.',
  },
  {
    id: 'vlammen',
    label: 'Vlammen',
    color: '#E8622A',
    image: PLAYER_VLAMMEN_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Claim 8 vakjes in een potje Claim Bingo.',
  },
  {
    id: 'goud',
    label: 'Goud',
    color: '#D99A10',
    image: PLAYER_GOUD_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Win 10 potjes Auto Bingo.',
  },
  {
    id: 'zilver',
    label: 'Zilver',
    color: '#B9C0C7',
    image: PLAYER_ZILVER_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Win 5 potjes Auto Bingo.',
  },
  {
    id: 'brons',
    label: 'Brons',
    color: '#B66B32',
    image: PLAYER_BRONS_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Win je eerste potje Auto Bingo.',
  },
  {
    id: 'kerst',
    label: 'Kerst',
    color: '#E03030',
    image: PLAYER_KERST_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Speel een potje met het thema Winter.',
  },
  {
    id: 'koe',
    label: 'Koe',
    color: '#111111',
    image: PLAYER_KOE_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Speel 3 potjes met het thema Platteland.',
  },
  {
    id: 'regenboog',
    label: 'Regenboog',
    color: '#27BDEB',
    image: PLAYER_REGENBOOG_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Speel minstens 1 potje met 4 verschillende kleuren.',
  },
  {
    id: 'kat',
    label: 'Kat',
    color: '#E58218',
    image: PLAYER_KAT_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Speel 3 potjes met het thema Platteland.',
  },
  {
    id: 'hond',
    label: 'Hond',
    color: '#C76A1E',
    image: PLAYER_HOND_IMAGE,
    premium: false,
    unlockType: 'challenge',
    challenge: 'Win een potje met minstens 2 spelers.',
  },
];

const SKIN_SHOP_ITEMS = [
  ...STANDARD_SKIN_SHOP_ITEMS,
  ...CHALLENGE_SKIN_SHOP_ITEMS,
  {
    id: 'future-skin',
    label: 'Binnenkort',
    color: '#A8ADB4',
    image: PLAYER_FUTURE_SKIN_IMAGE,
    premium: false,
    unlockType: 'future',
  },
];

function isSkinShopItemUnlocked(item) {
  if (item.unlockType === 'future') {
    return false;
  }

  return item.unlockType !== 'challenge' || Boolean(item.unlocked);
}

function getSkinShopAnimationPhase(item, animationSeed, cycleMs) {
  const text = `${item?.id ?? 'skin'}-${animationSeed}`;
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % cycleMs;
  }

  return hash;
}

const THEME_SHOWCASE_ITEMS = THEMES.map((theme) => ({
  ...theme,
  previewImage: getThemeCardImage(theme.id),
  previewItems: theme.id === 'winter' ? [] : getThemeIcons(theme.id).slice(0, 10),
  itemCount: theme.id === 'winter' ? 0 : getThemeIcons(theme.id).length,
}));
const THEME_ROAD_ITEMS_PER_SEGMENT = 1;
const THEME_ROAD_NEXT_CARD_PEEK_RATIO = 0.07;
const THEME_ROAD_PAGE_COUNT = Math.ceil(THEME_SHOWCASE_ITEMS.length / THEME_ROAD_ITEMS_PER_SEGMENT);
const THEME_ROAD_TITLE_OUTLINE_OFFSETS = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
  [-1.5, -1.5],
  [1.5, -1.5],
  [-1.5, 1.5],
  [1.5, 1.5],
];

function hasEmbeddedThemeFrame(themeId) {
  return (
    themeId === 'snelweg'
    || themeId === 'stad'
    || themeId === 'platteland'
    || themeId === 'vakantie'
    || themeId === 'voertuigen'
    || themeId === 'winter'
    || themeId === 'verkeersborden'
  );
}

function getEmbeddedThemeTitleStyle(themeId) {
  const compactTitleStyle = themeId === 'verkeersborden'
    ? {
        fontSize: 18,
        lineHeight: 25,
      }
    : themeId === 'voertuigen'
    ? {
        fontSize: 22,
        lineHeight: 30,
      }
    : null;

  if (themeId === 'verkeersborden') {
    return {
      color: '#111111',
      ...compactTitleStyle,
      letterSpacing: 0.5,
      textShadowColor: 'rgba(255, 255, 255, 0.52)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    };
  }

  return {
    color: '#FFFFFF',
    ...compactTitleStyle,
    letterSpacing: 0.5,
    textShadowColor: '#15539D',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  };
}

function withAlpha(hexColor, alpha) {
  if (typeof hexColor !== 'string' || !hexColor.startsWith('#') || hexColor.length !== 7) {
    return hexColor;
  }

  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function HomeNavIcon({ icon, active, size = 60 }) {
  const source = NAV_ICON_IMAGES[icon]?.[active ? 'selected' : 'unselected']
    ?? NAV_ICON_IMAGES.house.unselected;
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[styles.homeNavIconImage, { width: size, height: size }]}
    />
  );
}

function HomeTabButton({ item, active, onPress, metrics }) {
  const iconWrapSize = metrics?.iconWrapSize ?? 60;
  const iconSize = metrics?.iconSize ?? 60;
  const minHeight = metrics?.navButtonHeight ?? 118;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.bottomNavButton,
        item.center && styles.bottomNavButtonCenter,
        active && styles.bottomNavButtonActive,
        item.center && active && styles.bottomNavButtonCenterActive,
      ]}
    >
      <View
        style={[
          styles.bottomNavButtonInner,
          item.center && styles.bottomNavButtonInnerCenter,
          {
            minHeight,
            paddingVertical: metrics?.navPaddingVertical ?? 16,
          },
        ]}
      >
        <View
          style={[
            styles.bottomNavIconWrap,
            {
              width: iconWrapSize,
              height: iconWrapSize,
            },
            active && styles.bottomNavIconWrapActive,
          ]}
        >
          <HomeNavIcon icon={item.icon} active={active} size={iconSize} />
        </View>
      </View>
    </Pressable>
  );
}

function SkinRoadBackground() {
  const { width } = useWindowDimensions();
  const imageWidth = width * SKIN_ROAD_ZOOM;
  const imageHeight = imageWidth * SKIN_ROAD_IMAGE_RATIO;
  const roadImages = Array.from({ length: SKIN_ROAD_REPEAT_COUNT }, (_, index) => index);

  return (
    <ScrollView
      style={styles.skinRoadScroll}
      contentContainerStyle={styles.skinRoadScrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {roadImages.map((imageIndex) => (
        <Image
          key={imageIndex}
          source={SKIN_ROAD_BACKGROUND}
          resizeMode="stretch"
          style={[
            styles.skinRoadImage,
            {
              width: imageWidth,
              height: imageHeight,
            },
          ]}
        />
      ))}
    </ScrollView>
  );
}

function ThemeRoadCard({ item, isLocked = false }) {
  const cardColor = item.cardOutline ?? item.cardBorder ?? item.bg;
  const cardChromeColor = isLocked ? withAlpha(cardColor, 0.42) : cardColor;
  const embeddedFrame = hasEmbeddedThemeFrame(item.id);
  const lockOpacity = useRef(new Animated.Value(isLocked ? 1 : 0)).current;
  const [lockMounted, setLockMounted] = useState(isLocked);

  useEffect(() => {
    lockOpacity.stopAnimation();

    if (isLocked) {
      setLockMounted(true);
      lockOpacity.setValue(1);
      return;
    }

    Animated.timing(lockOpacity, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setLockMounted(false);
      }
    });
  }, [isLocked, lockOpacity]);

  const lockLayer = lockMounted ? (
    <Animated.View
      pointerEvents="none"
      style={[styles.roadThemeCardLockLayer, { opacity: lockOpacity }]}
    >
      <View style={styles.roadThemeCardLockedDim} />
      <Image
        source={THEME_LOCK_OVERLAY_OVERVIEW_IMAGE}
        resizeMode="cover"
        fadeDuration={0}
        style={styles.roadThemeCardLockOverlay}
      />
    </Animated.View>
  ) : null;

  if (item.previewImage) {
    return (
      <View
        style={[
          styles.roadThemeCard,
          embeddedFrame
            ? styles.roadThemeCardEmbedded
            : {
                borderColor: cardChromeColor,
                shadowColor: cardChromeColor,
              },
        ]}
      >
        <ImageBackground
          source={item.previewImage}
          resizeMode={embeddedFrame ? 'stretch' : 'cover'}
          imageStyle={embeddedFrame ? styles.roadThemeCardImageEmbedded : null}
          style={[
            styles.roadThemeCardBody,
            embeddedFrame && styles.roadThemeCardBodyEmbedded,
          ]}
        >
          {lockLayer}
          {embeddedFrame ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={[
                styles.roadThemeCardTitle,
                styles.roadThemeCardTitleEmbedded,
                embeddedFrame && getEmbeddedThemeTitleStyle(item.id),
              ]}
            >
              {item.label}
            </Text>
          ) : null}
        </ImageBackground>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.roadThemeCard,
        {
          borderColor: cardChromeColor,
          shadowColor: cardChromeColor,
        },
      ]}
    >
      <LinearGradient
        colors={[item.cardSurface ?? item.bg, '#FFF7E8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.roadThemeCardBody}
      >
        {lockLayer}
        <Text style={styles.roadThemeCardTitle}>
          {item.label}
        </Text>
      </LinearGradient>
    </View>
  );
}

function ThemeRoadBackground({ isPremium = false, onScrollOffsetChange, onThemePress }) {
  const { height, width } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(width, height);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollOffsetRef = useRef(0);
  const stageHeight = height;
  const nextCardPeek = Math.min(isTablet ? 58 : 36, Math.max(isTablet ? 34 : 24, width * THEME_ROAD_NEXT_CARD_PEEK_RATIO));
  const topClearance = Math.max(isTablet ? 92 : 72, height * (isTablet ? 0.09 : 0.08));
  const bottomClearance = Math.max(isTablet ? 170 : 138, height * (isTablet ? 0.18 : 0.16));
  const availableCardHeight = height - topClearance - bottomClearance;
  const heightBoundCardWidth = availableCardHeight / 1.5;
  const cardWidth = Math.max(isTablet ? 310 : 220, Math.min(isTablet ? 430 : 320, width * (isTablet ? 0.58 : 0.72), heightBoundCardWidth));
  const cardHeight = cardWidth * 1.5;
  const cardTop = topClearance + (availableCardHeight - cardHeight) / 2;
  const centeredCardLeft = (width - cardWidth) / 2;
  const segmentWidth = width - centeredCardLeft - nextCardPeek;
  const stageWidth = (THEME_ROAD_PAGE_COUNT - 1) * segmentWidth + width;
  const roadPages = Array.from({ length: THEME_ROAD_PAGE_COUNT }, (_, pageIndex) => ({
    items: THEME_SHOWCASE_ITEMS.slice(
      pageIndex * THEME_ROAD_ITEMS_PER_SEGMENT,
      pageIndex * THEME_ROAD_ITEMS_PER_SEGMENT + THEME_ROAD_ITEMS_PER_SEGMENT
    ),
  }));

  return (
    <Animated.ScrollView
      horizontal
      bounces={false}
      showsHorizontalScrollIndicator={false}
      style={styles.themeRoadScroll}
      contentContainerStyle={styles.themeRoadScrollContent}
      decelerationRate="fast"
      snapToInterval={segmentWidth}
      snapToAlignment="start"
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
          useNativeDriver: false,
          listener: (event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            scrollOffsetRef.current = offsetX;
            onScrollOffsetChange?.(offsetX);
          },
        }
      )}
    >
      <View style={[styles.themeRoadStage, { width: stageWidth, height: stageHeight }]}>
        <Image
          source={THEME_ROAD_BACKGROUND}
          resizeMode="stretch"
          style={[
            styles.themeRoadImage,
            {
              width: stageWidth,
              height: stageHeight,
            },
          ]}
        />
        {roadPages.map((page, pageIndex) => (
          page.items.map((item) => {
            const cardX = pageIndex * segmentWidth + centeredCardLeft;
            const cardY = cardTop;
            const titleColor = item.cardOutline ?? item.cardBorder ?? item.bg;
            const isLocked = item.premium && !isPremium;
            const embeddedFrame = hasEmbeddedThemeFrame(item.id);
            const focusOpacity = scrollX.interpolate({
              inputRange: [
                (pageIndex - 1) * segmentWidth,
                pageIndex * segmentWidth,
                (pageIndex + 1) * segmentWidth,
              ],
              outputRange: [0.8, 1, 0.8],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.roadThemeCardAnchor,
                  {
                    left: cardX,
                    top: cardY,
                    width: cardWidth,
                    height: cardHeight,
                    opacity: focusOpacity,
                  },
                ]}
              >
                {embeddedFrame ? null : (
                  <View pointerEvents="none" style={styles.roadThemeCardHeadingWrap}>
                    {THEME_ROAD_TITLE_OUTLINE_OFFSETS.map(([offsetX, offsetY]) => (
                      <Text
                        key={`${item.id}-outline-${offsetX}-${offsetY}`}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.72}
                        style={[
                          styles.roadThemeCardHeading,
                          styles.roadThemeCardHeadingOutline,
                          {
                            color: titleColor,
                            transform: [{ translateX: offsetX }, { translateY: offsetY }],
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    ))}
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                      style={[styles.roadThemeCardHeading, styles.roadThemeCardHeadingFill]}
                    >
                      {item.label}
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={() => {
                    onThemePress?.(item, {
                      x: cardX + cardWidth / 2 - scrollOffsetRef.current,
                      y: cardY + cardHeight / 2,
                    });
                  }}
                  style={styles.roadThemeCardPressable}
                >
                  <ThemeRoadCard item={item} isLocked={isLocked} />
                </Pressable>
              </Animated.View>
            );
          })
        ))}
      </View>
    </Animated.ScrollView>
  );
}

function ThemeItemTile({ itemImage, onInspect }) {
  const tileRef = useRef(null);

  function handlePress() {
    tileRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      void Haptics.selectionAsync();
      onInspect?.({
        icon: itemImage,
        rect: {
          x,
          y,
          width: measuredWidth,
          height: measuredHeight,
        },
      });
    });
  }

  return (
    <Pressable ref={tileRef} style={styles.themeItemTile} onPress={handlePress}>
      <Image source={itemImage} resizeMode="contain" style={styles.themeItemImage} />
    </Pressable>
  );
}

function ThemeItemInspectOverlay({ cell, progress, onClose }) {
  const { height, width } = useWindowDimensions();

  if (!cell) {
    return null;
  }

  const startSize = cell.rect.width || 112;
  const targetSize = Math.min(
    Math.max(startSize * 2.82, 218),
    width - 48,
    height - 170
  );
  const targetLeft = (width - targetSize) / 2;
  const targetTop = (height - targetSize) / 2;
  const borderRadius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 30],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.68],
  });
  const left = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cell.rect.x, targetLeft],
  });
  const top = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cell.rect.y, targetTop],
  });
  const size = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startSize, targetSize],
  });
  const imageSize = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startSize * 0.82, targetSize * 0.82],
  });
  const shadowOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.28],
  });

  return (
    <View pointerEvents="box-none" style={styles.themeInspectLayer}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.themeInspectBackdrop, { opacity: backdropOpacity }]} />
      </Pressable>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.themeInspectCell,
          {
            left,
            top,
            width: size,
            height: size,
            borderRadius,
            shadowOpacity,
          },
        ]}
      >
        <Animated.Image
          source={cell.icon}
          resizeMode="contain"
          style={{
            width: imageSize,
            height: imageSize,
          }}
        />
      </Animated.View>
    </View>
  );
}

function SkinShopPanel({ items, inspectedSkinId, onInspect }) {
  const { height, width } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(width, height);
  const imageWidth = width * SKIN_ROAD_ZOOM;
  const imageHeight = imageWidth * SKIN_ROAD_IMAGE_RATIO;
  const rowCount = Math.ceil(items.length / 2);
  const tileHeight = isTablet ? 214 : 146;
  const topOffset = isTablet ? 82 : 64;
  const navHeight = isTablet ? 154 : 118;
  const targetLastRowTop = height - navHeight - tileHeight * 0.48;
  const rowHeight = rowCount > 1
    ? Math.min(isTablet ? 236 : 154, Math.max(isTablet ? 184 : 132, (targetLastRowTop - topOffset) / (rowCount - 1)))
    : 144;
  const contentHeight = Math.max(
    imageHeight * SKIN_ROAD_REPEAT_COUNT,
    topOffset + Math.max(0, rowCount - 1) * rowHeight + tileHeight + navHeight + 58
  );
  const roadImages = Array.from({ length: Math.ceil(contentHeight / imageHeight) }, (_, index) => index);

  return (
    <ScrollView
      style={styles.skinRoadScroll}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={[styles.skinShopStage, { height: contentHeight }]}>
        {roadImages.map((imageIndex) => (
          <Image
            key={imageIndex}
            source={SKIN_ROAD_BACKGROUND}
            resizeMode="stretch"
            style={[
              styles.skinRoadImage,
              {
                width: imageWidth,
                height: imageHeight,
                left: (width - imageWidth) / 2,
                top: imageIndex * imageHeight,
              },
            ]}
          />
        ))}

        {items.map((item, index) => {
          const rowIndex = Math.floor(index / 2);
          const columnIndex = index % 2;

          return (
            <SkinShopTile
              key={item.id}
              item={item}
              animationSeed={index}
              hidden={item.id === inspectedSkinId}
              onInspect={onInspect}
              style={{
                left: columnIndex === 0 ? width * (isTablet ? 0.055 : 0.035) : width * (isTablet ? 0.525 : 0.495),
                top: topOffset + rowIndex * rowHeight,
                width: width * (isTablet ? 0.42 : 0.47),
                height: tileHeight,
              }}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

function SkinShopTile({ item, animationSeed = 0, hidden, onInspect, style }) {
  const tileRef = useRef(null);
  const bob = useRef(new Animated.Value(0)).current;
  const isUnlocked = isSkinShopItemUnlocked(item);
  const isChallengeLocked = item.unlockType === 'challenge' && !isUnlocked;
  const animationPhase = getSkinShopAnimationPhase(item, animationSeed, SKIN_SHOP_CAR_BOB_DURATION);
  const tileImageHeight = Math.max(SKIN_SHOP_TILE_IMAGE_HEIGHT, Math.min(202, (style?.height ?? 146) * 0.94));

  useEffect(() => {
    bob.stopAnimation();

    if (!isUnlocked) {
      bob.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: SKIN_SHOP_CAR_BOB_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: SKIN_SHOP_CAR_BOB_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      bob.stopAnimation();
      bob.setValue(0);
    };
  }, [bob, isUnlocked]);

  function handlePress() {
    tileRef.current?.measureInWindow((x, y, width, height) => {
      const movingWidth = width * SKIN_SHOP_TILE_IMAGE_WIDTH_RATIO / SKIN_INSPECT_MOVING_IMAGE_WIDTH_RATIO;
      const tileImageLeft = x - ((SKIN_SHOP_TILE_IMAGE_WIDTH_RATIO - 1) * width) / 2;
      const movingImageBleed = ((SKIN_INSPECT_MOVING_IMAGE_WIDTH_RATIO - 1) * movingWidth) / 2;

      onInspect({
        skin: item,
        rect: {
          x: tileImageLeft + movingImageBleed,
          y: y + (height - tileImageHeight) / 2,
          width: movingWidth,
          height: tileImageHeight,
        },
      });
    });
  }

  return (
    <Pressable
      ref={tileRef}
      collapsable={false}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.skinShopTile,
        style,
        hidden && styles.skinShopTileHidden,
        pressed && styles.skinShopTilePressed,
      ]}
  >
      <Animated.View
        style={[
          styles.skinShopTileShadowMotion,
          isUnlocked && {
            transform: [
              {
                scaleX: bob.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.92],
                }),
              },
              {
                scaleY: bob.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.86],
                }),
              },
            ],
          },
        ]}
      >
        <SkinCarShadow style={styles.skinShopTileShadow} />
      </Animated.View>
      <Animated.View
        style={[
          styles.skinShopTileCarMotion,
          { height: tileImageHeight },
          isUnlocked && {
            transform: [
              {
                translateY: bob.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -SKIN_SHOP_CAR_BOB_DISTANCE],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={item.image}
          resizeMode="contain"
          style={[
            styles.skinShopTileImage,
            { height: tileImageHeight },
            isChallengeLocked && styles.challengeSkinMutedImage,
          ]}
        />
      </Animated.View>
      {isChallengeLocked ? (
        <ChallengeSkinLockOverlay
          size="tile"
          animationPhase={animationPhase}
          style={styles.skinShopChallengeLock}
        />
      ) : null}
    </Pressable>
  );
}

function ChallengeSkinLockOverlay({ size = 'tile', progress, style, animationPhase = 0 }) {
  const jump = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const phaseDelay = 650 + ((animationPhase * 410) % 1700);
    const restDelay = 1150 + ((animationPhase * 193) % 760);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(phaseDelay),
        Animated.timing(jump, {
          toValue: 1,
          duration: 130,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(jump, {
          toValue: 0,
          duration: 190,
          easing: Easing.bounce,
          useNativeDriver: false,
        }),
        Animated.delay(restDelay),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      jump.stopAnimation();
      jump.setValue(0);
    };
  }, [animationPhase, jump]);

  const translateY = jump.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size === 'large' ? -14 : -8],
  });
  const scale = jump.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });

  return (
    <Animated.View
      style={[
        size === 'large' ? styles.challengeSkinLockLarge : styles.challengeSkinLockTile,
        style,
        {
          opacity: progress ?? 1,
        },
      ]}
    >
      <Animated.View
        style={{
          transform: [{ translateY }, { scale }],
        }}
      >
        <Image
          source={CHALLENGE_SKIN_LOCK_IMAGE}
          resizeMode="contain"
          style={styles.challengeSkinLockImage}
        />
      </Animated.View>
    </Animated.View>
  );
}

function SkinCarShadow({ style } = {}) {
  return (
    <Svg width={168} height={44} viewBox="0 0 168 44" style={[styles.skinShopCarShadow, style]}>
      <Defs>
        <RadialGradient id="skinCarShadowGradient" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#070707" stopOpacity="0.38" />
          <Stop offset="48%" stopColor="#070707" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#111111" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="84" cy="22" rx="84" ry="22" fill="url(#skinCarShadowGradient)" />
    </Svg>
  );
}

function SkinInspectOverlay({ inspection, progress, onClose }) {
  const { height, width } = useWindowDimensions();

  if (!inspection) {
    return null;
  }

  const { skin, rect } = inspection;
  const isFutureSkin = skin.unlockType === 'future';
  const isChallengeLocked = skin.unlockType === 'challenge' && !skin.unlocked;
  const hasSkinNameLabel = !isChallengeLocked && !isFutureSkin;
  const challengeText = skin.challenge ?? 'Voltooi de bijbehorende challenge om deze skin gratis te ontgrendelen.';
  const { isTablet } = getResponsiveMetrics(width, height);
  const targetWidth = isTablet ? Math.min(width * 0.86, 680) : Math.min(width * 1.08, 470);
  const targetHeight = targetWidth * 0.76;
  const targetContainerHeight = isChallengeLocked
    ? targetHeight + 112
    : hasSkinNameLabel
      ? targetHeight + 86
      : targetHeight;
  const targetLeft = (width - targetWidth) / 2;
  const targetTop = (height - targetContainerHeight) / 2 - 4;
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.72],
  });
  const left = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [rect.x, targetLeft],
  });
  const top = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [rect.y, targetTop],
  });
  const movingWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [rect.width, targetWidth],
  });
  const movingHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [rect.height, targetContainerHeight],
  });
  const imageHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SKIN_SHOP_TILE_IMAGE_HEIGHT, (isChallengeLocked || hasSkinNameLabel) ? targetHeight * 0.92 : targetHeight],
  });
  const shadowScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, targetWidth / 132],
  });
  const shadowBottom = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 14],
  });

  return (
    <View pointerEvents="box-none" style={styles.skinInspectLayer}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.skinInspectBackdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.skinInspectMovingCar,
          isChallengeLocked && styles.skinInspectChallengeMovingCar,
          hasSkinNameLabel && styles.skinInspectNamedMovingCar,
          {
            left,
            top,
            width: movingWidth,
            height: movingHeight,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.skinInspectMovingShadow,
            {
              bottom: shadowBottom,
              transform: [{ scale: shadowScale }],
            },
          ]}
        >
          <SkinCarShadow style={styles.skinInspectShadowSvg} />
        </Animated.View>
        <Animated.Image
          source={skin.image}
          resizeMode="contain"
          style={[
            styles.skinInspectMovingImage,
            isFutureSkin && styles.skinInspectFutureImage,
            isChallengeLocked && styles.challengeSkinMutedImage,
            {
              height: imageHeight,
            },
          ]}
        />
        {isChallengeLocked ? (
          <>
            <ChallengeSkinLockOverlay
              size="large"
              progress={progress}
              style={styles.skinInspectChallengeLock}
            />
            <Animated.View
              style={[
                styles.skinInspectChallengeTextBlock,
                {
                  opacity: progress,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.76}
                style={styles.skinInspectChallengeName}
              >
                {skin.label}
              </Text>
              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={styles.skinInspectChallengeText}
              >
                {challengeText}
              </Text>
            </Animated.View>
          </>
        ) : null}
        {hasSkinNameLabel ? (
          <Animated.View
            style={[
              styles.skinInspectNameBlock,
              {
                opacity: progress,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.76}
              style={styles.skinInspectChallengeName}
            >
              {skin.label}
            </Text>
          </Animated.View>
        ) : null}
        {isFutureSkin ? (
          <Animated.Text
            style={[
              styles.skinInspectFutureText,
              {
                opacity: progress,
              },
            ]}
          >
            Komt in de toekomst
          </Animated.Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

function ThemeDetailScreen({ theme, onBack }) {
  const items = theme.id === 'winter' ? [] : getThemeIcons(theme.id);
  const titleColor = theme.id === 'winter' ? '#274154' : '#FFFFFF';
  const backgroundImage = getThemeDetailBackgroundImage(theme.id);
  const inspectProgress = useRef(new Animated.Value(0)).current;
  const [inspectedItem, setInspectedItem] = useState(null);

  function openItemInspect(cell) {
    setInspectedItem(cell);
    inspectProgress.stopAnimation();
    inspectProgress.setValue(0);
    Animated.timing(inspectProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }

  function closeItemInspect() {
    inspectProgress.stopAnimation();
    Animated.timing(inspectProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setInspectedItem(null);
      }
    });
  }

  const content = (
    <>
      <View style={styles.themeDetailShade} />
      <AnimatedBackButton
        onActivated={onBack}
        size={66}
        style={styles.themeDetailBackButtonWrap}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.themeDetailContent}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          style={[
            styles.themeDetailTitle,
            theme.id === 'verkeersborden' && styles.themeDetailTitleCompact,
            { color: titleColor },
          ]}
        >
          {theme.label}
        </Text>
        {items.length ? (
          <View style={styles.themeItemsGrid}>
            {items.map((itemImage, index) => (
              <ThemeItemTile
                key={`${theme.id}-${index}`}
                itemImage={itemImage}
                onInspect={openItemInspect}
              />
            ))}
          </View>
        ) : (
          <View style={styles.themeItemsEmptyState}>
            <Text style={styles.themeItemsEmptyText}>Items komen later</Text>
          </View>
        )}
      </ScrollView>
      <ThemeItemInspectOverlay
        cell={inspectedItem}
        progress={inspectProgress}
        onClose={closeItemInspect}
      />
    </>
  );

  if (backgroundImage) {
    return (
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={styles.themeDetailScreen}
      >
        {content}
      </ImageBackground>
    );
  }

  return (
    <LinearGradient
      colors={[theme.cardSurface ?? theme.bg, '#8bcdf2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.themeDetailScreen}
    >
      {content}
    </LinearGradient>
  );
}

function ThemeCardsPanel({ selectedThemeIndex, onSelectTheme, selectedItemIndex, onSelectItem }) {
  const { width, height } = useWindowDimensions();
  const { isTablet } = getResponsiveMetrics(width, height);
  const selectedTheme = THEME_SHOWCASE_ITEMS[selectedThemeIndex] ?? THEME_SHOWCASE_ITEMS[0];
  const previewItems = selectedTheme.previewItems ?? [];
  const boundedItemIndex = previewItems.length ? Math.min(selectedItemIndex, previewItems.length - 1) : 0;
  const selectedItemImage = previewItems[boundedItemIndex] ?? null;

  return (
    <View style={styles.tabPanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelEyebrow}>Verzamel</Text>
        <Text style={styles.panelTitle}>Thema kaarten</Text>
        <Text style={styles.panelSubtitle}>Swipe door de kaartensets en bekijk voorbeelditems van elke set.</Text>
      </View>

      <ThemeCarousel
        items={THEME_SHOWCASE_ITEMS}
        keyExtractor={(item) => item.id}
        focusedIndex={selectedThemeIndex}
        onSnapToItem={onSelectTheme}
        itemWidth={isTablet ? 328 : 252}
        itemSpacing={isTablet ? 28 : 18}
        containerStyle={styles.themeCarousel}
        renderCard={({ item, isFocused }) => {
          const embeddedFrame = hasEmbeddedThemeFrame(item.id);

          return (
            <View
              style={[
                styles.themeShowcaseCard,
                embeddedFrame
                  ? styles.themeShowcaseCardEmbedded
                  : {
                      borderColor: item.cardOutline ?? item.cardBorder ?? item.bg,
                      shadowColor: item.cardOutline ?? item.cardBorder ?? item.bg,
                    },
                isFocused && styles.themeShowcaseCardFocused,
              ]}
            >
            {item.previewImage ? (
              <ImageBackground
                source={item.previewImage}
                resizeMode={embeddedFrame ? 'stretch' : 'cover'}
                imageStyle={[
                  styles.themeShowcaseCardImage,
                  embeddedFrame && styles.themeShowcaseCardImageEmbedded,
                ]}
                style={[
                  styles.themeShowcaseCardBody,
                  embeddedFrame && styles.themeShowcaseCardBodyEmbedded,
                ]}
              >
                <View style={styles.themeShowcaseOverlay} />
                <Text
                  style={[
                    styles.themeShowcaseTitle,
                    embeddedFrame && styles.themeShowcaseTitleEmbedded,
                    embeddedFrame && getEmbeddedThemeTitleStyle(item.id),
                  ]}
                >
                  {item.label}
                </Text>
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={[item.cardSurface ?? item.bg, '#FFF7E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.themeShowcaseCardBody}
              >
                {item.premium ? (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockBadgeText}>Premium</Text>
                  </View>
                ) : null}
                <Text style={styles.themeShowcaseTitle}>
                  {item.label}
                </Text>
              </LinearGradient>
            )}
            </View>
          );
        }}
      />

      <View style={styles.detailPanel}>
        <View style={styles.themeDetailHeader}>
          <View>
            <Text style={styles.detailPanelTitle}>{selectedTheme.label}</Text>
            <Text style={styles.detailPanelText}>
              {selectedTheme.itemCount
                ? `${selectedTheme.itemCount} mogelijke items om doorheen te bladeren`
                : 'Preview-items voor deze set komen later'}
            </Text>
          </View>
          <View style={[styles.themeStatusBadge, selectedTheme.premium && styles.themeStatusBadgePremium]}>
            <Text style={[styles.themeStatusBadgeText, selectedTheme.premium && styles.themeStatusBadgeTextPremium]}>
              {selectedTheme.premium ? 'Premium' : 'Free'}
            </Text>
          </View>
        </View>

        {selectedItemImage ? (
          <>
            <View style={styles.itemPreviewStage}>
              <Image source={selectedItemImage} resizeMode="contain" style={styles.itemPreviewImage} />
            </View>
            <Text style={styles.itemPreviewCaption}>
              Voorbeelditem {boundedItemIndex + 1} van {previewItems.length}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemStrip}
            >
              {previewItems.map((itemImage, index) => (
                <Pressable
                  key={`${selectedTheme.id}-${index}`}
                  onPress={() => onSelectItem(index)}
                  style={[styles.itemThumb, index === boundedItemIndex && styles.itemThumbActive]}
                >
                  <Image source={itemImage} resizeMode="contain" style={styles.itemThumbImage} />
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : (
          <View style={styles.emptyItemsState}>
            <Text style={styles.emptyItemsStateText}>Voor deze kaartset tonen we hier straks alle preview-items.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function measureViewCenter(targetRef) {
  return new Promise((resolve) => {
    if (!targetRef?.current?.measureInWindow) {
      resolve({ x: 0, y: 0 });
      return;
    }

    targetRef.current.measureInWindow((x, y, width, height) => {
      resolve({
        x: x + width / 2,
        y: y + height / 2,
      });
    });
  });
}

export default function HomeScreen({ navigation, route }) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { isTablet, tabletScale } = getResponsiveMetrics(windowWidth, windowHeight);
  const { isPremium } = usePremium();
  const pulse = useRef(new Animated.Value(1)).current;
  const premiumCrownPulse = useRef(new Animated.Value(1)).current;
  const hostPadlockJiggle = useRef(new Animated.Value(0)).current;
  const playCarJump = useRef(new Animated.Value(0)).current;
  const onlineYellowJump = useRef(new Animated.Value(0)).current;
  const onlineBlueJump = useRef(new Animated.Value(0)).current;
  const onlineGreenJump = useRef(new Animated.Value(0)).current;
  const onlineExpand = useRef(new Animated.Value(0)).current;
  const joinPlateProgress = useRef(new Animated.Value(0)).current;
  const joinCursorBlink = useRef(new Animated.Value(1)).current;
  const isNavigatingRef = useRef(false);
  const revealRef = useRef(null);
  const themeCoverRevealRef = useRef(null);
  const themeUncoverRevealRef = useRef(null);
  const playButtonWrapRef = useRef(null);
  const onlineButtonWrapRef = useRef(null);
  const hostOptionRef = useRef(null);
  const joinOptionRef = useRef(null);
  const joinCodeInputRef = useRef(null);
  const pendingRouteRef = useRef(null);
  const pendingRouteParamsRef = useRef(null);
  const pendingThemeBackRef = useRef(false);
  const latestPressPointRef = useRef(null);
  const themeRoadOffsetRef = useRef(0);
  const activeTabTranslateX = useRef(new Animated.Value(0)).current;
  const tabPageTranslateX = useRef(new Animated.Value(-windowWidth)).current;
  const skinInspectProgress = useRef(new Animated.Value(0)).current;
  const [revealOrigin, setRevealOrigin] = useState({ x: 0, y: 0 });
  const [revealColor, setRevealColor] = useState('#F5C400');
  const [isOnlineMenuVisible, setIsOnlineMenuVisible] = useState(false);
  const [isJoinPlateVisible, setIsJoinPlateVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [connectionError, setConnectionError] = useState(null);
  const [isJoinBusy, setIsJoinBusy] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumModalSource, setPremiumModalSource] = useState(null);
  const [lobbyExitMessage, setLobbyExitMessage] = useState(route?.params?.lobbyExitMessage ?? '');
  const [activeTab, setActiveTab] = useState(HOME_TAB_HOME);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [selectedThemeItemIndex, setSelectedThemeItemIndex] = useState(0);
  const [selectedThemeDetail, setSelectedThemeDetail] = useState(null);
  const [skinInspection, setSkinInspection] = useState(null);
  const [pendingThemeDetail, setPendingThemeDetail] = useState(null);
  const [themeRevealState, setThemeRevealState] = useState({
    covering: false,
    uncovering: false,
    color: '#1A5EA8',
    origin: { x: windowWidth / 2, y: 360 },
  });
  const tabWidth = windowWidth / NAV_ITEMS.length;
  const navMetrics = {
    navHeight: isTablet ? 154 : 118,
    navHighlightHeight: isTablet ? 176 : 136,
    navButtonHeight: isTablet ? 154 : 118,
    navPaddingVertical: isTablet ? 24 : 16,
    iconWrapSize: isTablet ? 76 : 60,
    iconSize: isTablet ? 76 : 60,
  };
  const actionPadding = isTablet ? 34 : HOME_ACTION_HORIZONTAL_PADDING;
  const actionGap = isTablet ? 22 : HOME_ACTION_GAP;
  const actionCollapsedHeight = isTablet ? 152 : HOME_ACTION_COLLAPSED_HEIGHT;
  const actionExpandedHeight = isTablet ? 282 : HOME_ACTION_EXPANDED_HEIGHT;
  const actionButtonHeight = isTablet ? 112 : 88;
  const actionAvailableWidth = windowWidth - actionPadding * 2 - actionGap;
  const collapsedActionWidth = actionAvailableWidth / 2;
  const expandedOnlineWidth = actionAvailableWidth * 0.66;
  const expandedPlayWidth = actionAvailableWidth - expandedOnlineWidth;
  const playPanelWidth = onlineExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedActionWidth, expandedPlayWidth],
  });
  const onlinePanelWidth = onlineExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedActionWidth, expandedOnlineWidth],
  });
  const onlinePanelHeight = onlineExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [isTablet ? 118 : 94, isTablet ? 178 : 140],
  });
  const onlinePanelRadius = onlineExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 26],
  });
  const onlineOptionsOpacity = onlineExpand.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0, 0, 1],
  });
  const onlineOptionsTranslateY = onlineExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });
  const onlineLabelTranslateY = onlineExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isTablet ? 72 : 55],
  });
  const onlineCarsTranslateY = onlineExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  useEffect(() => {
    setLobbyExitMessage(route?.params?.lobbyExitMessage ?? '');
  }, [route?.params?.lobbyExitMessage]);
  const normalizedJoinCode = useMemo(() => normalizeLobbyCode(joinCode), [joinCode]);
  const showMainMenuPremiumButton = (
    [HOME_TAB_HOME, HOME_TAB_SKINSHOP, HOME_TAB_THEMECARDS].includes(activeTab)
    && !isPremium
    && !selectedThemeDetail
  );
  const joinPlateSlots = useMemo(() => {
    const chars = normalizedJoinCode.split('');
    return [
      { key: 'char-0', type: 'char', value: chars[0] ?? '' },
      { key: 'char-1', type: 'char', value: chars[1] ?? '' },
      { key: 'dash-0', type: 'dash', value: '-' },
      { key: 'char-2', type: 'char', value: chars[2] ?? '' },
      { key: 'char-3', type: 'char', value: chars[3] ?? '' },
      { key: 'dash-1', type: 'dash', value: '-' },
      { key: 'char-4', type: 'char', value: chars[4] ?? '' },
      { key: 'char-5', type: 'char', value: chars[5] ?? '' },
      { key: 'char-6', type: 'char', value: chars[6] ?? '' },
    ];
  }, [normalizedJoinCode]);
  const joinCursorSlotIndex = [0, 1, 3, 4, 6, 7, 8, 9][normalizedJoinCode.length] ?? 9;
  const joinPlateWidth = Math.min(windowWidth - (isTablet ? 48 : 18), isTablet ? 760 : 430);
  const joinPlateHeight = joinPlateWidth / (1870 / 520);
  const joinPlateTop = (windowHeight - joinPlateHeight) / 2;
  const joinPlateIntroHeight = isTablet ? 92 : 68;
  const joinPlateLayerTop = Math.max(isTablet ? 116 : 82, joinPlateTop - joinPlateIntroHeight);
  const joinPlateFontSize = Math.min(isTablet ? 72 : 42, Math.max(isTablet ? 48 : 30, joinPlateWidth * 0.096));
  const joinPlateOpacity = joinPlateProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const joinPlateBackdropOpacity = joinPlateProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.68],
  });
  const joinPlateTranslateY = joinPlateProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const joinPlateScale = joinPlateProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const hostPadlockTranslateX = hostPadlockJiggle.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: [0, -2, 3, -1.5, 1.5, -0.5, 0],
  });
  const hostPadlockTranslateY = hostPadlockJiggle.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: [0, 0, -0.5, 0.5, 0, 0, 0],
  });
  const hostPadlockRotate = hostPadlockJiggle.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: ['0deg', '-2deg', '2.5deg', '-1.4deg', '1deg', '-0.4deg', '0deg'],
  });
  const hostPadlockScale = hostPadlockJiggle.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: [1, 1.006, 1.01, 1.004, 1.003, 1.001, 1],
  });

  useEffect(() => {
    void Asset.loadAsync(HOME_SCREEN_PRELOAD_ASSETS).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isJoinPlateVisible) {
      joinCursorBlink.stopAnimation();
      joinCursorBlink.setValue(1);
      return;
    }

    const cursorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(joinCursorBlink, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(joinCursorBlink, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
      ])
    );

    cursorAnimation.start();

    return () => {
      cursorAnimation.stop();
    };
  }, [isJoinPlateVisible, joinCursorBlink]);

  useLayoutEffect(() => {
    onlineExpand.stopAnimation();
    onlineExpand.setValue(0);
    setIsOnlineMenuVisible(false);
    joinPlateProgress.stopAnimation();
    joinPlateProgress.setValue(0);
    setIsJoinPlateVisible(false);
  }, [onlineExpand]);

  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      onlineExpand.stopAnimation();
      onlineExpand.setValue(0);
      setIsOnlineMenuVisible(false);
      joinPlateProgress.stopAnimation();
      joinPlateProgress.setValue(0);
      setIsJoinPlateVisible(false);
    });

    return unsubscribe;
  }, [navigation, onlineExpand, joinPlateProgress]);

  useEffect(() => {
    const activeIndex = NAV_ITEMS.findIndex((item) => item.key === activeTab);
    const nextTranslateX = Math.max(activeIndex, 0) * tabWidth;
    const nextPageTranslateX = -Math.max(activeIndex, 0) * windowWidth;

    Animated.parallel([
      Animated.spring(activeTabTranslateX, {
        toValue: nextTranslateX,
        useNativeDriver: true,
        speed: 16,
        bounciness: 8,
      }),
      Animated.spring(tabPageTranslateX, {
        toValue: nextPageTranslateX,
        useNativeDriver: true,
        speed: 18,
        bounciness: 3,
      }),
    ]).start();
  }, [activeTab, activeTabTranslateX, tabPageTranslateX, tabWidth, windowWidth]);

  useEffect(() => {
    if (!themeRevealState.uncovering) {
      return;
    }

    requestAnimationFrame(() => {
      themeUncoverRevealRef.current?.reveal();
    });
  }, [themeRevealState.uncovering]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      subscription.remove();
      animation.stop();
    };
  }, [pulse]);

  useEffect(() => {
    if (!showMainMenuPremiumButton) {
      premiumCrownPulse.stopAnimation();
      premiumCrownPulse.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(premiumCrownPulse, {
          toValue: 1.13,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(premiumCrownPulse, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.delay(2800),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      premiumCrownPulse.stopAnimation();
      premiumCrownPulse.setValue(1);
    };
  }, [premiumCrownPulse, showMainMenuPremiumButton]);

  useEffect(() => {
    if (isPremium) {
      hostPadlockJiggle.stopAnimation();
      hostPadlockJiggle.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(950),
        Animated.timing(hostPadlockJiggle, {
          toValue: 1,
          duration: 45,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(hostPadlockJiggle, {
          toValue: 2,
          duration: 55,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hostPadlockJiggle, {
          toValue: 3,
          duration: 50,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(hostPadlockJiggle, {
          toValue: 4,
          duration: 46,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hostPadlockJiggle, {
          toValue: 5,
          duration: 42,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hostPadlockJiggle, {
          toValue: 6,
          duration: 88,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(hostPadlockJiggle, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
        Animated.delay(2100),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      hostPadlockJiggle.stopAnimation();
      hostPadlockJiggle.setValue(0);
    };
  }, [hostPadlockJiggle, isPremium]);

  const triggerLightJumpHaptic = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const buildJumpAnimation = (value) =>
    Animated.sequence([
      Animated.timing(value, {
        toValue: -20,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 2,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]);

  const runOnlineCarJumpSequence = ({ withHaptics = false, onComplete } = {}) => {
    if (withHaptics) {
      triggerLightJumpHaptic();
    }
    buildJumpAnimation(onlineYellowJump).start();

    setTimeout(() => {
      if (withHaptics) {
        triggerLightJumpHaptic();
      }
      buildJumpAnimation(onlineBlueJump).start();
    }, ONLINE_CAR_JUMP_DELAYS[1]);

    setTimeout(() => {
      if (withHaptics) {
        triggerLightJumpHaptic();
      }
      buildJumpAnimation(onlineGreenJump).start(onComplete);
    }, ONLINE_CAR_JUMP_DELAYS[2]);
  };

  const openPremiumModal = (source = 'menu') => {
    setPremiumModalSource(source);
    setPremiumModalVisible(true);
  };

  const closePremiumModal = () => {
    setPremiumModalVisible(false);
    setPremiumModalSource(null);
  };

  const openSkinInspect = (inspection) => {
    void Haptics.selectionAsync();
    setSkinInspection(inspection);
    skinInspectProgress.stopAnimation();
    skinInspectProgress.setValue(0);
    Animated.timing(skinInspectProgress, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const closeSkinInspect = (onClosed) => {
    const afterClose = typeof onClosed === 'function' ? onClosed : null;

    skinInspectProgress.stopAnimation();
    Animated.timing(skinInspectProgress, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setSkinInspection(null);
        afterClose?.();
      }
    });
  };

  const closeOnlineMenu = () => {
    Animated.timing(onlineExpand, {
      toValue: 0,
      duration: 260,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setIsOnlineMenuVisible(false);
      }
    });
  };

  const openOnlineMenu = () => {
    setIsOnlineMenuVisible(true);
    Animated.timing(onlineExpand, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const openJoinPlate = () => {
    if (isNavigatingRef.current) {
      return;
    }

    runOnlineCarJumpSequence();

    setIsJoinPlateVisible(true);
    setJoinCode('');
    setJoinError('');
    setIsJoinBusy(false);

    if (isOnlineMenuVisible) {
      closeOnlineMenu();
    }

    joinPlateProgress.stopAnimation();
    joinPlateProgress.setValue(0);
    Animated.timing(joinPlateProgress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        joinCodeInputRef.current?.focus();
      }, 50);
    });
  };

  const closeJoinPlate = () => {
    joinCodeInputRef.current?.blur();
    Animated.timing(joinPlateProgress, {
      toValue: 0,
      duration: 190,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsJoinPlateVisible(false);
      }
    });
  };

  const submitJoinCode = async (codeToSubmit = normalizedJoinCode) => {
    const code = normalizeLobbyCode(codeToSubmit);

    if (code.length !== 7 || isJoinBusy) {
      return;
    }

    const decoded = decodeLobbyCode(code);
    if (!decoded) {
      setJoinError('Deze code klopt niet.');
      return;
    }

    setIsJoinBusy(true);
    setJoinError('');

    try {
      const syncType = decoded.syncType === 'live' ? 'live' : 'geen';
      if (syncType === 'live') {
        const online = await checkOnlineConnection();
        if (!online) {
          setConnectionError({
            title: 'Geen internetverbinding',
            message: 'Om deze lobby te joinen, heb je een stabiele internetverbinding nodig.',
          });
          setIsJoinBusy(false);
          return;
        }
      }
      const liveLobby = syncType === 'live' ? await getLobbySnapshot(code) : null;

      if (syncType === 'live' && !liveLobby) {
        setJoinError('Lobby niet gevonden.');
        setIsJoinBusy(false);
        return;
      }

      const config = createGameConfig({
        thema: liveLobby?.config?.thema ?? decoded.thema,
        modus: liveLobby?.config?.modus ?? decoded.gameMode,
        syncType,
        lobbyCode: code,
        seed: liveLobby?.config?.seed ?? decoded.seed,
        salt: liveLobby?.config?.salt ?? decoded.salt,
        wincondition: liveLobby?.config?.wincondition ?? '1rij',
        diagonaal: typeof liveLobby?.config?.diagonaal === 'boolean' ? liveLobby.config.diagonaal : true,
        kaartOpzet: liveLobby?.config?.kaartOpzet ?? 'zelfde',
        zichtbaarheid: decoded.syncType === 'live'
          ? { ...DEFAULT_ZICHTBAARHEID }
          : { eigenVoortgang: false, andermansVoortgang: false },
        startedAt: liveLobby?.startedAt ?? null,
        liveLobbyPlayers: liveLobby?.players ?? [],
      });

      setIsJoinBusy(false);
      isNavigatingRef.current = true;
      joinCodeInputRef.current?.blur();

      void triggerReveal({
        targetRef: joinOptionRef,
        color: '#F5C400',
        routeName: 'Wachten',
        routeParams: { config },
        origin: {
          x: windowWidth / 2,
          y: windowHeight / 2,
        },
      });
    } catch (_error) {
      setJoinError('Joinen lukt even niet.');
      setIsJoinBusy(false);
    }
  };

  const triggerReveal = async ({ targetRef, color, routeName, routeParams = {}, origin }) => {
    const center = origin ?? latestPressPointRef.current ?? await measureViewCenter(targetRef);

    pendingRouteRef.current = routeName;
    pendingRouteParamsRef.current = routeParams;
    setRevealColor(color);
    setRevealOrigin(center);

    requestAnimationFrame(() => {
      revealRef.current?.reveal();
    });
  };

  const handlePlayPress = () => {
    if (isNavigatingRef.current) {
      return;
    }

    if (isOnlineMenuVisible) {
      closeOnlineMenu();
    }

    isNavigatingRef.current = true;
    triggerLightJumpHaptic();

    buildJumpAnimation(playCarJump).start(({ finished }) => {
      if (!finished) {
        isNavigatingRef.current = false;
        return;
      }

      setTimeout(() => {
        void triggerReveal({
          targetRef: playButtonWrapRef,
          color: '#F5C400',
          routeName: 'SingleDeviceSetupTest',
          origin: latestPressPointRef.current,
        });
      }, 120);
    });
  };

  const handleOnlinePress = () => {
    if (isNavigatingRef.current) {
      return;
    }

    if (isOnlineMenuVisible) {
      closeOnlineMenu();
      return;
    }

    runOnlineCarJumpSequence({ withHaptics: true });
    openOnlineMenu();
  };

  const handleOnlineOptionPress = (routeName, targetRef, origin) => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    runOnlineCarJumpSequence({ onComplete: ({ finished }) => {
      if (!finished) {
        isNavigatingRef.current = false;
        return;
      }

      setTimeout(() => {
        void triggerReveal({
          targetRef,
          color: '#E03030',
          routeName,
          origin,
        });
      }, 150);
    }});
  };

  const handleHostOptionPress = async () => {
    if (!isPremium) {
      openPremiumModal('host');
      return;
    }

    const online = await checkOnlineConnection();
    if (!online) {
      setConnectionError({
        title: 'Geen internetverbinding',
        message: 'Om een online lobby aan te maken, heb je een stabiele internetverbinding nodig.',
      });
      return;
    }

    handleOnlineOptionPress(
      'HostSetup',
      hostOptionRef,
      latestPressPointRef.current
    );
  };

  const handleTabPress = (tabKey) => {
    if (activeTab === tabKey) {
      return;
    }

    void Haptics.selectionAsync();

    if (isOnlineMenuVisible) {
      closeOnlineMenu();
    }

    if (skinInspection) {
      closeSkinInspect(() => {
        setActiveTab(tabKey);
      });
      return;
    }

    setActiveTab(tabKey);
  };

  const handleThemeSelect = (index) => {
    setSelectedThemeIndex(index);
    setSelectedThemeItemIndex(0);
  };

  const handleRoadThemePress = (theme, origin) => {
    if (theme.premium && !isPremium) {
      openPremiumModal('theme');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pendingThemeBackRef.current = false;
    setPendingThemeDetail(theme);
    setThemeRevealState({
      covering: true,
      uncovering: false,
      color: theme.cardOutline ?? theme.cardBorder ?? theme.bg ?? '#1A5EA8',
      origin,
    });

    requestAnimationFrame(() => {
      themeCoverRevealRef.current?.reveal();
    });
  };

  const handleThemeBackPress = (origin) => {
    const theme = selectedThemeDetail;

    if (!theme) {
      return;
    }

    pendingThemeBackRef.current = true;
    setThemeRevealState({
      covering: true,
      uncovering: false,
      color: theme.cardOutline ?? theme.cardBorder ?? theme.bg ?? '#1A5EA8',
      origin: origin ?? { x: windowWidth / 2, y: 76 },
    });

    requestAnimationFrame(() => {
      themeCoverRevealRef.current?.reveal();
    });
  };

  const handleThemeCoverComplete = async () => {
    if (pendingThemeBackRef.current) {
      pendingThemeBackRef.current = false;

      await new Promise((resolve) => setTimeout(resolve, 180));

      setSelectedThemeDetail(null);
      setThemeRevealState((current) => ({
        ...current,
        covering: false,
        uncovering: true,
      }));
      return;
    }

    const theme = pendingThemeDetail;

    if (!theme) {
      setThemeRevealState((current) => ({ ...current, covering: false }));
      return;
    }

    try {
      await Asset.loadAsync([
        ...(theme.previewImage ? [theme.previewImage] : []),
        ...(theme.id === 'winter' ? [] : getThemeIcons(theme.id)),
      ]);
    } catch (_error) {
      // Als preload faalt, tonen we de detailpagina alsnog.
    }

    setSelectedThemeDetail(theme);
    setPendingThemeDetail(null);
    setThemeRevealState((current) => ({
      ...current,
      covering: false,
      uncovering: true,
    }));
  };

  const tabSwipeResponder = useMemo(() => {
    const clampTranslateX = (value) => Math.max(
      -windowWidth * (NAV_ITEMS.length - 1),
      Math.min(0, value)
    );

    const getActiveIndex = () => Math.max(
      0,
      NAV_ITEMS.findIndex((item) => item.key === activeTab)
    );

    const springBackToActiveTab = () => {
      const activeIndex = getActiveIndex();

      Animated.parallel([
        Animated.spring(tabPageTranslateX, {
          toValue: -activeIndex * windowWidth,
          useNativeDriver: true,
          speed: 18,
          bounciness: 3,
        }),
        Animated.spring(activeTabTranslateX, {
          toValue: activeIndex * tabWidth,
          useNativeDriver: true,
          speed: 16,
          bounciness: 8,
        }),
      ]).start();
    };

    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_event, gestureState) => (
        !isJoinPlateVisible
        &&
        activeTab === HOME_TAB_THEMECARDS
        && !selectedThemeDetail
        && themeRoadOffsetRef.current <= 2
        && gestureState.dx > 8
        && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25
      ),
      onMoveShouldSetPanResponder: (_event, gestureState) => (
        !isJoinPlateVisible
        &&
        (
          activeTab !== HOME_TAB_THEMECARDS
          || (!selectedThemeDetail && themeRoadOffsetRef.current <= 2 && gestureState.dx > 8)
        )
        &&
        Math.abs(gestureState.dx) > 8
        && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25
      ),
      onPanResponderGrant: () => {
        if (isJoinPlateVisible) {
          return;
        }

        tabPageTranslateX.stopAnimation();
      },
      onPanResponderMove: (_event, gestureState) => {
        if (isJoinPlateVisible) {
          return;
        }

        const baseTranslateX = -getActiveIndex() * windowWidth;
        const nextTranslateX = clampTranslateX(baseTranslateX + gestureState.dx);
        const nextProgress = Math.abs(nextTranslateX / windowWidth);

        tabPageTranslateX.setValue(nextTranslateX);
        activeTabTranslateX.setValue(nextProgress * tabWidth);
      },
      onPanResponderRelease: (_event, gestureState) => {
        if (isJoinPlateVisible) {
          return;
        }

        const activeIndex = getActiveIndex();
        const slowSwipeDistance = windowWidth * 0.16;
        const fastSwipeVelocity = 0.32;
        let nextIndex = activeIndex;

        if (gestureState.dx < -slowSwipeDistance || gestureState.vx < -fastSwipeVelocity) {
          nextIndex = Math.min(NAV_ITEMS.length - 1, activeIndex + 1);
        } else if (gestureState.dx > slowSwipeDistance || gestureState.vx > fastSwipeVelocity) {
          nextIndex = Math.max(0, activeIndex - 1);
        }

        const nextTab = NAV_ITEMS[nextIndex]?.key;

        if (nextTab && nextTab !== activeTab) {
          handleTabPress(nextTab);
          return;
        }

        springBackToActiveTab();
      },
      onPanResponderTerminate: springBackToActiveTab,
    });
  }, [activeTab, activeTabTranslateX, handleTabPress, isJoinPlateVisible, selectedThemeDetail, tabPageTranslateX, tabWidth, windowWidth]);

  return (
    <View style={styles.background}>
      <View style={styles.tabPagesViewport} {...tabSwipeResponder.panHandlers}>
        <Animated.View
          style={[
            styles.tabPagesTrack,
            {
              width: windowWidth * NAV_ITEMS.length,
              transform: [{ translateX: tabPageTranslateX }],
            },
          ]}
        >
          <View style={[styles.tabPage, { width: windowWidth }]}>
            <SkinShopPanel
              items={SKIN_SHOP_ITEMS}
              inspectedSkinId={skinInspection?.skin?.id}
              onInspect={openSkinInspect}
            />
          </View>

          <View style={[styles.tabPage, { width: windowWidth }]}>
            <ImageBackground
              source={require('../assets/homepage.png')}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.overlay}>
              <Animated.Image
                source={require('../assets/logo.png')}
                resizeMode="contain"
                style={[
                  styles.logo,
                  isTablet && {
                    height: 520,
                    marginTop: -18,
                  },
                  { transform: [{ scale: pulse }] },
                ]}
              />

              {isJoinPlateVisible ? (
                <>
                  <Pressable style={styles.joinPlateBackdropPressable} onPress={closeJoinPlate}>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.joinPlateBackdrop,
                        {
                          opacity: joinPlateBackdropOpacity,
                        },
                      ]}
                    />
                  </Pressable>
                  <Animated.View
                    pointerEvents="box-none"
                    style={[
                      styles.joinPlateLayer,
                      {
                        top: joinPlateLayerTop,
                        opacity: joinPlateOpacity,
                        transform: [
                          { translateY: joinPlateTranslateY },
                          { scale: joinPlateScale },
                        ],
                      },
                    ]}
                  >
                    <View style={[styles.joinPlateIntro, { width: joinPlateWidth }]}>
                      <Text style={styles.joinPlateIntroTitle}>Voer de lobbycode in</Text>
                      <Text style={styles.joinPlateIntroText}>
                        Deze code staat bovenin het scherm van de lobby.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => joinCodeInputRef.current?.focus()}
                      style={[
                        styles.joinPlateTapTarget,
                        {
                          width: joinPlateWidth,
                          height: joinPlateHeight,
                        },
                      ]}
                    >
                      <Image
                        source={JOIN_LICENSE_PLATE_IMAGE}
                        resizeMode="contain"
                        style={styles.joinPlateImage}
                      />
                      <View
                          style={[
                            styles.joinPlateCodeRow,
                            {
                              height: joinPlateFontSize * 1.34,
                            },
                          ]}
                      >
                        {joinPlateSlots.map((slot, slotIndex) => (
                          <View
                            key={slot.key}
                            style={[
                              styles.joinPlateSlot,
                              slot.type === 'dash' ? styles.joinPlateDashSlot : styles.joinPlateCharSlot,
                            ]}
                          >
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.joinPlateSlotText,
                                slot.type === 'dash' && styles.joinPlateDashText,
                                slot.type !== 'dash' && /[MW]/.test(slot.value) && styles.joinPlateWideSlotText,
                                {
                                  fontSize: joinPlateFontSize,
                                  lineHeight: joinPlateFontSize * 1.24,
                                },
                              ]}
                            >
                              {slot.value}
                            </Text>
                            {joinCursorSlotIndex === slotIndex ? (
                              <Animated.View
                                pointerEvents="none"
                                style={[
                                  styles.joinPlateCursor,
                                  {
                                    width: joinPlateFontSize * 0.48,
                                    opacity: joinCursorBlink,
                                  },
                                ]}
                              />
                            ) : null}
                          </View>
                        ))}
                        {joinCursorSlotIndex === 9 ? (
                          <Animated.View
                            pointerEvents="none"
                            style={[
                              styles.joinPlateCursor,
                              styles.joinPlateEndCursor,
                              {
                                width: joinPlateFontSize * 0.48,
                                opacity: joinCursorBlink,
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                    {joinError ? (
                      <Text style={styles.joinPlateError}>{joinError}</Text>
                    ) : null}
                    <TextInput
                      ref={joinCodeInputRef}
                      value={joinCode}
                      onChangeText={(value) => {
                        const nextCode = normalizeLobbyCode(value);
                        setJoinCode(nextCode);
                        setJoinError('');

                        if (nextCode.length === 7) {
                          setTimeout(() => {
                            void submitJoinCode(nextCode);
                          }, 220);
                        }
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={10}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void submitJoinCode();
                      }}
                      style={styles.joinPlateHiddenInput}
                    />
                  </Animated.View>
                </>
              ) : null}

              <View
                style={[
                  styles.hubBody,
                  isTablet && {
                    paddingHorizontal: actionPadding,
                    paddingBottom: navMetrics.navHeight + 18,
                  },
                ]}
              >
                <View
                  style={[
                    styles.actionsArea,
                    {
                      height: actionExpandedHeight,
                      transform: [{ translateY: isTablet ? -52 : -80 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.actionRow,
                      {
                        top: actionExpandedHeight - actionCollapsedHeight,
                        gap: actionGap,
                      },
                    ]}
                  >
                    <Animated.View
                      ref={playButtonWrapRef}
                      collapsable={false}
                      style={[
                        styles.actionButtonWrap,
                        styles.playButtonWrap,
                        {
                          width: playPanelWidth,
                          paddingTop: isTablet ? 46 : 34,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.actionImageBadge,
                          isTablet && {
                            top: 8,
                            transform: [{ scale: Math.min(tabletScale, 1.18) }],
                          },
                        ]}
                      >
                        <Animated.Image
                          source={PLAY_BUTTON_IMAGE}
                          resizeMode="contain"
                          style={[
                            styles.playActionImage,
                            {
                              transform: [{ translateY: playCarJump }],
                            },
                          ]}
                        />
                      </View>
                      <GlossyButton
                        label="Play"
                        variant="yellow"
                        size="large"
                        labelOffsetY={0}
                        contentOffsetY={12}
                        horizontalPadding={28}
                        heightOverride={actionButtonHeight}
                        labelFontScale={isTablet ? 1.18 : 1}
                        hapticStyle={Haptics.ImpactFeedbackStyle.Heavy}
                        onPressIn={(event) => {
                          latestPressPointRef.current = {
                            x: event.nativeEvent.pageX,
                            y: event.nativeEvent.pageY,
                          };
                        }}
                        onPress={handlePlayPress}
                      />
                    </Animated.View>

                    <Animated.View
                      ref={onlineButtonWrapRef}
                      collapsable={false}
                      style={[
                        styles.actionButtonWrap,
                        styles.onlineButtonWrap,
                        {
                          width: onlinePanelWidth,
                          paddingTop: isTablet ? 46 : 34,
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.actionImageBadge,
                          styles.onlineImageBadge,
                          {
                            top: isTablet ? -24 : -30,
                            transform: isTablet
                              ? [
                                  { translateY: onlineCarsTranslateY },
                                  { scale: Math.min(tabletScale, 1.16) },
                                ]
                              : [{ translateY: onlineCarsTranslateY }],
                          },
                        ]}
                      >
                        <View style={styles.onlineCarsStage}>
                          <Animated.Image
                            source={ONLINE_YELLOW_CAR}
                            resizeMode="contain"
                            style={[
                              styles.onlineCarImage,
                              styles.onlineYellowCar,
                              {
                                transform: [{ translateY: onlineYellowJump }],
                              },
                            ]}
                          />
                          <Animated.Image
                            source={ONLINE_BLUE_CAR}
                            resizeMode="contain"
                            style={[
                              styles.onlineCarImage,
                              styles.onlineBlueCar,
                              {
                                transform: [{ translateY: onlineBlueJump }],
                              },
                            ]}
                          />
                          <Animated.Image
                            source={ONLINE_GREEN_CAR}
                            resizeMode="contain"
                            style={[
                              styles.onlineCarImage,
                              styles.onlineGreenCar,
                              {
                                transform: [{ translateY: onlineGreenJump }],
                              },
                            ]}
                          />
                        </View>
                      </Animated.View>
                      <AnimatedPressable
                        onPress={handleOnlinePress}
                        onPressIn={(event) => {
                          latestPressPointRef.current = {
                            x: event.nativeEvent.pageX,
                            y: event.nativeEvent.pageY,
                          };
                        }}
                        style={[
                          styles.onlinePanelPressable,
                          {
                            width: onlinePanelWidth,
                            height: onlinePanelHeight,
                            borderRadius: onlinePanelRadius,
                          },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.onlinePanelOutline,
                            {
                              borderRadius: onlinePanelRadius,
                            },
                          ]}
                        >
                          <LinearGradient
                            colors={ONLINE_RED_GRADIENT}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={[
                              styles.onlinePanelBody,
                            ]}
                          >
                            <LinearGradient
                              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                              locations={[0, 0.62, 1]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={styles.onlinePanelGloss}
                            />
                            <Animated.View
                              pointerEvents={isOnlineMenuVisible ? 'auto' : 'none'}
                              style={[
                                styles.onlinePanelChoices,
                                isTablet && {
                                  top: 54,
                                  left: 18,
                                  right: 18,
                                  height: 76,
                                },
                                {
                                  opacity: onlineOptionsOpacity,
                                  transform: [{ translateY: onlineOptionsTranslateY }],
                                },
                              ]}
                            >
                              <Pressable
                                ref={joinOptionRef}
                                collapsable={false}
                                style={[
                                  styles.onlinePanelChoice,
                                  isTablet && { height: 72 },
                                ]}
                                onPressIn={(event) => {
                                  latestPressPointRef.current = {
                                    x: event.nativeEvent.pageX,
                                    y: event.nativeEvent.pageY,
                                  };
                                }}
                                onPress={openJoinPlate}
                              >
                                <View
                                  style={[
                                    styles.onlinePanelMiniButtonOutline,
                                    isTablet && {
                                      height: 64,
                                      borderRadius: 16,
                                    },
                                  ]}
                                >
                                  <LinearGradient
                                    colors={ONLINE_RED_GRADIENT}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={styles.onlinePanelMiniButtonBody}
                                  >
                                    <LinearGradient
                                      colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                                      locations={[0, 0.62, 1]}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 0, y: 1 }}
                                      style={styles.onlinePanelMiniButtonGloss}
                                    />
                                    <Text
                                      style={[
                                        styles.onlinePanelChoiceText,
                                        isTablet && {
                                          fontSize: 29,
                                          lineHeight: 34,
                                        },
                                      ]}
                                    >
                                      Join
                                    </Text>
                                  </LinearGradient>
                                </View>
                              </Pressable>
                              <Pressable
                                ref={hostOptionRef}
                                collapsable={false}
                                style={[
                                  styles.onlinePanelChoice,
                                  isTablet && { height: 72 },
                                ]}
                                onPressIn={(event) => {
                                  latestPressPointRef.current = {
                                    x: event.nativeEvent.pageX,
                                    y: event.nativeEvent.pageY,
                                  };
                                }}
                                onPress={handleHostOptionPress}
                              >
                                <View
                                  style={[
                                    styles.onlinePanelMiniButtonOutline,
                                    isTablet && {
                                      height: 64,
                                      borderRadius: 16,
                                    },
                                  ]}
                                >
                                  <LinearGradient
                                    colors={ONLINE_RED_GRADIENT}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={styles.onlinePanelMiniButtonBody}
                                  >
                                    <LinearGradient
                                      colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                                      locations={[0, 0.62, 1]}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 0, y: 1 }}
                                      style={styles.onlinePanelMiniButtonGloss}
                                    />
                                    <Text
                                      style={[
                                        styles.onlinePanelChoiceText,
                                        !isPremium && styles.onlinePanelChoiceTextLocked,
                                        isTablet && {
                                          fontSize: 29,
                                          lineHeight: 34,
                                        },
                                      ]}
                                    >
                                      Host
                                    </Text>
                                    {!isPremium ? <View style={styles.onlinePanelMiniButtonLockedDim} /> : null}
                                    {!isPremium ? (
                                      <View pointerEvents="none" style={styles.onlinePanelHostLockLayer}>
                                        <Image
                                          source={HOST_LOCK_CHAINS_IMAGE}
                                          resizeMode="cover"
                                          fadeDuration={0}
                                          style={styles.onlinePanelHostLockChains}
                                        />
                                        <Animated.Image
                                          source={HOST_LOCK_PADLOCK_IMAGE}
                                          resizeMode="contain"
                                          fadeDuration={0}
                                          style={[
                                            styles.onlinePanelHostLockPadlock,
                                            {
                                              transform: [
                                                { translateX: hostPadlockTranslateX },
                                                { translateY: hostPadlockTranslateY },
                                                { rotate: hostPadlockRotate },
                                                { scale: hostPadlockScale },
                                              ],
                                            },
                                          ]}
                                        />
                                      </View>
                                    ) : null}
                                  </LinearGradient>
                                </View>
                              </Pressable>
                            </Animated.View>
                            <Animated.Text
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.72}
                              style={[
                              styles.onlinePanelLabel,
                              isTablet && {
                                top: 49,
                                fontSize: 38,
                                lineHeight: 45,
                              },
                              {
                                  transform: [{ translateY: onlineLabelTranslateY }],
                                },
                              ]}
                            >
                              Online
                            </Animated.Text>
                          </LinearGradient>
                        </Animated.View>
                      </AnimatedPressable>
                    </Animated.View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.tabPage, styles.themeCardsPage, { width: windowWidth }]}>
            {selectedThemeDetail ? (
              <ThemeDetailScreen
                theme={selectedThemeDetail}
                onBack={handleThemeBackPress}
              />
            ) : (
              <ThemeRoadBackground
                isPremium={isPremium}
                onScrollOffsetChange={(offset) => {
                  themeRoadOffsetRef.current = offset;
                }}
                onThemePress={handleRoadThemePress}
              />
            )}
          </View>
        </Animated.View>
      </View>

      {showMainMenuPremiumButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Premium"
              style={[
                styles.mainMenuPremiumButton,
                isTablet && {
                  top: 24,
                  left: 24,
                  width: 54 * tabletScale,
                  height: 54 * tabletScale,
                },
              ]}
          onPress={() => {
            triggerLightJumpHaptic();
            openPremiumModal('menu');
          }}
        >
          <Animated.Image
            source={MAIN_MENU_PREMIUM_CROWN_IMAGE}
            resizeMode="contain"
            style={[
              styles.mainMenuPremiumButtonImage,
              isTablet && {
                width: 54 * tabletScale,
                height: 54 * tabletScale,
              },
              {
                transform: [{ scale: premiumCrownPulse }],
              },
            ]}
          />
        </Pressable>
      ) : null}

      <SkinInspectOverlay
        inspection={skinInspection}
        progress={skinInspectProgress}
        onClose={closeSkinInspect}
      />

      {!selectedThemeDetail ? (
        <View style={styles.bottomNavShell}>
          <View
            style={[
              styles.bottomNavRail,
              isTablet && {
                borderTopWidth: 5,
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bottomNavActiveHighlight,
                {
                  width: tabWidth,
                  minHeight: navMetrics.navHighlightHeight,
                  transform: [{ translateX: activeTabTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={['#FFE56A', '#F3C316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.bottomNavActiveHighlightFill}
              />
            </Animated.View>
            {NAV_ITEMS.map((item) => (
              <HomeTabButton
                key={item.key}
                item={item}
                active={activeTab === item.key}
                onPress={() => handleTabPress(item.key)}
                metrics={navMetrics}
              />
            ))}
          </View>
        </View>
      ) : null}

        <CircularReveal
          ref={revealRef}
          color={revealColor}
          originX={revealOrigin.x}
          originY={revealOrigin.y}
          onComplete={() => {
            const routeName = pendingRouteRef.current;

            if (!routeName) {
              pendingRouteParamsRef.current = null;
              isNavigatingRef.current = false;
              return;
            }

            const routeParams = pendingRouteParamsRef.current ?? {};
            navigation.navigate(routeName, {
              ...routeParams,
              transition: {
                color: revealColor,
                originX: windowWidth / 2,
                originY: windowHeight / 2,
                routeName,
                pauseMs: 280,
                transitionKey: `${routeName}-${Date.now()}`,
              },
            });
            pendingRouteRef.current = null;
            pendingRouteParamsRef.current = null;
            isNavigatingRef.current = false;
          }}
        />
        {themeRevealState.covering ? (
          <CircularReveal
            key={`theme-cover-${pendingThemeDetail?.id ?? 'pending'}`}
            ref={themeCoverRevealRef}
            color={themeRevealState.color}
            originX={themeRevealState.origin.x}
            originY={themeRevealState.origin.y}
            onComplete={handleThemeCoverComplete}
          />
        ) : null}
        {themeRevealState.uncovering ? (
          <CircularReveal
            key={`theme-uncover-${selectedThemeDetail?.id ?? 'detail'}`}
            ref={themeUncoverRevealRef}
            color={themeRevealState.color}
            originX={windowWidth / 2}
            originY={windowHeight / 2}
            initiallyVisible
            initialProgress={0}
            mode="uncover"
            onComplete={() => {
              setThemeRevealState((current) => ({
                ...current,
                uncovering: false,
              }));
            }}
          />
        ) : null}
        <PremiumPaywallModal
          visible={premiumModalVisible}
          onClose={closePremiumModal}
          onUnlocked={() => {
            const source = premiumModalSource;
            closePremiumModal();

            if (source === 'host') {
              handleOnlineOptionPress(
                'HostSetup',
                hostOptionRef,
                latestPressPointRef.current
              );
            }
          }}
          title="Auto Bingo Premium"
          message="Met Premium kun je lobby’s hosten en alle premium thema’s gebruiken. Joinen blijft gratis."
        />
        <Modal
          visible={Boolean(lobbyExitMessage)}
          transparent
          animationType="fade"
          onRequestClose={() => setLobbyExitMessage('')}
        >
          <View style={styles.lobbyNoticeBackdrop}>
            <PopupPanel
              title="Lobby verlaten"
              fontFamily="FredokaOne_400Regular"
              compact
              actions={(
                <View style={styles.lobbyNoticeButtonWrap}>
                <GlossyButton
                  label="Oké"
                  variant="green"
                  heightOverride={58}
                  horizontalPadding={34}
                  onPress={() => setLobbyExitMessage('')}
                />
              </View>
              )}
            >
              {lobbyExitMessage}
            </PopupPanel>
          </View>
        </Modal>
        <Modal
          visible={Boolean(connectionError)}
          transparent
          animationType="fade"
          onRequestClose={() => setConnectionError(null)}
        >
          <View style={styles.lobbyNoticeBackdrop}>
            <PopupPanel
              title={connectionError?.title}
              fontFamily="FredokaOne_400Regular"
              compact
              actionsStyle={styles.connectionErrorActions}
              actions={(
                <View style={styles.lobbyNoticeButtonWrap}>
                  <GlossyButton
                    label="Oké"
                    variant="green"
                    heightOverride={48}
                    horizontalPadding={28}
                    labelFontScale={0.9}
                    onPress={() => setConnectionError(null)}
                  />
                </View>
              )}
            >
              {connectionError?.message ?? ''}
            </PopupPanel>
          </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  emptyTabBackground: {
    backgroundColor: '#FFFFFF',
  },
  themeCardsPage: {
    backgroundColor: '#6fa6e8',
    overflow: 'hidden',
  },
  themeRoadScroll: {
    flex: 1,
    backgroundColor: '#6fa6e8',
  },
  themeRoadScrollContent: {
    alignItems: 'stretch',
    minHeight: '100%',
  },
  themeRoadStage: {
    position: 'relative',
  },
  themeRoadImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  roadThemeCardAnchor: {
    position: 'absolute',
    overflow: 'visible',
  },
  roadThemeCardPressable: {
    flex: 1,
    overflow: 'visible',
  },
  roadThemeCardHeadingWrap: {
    position: 'absolute',
    left: -42,
    right: -42,
    top: -54,
    height: 42,
    zIndex: 2,
  },
  roadThemeCardHeading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
  },
  roadThemeCardHeadingOutline: {
    zIndex: 1,
  },
  roadThemeCardHeadingFill: {
    zIndex: 2,
    color: '#FFFFFF',
  },
  roadThemeCard: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 6,
    overflow: 'hidden',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 10,
    backgroundColor: '#FFFFFF',
  },
  roadThemeCardEmbedded: {
    borderWidth: 0,
    shadowOpacity: 0.18,
    backgroundColor: 'transparent',
  },
  roadThemeCardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  roadThemeCardBodyEmbedded: {
    paddingHorizontal: 0,
    justifyContent: 'flex-start',
  },
  roadThemeCardImageEmbedded: {
    borderRadius: 0,
  },
  roadThemeCardLockLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  roadThemeCardLockedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  roadThemeCardLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  roadThemeCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 25,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.24)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 7,
    zIndex: 3,
  },
  roadThemeCardTitleEmbedded: {
    position: 'absolute',
    top: '5.0%',
    left: '10%',
    right: '10%',
    fontSize: 28,
    lineHeight: 38,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  themeDetailScreen: {
    flex: 1,
  },
  themeDetailShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 25, 43, 0.48)',
  },
  themeDetailBackButtonWrap: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 20,
    elevation: 20,
  },
  themeDetailContent: {
    paddingTop: 86,
    paddingHorizontal: 22,
    paddingBottom: 154,
  },
  themeDetailTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
    marginBottom: 46,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 8,
  },
  themeDetailTitleCompact: {
    fontSize: 42,
    lineHeight: 50,
  },
  themeItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  themeItemTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,253,247,0.74)',
    borderWidth: 2,
    borderColor: 'rgba(58,67,78,0.48)',
  },
  themeItemImage: {
    width: '82%',
    height: '82%',
  },
  themeItemsEmptyState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 2,
    borderColor: 'rgba(80,80,80,0.48)',
  },
  themeItemsEmptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  themeInspectLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  themeInspectBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  themeInspectCell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: 'rgba(58,67,78,0.58)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowRadius: 22,
    elevation: 18,
  },
  tabPagesViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  tabPagesTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  tabPage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  logo: {
    width: '100%',
    height: 361,
    alignSelf: 'center',
    marginTop: -18,
  },
  logoCompact: {
    height: 220,
    marginTop: -8,
  },
  mainMenuPremiumButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    elevation: 60,
  },
  mainMenuPremiumButtonImage: {
    width: 54,
    height: 54,
  },
  joinPlateBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 38,
    elevation: 38,
  },
  joinPlateBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  joinPlateLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 44,
    elevation: 44,
  },
  joinPlateIntro: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  joinPlateIntroTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 26,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(31, 42, 55, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  joinPlateIntroText: {
    marginTop: 2,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(31, 42, 55, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  joinPlateTapTarget: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinPlateImage: {
    width: '100%',
    height: '100%',
  },
  joinPlateCodeRow: {
    position: 'absolute',
    left: '18.2%',
    right: '8.2%',
    top: '25.8%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  joinPlateSlot: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinPlateCharSlot: {
    flex: 1,
  },
  joinPlateDashSlot: {
    flex: 0.36,
  },
  joinPlateSlotText: {
    width: '138%',
    fontFamily: 'KentekenSmits1951',
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
    textShadowColor: 'rgba(17,17,17,0.42)',
    textShadowOffset: { width: 0.6, height: 0 },
    textShadowRadius: 0.2,
  },
  joinPlateWideSlotText: {
    transform: [{ scaleX: 0.86 }],
  },
  joinPlateDashText: {
    opacity: 0.78,
  },
  joinPlateCursor: {
    position: 'absolute',
    bottom: '3%',
    height: 3,
    borderRadius: 3,
    backgroundColor: '#111111',
  },
  joinPlateEndCursor: {
    right: -4,
  },
  joinPlateError: {
    marginTop: -4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(120, 15, 15, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.76)',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  joinPlateHiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    left: 0,
    bottom: 0,
  },
  hubBody: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
  skinRoadScroll: {
    flex: 1,
    backgroundColor: '#7A8E15',
  },
  skinRoadScrollContent: {
    alignItems: 'center',
  },
  skinRoadImage: {
    position: 'absolute',
    alignSelf: 'center',
  },
  skinShopStage: {
    position: 'relative',
    overflow: 'visible',
  },
  skinShopTile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  skinShopTilePressed: {
    transform: [{ scale: 0.97 }],
  },
  skinShopTileHidden: {
    opacity: 0,
  },
  skinShopCarShadow: {
    position: 'absolute',
    bottom: 18,
  },
  skinShopTileShadowMotion: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 72,
  },
  skinShopTileShadow: {
    transform: [{ scaleX: 1.03 }, { scaleY: 0.72 }],
    opacity: 0.9,
  },
  skinShopTileCarMotion: {
    width: '100%',
    height: SKIN_SHOP_TILE_IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  skinShopTileImage: {
    width: `${SKIN_SHOP_TILE_IMAGE_WIDTH_RATIO * 100}%`,
    height: SKIN_SHOP_TILE_IMAGE_HEIGHT,
  },
  challengeSkinMutedImage: {
    opacity: 0.46,
  },
  skinShopChallengeLock: {
    position: 'absolute',
    left: '50%',
    top: 27,
    marginLeft: -38,
    zIndex: 4,
  },
  challengeSkinLockTile: {
    width: 76,
    height: 76,
  },
  challengeSkinLockLarge: {
    width: 152,
    height: 152,
  },
  challengeSkinLockImage: {
    width: '100%',
    height: '100%',
  },
  skinInspectLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  skinInspectBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  skinInspectMovingCar: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinInspectChallengeMovingCar: {
    justifyContent: 'flex-start',
  },
  skinInspectNamedMovingCar: {
    justifyContent: 'flex-start',
  },
  skinInspectMovingShadow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinInspectShadowSvg: {
    position: 'relative',
    bottom: 0,
  },
  skinInspectMovingImage: {
    width: `${SKIN_INSPECT_MOVING_IMAGE_WIDTH_RATIO * 100}%`,
  },
  skinInspectFutureImage: {
    opacity: 0.92,
  },
  skinInspectChallengeLock: {
    position: 'absolute',
    top: '24%',
    left: '50%',
    marginLeft: -76,
    zIndex: 5,
  },
  skinInspectChallengeTextBlock: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 8,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 32, 52, 0.86)',
    borderWidth: 2,
    borderColor: 'rgba(136, 221, 255, 0.74)',
  },
  skinInspectNameBlock: {
    position: 'absolute',
    left: 34,
    right: 34,
    bottom: 10,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 32, 52, 0.84)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  skinInspectChallengeName: {
    width: '100%',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skinInspectChallengeText: {
    width: '100%',
    marginTop: 4,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 15,
    lineHeight: 20,
    color: '#BDEFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skinInspectFutureText: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 28, 40, 0.82)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionsArea: {
    height: HOME_ACTION_EXPANDED_HEIGHT,
    marginBottom: 18,
    position: 'relative',
    transform: [{ translateY: -80 }],
  },
  actionRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: HOME_ACTION_EXPANDED_HEIGHT - HOME_ACTION_COLLAPSED_HEIGHT,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    zIndex: 30,
    elevation: 30,
  },
  actionButtonWrap: {
    paddingTop: 34,
    position: 'relative',
    zIndex: 30,
    elevation: 30,
  },
  playButtonWrap: {
    zIndex: 8,
    elevation: 8,
  },
  onlineButtonWrap: {
    zIndex: 12,
    elevation: 12,
  },
  onlinePanelPressable: {
    position: 'relative',
    alignSelf: 'stretch',
    overflow: 'visible',
    shadowColor: ONLINE_RED_OUTLINE,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  onlinePanelOutline: {
    flex: 1,
    paddingTop: 3,
    paddingLeft: 3,
    paddingRight: 3,
    paddingBottom: 3,
    backgroundColor: ONLINE_RED_OUTLINE,
  },
  onlinePanelBody: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    borderRadius: 22,
  },
  onlinePanelGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  onlinePanelChoices: {
    position: 'absolute',
    top: 42,
    left: 14,
    right: 14,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  onlinePanelChoice: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlinePanelMiniButtonOutline: {
    width: '86%',
    height: 48,
    paddingTop: 2,
    paddingLeft: 2,
    paddingRight: 2,
    paddingBottom: 2,
    borderRadius: 12,
    backgroundColor: ONLINE_RED_OUTLINE,
    shadowColor: ONLINE_RED_OUTLINE,
    shadowOpacity: 0.75,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  onlinePanelMiniButtonBody: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  onlinePanelMiniButtonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  onlinePanelMiniButtonLockedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    zIndex: 2,
  },
  onlinePanelHostLockLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  onlinePanelHostLockChains: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  onlinePanelHostLockPadlock: {
    position: 'absolute',
    width: '48%',
    height: '118%',
    left: '26%',
    top: '-9%',
    zIndex: 4,
  },
  onlinePanelChoiceText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 21,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: '#8e1212',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  onlinePanelChoiceTextLocked: {
    color: 'rgba(255, 232, 232, 0.72)',
    textShadowColor: 'rgba(80, 8, 8, 0.74)',
  },
  onlinePanelLabel: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 39,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: '#8e1212',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },
  actionImageBadge: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 12,
    elevation: 12,
    pointerEvents: 'none',
  },
  onlineImageBadge: {
    top: -30,
  },
  onlineCarsStage: {
    width: 168,
    height: 124,
    position: 'relative',
  },
  playActionImage: {
    width: 124,
    height: 86,
  },
  onlineCarImage: {
    position: 'absolute',
  },
  onlineYellowCar: {
    width: 98,
    height: 69,
    left: 14,
    top: 40,
    zIndex: 2,
  },
  onlineBlueCar: {
    width: 114,
    height: 80,
    left: 45,
    top: 42,
    zIndex: 3,
  },
  onlineGreenCar: {
    width: 105,
    height: 74,
    left: 52,
    top: 24,
    zIndex: 1,
  },
  tabPanel: {
    flex: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  panelHeader: {
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  panelEyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#F4FFB1',
  },
  panelTitle: {
    marginTop: 2,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 32,
    color: '#FFFFFF',
    textShadowColor: 'rgba(4, 42, 20, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  panelSubtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.92)',
  },
  skinCarousel: {
    marginTop: 6,
  },
  themeCarousel: {
    marginTop: 2,
  },
  skinCard: {
    borderRadius: 30,
    borderWidth: 4,
    overflow: 'hidden',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 9,
  },
  skinCardFocused: {
    transform: [{ translateY: -6 }],
  },
  skinCardInner: {
    minHeight: 292,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 72, 35, 0.84)',
  },
  skinCardGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    top: 36,
    opacity: 0.18,
  },
  skinCardImage: {
    width: 170,
    height: 170,
  },
  skinCardTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 22,
    color: '#FFFFFF',
  },
  skinCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  skinCardDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  skinCardFooterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F5FFF5',
  },
  detailPanel: {
    marginTop: 14,
    borderRadius: 26,
    padding: 18,
    backgroundColor: 'rgba(8, 68, 32, 0.78)',
    borderWidth: 2,
    borderColor: 'rgba(212,255,149,0.34)',
    shadowColor: '#07301A',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },
  detailPanelTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 23,
    color: '#FFFFFF',
  },
  detailPanelText: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(245,255,245,0.92)',
  },
  themeShowcaseCard: {
    borderRadius: 28,
    borderWidth: 4,
    overflow: 'hidden',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 9,
  },
  themeShowcaseCardEmbedded: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  themeShowcaseCardFocused: {
    transform: [{ translateY: -6 }],
  },
  themeShowcaseCardBody: {
    minHeight: 250,
    justifyContent: 'flex-end',
    padding: 18,
  },
  themeShowcaseCardBodyEmbedded: {
    padding: 0,
    justifyContent: 'flex-start',
  },
  themeShowcaseCardImage: {
    borderRadius: 24,
  },
  themeShowcaseCardImageEmbedded: {
    borderRadius: 0,
  },
  themeShowcaseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 31, 43, 0.16)',
  },
  themeShowcaseTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  themeShowcaseTitleEmbedded: {
    position: 'absolute',
    top: 12,
    left: 24,
    right: 24,
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#1F2A34',
  },
  lockBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFE17D',
  },
  themeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  themeStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#CFF26B',
  },
  themeStatusBadgePremium: {
    backgroundColor: '#2A2D59',
  },
  themeStatusBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1B4B13',
  },
  themeStatusBadgeTextPremium: {
    color: '#FFE180',
  },
  itemPreviewStage: {
    marginTop: 16,
    minHeight: 160,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  itemPreviewImage: {
    width: 120,
    height: 120,
  },
  itemPreviewCaption: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: '#EFFFE5',
  },
  itemStrip: {
    gap: 10,
    paddingTop: 12,
    paddingBottom: 4,
  },
  itemThumb: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemThumbActive: {
    borderColor: '#D9FF71',
    transform: [{ translateY: -2 }],
  },
  itemThumbImage: {
    width: 42,
    height: 42,
  },
  emptyItemsState: {
    marginTop: 14,
    minHeight: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyItemsStateText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
  },
  bottomNavShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  bottomNavRail: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: '#1573E0',
    borderTopWidth: 4,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#0F57B8',
    shadowColor: '#0D4B98',
    shadowOpacity: 0.22,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowRadius: 10,
    elevation: 8,
    overflow: 'visible',
  },
  bottomNavButton: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  bottomNavButtonCenter: {
    marginTop: 0,
  },
  bottomNavButtonActive: {
    transform: [{ translateY: 0 }],
  },
  bottomNavButtonCenterActive: {
    transform: [{ translateY: 0 }],
  },
  bottomNavButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 118,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  bottomNavButtonInnerCenter: {
    minHeight: 118,
    borderRadius: 0,
  },
  bottomNavActiveHighlight: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    minHeight: 136,
    marginTop: -18,
    zIndex: 0,
  },
  bottomNavActiveHighlightFill: {
    flex: 1,
    borderTopWidth: 4,
    borderTopColor: '#FFF1A8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#C99B10',
    shadowOpacity: 0.18,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowRadius: 6,
    elevation: 10,
  },
  bottomNavIconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B3770',
    shadowOpacity: 0.24,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowRadius: 8,
    elevation: 6,
  },
  bottomNavIconWrapActive: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#153F74',
    shadowOpacity: 0.34,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowRadius: 12,
    elevation: 10,
  },
  homeNavIconImage: {
    width: 60,
    height: 60,
  },
  lobbyNoticeBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(7, 12, 18, 0.58)',
  },
  lobbyNoticeButtonWrap: {
    minWidth: 132,
  },
  connectionErrorActions: {
    marginTop: 8,
    transform: [{ translateY: -6 }],
  },
});
