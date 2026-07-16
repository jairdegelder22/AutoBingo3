import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlossyButton from '../src/components/GlossyButton';
import WarmupImages from '../src/components/WarmupImages';
import * as Haptics from '../src/settings/haptics';
import { useAppSettings } from '../src/settings/AppSettingsContext';
import { usePremium } from '../src/premium/PremiumContext';
import PremiumPaywallModal from '../src/premium/PremiumPaywallModal';
import { hasPremiumEntitlement } from '../src/premium/revenueCatClient';
import { getResponsiveMetrics } from '../src/utils/responsive';
import { LEGAL_URLS } from '../src/legal/legalConfig';
import { redeemUnlockCode } from '../src/unlocks/unlockCodes';
import { SETTINGS_ASSETS } from '../src/assets/preloadManifest';

const SETTINGS_MENU_IMAGE = require('../assets/images/settings/settings-menu-panel.png');
const SETTINGS_LANGUAGE_IMAGE = require('../assets/images/settings/settings-language.png');
const SETTINGS_TUTORIAL_IMAGE = require('../assets/images/settings/settings-tutorial.png');
const SETTINGS_PRIVACY_IMAGE = require('../assets/images/settings/settings-privacy.png');
const SETTINGS_PREMIUM_RESTORE_IMAGE = require('../assets/images/settings/settings-premium-restore.png');
const SETTINGS_PREMIUM_IMAGE = require('../assets/images/premium/main-menu-premium-crown.png');
const CODE_ENTRY_MENU_IMAGE = require('../assets/images/settings/code-invoeren-menu.png');
const SFX_ON_IMAGE = require('../assets/images/settings/toggles/sfx-on.png');
const SFX_OFF_IMAGE = require('../assets/images/settings/toggles/sfx-off.png');
const MUSIC_ON_IMAGE = require('../assets/images/settings/toggles/music-on.png');
const MUSIC_OFF_IMAGE = require('../assets/images/settings/toggles/music-off.png');
const HAPTICS_ON_IMAGE = require('../assets/images/settings/toggles/haptics-on.png');
const HAPTICS_OFF_IMAGE = require('../assets/images/settings/toggles/haptics-off.png');
const SETTING_ON_BADGE_IMAGE = require('../assets/images/settings/toggles/state-on.png');
const SETTING_OFF_BADGE_IMAGE = require('../assets/images/settings/toggles/state-off.png');
const APP_VERSION = require('../app.json').expo.version;

const SETTINGS_MENU_ASPECT_RATIO = 975 / 1614;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SettingsScreen({ navigation, onClose, visible = true }) {
  const { settings, updateSetting } = useAppSettings();
  const {
    available: premiumAvailable,
    customerInfo,
    isPremium,
    restorePremiumPurchases,
    unlockPremiumWithCode,
  } = usePremium();
  const { width, height } = useWindowDimensions();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [menuImageReady, setMenuImageReady] = useState(!visible);
  const menuProgress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const { isTablet } = getResponsiveMetrics(width, height);
  const menuWidth = isTablet
    ? Math.min(width - 20, height * SETTINGS_MENU_ASPECT_RATIO * 0.95, 560)
    : Math.min(width - 10, height * SETTINGS_MENU_ASPECT_RATIO * 0.94, 430);
  const menuHeight = menuWidth / SETTINGS_MENU_ASPECT_RATIO;
  const menuScale = menuWidth / 975;
  const scaled = (value) => value * menuScale;
  const closeSettings = onClose ?? (() => navigation.goBack());
  const handleSettingsWarmupReady = useCallback(() => {
    setMenuImageReady(true);
  }, []);

  useEffect(() => {
    menuProgress.stopAnimation();

    if (visible) {
      if (!menuImageReady) {
        menuProgress.setValue(0);
        return;
      }

      menuProgress.setValue(0);
      Animated.timing(menuProgress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(menuProgress, {
      toValue: 0,
      duration: 130,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [menuImageReady, menuProgress, visible]);

  useEffect(() => {
    if (!visible) {
      setPremiumModalVisible(false);
      setCodeModalVisible(false);
      setMenuImageReady(false);
    }
  }, [visible]);

  async function handleRestorePremium() {
    if (restoreInProgress) {
      return;
    }

    if (!premiumAvailable) {
      Alert.alert('Premium herstellen', 'Aankopen herstellen is nog niet beschikbaar in deze build.');
      return;
    }

    setRestoreInProgress(true);

    try {
      const info = await restorePremiumPurchases();

      if (hasPremiumEntitlement(info)) {
        Alert.alert('Premium herstellen', 'Aankopen hersteld.');
        return;
      }

      Alert.alert('Premium herstellen', 'Geen actieve premium aankoop gevonden.');
    } catch (_error) {
      Alert.alert('Premium herstellen', 'Herstellen lukt nu niet. Probeer het zo opnieuw.');
    } finally {
      setRestoreInProgress(false);
    }
  }

  async function openPremiumManagementUrl() {
    const managementUrl = customerInfo?.managementURL
      ?? (Platform.OS === 'ios'
        ? 'itms-apps://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions');

    try {
      const canOpen = await Linking.canOpenURL(managementUrl);

      if (!canOpen) {
        throw new Error('Subscription management URL unavailable.');
      }

      await Linking.openURL(managementUrl);
    } catch (_error) {
      const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
      Alert.alert(
        'Premium beheren',
        `Open de ${storeName} en ga naar je abonnementen om Auto Bingo Premium te beheren.`
      );
    }
  }

  async function openLegalUrl(url) {
    try {
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert('Link openen lukt niet', 'Probeer het later opnieuw.');
    }
  }

  function handlePremiumPress() {
    if (!isPremium) {
      setPremiumModalVisible(true);
      return;
    }

    const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

    Alert.alert(
      'Premium beheren',
      `Je premium is actief. Stopzetten of aanpassen loopt via je ${storeName}-abonnementen.`,
      [
        { text: 'Sluiten', style: 'cancel' },
        {
          text: `Open ${storeName}`,
          onPress: () => {
            void openPremiumManagementUrl();
          },
        },
      ]
    );
  }

  async function handleRedeemCode(code) {
    return redeemUnlockCode(code, { unlockPremiumWithCode });
  }

  const shortcutButtons = [
    {
      key: 'language',
      label: 'Taal',
      icon: SETTINGS_LANGUAGE_IMAGE,
      onPress: () => Alert.alert('Taal', 'Taalinstellingen komen later.'),
    },
    {
      key: 'premium',
      label: isPremium ? 'Premium beheren' : 'Premium',
      icon: SETTINGS_PREMIUM_IMAGE,
      onPress: handlePremiumPress,
    },
    {
      key: 'tutorial',
      label: 'Tutorial',
      icon: SETTINGS_TUTORIAL_IMAGE,
      onPress: () => Alert.alert('Tutorial', 'Tutorial komt later.'),
    },
    {
      key: 'restore-premium',
      label: restoreInProgress ? 'Laden...' : 'Premium herstellen',
      icon: SETTINGS_PREMIUM_RESTORE_IMAGE,
      onPress: handleRestorePremium,
    },
    {
      key: 'redeem-code',
      label: 'Code invoeren',
      icon: null,
      onPress: () => setCodeModalVisible(true),
    },
  ];

  const menuAnimatedStyle = {
    opacity: menuProgress,
    transform: [
      {
        scale: menuProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.965, 1],
        }),
      },
      {
        translateY: menuProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeSettings}>
      <View style={styles.screen}>
        <WarmupImages
          assets={SETTINGS_ASSETS}
          active={visible}
          timeoutMs={null}
          imageSize={128}
          batchSize={16}
          onReady={handleSettingsWarmupReady}
        />
        <Pressable style={styles.dismissBackdrop} onPress={closeSettings} />

        <Animated.View
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[styles.menuWrap, menuAnimatedStyle]}
        >
          <ImageBackground
            source={SETTINGS_MENU_IMAGE}
            resizeMode="stretch"
            style={[styles.menu, { width: menuWidth, height: menuHeight }]}
            fadeDuration={0}
            onLoadEnd={() => setMenuImageReady(true)}
          >
            <View
              style={[
                styles.topToggles,
                {
                  top: scaled(134),
                  left: scaled(38),
                  right: scaled(38),
                  gap: scaled(28),
                },
              ]}
            >
              <MiniToggleButton
                label="SFX"
                active={settings.soundEffectsEnabled}
                activeIcon={SFX_ON_IMAGE}
                inactiveIcon={SFX_OFF_IMAGE}
                onPress={() => updateSetting('soundEffectsEnabled', !settings.soundEffectsEnabled)}
                width={scaled(246)}
                height={scaled(226)}
                fontSize={scaled(49)}
                iconSize={scaled(170)}
                badgeSize={scaled(70)}
              />
              <MiniToggleButton
                label="Muziek"
                active={settings.musicEnabled}
                activeIcon={MUSIC_ON_IMAGE}
                inactiveIcon={MUSIC_OFF_IMAGE}
                onPress={() => updateSetting('musicEnabled', !settings.musicEnabled)}
                width={scaled(246)}
                height={scaled(226)}
                fontSize={scaled(46)}
                iconSize={scaled(170)}
                badgeSize={scaled(70)}
              />
              <MiniToggleButton
                label="Trilling"
                active={settings.hapticsEnabled}
                activeIcon={HAPTICS_ON_IMAGE}
                inactiveIcon={HAPTICS_OFF_IMAGE}
                onPress={() => updateSetting('hapticsEnabled', !settings.hapticsEnabled)}
                width={scaled(246)}
                height={scaled(226)}
                fontSize={scaled(46)}
                iconSize={scaled(170)}
                badgeSize={scaled(70)}
              />
            </View>

            <View
              style={[
                styles.shortcutStack,
                {
                  top: scaled(408),
                  left: scaled(122),
                  right: scaled(122),
                  gap: scaled(62),
                },
              ]}
            >
              {shortcutButtons.map((button) => (
                <SettingsShortcutButton
                  key={button.key}
                  label={button.label}
                  icon={button.icon}
                  onPress={button.onPress}
                  height={scaled(132)}
                  iconSize={scaled(112)}
                  iconRight={scaled(30)}
                />
              ))}
            </View>

            <Text
              style={[
                styles.versionText,
                {
                  bottom: scaled(68),
                  left: scaled(140),
                  right: scaled(140),
                  fontSize: scaled(26),
                  lineHeight: scaled(32),
                },
              ]}
            >
              Versie {APP_VERSION}
            </Text>

            <View
              style={[
                styles.legalLinks,
                {
                  bottom: scaled(112),
                  left: scaled(116),
                  right: scaled(116),
                  gap: scaled(12),
                },
              ]}
            >
              <LegalLink
                label="Gebruiksvoorwaarden"
                fontSize={scaled(25)}
                onPress={() => {
                  void openLegalUrl(LEGAL_URLS.terms);
                }}
              />
              <LegalLink
                label="Privacybeleid"
                fontSize={scaled(25)}
                onPress={() => {
                  void openLegalUrl(LEGAL_URLS.privacy);
                }}
              />
            </View>
          </ImageBackground>
        </Animated.View>
      </View>
      <PremiumPaywallModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onUnlocked={() => setPremiumModalVisible(false)}
      />
      <UnlockCodeModal
        visible={codeModalVisible}
        onClose={() => setCodeModalVisible(false)}
        onRedeem={handleRedeemCode}
      />
    </Modal>
  );
}

function MiniToggleButton({
  label,
  active,
  activeIcon,
  inactiveIcon,
  onPress,
  width,
  height,
  fontSize,
  iconSize,
  badgeSize,
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const icon = active ? activeIcon : inactiveIcon;
  const badge = active ? SETTING_ON_BADGE_IMAGE : SETTING_OFF_BADGE_IMAGE;
  const borderRadius = height * 0.22;
  const innerRadius = borderRadius - 3;
  const pressTransform = {
    transform: [
      {
        translateY: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 5],
        }),
      },
      {
        scale: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.97],
        }),
      },
    ],
  };
  const pressBrightness = {
    opacity: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.84],
    }),
  };

  function handlePressIn() {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }

  return (
    <Animated.View style={[styles.miniToggleWrap, { width, height }, pressTransform]}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={styles.miniTogglePressable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <Animated.View style={[styles.miniToggleFace, pressBrightness]}>
          <View style={[styles.miniToggleOutline, { borderRadius }]}>
            <LinearGradient
              colors={active ? ['#7DD4F8', '#4AADEE', '#1A7BD4', '#0F5AAA'] : ['#8EC4EA', '#3E9EDB', '#1A75BA', '#13548C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.miniToggleGradient, { borderRadius: innerRadius }]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
                locations={[0, 0.58, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.miniToggleGlossBody,
                  {
                    borderTopLeftRadius: innerRadius,
                    borderTopRightRadius: innerRadius,
                    borderBottomLeftRadius: innerRadius * 1.35,
                    borderBottomRightRadius: innerRadius * 1.35,
                  },
                ]}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.17)', 'rgba(255,255,255,0)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.miniToggleGlossPill}
              />
              <Text style={[styles.miniToggleText, { fontSize, lineHeight: fontSize * 1.1 }]}>{label}</Text>
              <View style={[styles.miniToggleIconWrap, { width: iconSize, height: iconSize }]}>
                <Image source={icon} resizeMode="contain" style={styles.miniToggleIcon} fadeDuration={0} />
                <Image
                  source={badge}
                  resizeMode="contain"
                  fadeDuration={0}
                  style={[
                    styles.miniToggleBadge,
                    {
                      width: badgeSize,
                      height: badgeSize,
                      right: -badgeSize * 0.05,
                      bottom: -badgeSize * 0.06,
                    },
                  ]}
                />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function SettingsShortcutButton({ label, icon, onPress, height, iconSize, iconRight }) {
  const iconPressAnim = useRef(new Animated.Value(0)).current;
  const iconPressedStyle = {
    transform: [
      {
        translateY: iconPressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 5],
        }),
      },
      {
        scale: iconPressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.97],
        }),
      },
    ],
  };

  function pressIconIn() {
    Animated.spring(iconPressAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function pressIconOut() {
    Animated.spring(iconPressAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }

  return (
    <View style={[styles.shortcutButtonWrap, { height }]}>
      <GlossyButton
        label={label}
        variant="blue"
        size="large"
        heightOverride={height}
        horizontalPadding={48}
        onPress={onPress}
        onPressIn={pressIconIn}
        onPressOut={pressIconOut}
        hapticStyle={Haptics.ImpactFeedbackStyle.Light}
      />
      {icon ? (
        <Animated.Image
          pointerEvents="none"
          source={icon}
          resizeMode="contain"
          style={[
            styles.shortcutIcon,
            iconPressedStyle,
            {
              width: iconSize,
              height: iconSize,
              right: iconRight,
              marginTop: -iconSize / 2,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

function UnlockCodeModal({ visible, onClose, onRedeem }) {
  const { width, height } = useWindowDimensions();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const panelWidth = Math.min(width - 10, height * (962 / 1179) * 0.94, 430);

  useEffect(() => {
    if (!visible) {
      setCode('');
      setBusy(false);
      setResult(null);
      setKeyboardVisible(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible]);

  async function handleSubmit() {
    const trimmedCode = code.trim();

    if (!trimmedCode || busy) {
      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const nextResult = await onRedeem(trimmedCode);
      setResult(nextResult);

      if (nextResult?.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (_error) {
      setResult({
        ok: false,
        title: 'Code invoeren lukt niet',
        message: 'Probeer het zo opnieuw.',
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }

  function handleBackdropPress() {
    if (keyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.codeModalScreen}
      >
        <Pressable style={styles.dismissBackdrop} onPress={handleBackdropPress} />
        <View style={[styles.codePanel, { width: panelWidth }]}>
          <Image
            pointerEvents="none"
            source={CODE_ENTRY_MENU_IMAGE}
            resizeMode="contain"
            style={styles.codePanelBackground}
            fadeDuration={0}
          />
          <View style={styles.codePanelContent}>
            <Pressable
              style={styles.codePanelDismissLayer}
              onPress={() => {
                if (keyboardVisible) {
                  Keyboard.dismiss();
                }
              }}
            />
            <Text style={styles.codeTitle}>Code invoeren</Text>
            <Text style={styles.codeMessage}>
              Vul een speciale code in om extra's op dit apparaat vrij te spelen.
            </Text>
            <TextInput
              value={code}
              onChangeText={(nextCode) => {
                setCode(nextCode);
                setResult(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!busy}
              style={styles.codeInput}
            />
            <View style={styles.codeResultSlot}>
              {result ? (
                <Text style={[styles.codeResult, result.ok ? styles.codeResultSuccess : styles.codeResultError]}>
                  {result.title}. {result.message}
                </Text>
              ) : null}
            </View>
            <View style={styles.codeActions}>
              <View style={styles.codeActionButton}>
                <GlossyButton
                  label={busy ? 'Laden...' : 'Invoeren'}
                  variant="green"
                  size="normal"
                  onPress={handleSubmit}
                  disabled={busy || !code.trim()}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LegalLink({ label, fontSize, onPress }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={styles.legalLinkPressable}>
      <Text style={[styles.legalLinkText, { fontSize, lineHeight: fontSize * 1.18 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    zIndex: 8900,
    elevation: 8900,
    padding: 10,
  },
  dismissBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuWrap: {
    zIndex: 2,
    elevation: 2,
  },
  menu: {
    shadowColor: '#032B72',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
    elevation: 16,
  },
  topToggles: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  miniToggleWrap: {
    shadowColor: '#0B3268',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  miniTogglePressable: {
    flex: 1,
  },
  miniToggleFace: {
    flex: 1,
  },
  miniToggleOutline: {
    flex: 1,
    backgroundColor: '#123B73',
    paddingTop: 3,
    paddingLeft: 3,
    paddingRight: 3,
    paddingBottom: 2,
  },
  miniToggleGradient: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 7,
  },
  miniToggleGlossBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  miniToggleGlossPill: {
    position: 'absolute',
    top: 5,
    left: 13,
    right: 13,
    height: 10,
    borderRadius: 8,
  },
  miniToggleText: {
    fontFamily: 'FredokaOne_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#075A9D',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  miniToggleIconWrap: {
    marginTop: -10,
  },
  miniToggleIcon: {
    width: '100%',
    height: '100%',
  },
  miniToggleBadge: {
    position: 'absolute',
  },
  shortcutStack: {
    position: 'absolute',
  },
  shortcutButtonWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  shortcutIcon: {
    position: 'absolute',
    top: '50%',
    zIndex: 3,
  },
  codeModalScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    padding: 18,
    zIndex: 9200,
    elevation: 9200,
  },
  codePanel: {
    aspectRatio: 962 / 1179,
    alignItems: 'stretch',
    justifyContent: 'center',
    shadowColor: '#032B72',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 18,
  },
  codePanelBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  codePanelContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 58,
    paddingTop: 130,
    paddingBottom: 86,
  },
  codePanelDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  codeTitle: {
    zIndex: 1,
    fontFamily: 'FredokaOne_400Regular',
    color: '#17364A',
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  codeMessage: {
    zIndex: 1,
    marginTop: 8,
    fontFamily: 'FredokaOne_400Regular',
    color: '#315266',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  codeInput: {
    zIndex: 1,
    width: '100%',
    minHeight: 58,
    marginTop: 34,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1A75BA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 18,
    color: '#17364A',
    textAlign: 'center',
  },
  codeResult: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  codeResultSlot: {
    zIndex: 1,
    width: '100%',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  codeResultSuccess: {
    color: '#087233',
  },
  codeResultError: {
    color: '#9E0F0F',
  },
  codeActions: {
    zIndex: 1,
    width: '68%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 0,
  },
  codeActionButton: {
    width: '100%',
  },
  legalLinks: {
    position: 'absolute',
    alignItems: 'center',
  },
  legalLinkPressable: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  legalLinkText: {
    fontFamily: 'FredokaOne_400Regular',
    color: '#1D77BD',
    textAlign: 'center',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(255, 255, 255, 0.82)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  versionText: {
    position: 'absolute',
    fontFamily: 'FredokaOne_400Regular',
    color: 'rgba(22, 91, 154, 0.72)',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
