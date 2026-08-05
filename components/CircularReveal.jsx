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

const DEFAULT_DURATION = 620;

function buildCirclePath(originX, originY, circleRadius) {
  const safeRadius = Math.max(0.001, circleRadius);

  return [
    `M ${originX} ${originY}`,
    `m -${safeRadius}, 0`,
    `a ${safeRadius},${safeRadius} 0 1,0 ${safeRadius * 2},0`,
    `a ${safeRadius},${safeRadius} 0 1,0 -${safeRadius * 2},0`,
  ].join(' ');
}

const CircularReveal = forwardRef(function CircularReveal(
  {
    color,
    originX,
    originY,
    onComplete,
    onHideComplete,
    onRevealStart,
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
  const circleRadius = Math.max(0.001, radius * renderProgress);

  const visiblePath = useMemo(() => {
    const circle = buildCirclePath(originX, originY, circleRadius);

    if (mode === 'uncover') {
      const outer = `M 0 0 H ${width} V ${height} H 0 Z`;
      return `${outer} ${circle}`;
    }

    return circle;
  }, [circleRadius, height, mode, originX, originY, width]);

  const stopAnimation = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const runAnimation = useCallback(
    (toValue, { completeOnFinish = false } = {}) => {
      stopAnimation();

      setIsVisible(true);
      setBlocksTouches(toValue > 0);
      if (toValue > 0) {
        onRevealStart?.();
      }

      animationRef.current = Animated.timing(progress, {
        toValue,
        duration: DEFAULT_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: mode === 'cover',
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
    [mode, onComplete, onHideComplete, onRevealStart, progress, stopAnimation]
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
    if (mode === 'cover') {
      setRenderProgress(initialProgress);
      return undefined;
    }

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

  if (mode === 'cover') {
    return (
      <Animated.View
        pointerEvents={blocksTouches ? 'auto' : 'none'}
        style={styles.overlay}
      >
        <Animated.View
          style={[
            styles.coverCircle,
            {
              left: originX - radius,
              top: originY - radius,
              width: diameter,
              height: diameter,
              borderRadius: radius,
              backgroundColor: color,
              transform: [{ scale: progress }],
            },
          ]}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents={blocksTouches ? 'auto' : 'none'}
      style={styles.overlay}
    >
      <Svg width={width} height={height}>
        <Path d={visiblePath} fill={color} fillRule="evenodd" />
      </Svg>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  coverCircle: {
    position: 'absolute',
  },
});

export default CircularReveal;
