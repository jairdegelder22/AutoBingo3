import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

export function ScreenLayout({ title, children, footer, scroll = true }) {
  const ContentWrapper = scroll ? ScrollView : View;

  return (
    <View style={styles.screen}>
      <ContentWrapper
        style={styles.content}
        contentContainerStyle={scroll ? styles.scrollContent : undefined}
      >
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </ContentWrapper>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
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

export function BackButton({ onPress, label = 'Terug' }) {
  return (
    <Pressable style={styles.backButton} onPress={onPress}>
      <Text style={styles.backButtonText}>{label}</Text>
    </Pressable>
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
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#D3CCBD',
    backgroundColor: '#F4F1E8',
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
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
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
