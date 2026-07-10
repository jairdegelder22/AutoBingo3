import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import CircularReveal from '../../components/CircularReveal';
import AnimatedBackButton from './AnimatedBackButton';

const BACK_REVEAL_YELLOW = '#F5C400';

export default function AnimatedRouteBackButton({
  navigation,
  size = 66,
  style = null,
}) {
  const revealRef = useRef(null);
  const [origin, setOrigin] = useState({ x: size / 2, y: size / 2 });
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
    setOrigin(nextOrigin);
    setTransitioning(true);
  }

  function handleRevealComplete() {
    const transition = {
      color: BACK_REVEAL_YELLOW,
      originX: origin.x,
      originY: origin.y,
      pauseMs: 240,
      transitionKey: `back-${Date.now()}`,
    };

    if (navigation?.goBackWithTransition) {
      navigation.goBackWithTransition(transition);
    } else {
      navigation?.goBack?.();
    }
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, style]}>
      <AnimatedBackButton
        disabled={transitioning}
        onActivated={handleActivated}
        size={size}
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

const styles = StyleSheet.create({
  wrap: {
    minWidth: 66,
    minHeight: 66,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  modalFill: {
    flex: 1,
  },
});
