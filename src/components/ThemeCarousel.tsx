import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatListProps,
  InteractionManager,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from '../settings/haptics';
import { getResponsiveMetrics } from '../utils/responsive';
import { useAppSettings } from '../settings/AppSettingsContext';
import { playPooledSoundEffect, preloadPooledSoundEffect } from '../audio/soundEffects';

type ThemeCarouselProps<ItemT> = {
  items: ItemT[];
  keyExtractor: (item: ItemT, index: number) => string;
  renderCard: (info: { item: ItemT; index: number; isFocused: boolean }) => React.ReactNode;
  itemWidth?: number;
  itemSpacing?: number;
  focusedIndex?: number;
  onSnapToItem?: (index: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
  loop?: boolean;
  decelerationRate?: FlatListProps<ItemT>['decelerationRate'];
  focusSwitchThreshold?: number;
  scrollSoundStepIntervalMs?: number;
  flatListProps?: Omit<
    FlatListProps<ItemT>,
    | 'data'
    | 'renderItem'
    | 'keyExtractor'
    | 'horizontal'
    | 'showsHorizontalScrollIndicator'
    | 'snapToInterval'
    | 'decelerationRate'
    | 'bounces'
    | 'contentContainerStyle'
    | 'onScroll'
    | 'scrollEventThrottle'
    | 'getItemLayout'
  >;
};

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);
const LOOP_SETS = 3;
const DEFAULT_FOCUS_SWITCH_THRESHOLD = 0.28;
const DIRECTION_LOCK_THRESHOLD_PX = 6;
const SCROLL_SOUND = 'scrollGeluid';
const SCROLL_SOUND_POOL_SIZE = 10;
const SCROLL_SOUND_VOLUME_MULTIPLIER = 0.36;
const MAX_SCROLL_SOUND_STEPS = 5;
const MAX_PENDING_SCROLL_SOUND_STEPS = 5;
const IS_ANDROID = Platform.OS === 'android';

export default function ThemeCarousel<ItemT>({
  items,
  keyExtractor,
  renderCard,
  itemWidth,
  itemSpacing,
  focusedIndex,
  onSnapToItem,
  containerStyle,
  loop = true,
  decelerationRate = 'fast',
  focusSwitchThreshold = DEFAULT_FOCUS_SWITCH_THRESHOLD,
  scrollSoundStepIntervalMs = 0,
  flatListProps,
}: ThemeCarouselProps<ItemT>) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { settings } = useAppSettings();
  const { isTablet } = getResponsiveMetrics(screenWidth, screenHeight);
  const resolvedItemWidth = itemWidth ?? Math.min(screenWidth * (isTablet ? 0.54 : 0.68), isTablet ? 380 : 300);
  const resolvedItemSpacing = itemSpacing ?? (isTablet ? 26 : 18);
  const snapInterval = resolvedItemWidth + resolvedItemSpacing;
  const sideInset = Math.max(0, (screenWidth - resolvedItemWidth) / 2);
  const horizontalInset = Math.max(0, sideInset - resolvedItemSpacing / 2);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<ItemT>>(null);
  const baseCount = items.length;
  const shouldLoop = loop && baseCount > 1;
  const requestedInitialIndex = typeof flatListProps?.initialScrollIndex === 'number'
    ? flatListProps.initialScrollIndex
    : 0;
  const initialLogicalIndex = baseCount > 0
    ? Math.max(0, Math.min(requestedInitialIndex, baseCount - 1))
    : 0;
  const loopedItems = useMemo<ItemT[]>(
    () => (shouldLoop ? Array.from({ length: LOOP_SETS }, () => items).flat() : items),
    [items, shouldLoop]
  );
  const initialRenderCount = IS_ANDROID
    ? Math.min(loopedItems.length, Math.max(5, baseCount + 2))
    : loopedItems.length;
  const renderBatchCount = IS_ANDROID
    ? Math.min(loopedItems.length, Math.max(4, baseCount))
    : loopedItems.length;
  const initialIndex = shouldLoop ? baseCount + initialLogicalIndex : initialLogicalIndex;
  const currentAbsoluteIndexRef = useRef(initialIndex);
  const currentLogicalIndexRef = useRef(initialLogicalIndex);
  const hasAppliedInitialOffsetRef = useRef(false);
  const lastFocusedIndexRef = useRef<number | undefined>(undefined);
  const lastScrollOffsetRef = useRef(initialIndex * snapInterval);
  const scrollGestureStartOffsetRef = useRef(initialIndex * snapInterval);
  const lockedScrollDirectionRef = useRef(0);
  const pendingScrollFeedbackTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const preloadTask = InteractionManager.runAfterInteractions(() => {
      preloadPooledSoundEffect(SCROLL_SOUND, SCROLL_SOUND_POOL_SIZE);
    });

    return () => {
      preloadTask.cancel?.();
      clearPendingScrollFeedback();
    };
  }, []);

  useEffect(() => {
    currentAbsoluteIndexRef.current = initialIndex;
    currentLogicalIndexRef.current = initialLogicalIndex;
    hasAppliedInitialOffsetRef.current = false;
    scrollX.setValue(initialIndex * snapInterval);
    lastScrollOffsetRef.current = initialIndex * snapInterval;
    scrollGestureStartOffsetRef.current = initialIndex * snapInterval;
    lockedScrollDirectionRef.current = 0;
  }, [initialIndex, initialLogicalIndex]);

  useEffect(() => {
    if (!IS_ANDROID || focusedIndex === undefined || baseCount === 0) {
      lastFocusedIndexRef.current = focusedIndex;
      return;
    }

    if (lastFocusedIndexRef.current === focusedIndex) {
      return;
    }
    lastFocusedIndexRef.current = focusedIndex;

    const boundedIndex = Math.max(0, Math.min(focusedIndex, baseCount - 1));
    const targetAbsoluteIndex = shouldLoop
      ? [boundedIndex, boundedIndex + baseCount, boundedIndex + baseCount * 2].reduce((closestIndex, candidateIndex) => {
          const closestDistance = Math.abs(closestIndex - currentAbsoluteIndexRef.current);
          const candidateDistance = Math.abs(candidateIndex - currentAbsoluteIndexRef.current);
          return candidateDistance < closestDistance ? candidateIndex : closestIndex;
        }, boundedIndex + baseCount)
      : boundedIndex;
    const targetOffset = targetAbsoluteIndex * snapInterval;

    listRef.current?.scrollToOffset({
      offset: targetOffset,
      animated: true,
    });
    scrollX.setValue(targetOffset);
    lastScrollOffsetRef.current = targetOffset;
    scrollGestureStartOffsetRef.current = targetOffset;
    lockedScrollDirectionRef.current = 0;
    updateFocusedIndex(targetAbsoluteIndex, false, false);
  }, [baseCount, focusedIndex, scrollX, shouldLoop, snapInterval]);

  const ensureInitialOffset = () => {
    if (hasAppliedInitialOffsetRef.current || baseCount === 0) {
      return;
    }

    const initialOffset = initialIndex * snapInterval;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: initialOffset,
        animated: false,
      });
    });
    scrollX.setValue(initialOffset);
    lastScrollOffsetRef.current = initialOffset;
    scrollGestureStartOffsetRef.current = initialOffset;
    lockedScrollDirectionRef.current = 0;
    updateFocusedIndex(initialIndex, false, false);
    hasAppliedInitialOffsetRef.current = true;
  };

  const getItemLayout = useMemo(
    () => (_data: ArrayLike<ItemT> | null | undefined, index: number) => ({
      length: snapInterval,
      offset: snapInterval * index,
      index,
    }),
    [snapInterval]
  );

  const recenterIfNeeded = (absoluteIndex: number) => {
    if (!shouldLoop || baseCount <= 1) {
      return absoluteIndex;
    }

    let targetIndex = absoluteIndex;

    if (absoluteIndex < baseCount) {
      targetIndex = absoluteIndex + baseCount;
    } else if (absoluteIndex >= baseCount * 2) {
      targetIndex = absoluteIndex - baseCount;
    }

    if (targetIndex !== absoluteIndex) {
      listRef.current?.scrollToOffset({
        offset: targetIndex * snapInterval,
        animated: false,
      });
      scrollX.setValue(targetIndex * snapInterval);
      lastScrollOffsetRef.current = targetIndex * snapInterval;
      scrollGestureStartOffsetRef.current = targetIndex * snapInterval;
      lockedScrollDirectionRef.current = 0;
    }

    return targetIndex;
  };

  const getResponsiveFocusedIndex = (offsetX: number) => {
    const rawIndex = offsetX / snapInterval;
    const scrollDelta = offsetX - lastScrollOffsetRef.current;
    const gestureDelta = offsetX - scrollGestureStartOffsetRef.current;
    lastScrollOffsetRef.current = offsetX;

    if (lockedScrollDirectionRef.current === 0 && Math.abs(gestureDelta) >= DIRECTION_LOCK_THRESHOLD_PX) {
      lockedScrollDirectionRef.current = gestureDelta > 0 ? 1 : -1;
    }

    if (lockedScrollDirectionRef.current > 0) {
      return Math.max(
        currentAbsoluteIndexRef.current,
        Math.floor(rawIndex + (1 - focusSwitchThreshold))
      );
    }

    if (lockedScrollDirectionRef.current < 0) {
      return Math.min(
        currentAbsoluteIndexRef.current,
        Math.ceil(rawIndex - (1 - focusSwitchThreshold))
      );
    }

    if (scrollDelta > 0) {
      return Math.max(currentAbsoluteIndexRef.current, Math.floor(rawIndex + (1 - focusSwitchThreshold)));
    }

    if (scrollDelta < 0) {
      return Math.min(currentAbsoluteIndexRef.current, Math.ceil(rawIndex - (1 - focusSwitchThreshold)));
    }

    return currentAbsoluteIndexRef.current;
  };

  const handleScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    clearPendingScrollFeedback();
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollGestureStartOffsetRef.current = offsetX;
    lastScrollOffsetRef.current = offsetX;
    lockedScrollDirectionRef.current = 0;
    flatListProps?.onScrollBeginDrag?.(event);
  };

  const clearPendingScrollFeedback = () => {
    pendingScrollFeedbackTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingScrollFeedbackTimeoutsRef.current = [];
  };

  const playScrollSoundStep = () => {
    void playPooledSoundEffect(SCROLL_SOUND, settings, SCROLL_SOUND_POOL_SIZE, {
      volumeMultiplier: SCROLL_SOUND_VOLUME_MULTIPLIER,
    });
  };

  const scheduleScrollSoundStep = (delayMs: number) => {
    if (delayMs <= 0) {
      playScrollSoundStep();
      return;
    }

    if (pendingScrollFeedbackTimeoutsRef.current.length >= MAX_PENDING_SCROLL_SOUND_STEPS) {
      return;
    }

    const timeoutId = setTimeout(() => {
      pendingScrollFeedbackTimeoutsRef.current = pendingScrollFeedbackTimeoutsRef.current.filter(
        (pendingTimeoutId) => pendingTimeoutId !== timeoutId
      );
      playScrollSoundStep();
    }, delayMs);

    pendingScrollFeedbackTimeoutsRef.current.push(timeoutId);
  };

  const playScrollFeedbackSteps = (stepCount: number) => {
    const resolvedStepCount = Math.min(Math.max(stepCount, 1), MAX_SCROLL_SOUND_STEPS);

    void Haptics.selectionAsync();

    for (let stepIndex = 0; stepIndex < resolvedStepCount; stepIndex += 1) {
      scheduleScrollSoundStep(stepIndex * scrollSoundStepIntervalMs);
    }
  };

  const updateFocusedIndex = (absoluteIndex: number, triggerHaptic: boolean, notifySelection = true) => {
    const safeAbsoluteIndex = Math.max(0, Math.min(absoluteIndex, loopedItems.length - 1));
    const logicalIndex = baseCount > 0 ? safeAbsoluteIndex % baseCount : 0;
    const crossedSteps = Math.abs(safeAbsoluteIndex - currentAbsoluteIndexRef.current);

    currentAbsoluteIndexRef.current = safeAbsoluteIndex;

    if (logicalIndex !== currentLogicalIndexRef.current) {
      currentLogicalIndexRef.current = logicalIndex;
      if (triggerHaptic) {
        playScrollFeedbackSteps(crossedSteps);
      }
      if (notifySelection) {
        onSnapToItem?.(logicalIndex);
      }
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (baseCount === 0) {
          return;
        }

        const offsetX = event.nativeEvent.contentOffset.x;
        const absoluteIndex = getResponsiveFocusedIndex(offsetX);
        updateFocusedIndex(absoluteIndex, true, true);
      },
    }
  );

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextAbsoluteIndex = Math.round(offsetX / snapInterval);
    const recenteredIndex = recenterIfNeeded(nextAbsoluteIndex);
    updateFocusedIndex(recenteredIndex, false, true);
    scrollGestureStartOffsetRef.current = recenteredIndex * snapInterval;
    lastScrollOffsetRef.current = recenteredIndex * snapInterval;
    lockedScrollDirectionRef.current = 0;
    flatListProps?.onMomentumScrollEnd?.(event);
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    flatListProps?.onScrollEndDrag?.(event);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<ItemT>) => {
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [24, 0, -24],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [18, 0, 18],
      extrapolate: 'clamp',
    });

    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ['28deg', '0deg', '-28deg'],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.72, 1, 0.72],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ width: snapInterval }}>
        <Animated.View
          style={[
            styles.cardWrap,
            {
              width: resolvedItemWidth,
              opacity,
              transform: [
                { perspective: 1000 },
                { translateX },
                { translateY },
                { scale },
                { rotateY },
              ],
            },
          ]}
        >
          {renderCard({
            item,
            index: baseCount > 0 ? index % baseCount : index,
            isFocused: index === currentAbsoluteIndexRef.current,
          })}
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <AnimatedFlatList
        {...flatListProps}
        ref={listRef}
        horizontal
        bounces={false}
        data={loopedItems}
        decelerationRate={decelerationRate}
        directionalLockEnabled
        getItemLayout={getItemLayout}
        initialScrollIndex={shouldLoop ? undefined : initialIndex}
        keyExtractor={(item, index) => `${keyExtractor(item as ItemT, baseCount > 0 ? index % baseCount : index)}-${index}`}
        initialNumToRender={initialRenderCount}
        maxToRenderPerBatch={renderBatchCount}
        onLayout={ensureInitialOffset}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScrollEndDrag}
        onScroll={handleScroll}
        onScrollToIndexFailed={() => {
          requestAnimationFrame(ensureInitialOffset);
        }}
        renderItem={renderItem}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={snapInterval}
        updateCellsBatchingPeriod={0}
        windowSize={IS_ANDROID ? 5 : Math.max(7, loopedItems.length)}
        style={styles.list}
        onContentSizeChange={ensureInitialOffset}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: horizontalInset,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  list: {
    width: '100%',
    overflow: 'visible',
  },
  contentContainer: {
    alignItems: 'center',
  },
  cardWrap: {
    alignSelf: 'center',
  },
});
