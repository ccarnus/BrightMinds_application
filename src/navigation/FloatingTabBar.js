import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const TabItem = ({ routeName, label, focused, onPress, onLongPress }) => {
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
 * stretches) toward the selected tab. Sized from the window and safe-area insets so it stays
 * centered on any phone or tablet, and slides away while the keyboard is open.
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
  // Items share the bar's inner width (inside the hairline border and side padding).
  const itemWidth = (barWidth - StyleSheet.hairlineWidth * 2 - BAR_PADDING * 2) / routes.length;
  const indicatorX = BAR_PADDING + activeIndex * itemWidth + (itemWidth - INDICATOR_SIZE) / 2;
  const barBottom = getBarBottom(insets);

  const translateX = useSharedValue(indicatorX);
  const stretch = useSharedValue(1);
  const hidden = useSharedValue(0);
  const previousLayout = useRef({ indicatorX, itemWidth });

  useLayoutEffect(() => {
    reportHeight?.(tabBarSpace);
  }, [reportHeight, tabBarSpace]);

  useEffect(() => {
    const previous = previousLayout.current;
    previousLayout.current = { indicatorX, itemWidth };
    if (previous.indicatorX === indicatorX) return;
    // A layout change (tab added, rotation) moves the indicator instantly; a tab change springs it.
    if (previous.itemWidth !== itemWidth) {
      translateX.value = indicatorX;
      return;
    }
    translateX.value = withSpring(indicatorX, SPRING);
    stretch.value = withSequence(withTiming(1.3, { duration: 110 }), withSpring(1, SPRING));
  }, [indicatorX, itemWidth, translateX, stretch]);

  useEffect(() => {
    hidden.value = withTiming(keyboardVisible ? 1 : 0, { duration: 200 });
  }, [keyboardVisible, hidden]);

  const indicatorStyle = useAnimatedStyle(() => ({
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
        <Animated.View style={[styles.indicator, indicatorStyle]} />
        <View style={styles.items}>
          {routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = activeIndex === index;
            const label = options.tabBarAccessibilityLabel || options.title || route.name;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
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
              />
            );
          })}
        </View>
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
    justifyContent: 'center',
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.soft,
  },
  // The bar has no padding so the absolutely positioned indicator shares the items' origin.
  items: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: BAR_PADDING,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: (TAB_BAR_HEIGHT - INDICATOR_SIZE) / 2 - StyleSheet.hairlineWidth,
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
