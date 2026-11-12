import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Keyboard, Platform, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, spacing } from '@shared/config/theme';
import haptics from '@shared/utils/haptics';

export const TAB_BAR_HEIGHT = 64;
const INDICATOR_SIZE = 48;
const ICON_SIZE = 24;
const ITEM_WIDTH = 72;
const BAR_PADDING = spacing.s;
const SIDE_MARGIN = spacing.l;
const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

// [active, inactive] Ionicons per tab.
const TAB_ICONS = {
  Cast: ['home', 'home-outline'],
  Track: ['stats-chart', 'stats-chart-outline'],
  Lab: ['flask', 'flask-outline'],
  Library: ['library', 'library-outline'],
};

// Distance between the bottom of the screen and the bar: above the home indicator / navigation bar.
const getBarBottom = (insets) => Math.max(insets.bottom, spacing.m);

/** Bottom space a tab screen must keep free so its content is never hidden behind the floating bar. */
export const useTabBarSpace = () => {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + getBarBottom(insets) + spacing.m;
};

const useKeyboardVisible = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // iOS reports the keyboard before it animates in, so the bar can leave in sync with it.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
};

const TabItem = ({ routeName, label, focused, onPress, onLongPress, onLayout }) => {
  const [activeIcon, inactiveIcon] = TAB_ICONS[routeName] || ['ellipse', 'ellipse-outline'];
  const progress = useSharedValue(focused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, progress]);

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  const activeStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + 0.3 * progress.value }],
  }));
  const inactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
      onPressIn={() => {
        pressScale.value = withSpring(0.86, SPRING);
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, SPRING);
      }}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.iconBox, pressStyle]}>
        <Animated.View style={[styles.iconLayer, inactiveStyle]}>
          <Ionicons name={inactiveIcon} size={ICON_SIZE} color={colors.textSecondary} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, activeStyle]}>
          <Ionicons name={activeIcon} size={ICON_SIZE} color={colors.textOnColor} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

/**
 * Floating, pill-shaped tab bar: icons only, with a blue indicator that springs (and briefly
 * stretches) toward the selected tab. The bar is centered and sized from the window and the
 * safe-area insets, and slides away while the keyboard is open.
 *
 * The indicator lives in the same row as the items and is placed from their *measured* position,
 * so it stays exactly behind its icon on any screen size, tab count, rounding or font scale.
 */
const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  const tabBarSpace = useTabBarSpace();

  const { routes, index: activeIndex } = state;
  const availableWidth = windowWidth - Math.max(insets.left, insets.right, 0) * 2 - SIDE_MARGIN * 2;
  const barWidth = Math.min(availableWidth, routes.length * ITEM_WIDTH + BAR_PADDING * 2);
  const barBottom = getBarBottom(insets);

  // Position of each item in the row, by route key.
  const [layouts, setLayouts] = useState({});
  const activeLayout = layouts[routes[activeIndex]?.key];
  const targetX = activeLayout ? activeLayout.x + (activeLayout.width - INDICATOR_SIZE) / 2 : null;
  const activeWidth = activeLayout?.width ?? null;

  const translateX = useSharedValue(0);
  const stretch = useSharedValue(1);
  const ready = useSharedValue(0);
  const hidden = useSharedValue(0);
  const placedWidth = useRef(null);

  const onItemLayout = useCallback((key, { x, width }) => {
    setLayouts((previous) => {
      const current = previous[key];
      if (current && Math.abs(current.x - x) < 0.5 && Math.abs(current.width - width) < 0.5) {
        return previous;
      }
      return { ...previous, [key]: { x, width } };
    });
  }, []);

  useLayoutEffect(() => {
    reportHeight?.(tabBarSpace);
  }, [reportHeight, tabBarSpace]);

  useEffect(() => {
    if (targetX === null) return;
    // First measure, or a new layout (tab added, rotation, tablet resize): jump. A tab change
    // keeps the item width, so it springs.
    if (placedWidth.current === null || placedWidth.current !== activeWidth) {
      placedWidth.current = activeWidth;
      translateX.value = targetX;
      ready.value = 1;
      return;
    }
    translateX.value = withSpring(targetX, SPRING);
    stretch.value = withSequence(withTiming(1.3, { duration: 110 }), withSpring(1, SPRING));
  }, [targetX, activeWidth, translateX, stretch, ready]);

  useEffect(() => {
    hidden.value = withTiming(keyboardVisible ? 1 : 0, { duration: 200 });
  }, [keyboardVisible, hidden]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: ready.value,
    transform: [{ translateX: translateX.value }, { scaleX: stretch.value }],
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - hidden.value,
    transform: [{ translateY: hidden.value * (TAB_BAR_HEIGHT + barBottom) }],
  }));

  return (
    <Animated.View
      style={[styles.container, { bottom: barBottom }, barStyle]}
      pointerEvents={keyboardVisible ? 'none' : 'box-none'}
    >
      <View style={[styles.bar, { width: barWidth }]} accessibilityRole="tablist">
        <View style={styles.items}>
          <Animated.View style={[styles.indicatorTrack, indicatorStyle]} pointerEvents="none">
            <View style={styles.indicator} />
          </Animated.View>
          {routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = activeIndex === index;
            const label = options.tabBarAccessibilityLabel || options.title || route.name;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptics.tap();
                navigation.navigate(route.name, route.params);
              }
            };
            const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                label={label}
                focused={focused}
                onPress={onPress}
                onLongPress={onLongPress}
                onLayout={(event) => onItemLayout(route.key, event.nativeEvent.layout)}
              />
            );
          })}
        </View>
        {/* The hairline border is drawn over the bar, so it takes no part in the layout. */}
        <View style={styles.border} pointerEvents="none" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  // Items and indicator share this row, so they share one origin.
  items: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: BAR_PADDING,
  },
  indicatorTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: INDICATOR_SIZE,
    justifyContent: 'center',
  },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: colors.accent,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingTabBar;
