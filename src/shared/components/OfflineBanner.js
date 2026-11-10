import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, sizes, spacing } from '@shared/config/theme';
import { useIsOffline } from '@shared/utils/connectivity';

const ANIMATION_MS = 250;
const BACK_ONLINE_VISIBLE_MS = 2000;

/**
 * App-wide connection indicator: a pill at the top of the screen while the device is offline,
 * briefly turning into "Back online" when the connection returns. Never intercepts touches.
 */
const OfflineBanner = () => {
  const isOffline = useIsOffline();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState(isOffline ? 'offline' : 'hidden');
  const visibility = useRef(new Animated.Value(isOffline ? 1 : 0)).current;
  const wasOfflineRef = useRef(isOffline);

  useEffect(() => {
    let timer;
    if (isOffline) {
      setStatus('offline');
      Animated.timing(visibility, { toValue: 1, duration: ANIMATION_MS, useNativeDriver: true }).start();
    } else if (wasOfflineRef.current) {
      setStatus('online');
      timer = setTimeout(() => {
        Animated.timing(visibility, { toValue: 0, duration: ANIMATION_MS, useNativeDriver: true }).start(
          ({ finished }) => {
            if (finished) setStatus('hidden');
          }
        );
      }, BACK_ONLINE_VISIBLE_MS);
    }
    wasOfflineRef.current = isOffline;
    return () => clearTimeout(timer);
  }, [isOffline, visibility]);

  if (status === 'hidden') return null;

  const online = status === 'online';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top + spacing.xs,
          opacity: visibility,
          transform: [
            { translateY: visibility.interpolate({ inputRange: [0, 1], outputRange: [-spacing.m, 0] }) },
          ],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.pill, online && styles.pillOnline]}>
        <Ionicons
          name={online ? 'cloud-done-outline' : 'cloud-offline-outline'}
          size={16}
          color={colors.primary}
        />
        <Text style={styles.text}>{online ? 'Back online' : 'No internet connection'}</Text>
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
    zIndex: 9999,
    elevation: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs + 2,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.darkGray,
  },
  pillOnline: {
    backgroundColor: colors.action,
  },
  text: {
    color: colors.textOnColor,
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
  },
});

export default OfflineBanner;
