import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatListProps,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

type ThemeCarouselProps<ItemT> = {
  items: ItemT[];
  keyExtractor: (item: ItemT, index: number) => string;
  renderCard: (info: { item: ItemT; index: number; isFocused: boolean }) => React.ReactNode;
  itemWidth?: number;
  itemSpacing?: number;
  onSnapToItem?: (index: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
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

export default function ThemeCarousel<ItemT>({
  items,
  keyExtractor,
  renderCard,
  itemWidth,
  itemSpacing = 18,
  onSnapToItem,
  containerStyle,
  flatListProps,
}: ThemeCarouselProps<ItemT>) {
  const { width: screenWidth } = useWindowDimensions();
  const resolvedItemWidth = itemWidth ?? Math.min(screenWidth * 0.68, 300);
  const snapInterval = resolvedItemWidth + itemSpacing;
  const sideInset = Math.max(0, (screenWidth - resolvedItemWidth) / 2);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<ItemT>>(null);
  const baseCount = items.length;
  const loopedItems = useMemo(
    () => (baseCount > 1 ? Array.from({ length: LOOP_SETS }, () => items).flat() : items),
    [baseCount, items]
  );
  const initialIndex = baseCount > 1 ? baseCount : 0;
  const currentAbsoluteIndexRef = useRef(initialIndex);
  const currentLogicalIndexRef = useRef(0);

  useEffect(() => {
    currentAbsoluteIndexRef.current = initialIndex;
    currentLogicalIndexRef.current = 0;
  }, [initialIndex]);

  const getItemLayout = useMemo(
    () => (_data: ArrayLike<ItemT> | null | undefined, index: number) => ({
      length: snapInterval,
      offset: snapInterval * index,
      index,
    }),
    [snapInterval]
  );

  const recenterIfNeeded = (absoluteIndex: number) => {
    if (baseCount <= 1) {
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
    }

    return targetIndex;
  };

  const updateFocusedIndex = (absoluteIndex: number, triggerHaptic: boolean) => {
    const safeAbsoluteIndex = Math.max(0, Math.min(absoluteIndex, loopedItems.length - 1));
    const logicalIndex = baseCount > 0 ? safeAbsoluteIndex % baseCount : 0;

    currentAbsoluteIndexRef.current = safeAbsoluteIndex;

    if (logicalIndex !== currentLogicalIndexRef.current) {
      currentLogicalIndexRef.current = logicalIndex;
      if (triggerHaptic) {
        void Haptics.selectionAsync();
      }
      onSnapToItem?.(logicalIndex);
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
        const absoluteIndex = Math.round(offsetX / snapInterval);
        updateFocusedIndex(absoluteIndex, true);
      },
    }
  );

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextAbsoluteIndex = Math.round(offsetX / snapInterval);
    const recenteredIndex = recenterIfNeeded(nextAbsoluteIndex);
    updateFocusedIndex(recenteredIndex, false);
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
    <View style={containerStyle}>
      <AnimatedFlatList
        {...flatListProps}
        ref={listRef}
        horizontal
        bounces={false}
        data={loopedItems}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        keyExtractor={(item, index) => `${keyExtractor(item, baseCount > 0 ? index % baseCount : index)}-${index}`}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={handleScroll}
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={snapInterval}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: sideInset,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
  },
  cardWrap: {
    alignSelf: 'center',
  },
});
