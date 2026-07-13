import React, { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import CircularReveal from '../../components/CircularReveal';

const DEMO_BUTTONS = [
  {
    label: 'Blue reveal',
    color: '#155E75',
  },
  {
    label: 'Red reveal',
    color: '#C2410C',
  },
  {
    label: 'Gold reveal',
    color: '#D97706',
  },
];

function measureViewCenter(target) {
  return new Promise((resolve) => {
    const node = target?.current ?? target;

    if (!node?.measureInWindow) {
      resolve({ x: 0, y: 0 });
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      resolve({
        x: x + width / 2,
        y: y + height / 2,
      });
    });
  });
}

export default function CircularRevealDemoScreen() {
  const { width, height } = useWindowDimensions();
  const revealRef = useRef(null);
  const buttonRefs = useRef([]);
  const hideTimeoutRef = useRef(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [revealColor, setRevealColor] = useState(DEMO_BUTTONS[0].color);
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleRevealPress = async (index) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    const selectedButton = DEMO_BUTTONS[index];
    const center = await measureViewCenter(buttonRefs.current[index]);

    setPhase('revealing');
    setRevealColor(selectedButton.color);
    setOrigin(center);
    requestAnimationFrame(() => {
      revealRef.current?.reveal();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Circular Reveal Demo</Text>
        <Text style={styles.subtitle}>
          Tap the button to expand from the button&apos;s position. After 2 seconds the color closes
          back in toward the middle of the screen.
        </Text>

        <View style={styles.buttonList}>
          {DEMO_BUTTONS.map((button, index) => (
            <View
              key={button.label}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              collapsable={false}
            >
              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: button.color },
                  phase !== 'idle' ? styles.buttonDisabled : null,
                ]}
                disabled={phase !== 'idle'}
                onPress={() => handleRevealPress(index)}
              >
                <Text style={styles.buttonText}>{button.label}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <CircularReveal
        ref={revealRef}
        color={revealColor}
        originX={origin.x}
        originY={origin.y}
        onComplete={() => {
          setPhase('filled');
          hideTimeoutRef.current = setTimeout(() => {
            setOrigin({
              x: width / 2,
              y: height / 2,
            });
            setPhase('closing');
            requestAnimationFrame(() => {
              revealRef.current?.hide();
            });
            hideTimeoutRef.current = null;
          }, 2000);
        }}
        onHideComplete={() => {
          setPhase('idle');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1E8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  buttonList: {
    width: '100%',
    maxWidth: 280,
    gap: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#143A52',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: '#35627B',
    textAlign: 'center',
    maxWidth: 320,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
