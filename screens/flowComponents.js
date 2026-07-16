import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import CircularReveal from '../components/CircularReveal';
import AnimatedBackButton from '../src/components/AnimatedBackButton';
import { getResponsiveMetrics } from '../src/utils/responsive';

const BACK_REVEAL_YELLOW = '#F5C400';

export function ScreenLayout({
  title,
  children,
  footer,
  scroll = true,
  backgroundImage,
  backgroundBlurRadius = 0,
  backgroundOverlayStyle = null,
  footerTransparent = false,
  onLayout,
}) {
  const ContentWrapper = scroll ? ScrollView : View;
  const screenContent = (
    <>
      <ContentWrapper
        style={styles.content}
        contentContainerStyle={scroll ? styles.scrollContent : undefined}
      >
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </ContentWrapper>
      {footer ? (
        <View
          style={[
            styles.footer,
            backgroundImage ? styles.footerWithBackground : null,
            footerTransparent && styles.footerTransparent,
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.screen} onLayout={onLayout}>
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          blurRadius={backgroundBlurRadius}
          style={styles.backgroundImage}
        >
          {backgroundOverlayStyle ? <View pointerEvents="none" style={[styles.backgroundOverlay, backgroundOverlayStyle]} /> : null}
          {screenContent}
        </ImageBackground>
      ) : screenContent}
    </View>
  );
}

export function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function OptionButton({ label, subtitle, selected, disabled, onPress, rightLabel }) {
  return (
    <Pressable
      style={[
        styles.button,
        selected && styles.buttonSelected,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.buttonTextWrap}>
        <Text style={[styles.buttonLabel, disabled && styles.disabledText]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.buttonSubtitle, disabled && styles.disabledText]}>{subtitle}</Text>
        ) : null}
      </View>
      {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
    </Pressable>
  );
}

export function PrimaryButton({ label, disabled, onPress }) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function BackButton({ onPress, navigation }) {
  const { width, height } = useWindowDimensions();
  const { isTablet, tabletScale } = getResponsiveMetrics(width, height);
  const buttonSize = isTablet ? Math.round(66 * Math.min(tabletScale, 1.22)) : 66;
  const revealRef = useRef(null);
  const [origin, setOrigin] = useState({ x: buttonSize / 2, y: buttonSize / 2 });
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!transitioning) {
      return;
    }

    requestAnimationFrame(() => {
      revealRef.current?.reveal();
    });
  }, [transitioning]);

  function handleActivated(nextOrigin) {
    if (onPress) {
      onPress(nextOrigin);
      return;
    }

    setOrigin(nextOrigin);
    setTransitioning(true);
  }

  function handleRevealComplete() {
    if (navigation?.goBackWithTransition) {
      navigation.goBackWithTransition({
        color: BACK_REVEAL_YELLOW,
        originX: origin.x,
        originY: origin.y,
        pauseMs: 240,
        transitionKey: `flow-back-${Date.now()}`,
      });
      return;
    }

    onPress?.();
  }

  return (
    <View pointerEvents="box-none" style={styles.backButton}>
      <AnimatedBackButton
        disabled={transitioning}
        onActivated={handleActivated}
        size={buttonSize}
      />
      <Modal transparent visible={transitioning} animationType="none">
        <View style={styles.modalFill}>
          <CircularReveal
            ref={revealRef}
            color={BACK_REVEAL_YELLOW}
            originX={origin.x}
            originY={origin.y}
            onComplete={handleRevealComplete}
          />
        </View>
      </Modal>
    </View>
  );
}

export function ToggleRow({ label, value, onValueChange, disabled = false }) {
  return (
    <View style={[styles.toggleRow, disabled && styles.buttonDisabled]}>
      <Text style={[styles.toggleLabel, disabled && styles.disabledText]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}

export function TextField({ label, value, onChangeText, placeholder, autoCapitalize = 'sentences', maxLength }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </View>
  );
}

export function InlineNote({ children }) {
  return <Text style={styles.note}>{children}</Text>;
}

export const flowStyles = styles;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F1E8',
  },
  content: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
    gap: 16,
    paddingBottom: 32,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#D3CCBD',
    backgroundColor: '#F4F1E8',
  },
  footerWithBackground: {
    backgroundColor: 'rgba(244, 241, 232, 0.86)',
  },
  footerTransparent: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2A37',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  sectionBody: {
    gap: 10,
  },
  button: {
    borderWidth: 1,
    borderColor: '#B8AF9B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#E8F0FF',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextWrap: {
    flex: 1,
    gap: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buttonSubtitle: {
    fontSize: 13,
    color: '#4B5563',
  },
  rightLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 20,
    elevation: 20,
  },
  modalFill: {
    flex: 1,
  },
  toggleRow: {
    borderWidth: 1,
    borderColor: '#B8AF9B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#B8AF9B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },
  note: {
    fontSize: 13,
    color: '#6B7280',
  },
  disabledText: {
    color: '#6B7280',
  },
});
