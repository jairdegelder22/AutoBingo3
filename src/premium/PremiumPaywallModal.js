import { Alert, Animated, Image, ImageBackground, Linking, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePremium } from './PremiumContext';
import { hasPremiumEntitlement } from './revenueCatClient';
import * as Haptics from '../settings/haptics';
import { getResponsiveMetrics } from '../utils/responsive';
import WarmupImages from '../components/WarmupImages';
import { PREMIUM_MODAL_ASSETS } from '../assets/preloadManifest';
import { LEGAL_URLS } from '../legal/legalConfig';

const PREMIUM_MENU_IMAGE = require('../../assets/images/premium/premium-menu.png');
const NO_ADS_IMAGE = require('../../assets/images/premium/benefits/no-ads-user.png');
const EXTRA_THEMES_IMAGE = require('../../assets/images/premium/benefits/extra-themes-user.png');
const HOST_BINGO_IMAGE = require('../../assets/images/premium/benefits/host-bingo-user.png');
const CLOSE_IMAGE = require('../../assets/images/premium/close-premium.png');
const TAKE_PREMIUM_BUTTON_IMAGE = require('../../assets/images/premium/take-premium-button.png');
const TAKE_PREMIUM_BUTTON_PRESSED_IMAGE = require('../../assets/images/premium/take-premium-button-pressed.png');
const RADIO_UNSELECTED_IMAGE = require('../../assets/images/premium/radio-unselected.png');
const RADIO_SELECTED_IMAGE = require('../../assets/images/premium/radio-selected.png');

const MENU_ASPECT_RATIO = 400 / 690;
const BENEFITS = [
  {
    key: 'no-ads',
    label: 'Geen advertenties',
    image: NO_ADS_IMAGE,
  },
  {
    key: 'themes',
    label: 'Extra thema’s',
    image: EXTRA_THEMES_IMAGE,
  },
  {
    key: 'host',
    label: 'Online hosten',
    image: HOST_BINGO_IMAGE,
  },
];

function formatPremiumPrice(priceString) {
  if (!priceString) {
    return null;
  }

  return priceString.replace(/\$/g, '€');
}

function formatPackagePrice(packageOption, fallbackLabel) {
  const priceString = formatPremiumPrice(packageOption?.product?.priceString);
  return priceString ?? fallbackLabel;
}

export default function PremiumPaywallModal({
  visible,
  onClose,
  onUnlocked,
  title = 'Auto Bingo Premium',
  message = 'Host lobby’s en speel alle premium thema’s vrij voor het hele gezin.',
}) {
  const {
    available,
    loading,
    isPremium,
    lifetimePackage,
    monthlyPackage,
    purchasePremiumPackage,
    restorePremiumPurchases,
  } = usePremium();
  const { width, height } = useWindowDimensions();
  const [selectedPackageKey, setSelectedPackageKey] = useState('lifetime');
  const [busyPackageId, setBusyPackageId] = useState(null);
  const [ctaPressed, setCtaPressed] = useState(false);
  const benefitPulseScales = useRef(BENEFITS.map(() => new Animated.Value(1))).current;
  const { isTablet } = getResponsiveMetrics(width, height);

  const menuWidth = isTablet
    ? Math.min(width - 18, height * MENU_ASPECT_RATIO * 0.92, 560)
    : Math.min(width - 6, height * MENU_ASPECT_RATIO * 0.9, 430);
  const menuHeight = menuWidth / MENU_ASPECT_RATIO;
  const menuScale = menuWidth / 400;
  const scaled = (value) => value * menuScale;

  const packages = useMemo(
    () => [
      {
        key: 'lifetime',
        title: 'Levenslang',
        price: formatPackagePrice(lifetimePackage, loading ? 'Laden...' : 'Niet beschikbaar'),
        package: lifetimePackage,
      },
      {
        key: 'monthly',
        title: 'Maandelijks',
        price: monthlyPackage?.product?.priceString
          ? `${formatPremiumPrice(monthlyPackage.product.priceString)} per maand`
          : loading ? 'Laden...' : 'Niet beschikbaar',
        package: monthlyPackage,
      },
    ],
    [lifetimePackage, loading, monthlyPackage]
  );
  const selectedPackage = packages.find((packageOption) => packageOption.key === selectedPackageKey && packageOption.package)
    ?? packages.find((packageOption) => packageOption.package)
    ?? packages.find((packageOption) => packageOption.key === selectedPackageKey)
    ?? packages[0];
  const purchaseInProgress = Boolean(busyPackageId && busyPackageId !== 'restore');

  useEffect(() => {
    if (!visible) {
      benefitPulseScales.forEach((pulseScale) => {
        pulseScale.stopAnimation();
        pulseScale.setValue(1);
      });
      return undefined;
    }

    const pulseAnimation = Animated.loop(
      Animated.sequence(
        benefitPulseScales.flatMap((pulseScale) => [
          Animated.timing(pulseScale, {
            toValue: 1.15,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.delay(260),
        ])
      )
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
      benefitPulseScales.forEach((pulseScale) => {
        pulseScale.stopAnimation();
        pulseScale.setValue(1);
      });
    };
  }, [benefitPulseScales, visible]);

  function showPurchaseMessage(messageToShow) {
    Alert.alert('Premium', messageToShow);
  }

  async function handlePurchase(packageOption = selectedPackage) {
    if (!packageOption?.package || busyPackageId) {
      if (!packageOption?.package) {
        showPurchaseMessage('Deze optie is nog niet beschikbaar.');
      }
      return;
    }

    setBusyPackageId(packageOption.key);

    try {
      const result = await purchasePremiumPackage(packageOption.package);
      const activePremium = hasPremiumEntitlement(result?.customerInfo);

      if (activePremium || isPremium) {
        onUnlocked?.();
        return;
      }

      showPurchaseMessage('Aankoop verwerkt, maar premium is nog niet actief.');
    } catch (error) {
      if (error?.userCancelled) {
        showPurchaseMessage('Aankoop geannuleerd.');
      } else {
        showPurchaseMessage('Aankoop lukt nu niet. Probeer het zo opnieuw.');
      }
    } finally {
      setBusyPackageId(null);
    }
  }

  async function handleRestore() {
    if (busyPackageId) {
      return;
    }

    setBusyPackageId('restore');

    try {
      const info = await restorePremiumPurchases();
      const activePremium = hasPremiumEntitlement(info);

      if (activePremium) {
        showPurchaseMessage('Aankopen hersteld.');
        onUnlocked?.();
        return;
      }

      showPurchaseMessage('Geen actieve premium aankoop gevonden.');
    } catch (_error) {
      showPurchaseMessage('Herstellen lukt nu niet. Probeer het zo opnieuw.');
    } finally {
      setBusyPackageId(null);
    }
  }

  async function openLegalUrl(url) {
    try {
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert('Link openen lukt niet', 'Probeer het later opnieuw.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <WarmupImages
          assets={PREMIUM_MODAL_ASSETS}
          active={visible}
          timeoutMs={null}
          imageSize={128}
          batchSize={16}
        />
        <ImageBackground
          source={PREMIUM_MENU_IMAGE}
          resizeMode="stretch"
          fadeDuration={0}
          style={[
            styles.menu,
            {
              width: menuWidth,
              height: menuHeight,
            },
          ]}
          imageStyle={styles.menuImage}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sluit Premium"
            style={[
              styles.closeButton,
              {
                top: scaled(56),
                right: scaled(12),
                width: scaled(46),
                height: scaled(46),
                borderRadius: scaled(23),
              },
            ]}
            onPress={onClose}
            disabled={Boolean(busyPackageId)}
          >
            <Image source={CLOSE_IMAGE} style={styles.closeImage} resizeMode="contain" fadeDuration={0} />
          </Pressable>

          <View
            style={[
              styles.benefits,
              {
                top: scaled(128),
                left: scaled(50),
                width: scaled(320),
                gap: scaled(8),
              },
            ]}
          >
            {BENEFITS.map((benefit, index) => (
              <View key={benefit.key} style={[styles.benefitRow, { minHeight: scaled(64), gap: scaled(8) }]}>
                <Animated.Image
                  source={benefit.image}
                  style={[
                    styles.benefitIcon,
                    {
                      width: scaled(90),
                      height: scaled(90),
                      marginLeft: scaled(-10),
                      transform: [{ scale: benefitPulseScales[index] }],
                    },
                  ]}
                  resizeMode="contain"
                />
                <Text
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={[
                    styles.benefitText,
                    {
                      width: scaled(210),
                      fontSize: scaled(27),
                      lineHeight: scaled(32),
                    },
                  ]}
                >
                  {benefit.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.packageBox,
              {
                top: scaled(416),
                left: scaled(44),
                width: scaled(306),
                borderRadius: scaled(20),
              },
            ]}
          >
            {packages.map((packageOption, index) => {
              const unavailable = !packageOption.package;
              const disabled = Boolean(busyPackageId) || unavailable;
              const isSelected = selectedPackageKey === packageOption.key;
              return (
                <Pressable
                  key={packageOption.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${packageOption.title} premium`}
                  style={({ pressed }) => [
                    styles.packageRow,
                    {
                      minHeight: scaled(48),
                      gap: scaled(9),
                      paddingHorizontal: scaled(10),
                    },
                    index === 0 && [styles.packageRowDivider, { borderBottomWidth: scaled(2) }],
                    isSelected && styles.packageRowSelected,
                    unavailable && styles.packageRowUnavailable,
                    Boolean(busyPackageId) && styles.packageRowDisabled,
                    pressed && !disabled && styles.packageRowPressed,
                  ]}
                  onPress={() => {
                    if (unavailable) {
                      return;
                    }
                    setSelectedPackageKey(packageOption.key);
                  }}
                  disabled={disabled}
                >
                  <Image
                    source={isSelected ? RADIO_SELECTED_IMAGE : RADIO_UNSELECTED_IMAGE}
                    style={[styles.radioImage, { width: scaled(26), height: scaled(26) }]}
                    resizeMode="contain"
                    fadeDuration={0}
                  />
                  <Text style={[styles.packageTitle, { fontSize: scaled(17), lineHeight: scaled(21) }]}>
                    {packageOption.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    style={[
                      styles.packagePrice,
                      unavailable && styles.packagePriceUnavailable,
                      { fontSize: scaled(13), lineHeight: scaled(17) },
                    ]}
                  >
                    {packageOption.price}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Image
            pointerEvents="none"
            source={(ctaPressed || purchaseInProgress) ? TAKE_PREMIUM_BUTTON_PRESSED_IMAGE : TAKE_PREMIUM_BUTTON_IMAGE}
            style={[
              styles.ctaButtonImage,
              {
                top: scaled(508),
                left: scaled(22),
                width: scaled(356),
                height: scaled(124),
              },
            ]}
            resizeMode="contain"
            fadeDuration={0}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Neem Premium"
            style={[
              styles.ctaButton,
              {
                top: scaled(532),
                left: scaled(96),
                right: scaled(96),
                height: scaled(76),
              },
            ]}
            onPressIn={() => setCtaPressed(true)}
            onPressOut={() => setCtaPressed(false)}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handlePurchase();
            }}
            disabled={!available || Boolean(busyPackageId) || !selectedPackage?.package}
          />

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.restoreButton,
              {
                top: scaled(610),
                left: scaled(106),
                right: scaled(106),
                paddingHorizontal: scaled(12),
                paddingVertical: scaled(8),
              },
              pressed && styles.restoreButtonPressed,
            ]}
            onPress={handleRestore}
            disabled={!available || Boolean(busyPackageId)}
          >
            <Text style={[styles.restoreButtonText, { fontSize: scaled(12) }]}>
              {busyPackageId === 'restore' ? 'Laden...' : 'Aankoop herstellen'}
            </Text>
          </Pressable>

          <View
            style={[
              styles.legalLinks,
              {
                top: scaled(636),
                left: scaled(82),
                right: scaled(82),
                gap: scaled(8),
              },
            ]}
          >
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                void openLegalUrl(LEGAL_URLS.terms);
              }}
              hitSlop={6}
            >
              <Text style={[styles.legalLinkText, { fontSize: scaled(8) }]}>Voorwaarden</Text>
            </Pressable>
            <Text style={[styles.legalLinkSeparator, { fontSize: scaled(8) }]}>•</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                void openLegalUrl(LEGAL_URLS.privacy);
              }}
              hitSlop={6}
            >
              <Text style={[styles.legalLinkText, { fontSize: scaled(8) }]}>Privacybeleid</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  menu: {
    shadowColor: '#3D2000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 14,
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  closeImage: {
    width: '100%',
    height: '100%',
  },
  benefits: {
    position: 'absolute',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: {
  },
  benefitText: {
    fontSize: 27,
    lineHeight: 32,
    color: '#7B3600',
    fontFamily: 'FredokaOne_400Regular',
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(255, 244, 188, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  packageBox: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 193, 141, 0.78)',
  },
  packageTitle: {
    flexShrink: 0,
    color: '#6C2B00',
    fontFamily: 'FredokaOne_400Regular',
    letterSpacing: 0,
    textShadowColor: 'rgba(255, 238, 185, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  packagePrice: {
    flexShrink: 1,
    color: '#9B3F00',
    fontWeight: '900',
    textAlign: 'right',
    textShadowColor: 'rgba(255, 238, 185, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  packagePriceUnavailable: {
    color: '#B06A2D',
  },
  radioImage: {
    flexShrink: 0,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageRowDivider: {
    borderBottomColor: 'rgba(160, 69, 0, 0.18)',
  },
  packageRowDisabled: {
    opacity: 0.45,
  },
  packageRowUnavailable: {
    opacity: 0.72,
  },
  packageRowSelected: {
    backgroundColor: 'rgba(255, 247, 202, 0.34)',
  },
  packageRowPressed: {
    backgroundColor: 'rgba(255, 247, 202, 0.48)',
  },
  status: {
    fontSize: 12,
    lineHeight: 16,
    color: '#7A3200',
    fontFamily: 'FredokaOne_400Regular',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 240, 185, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  topStatus: {
    position: 'absolute',
  },
  bottomStatus: {
    position: 'absolute',
  },
  restoreButton: {
    position: 'absolute',
  },
  restoreButtonPressed: {
    opacity: 0.65,
  },
  restoreButtonText: {
    fontSize: 13,
    color: '#8C3A00',
    fontFamily: 'FredokaOne_400Regular',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 238, 185, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  legalLinks: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalLinkText: {
    color: '#8C3A00',
    fontFamily: 'FredokaOne_400Regular',
    letterSpacing: 0,
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(255, 238, 185, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  legalLinkSeparator: {
    color: '#8C3A00',
    fontFamily: 'FredokaOne_400Regular',
  },
  ctaButton: {
    position: 'absolute',
  },
  ctaButtonImage: {
    position: 'absolute',
  },
});
