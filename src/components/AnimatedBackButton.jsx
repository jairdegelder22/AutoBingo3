import { useState } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import * as Haptics from '../settings/haptics';

const BACK_BUTTON_IMAGE = require('../../assets/images/navigation/back-button.png');
const BACK_BUTTON_PRESSED_IMAGE = require('../../assets/images/navigation/back-button-pressed.png');

export default function AnimatedBackButton({
  disabled = false,
  onActivated,
  size = 66,
  style = null,
}) {
  const [pressed, setPressed] = useState(false);

  function activateFromButton(event) {
    if (disabled) {
      return;
    }

    const { pageX, pageY } = event?.nativeEvent ?? {};
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActivated?.({
      x: typeof pageX === 'number' ? pageX : size / 2,
      y: typeof pageY === 'number' ? pageY : size / 2,
    });
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={activateFromButton}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.button,
        {
          width: size,
          height: size,
        },
        style,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Image
        source={pressed ? BACK_BUTTON_PRESSED_IMAGE : BACK_BUTTON_IMAGE}
        resizeMode="contain"
        fadeDuration={0}
        style={styles.image}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
