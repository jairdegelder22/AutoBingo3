import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const DEFAULT_DURATION = 850;

const CircularReveal = forwardRef(function CircularReveal(
  {
    color,
    originX,
    originY,
    onComplete,
    onHideComplete,
    initiallyVisible = false,
    initialProgress = 0,
    mode = 'cover',
  },
  ref
) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(initialProgress)).current;
  const animationRef = useRef(null);
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [blocksTouches, setBlocksTouches] = useState(initiallyVisible);
  const [renderProgress, setRenderProgress] = useState(initialProgress);

  const diameter = useMemo(
    () => Math.sqrt(width * width + height * height) * 2,
    [height, width]
  );
  const radius = diameter / 2;
  const holeRadius = Math.max(0.001, radius * renderProgress);

  const uncoverPath = useMemo(() => {
    const outer = `M 0 0 H ${width} V ${height} H 0 Z`;
    const circle = [
      `M ${originX} ${originY}`,
      `m -${holeRadius}, 0`,
      `a ${holeRadius},${holeRadius} 0 1,0 ${holeRadius * 2},0`,
      `a ${holeRadius},${holeRadius} 0 1,0 -${holeRadius * 2},0`,
    ].join(' ');

    return `${outer} ${circle}`;
  }, [height, holeRadius, originX, originY, width]);

  const stopAnimation = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const runAnimation = useCallback(
    (toValue, { completeOnFinish = false } = {}) => {
      stopAnimation();

      setIsVisible(true);
      setBlocksTouches(toValue > 0);

      animationRef.current = Animated.timing(progress, {
        toValue,
        duration: DEFAULT_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });

      animationRef.current.start(({ finished }) => {
        animationRef.current = null;

        if (!finished) {
          return;
        }

        if (toValue === 0 && mode === 'cover') {
          setIsVisible(false);
          setBlocksTouches(false);
          onHideComplete?.();
        }

        if (toValue === 1 && mode === 'uncover') {
          setIsVisible(false);
          setBlocksTouches(false);
          onComplete?.();
          return;
        }

        if (completeOnFinish) {
          onComplete?.();
        }
      });
    },
    [mode, onComplete, onHideComplete, progress, stopAnimation]
  );

  const reveal = useCallback(() => {
    progress.setValue(0);
    runAnimation(1, { completeOnFinish: true });
  }, [progress, runAnimation]);

  const hide = useCallback(() => {
    runAnimation(0);
  }, [runAnimation]);

  useImperativeHandle(
    ref,
    () => ({
      reveal,
      hide,
    }),
    [hide, reveal]
  );

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setRenderProgress(value);
    });

    setRenderProgress(initialProgress);

    return () => {
      progress.removeListener(id);
    };
  }, [initialProgress, progress]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  if (!isVisible) {
    return null;
  }

  if (mode === 'uncover') {
    return (
      <Animated.View
        pointerEvents={blocksTouches ? 'auto' : 'none'}
        style={styles.overlay}
      >
        <Svg width={width} height={height}>
          <Path d={uncoverPath} fill={color} fillRule="evenodd" />
        </Svg>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents={blocksTouches ? 'auto' : 'none'}
      style={styles.overlay}
    >
      <Animated.View
        style={[
          styles.circle,
          {
            width: diameter,
            height: diameter,
            borderRadius: radius,
            backgroundColor: color,
            left: originX - radius,
            top: originY - radius,
            transform: [{ scale: progress }],
          },
        ]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  circle: {
    position: 'absolute',
  },
});

export default CircularReveal;
