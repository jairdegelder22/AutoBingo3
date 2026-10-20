import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CircularReveal from '../components/CircularReveal';
import GlossyButton from '../src/components/GlossyButton';
import WarmupImages from '../src/components/WarmupImages';
import * as Haptics from '../src/settings/haptics';
import { useAppSettings } from '../src/settings/AppSettingsContext';
import { usePremium } from '../src/premium/PremiumContext';
import { hasPremiumEntitlement } from '../src/premium/revenueCatClient';
import { useAccount } from '../src/account/AccountContext';
import PremiumPaywallModal from '../src/premium/PremiumPaywallModal';
import { getAssetPanelWidth } from '../src/utils/responsive';
import { LEGAL_URLS } from '../src/legal/legalConfig';
import { redeemUnlockCode } from '../src/unlocks/unlockCodes';
import { SETTINGS_ASSETS } from '../src/assets/preloadManifest';
import { useTranslation } from '../src/i18n/useTranslation';

const SETTINGS_MENU_IMAGE = require('../assets/images/settings/settings-menu-panel.png');
const SETTINGS_LANGUAGE_IMAGE = require('../assets/images/settings/settings-language.png');
const SETTINGS_TUTORIAL_IMAGE = require('../assets/images/settings/settings-tutorial.png');
const SETTINGS_PRIVACY_IMAGE = require('../assets/images/settings/settings-privacy.png');
const SETTINGS_PREMIUM_IMAGE = require('../assets/images/premium/main-menu-premium-crown.png');
const CODE_ENTRY_MENU_IMAGE = require('../assets/images/settings/code-invoeren-menu.png');
const HOST_LOCK_CHAINS_IMAGE = require('../assets/images/host-lock-chains.png');
const HOST_LOCK_PADLOCK_IMAGE = require('../assets/images/host-lock-padlock.png');
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

export default function SettingsScreen({ navigation, onClose, onTutorial, onPremiumCodeDisabled, visible = true }) {
  const { settings, updateSetting } = useAppSettings();
  const { languageOptions, t } = useTranslation();
  const {
    available: premiumAvailable,
    customerInfo,
    disablePaidSkinCodeUnlock,
    disablePremiumCodeUnlock,
    isPremium,
    restorePremiumPurchases,
    unlockAllPaidSkinsWithCode,
    unlockPremiumWithCode,
  } = usePremium();
  const {
    loading: accountLoading,
    signingInProvider,
    signInWithApple,
    signInWithGoogle,
    signOut,
    user,
  } = useAccount();
  const { width, height } = useWindowDimensions();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [tutorialPickerVisible, setTutorialPickerVisible] = useState(false);
  const [tutorialHandoffColor, setTutorialHandoffColor] = useState(null);
  const [menuImageReady, setMenuImageReady] = useState(!visible);
  const menuProgress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const menuWidth = getAssetPanelWidth(width, height, SETTINGS_MENU_ASPECT_RATIO, 430, 560);
  const menuHeight = menuWidth / SETTINGS_MENU_ASPECT_RATIO;
  const menuScale = menuWidth / 975;
  const scaled = (value) => value * menuScale;
  const closeSettings = onClose ?? (() => navigation.goBack());
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
    if (visible) {
      setTutorialHandoffColor(null);
      return undefined;
    }

    setPremiumModalVisible(false);
    setCodeModalVisible(false);
    setLanguageModalVisible(false);
    setTutorialPickerVisible(false);
    setMenuImageReady(false);

    const clearHandoffTimer = setTimeout(() => {
      setTutorialHandoffColor(null);
    }, 420);

    return () => clearTimeout(clearHandoffTimer);
  }, [visible]);

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
        t('settings.managePremium'),
        t('settings.openStoreFallback', { storeName })
      );
    }
  }

  async function openLegalUrl(url) {
    try {
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert(t('settings.linkFailedTitle'), t('settings.linkFailedMessage'));
    }
  }

  function handlePremiumPress() {
    if (!isPremium) {
      if (!premiumAvailable) {
        Alert.alert(t('common.premium'), t('settings.restoreUnavailable'));
        return;
      }

      setPremiumModalVisible(true);
      return;
    }

    const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

    Alert.alert(
      t('settings.managePremium'),
      t('settings.premiumActive', { storeName }),
      [
        { text: t('common.close'), style: 'cancel' },
        {
          text: t('settings.openStore', { storeName }),
          onPress: () => {
            void openPremiumManagementUrl();
          },
        },
      ]
    );
  }

  async function handleRedeemCode(code) {
    const result = await redeemUnlockCode(code, {
      unlockPremiumWithCode,
      disablePremiumCodeUnlock,
      unlockAllPaidSkinsWithCode,
      disablePaidSkinCodeUnlock,
    });

    if (result?.ok && result.effects?.includes('appReset')) {
      setTimeout(() => {
        setCodeModalVisible(false);
        closeSettings();
        onPremiumCodeDisabled?.();
      }, 0);
    }

    return result;
  }

  async function signInAndReport(provider) {
    try {
      const session = provider === 'apple'
        ? await signInWithApple()
        : await signInWithGoogle();

      if (session?.user) {
        const restoredCustomerInfo = await restorePremiumPurchases().catch(() => null);
        const premiumRestored = hasPremiumEntitlement(restoredCustomerInfo) || isPremium;
        const message = premiumRestored
          ? t('settings.saveProgressAndPremiumLinked')
          : t('settings.saveProgressLinked');

        Alert.alert(t('settings.saveProgress'), message);
      }
    } catch (_error) {
      Alert.alert(t('settings.saveProgress'), t('settings.saveProgressFailed'));
    }
  }

  function handleSaveProgressPress() {
    if (accountLoading || signingInProvider) {
      return;
    }

    if (user) {
      Alert.alert(
        t('settings.saveProgress'),
        t('settings.saveProgressActive'),
        [
          { text: t('common.close'), style: 'cancel' },
          {
            text: t('settings.signOut'),
            style: 'destructive',
            onPress: () => {
              void signOut().catch(() => {
                Alert.alert(t('settings.saveProgress'), t('settings.signOutFailed'));
              });
            },
          },
        ]
      );
      return;
    }

    if (Platform.OS === 'ios') {
      void signInAndReport('apple');
      return;
    }

    if (Platform.OS === 'android') {
      void signInAndReport('google');
      return;
    }

    Alert.alert(
      t('settings.saveProgress'),
      t('settings.saveProgressMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.continueWithApple'),
          onPress: () => {
            void signInAndReport('apple');
          },
        },
        {
          text: t('settings.continueWithGoogle'),
          onPress: () => {
            void signInAndReport('google');
          },
        },
      ]
    );
  }

  function handleTutorialChoice(choice) {
    setTutorialHandoffColor(choice.color ?? '#F5C400');
    onTutorial?.({ ...choice, deferSettingsClose: true });
    setTimeout(() => {
      setTutorialPickerVisible(false);
      closeSettings();
    }, 120);
  }

  const shortcutButtons = [
    {
      key: 'language',
      label: t('settings.language'),
      icon: SETTINGS_LANGUAGE_IMAGE,
      onPress: () => setLanguageModalVisible(true),
    },
    {
      key: 'tutorial',
      label: t('settings.tutorial'),
      icon: SETTINGS_TUTORIAL_IMAGE,
      onPress: () => setTutorialPickerVisible(true),
    },
    {
      key: 'premium',
      label: isPremium ? t('settings.managePremium') : t('common.premium'),
      icon: SETTINGS_PREMIUM_IMAGE,
      onPress: handlePremiumPress,
    },
    {
      key: 'save-progress',
      label: accountLoading || signingInProvider
        ? t('common.loading')
        : user
          ? t('settings.progressSaved')
          : t('settings.saveProgress'),
      icon: null,
      onPress: handleSaveProgressPress,
    },
    {
      key: 'redeem-code',
      label: t('settings.redeemCode'),
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
    <Modal visible={visible} transparent animationType={tutorialHandoffColor ? 'none' : 'fade'} onRequestClose={closeSettings}>
      <View style={styles.screen}>
        <WarmupImages
          assets={SETTINGS_ASSETS}
          active={visible}
          timeoutMs={null}
          imageSize={128}
          batchSize={16}
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
            style={[
              styles.menu,
              { width: menuWidth, height: menuHeight },
            ]}
            fadeDuration={0}
            onLoadEnd={() => setMenuImageReady(true)}
            imageStyle={styles.menuImage}
          >
            {menuImageReady ? (
              <>
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
                label={t('settings.music')}
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
                label={t('settings.haptics')}
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
              {t('common.version')} {APP_VERSION}
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
                label={t('settings.terms')}
                fontSize={scaled(25)}
                onPress={() => {
                  void openLegalUrl(LEGAL_URLS.terms);
                }}
              />
              <LegalLink
                label={t('settings.privacy')}
                fontSize={scaled(25)}
                onPress={() => {
                  void openLegalUrl(LEGAL_URLS.privacy);
                }}
              />
            </View>
              </>
            ) : null}
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
        t={t}
      />
      <LanguagePickerModal
        visible={languageModalVisible}
        currentLanguageId={settings.language}
        languageOptions={languageOptions}
        title={t('settings.languageTitle')}
        message={t('settings.languageMessage')}
        onClose={() => setLanguageModalVisible(false)}
        onSelect={(language) => {
          updateSetting('language', language.id);
          setLanguageModalVisible(false);
        }}
      />
      <TutorialPickerModal
        visible={tutorialPickerVisible}
        isPremium={isPremium}
        onClose={() => setTutorialPickerVisible(false)}
        onSelect={handleTutorialChoice}
        onLockedPremium={() => {
          setTutorialPickerVisible(false);
          setPremiumModalVisible(true);
        }}
        t={t}
      />
      {tutorialHandoffColor ? (
        <View
          pointerEvents="auto"
          style={[
            styles.tutorialHandoffScreen,
            { backgroundColor: tutorialHandoffColor },
          ]}
        />
      ) : null}
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
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.64}
                style={[styles.miniToggleText, { fontSize, lineHeight: fontSize * 1.1 }]}
              >
                {label}
              </Text>
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

function UnlockCodeModal({ visible, onClose, onRedeem, t }) {
  const { width, height } = useWindowDimensions();
  const codeInputRef = useRef(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const panelWidth = getAssetPanelWidth(width, height, 962 / 1179, 430, 560);

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
        title: t('code.failedTitle'),
        message: t('code.failedMessage'),
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
            <Text style={styles.codeTitle}>{t('code.title')}</Text>
            <Text style={styles.codeMessage}>
              {t('code.message')}
            </Text>
            <Pressable style={styles.codeInputShell} onPress={() => codeInputRef.current?.focus()}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.codeInputText}
              >
                {code}
              </Text>
              <TextInput
                ref={codeInputRef}
                value={code}
                onChangeText={(nextCode) => {
                  setCode(nextCode.replace(/[\r\n]+/g, '').toUpperCase());
                  setResult(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                keyboardType="visible-password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!busy}
                multiline={false}
                numberOfLines={1}
                scrollEnabled={false}
                blurOnSubmit={false}
                caretHidden
                contextMenuHidden
                style={styles.codeHiddenInput}
              />
            </Pressable>
            <View style={styles.codeActions}>
              <View style={styles.codeActionButton}>
                <GlossyButton
                  label={busy ? t('common.loading') : t('code.submit')}
                  variant="green"
                  size="normal"
                  onPress={handleSubmit}
                  disabled={busy || !code.trim()}
                />
              </View>
            </View>
            <View style={styles.codeResultSlot}>
              {result ? (
                <Text style={[styles.codeResult, result.ok ? styles.codeResultSuccess : styles.codeResultError]}>
                  {result.title}. {result.message}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const TUTORIAL_CHOICES = [
  {
    id: 'general',
    titleKey: 'tutorial.general',
    variant: 'yellow',
    color: '#F5C400',
  },
  {
    id: 'menu',
    titleKey: 'tutorial.menu',
    variant: 'green',
    color: '#159B3B',
  },
  {
    id: 'join',
    titleKey: 'tutorial.join',
    variant: 'blue',
    color: '#1A7BD4',
  },
  {
    id: 'host',
    titleKey: 'tutorial.host',
    variant: 'red',
    color: '#E03030',
    premium: true,
  },
];

function LanguagePickerModal({
  visible,
  currentLanguageId,
  languageOptions,
  title,
  message,
  onClose,
  onSelect,
}) {
  const { width, height } = useWindowDimensions();
  const panelWidth = getAssetPanelWidth(width, height, 962 / 1179, 430, 560);
  const languageChoiceGap = Math.round(Math.max(10, Math.min(14, panelWidth * 0.032)));
  const languageContentPadding = 46;
  const languageChoiceWidth = Math.floor((panelWidth - languageContentPadding * 2 - languageChoiceGap) / 2);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.tutorialPickerScreen}>
        <Pressable style={styles.dismissBackdrop} onPress={onClose} />
        <View style={[styles.codePanel, { width: panelWidth }]}>
          <Image
            pointerEvents="none"
            source={CODE_ENTRY_MENU_IMAGE}
            resizeMode="contain"
            style={styles.codePanelBackground}
            fadeDuration={0}
          />
          <View style={[styles.codePanelContent, styles.languagePanelContent]}>
            <Text style={[styles.codeTitle, styles.tutorialPickerTitle]}>{title}</Text>
            <Text style={styles.codeMessage}>{message}</Text>
            <View style={styles.languageChoiceStack}>
              {languageOptions.map((language, index) => {
                const selected = language.id === currentLanguageId;
                const isLeftColumn = index % 2 === 0;
                const isLastRow = index >= languageOptions.length - 2;

                return (
                  <View
                    key={language.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.languageChoice,
                      {
                        width: languageChoiceWidth,
                        marginRight: isLeftColumn ? languageChoiceGap : 0,
                        marginBottom: isLastRow ? 0 : languageChoiceGap,
                      },
                    ]}
                  >
                    <GlossyButton
                      label={language.nativeName}
                      variant={selected ? 'green' : 'blue'}
                      heightOverride={58}
                      horizontalPadding={18}
                      labelFontScale={0.96}
                      onPress={() => onSelect(language)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TutorialPickerModal({ visible, isPremium, onClose, onSelect, onLockedPremium, t }) {
  const { width, height } = useWindowDimensions();
  const revealRef = useRef(null);
  const pendingChoiceRef = useRef(null);
  const pickerProgress = useRef(new Animated.Value(0)).current;
  const [revealColor, setRevealColor] = useState('#F5C400');
  const [revealOrigin, setRevealOrigin] = useState({ x: width / 2, y: height / 2 });
  const panelWidth = getAssetPanelWidth(width, height, 962 / 1179, 430, 560);
  const tutorialChoiceGap = Math.round(Math.max(10, Math.min(14, panelWidth * 0.032)));
  const tutorialContentPadding = 48;
  const tutorialChoiceWidth = Math.floor((panelWidth - tutorialContentPadding * 2 - tutorialChoiceGap) / 2);

  useEffect(() => {
    pickerProgress.stopAnimation();

    if (!visible) {
      pickerProgress.setValue(0);
      return;
    }

    pickerProgress.setValue(0);
    Animated.timing(pickerProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pickerProgress, visible]);

  if (!visible) {
    return null;
  }

  function handleChoicePress(choice, event) {
    if (choice.premium && !isPremium) {
      onLockedPremium?.();
      return;
    }

    pendingChoiceRef.current = choice;
    setRevealColor(choice.color);
    setRevealOrigin({
      x: event?.nativeEvent?.pageX ?? width / 2,
      y: event?.nativeEvent?.pageY ?? height / 2,
    });

    requestAnimationFrame(() => {
      revealRef.current?.reveal();
    });
  }

  return (
    <Animated.View
      style={[
        styles.tutorialPickerScreen,
        {
          opacity: pickerProgress,
        },
      ]}
    >
      <Pressable style={styles.dismissBackdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.codePanel,
          {
            width: panelWidth,
            transform: [
              {
                scale: pickerProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.965, 1],
                }),
              },
              {
                translateY: pickerProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          pointerEvents="none"
          source={CODE_ENTRY_MENU_IMAGE}
          resizeMode="contain"
          style={styles.codePanelBackground}
          fadeDuration={0}
        />
        <View style={[styles.codePanelContent, styles.tutorialPanelContent]}>
          <Text style={[styles.codeTitle, styles.tutorialPickerTitle]}>{t('tutorial.title')}</Text>
          <Text style={styles.codeMessage}>
            {t('tutorial.message')}
          </Text>
          <View style={styles.tutorialChoiceStack}>
            {TUTORIAL_CHOICES.map((choice, index) => {
              const locked = choice.premium && !isPremium;
              const isLeftColumn = index % 2 === 0;
              const isLastRow = index >= TUTORIAL_CHOICES.length - 2;
              const buttonLabel = choice.id === 'general'
                ? t(choice.titleKey).replace(' AutoBingo', '\nAutoBingo')
                : t(choice.titleKey);

              return (
                <View
                  key={choice.id}
                  style={[
                    styles.tutorialChoiceItem,
                    {
                      width: tutorialChoiceWidth,
                      marginRight: isLeftColumn ? tutorialChoiceGap : 0,
                      marginBottom: isLastRow ? 0 : tutorialChoiceGap,
                    },
                    locked && styles.tutorialChoiceItemLocked,
                  ]}
                >
                  <GlossyButton
                    label={buttonLabel}
                    variant={choice.variant}
                    size="normal"
                    heightOverride={78}
                    horizontalPadding={12}
                    labelFontScale={choice.id === 'general' ? 0.8 : 0.7}
                    labelNumberOfLines={choice.id === 'general' ? 2 : 1}
                    onPress={(event) => handleChoicePress(choice, event)}
                  />
                  {locked ? (
                    <View pointerEvents="none" style={styles.tutorialChoiceLockLayer}>
                      <View style={styles.tutorialChoiceLockDim} />
                      <Image
                        source={HOST_LOCK_CHAINS_IMAGE}
                        resizeMode="cover"
                        style={styles.tutorialChoiceLockChains}
                        fadeDuration={0}
                      />
                      <Image
                        source={HOST_LOCK_PADLOCK_IMAGE}
                        resizeMode="contain"
                        style={styles.tutorialChoiceLockPadlock}
                        fadeDuration={0}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>
      <CircularReveal
        ref={revealRef}
        color={revealColor}
        originX={revealOrigin.x}
        originY={revealOrigin.y}
        onComplete={() => {
          const choice = pendingChoiceRef.current;
          pendingChoiceRef.current = null;
          if (choice) {
            onSelect(choice);
          }
        }}
      />
    </Animated.View>
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
  menuImage: {
    width: '100%',
    height: '100%',
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
  tutorialPickerScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    padding: 18,
    zIndex: 9300,
    elevation: 9300,
  },
  tutorialHandoffScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 13000,
    elevation: 13000,
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
    paddingTop: 106,
    paddingBottom: 86,
  },
  tutorialPanelContent: {
    paddingHorizontal: 48,
    paddingTop: 112,
    paddingBottom: 72,
  },
  languagePanelContent: {
    paddingHorizontal: 46,
    paddingTop: 104,
    paddingBottom: 78,
  },
  tutorialPickerTitle: {
    fontSize: 34,
    lineHeight: 40,
    marginBottom: -6,
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
    marginTop: 4,
    fontFamily: 'FredokaOne_400Regular',
    color: '#315266',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  codeInputShell: {
    zIndex: 1,
    width: '100%',
    height: 58,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1A75BA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  codeInputText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 18,
    lineHeight: 24,
    color: '#17364A',
    textAlign: 'left',
    includeFontPadding: false,
    overflow: 'hidden',
  },
  codeHiddenInput: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    height: 58,
    color: 'transparent',
    opacity: 0.02,
    fontSize: 18,
    lineHeight: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
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
    marginTop: 6,
  },
  codeActionButton: {
    width: '100%',
  },
  tutorialChoiceStack: {
    zIndex: 1,
    width: '100%',
    marginTop: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  languageChoiceStack: {
    zIndex: 1,
    width: '100%',
    marginTop: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  languageChoice: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tutorialChoiceItem: {
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 19,
  },
  tutorialChoiceItemLocked: {
    opacity: 0.98,
  },
  tutorialChoiceLockLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialChoiceLockDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  tutorialChoiceLockChains: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  tutorialChoiceLockPadlock: {
    width: 44,
    height: 44,
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
