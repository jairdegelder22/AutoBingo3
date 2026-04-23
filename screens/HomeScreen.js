import { BackHandler, Animated, Easing, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import CircularReveal from '../components/CircularReveal';
import GlossyButton from '../src/components/GlossyButton';
import ThemeCarousel from '../src/components/ThemeCarousel';
import { PLAYER_HEX, PLAYER_IMAGES } from '../assets/images/players/playerImages';
import { getThemeCardImage } from '../assets/images/theme-cards/themeCardImages';
import { SKIN_OPTIONS } from './gameFlowConfig';
import { THEMES } from './themeCatalog';
import { getThemeIcons } from './themeIcons';

const PLAY_BUTTON_IMAGE = require('../assets/images/home-online-button.png');
const ONLINE_YELLOW_CAR = require('../assets/images/online-car-yellow.png');
const ONLINE_BLUE_CAR = require('../assets/images/online-car-blue.png');
const ONLINE_GREEN_CAR = require('../assets/images/online-car-green.png');
const SKIN_ROAD_BACKGROUND = require('../assets/images/backgrounds/skin-road-background.png');
const SKIN_ROAD_IMAGE_RATIO = 1920 / 819;
const SKIN_ROAD_REPEAT_COUNT = 2;
const HOME_TAB_HOME = 'home';
const HOME_TAB_SKINSHOP = 'skinshop';
const HOME_TAB_THEMECARDS = 'themecards';

const SKIN_LABELS = {
  rood: 'Rode racer',
  blauw: 'Blauwe cruise',
  groen: 'Groene turbo',
  geel: 'Gele starter',
  oranje: 'Oranje sprint',
  paars: 'Paarse neon',
  roze: 'Roze pop',
  lichtblauw: 'Sky rider',
  zwart: 'Night rider',
  wit: 'Snow rider',
};

const NAV_ITEMS = [
  { key: HOME_TAB_SKINSHOP, label: 'Skinshop', icon: 'palette', accent: '#FF8C42' },
  { key: HOME_TAB_HOME, label: 'Home', icon: 'house', accent: '#C8F122', center: true },
  { key: HOME_TAB_THEMECARDS, label: 'Kaarten', icon: 'checkerboard', accent: '#F2C94C' },
];

const SKIN_SHOP_ITEMS = SKIN_OPTIONS.map((skin) => ({
  id: skin,
  label: SKIN_LABELS[skin] ?? skin,
  color: PLAYER_HEX[skin] ?? '#FFFFFF',
  image: PLAYER_IMAGES[skin],
}));

const THEME_SHOWCASE_ITEMS = THEMES.map((theme) => ({
  ...theme,
  previewImage: getThemeCardImage(theme.id),
  previewItems: theme.id === 'winter' ? [] : getThemeIcons(theme.id).slice(0, 10),
  itemCount: theme.id === 'winter' ? 0 : getThemeIcons(theme.id).length,
}));

function HomeNavIcon({ icon, active }) {
  const stroke = active ? '#1B4F9B' : '#F7D43A';
  const duotone = active ? 'rgba(27,79,155,0.18)' : 'rgba(247,212,58,0.24)';

  if (icon === 'house') {
    return (
      <Svg width={60} height={60} viewBox="0 0 256 256">
        <Path
          d="M40 216H216V120a8 8 0 0 0-2.34-5.66l-80-80a8 8 0 0 0-11.32 0l-80 80A8 8 0 0 0 40 120Z"
          fill={duotone}
        />
        <Path
          d="M40 216H216V120a8 8 0 0 0-2.34-5.66l-80-80a8 8 0 0 0-11.32 0l-80 80A8 8 0 0 0 40 120Z"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={16}
        />
      </Svg>
    );
  }

  if (icon === 'palette') {
    return (
      <Svg width={60} height={60} viewBox="0 0 256 256">
        <Path
          d="M128 192a24 24 0 0 1 24-24h46.21a24 24 0 0 0 23.4-18.65A96.48 96.48 0 0 0 224 127.17c-.45-52.82-44.16-95.7-97-95.17a96 96 0 0 0-95 96c0 41.81 26.73 73.44 64 86.61A24 24 0 0 0 128 192Z"
          fill={duotone}
        />
        <Path
          d="M128 192a24 24 0 0 1 24-24h46.21a24 24 0 0 0 23.4-18.65A96.48 96.48 0 0 0 224 127.17c-.45-52.82-44.16-95.7-97-95.17a96 96 0 0 0-95 96c0 41.81 26.73 73.44 64 86.61A24 24 0 0 0 128 192Z"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={16}
        />
        <Circle cx={128} cy={76} r={12} fill={stroke} />
        <Circle cx={84} cy={100} r={12} fill={stroke} />
        <Circle cx={84} cy={156} r={12} fill={stroke} />
        <Circle cx={172} cy={100} r={12} fill={stroke} />
      </Svg>
    );
  }

  return (
    <Svg width={60} height={60} viewBox="0 0 256 256">
      <Path d="M40 128h88v88H48a8 8 0 0 1-8-8Z" fill={duotone} />
      <Path d="M128 40h80a8 8 0 0 1 8 8v80H128Z" fill={duotone} />
      <Rect
        x={40}
        y={40}
        width={176}
        height={176}
        rx={8}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
      />
      <Line
        x1={128}
        y1={40}
        x2={128}
        y2={216}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
      />
      <Line
        x1={216}
        y1={128}
        x2={40}
        y2={128}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
      />
    </Svg>
  );
}

function HomeTabButton({ item, active, onPress }) {
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
        ]}
      >
        <View style={[styles.bottomNavIconWrap, active && styles.bottomNavIconWrapActive]}>
          <HomeNavIcon icon={item.icon} active={active} />
        </View>
      </View>
    </Pressable>
  );
}

function SkinRoadBackground() {
  const { width } = useWindowDimensions();
  const imageHeight = width * SKIN_ROAD_IMAGE_RATIO;
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
              width,
              height: imageHeight,
            },
          ]}
        />
      ))}
    </ScrollView>
  );
}

function ThemeCardsPanel({ selectedThemeIndex, onSelectTheme, selectedItemIndex, onSelectItem }) {
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
        itemWidth={252}
        containerStyle={styles.themeCarousel}
        renderCard={({ item, isFocused }) => (
          <View
            style={[
              styles.themeShowcaseCard,
              { borderColor: item.cardBorder ?? item.bg, shadowColor: item.cardBorder ?? item.bg },
              isFocused && styles.themeShowcaseCardFocused,
            ]}
          >
            {item.previewImage ? (
              <ImageBackground
                source={item.previewImage}
                resizeMode="cover"
                imageStyle={styles.themeShowcaseCardImage}
                style={styles.themeShowcaseCardBody}
              >
                <View style={styles.themeShowcaseOverlay} />
                <Text style={[styles.themeShowcaseTitle, item.id === 'winter' && styles.themeShowcaseTitleDark]}>
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
                <Text style={[styles.themeShowcaseTitle, item.id === 'winter' && styles.themeShowcaseTitleDark]}>
                  {item.label}
                </Text>
              </LinearGradient>
            )}
          </View>
        )}
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

function DropdownOption({ label, subtitle, position, onPress }) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 45,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.dropdownOptionWrap,
        {
          transform: [
            {
              translateY: pressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
            },
            {
              scale: pressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.985],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <LinearGradient
          colors={
            position === 'top'
              ? ['#ff8f8f', '#f25050', '#cf2020', '#9f1010']
              : ['#ff7f7f', '#e74343', '#bc1a1a', '#8d0d0d']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.dropdownOptionBody,
            position === 'top' ? styles.dropdownOptionBodyTop : styles.dropdownOptionBodyBottom,
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.52)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.dropdownOptionGloss}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.04)']}
            locations={[0, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.dropdownOptionGlossPill}
          />
          <View style={styles.dropdownOptionContent}>
            <Text style={styles.dropdownOptionTitle}>{label}</Text>
            {subtitle ? <Text style={styles.dropdownOptionSubtitle}>{subtitle}</Text> : null}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
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

export default function HomeScreen({ navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(1)).current;
  const playCarJump = useRef(new Animated.Value(0)).current;
  const onlineYellowJump = useRef(new Animated.Value(0)).current;
  const onlineBlueJump = useRef(new Animated.Value(0)).current;
  const onlineGreenJump = useRef(new Animated.Value(0)).current;
  const onlineMenuOpacity = useRef(new Animated.Value(0)).current;
  const onlineMenuTranslateY = useRef(new Animated.Value(-10)).current;
  const onlineMenuScale = useRef(new Animated.Value(0.96)).current;
  const isNavigatingRef = useRef(false);
  const revealRef = useRef(null);
  const playButtonWrapRef = useRef(null);
  const onlineButtonWrapRef = useRef(null);
  const hostOptionRef = useRef(null);
  const joinOptionRef = useRef(null);
  const pendingRouteRef = useRef(null);
  const latestPressPointRef = useRef(null);
  const activeTabTranslateX = useRef(new Animated.Value(0)).current;
  const [revealOrigin, setRevealOrigin] = useState({ x: 0, y: 0 });
  const [revealColor, setRevealColor] = useState('#F5C400');
  const [isOnlineMenuVisible, setIsOnlineMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(HOME_TAB_HOME);
  const [selectedSkinIndex, setSelectedSkinIndex] = useState(0);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [selectedThemeItemIndex, setSelectedThemeItemIndex] = useState(0);
  const tabWidth = windowWidth / NAV_ITEMS.length;
  const isSkinTab = activeTab === HOME_TAB_SKINSHOP;

  useEffect(() => {
    const activeIndex = NAV_ITEMS.findIndex((item) => item.key === activeTab);
    const nextTranslateX = Math.max(activeIndex, 0) * tabWidth;

    Animated.spring(activeTabTranslateX, {
      toValue: nextTranslateX,
      useNativeDriver: true,
      speed: 16,
      bounciness: 8,
    }).start();
  }, [activeTab, activeTabTranslateX, tabWidth]);

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

  const closeOnlineMenu = () => {
    Animated.parallel([
      Animated.timing(onlineMenuOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(onlineMenuTranslateY, {
        toValue: -14,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(onlineMenuScale, {
        toValue: 0.96,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsOnlineMenuVisible(false);
      }
    });
  };

  const openOnlineMenu = () => {
    setIsOnlineMenuVisible(true);
    onlineMenuOpacity.setValue(0);
    onlineMenuTranslateY.setValue(-18);
    onlineMenuScale.setValue(0.94);

    Animated.parallel([
      Animated.timing(onlineMenuOpacity, {
        toValue: 1,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(onlineMenuTranslateY, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(onlineMenuScale, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerReveal = async ({ targetRef, color, routeName, origin }) => {
    const center = origin ?? latestPressPointRef.current ?? await measureViewCenter(targetRef);

    pendingRouteRef.current = routeName;
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

    openOnlineMenu();
  };

  const handleOnlineOptionPress = (routeName, targetRef, origin) => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    triggerLightJumpHaptic();
    buildJumpAnimation(onlineYellowJump).start();

    setTimeout(() => {
      triggerLightJumpHaptic();
      buildJumpAnimation(onlineBlueJump).start();
    }, 95);

    setTimeout(() => {
      triggerLightJumpHaptic();
      buildJumpAnimation(onlineGreenJump).start(({ finished }) => {
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
      });
    }, 190);
  };

  const handleTabPress = (tabKey) => {
    if (activeTab === tabKey) {
      return;
    }

    void Haptics.selectionAsync();

    if (isOnlineMenuVisible) {
      closeOnlineMenu();
    }

    setActiveTab(tabKey);
  };

  const handleThemeSelect = (index) => {
    setSelectedThemeIndex(index);
    setSelectedThemeItemIndex(0);
  };

  return (
    <View style={[styles.background, isSkinTab && styles.emptyTabBackground]}>
      {!isSkinTab ? (
        <ImageBackground
          source={require('../assets/homepage.png')}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[styles.overlay, isSkinTab && styles.skinTabOverlay]}>
        {!isSkinTab ? (
          <Animated.Image
            source={require('../assets/logo.png')}
            resizeMode="contain"
            style={[
              styles.logo,
              activeTab !== HOME_TAB_HOME && styles.logoCompact,
              { transform: [{ scale: pulse }] },
            ]}
          />
        ) : null}

        <View style={[styles.hubBody, isSkinTab && styles.skinTabHubBody]}>
          {activeTab === HOME_TAB_HOME ? (
            <View style={styles.actionsArea}>
              <View style={styles.actionRow}>
                <View ref={playButtonWrapRef} collapsable={false} style={styles.actionButtonWrap}>
                  <View style={styles.actionImageBadge}>
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
                    heightOverride={88}
                    hapticStyle={Haptics.ImpactFeedbackStyle.Heavy}
                    onPressIn={(event) => {
                      latestPressPointRef.current = {
                        x: event.nativeEvent.pageX,
                        y: event.nativeEvent.pageY,
                      };
                    }}
                    onPress={handlePlayPress}
                  />
                </View>

                <View ref={onlineButtonWrapRef} collapsable={false} style={styles.actionButtonWrap}>
                  {isOnlineMenuVisible ? (
                    <Animated.View
                      style={[
                        styles.onlineMenu,
                        {
                          opacity: onlineMenuOpacity,
                          transform: [
                            { translateY: onlineMenuTranslateY },
                            { scale: onlineMenuScale },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.onlineMenuConnector} />
                      <View ref={hostOptionRef} collapsable={false}>
                        <DropdownOption
                          label="Host"
                          position="top"
                          onPress={(event) => handleOnlineOptionPress('HostSetup', hostOptionRef, {
                            x: event.nativeEvent.pageX,
                            y: event.nativeEvent.pageY,
                          })}
                        />
                      </View>
                      <View ref={joinOptionRef} collapsable={false}>
                        <DropdownOption
                          label="Join"
                          position="bottom"
                          onPress={(event) => handleOnlineOptionPress('Join', joinOptionRef, {
                            x: event.nativeEvent.pageX,
                            y: event.nativeEvent.pageY,
                          })}
                        />
                      </View>
                    </Animated.View>
                  ) : null}
                  <View style={[styles.actionImageBadge, styles.onlineImageBadge]}>
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
                  </View>
                  <GlossyButton
                    label="Online"
                    variant="red"
                    size="large"
                    labelOffsetY={0}
                    contentOffsetY={12}
                    horizontalPadding={24}
                    heightOverride={88}
                    hapticStyle={Haptics.ImpactFeedbackStyle.Light}
                    onPressIn={(event) => {
                      latestPressPointRef.current = {
                        x: event.nativeEvent.pageX,
                        y: event.nativeEvent.pageY,
                      };
                    }}
                    onPress={handleOnlinePress}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {activeTab === HOME_TAB_SKINSHOP ? <SkinRoadBackground /> : null}

        </View>

        <View style={styles.bottomNavShell}>
          <View style={styles.bottomNavRail}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bottomNavActiveHighlight,
                {
                  width: tabWidth,
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
              />
            ))}
          </View>
        </View>

        <CircularReveal
          ref={revealRef}
          color={revealColor}
          originX={revealOrigin.x}
          originY={revealOrigin.y}
          onComplete={() => {
            const routeName = pendingRouteRef.current;

            if (!routeName) {
              isNavigatingRef.current = false;
              return;
            }

            navigation.navigate(routeName, {
              transition: {
                color: revealColor,
                originX: revealOrigin.x,
                originY: revealOrigin.y,
                routeName,
                pauseMs: 280,
                transitionKey: `${routeName}-${Date.now()}`,
              },
            });
            pendingRouteRef.current = null;
            isNavigatingRef.current = false;
          }}
        />
      </View>
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
  overlay: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  skinTabOverlay: {
    paddingTop: 0,
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
  hubBody: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
  skinTabHubBody: {
    paddingHorizontal: 0,
  },
  skinRoadScroll: {
    flex: 1,
    backgroundColor: '#7A8E15',
  },
  skinRoadScrollContent: {
    alignItems: 'stretch',
  },
  skinRoadImage: {
    alignSelf: 'stretch',
  },
  actionsArea: {
    marginBottom: 18,
    transform: [{ translateY: -80 }],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 14,
    zIndex: 10,
  },
  actionButtonWrap: {
    flex: 1,
    paddingTop: 34,
    position: 'relative',
    zIndex: 10,
  },
  onlineMenu: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 116,
    zIndex: 6,
    gap: 4,
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#6f0c0c',
    shadowColor: '#6f1212',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 7,
  },
  onlineMenuConnector: {
    position: 'absolute',
    top: -10,
    right: 22,
    width: 44,
    height: 18,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#6f0c0c',
  },
  dropdownOptionWrap: {
    borderRadius: 16,
  },
  dropdownOptionBody: {
    borderRadius: 15,
    overflow: 'hidden',
    minHeight: 62,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dropdownOptionBodyTop: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dropdownOptionBodyBottom: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dropdownOptionGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownOptionGlossPill: {
    position: 'absolute',
    top: 4,
    left: 16,
    right: 16,
    height: 12,
    borderRadius: 999,
  },
  dropdownOptionContent: {
    alignItems: 'center',
    gap: 1,
    zIndex: 2,
  },
  dropdownOptionTitle: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 20,
    color: '#fff7f7',
    textShadowColor: 'rgba(86, 8, 8, 0.34)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dropdownOptionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,245,245,0.9)',
  },
  actionImageBadge: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
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
  themeShowcaseCardFocused: {
    transform: [{ translateY: -6 }],
  },
  themeShowcaseCardBody: {
    minHeight: 250,
    justifyContent: 'flex-end',
    padding: 18,
  },
  themeShowcaseCardImage: {
    borderRadius: 24,
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
  themeShowcaseTitleDark: {
    color: '#274154',
    textShadowColor: 'rgba(255,255,255,0.18)',
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
  },
  bottomNavIconWrapActive: {
    transform: [{ scale: 1.02 }],
  },
});
