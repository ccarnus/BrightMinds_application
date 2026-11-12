import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import { SLOW_LOADING_HINT_MS } from '@shared/components/Loader';
import { useIsOffline } from '@shared/utils/connectivity';

const Block = ({ style }) => <View style={[styles.block, style]} />;

/**
 * Placeholder of the home layout while the feed loads: it pulses softly, then explains the wait
 * when it is slow (like the full-screen loader does).
 */
const HomeSkeleton = () => {
  const pulse = useSharedValue(0.55);
  const isOffline = useIsOffline();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_LOADING_HINT_MS);
    return () => clearTimeout(timer);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading your feed">
      <Animated.View style={[styles.content, pulseStyle]}>
        <Block style={styles.greeting} />
        <Block style={styles.title} />
        <Block style={styles.search} />
        <View style={styles.tiles}>
          <Block style={styles.tile} />
          <Block style={styles.tile} />
          <Block style={styles.tile} />
        </View>
        <Block style={styles.hero} />
        <Block style={styles.sectionTitle} />
        <View style={styles.rail}>
          <Block style={styles.card} />
          <Block style={styles.card} />
        </View>
      </Animated.View>
      {isSlow && (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {isOffline
            ? "You're offline. Waiting for the connection..."
            : 'This is taking longer than usual...'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
  },
  block: { backgroundColor: colors.border, borderRadius: sizes.radius },
  greeting: { width: '32%', height: 14, borderRadius: 7 },
  title: { width: '78%', height: 26, borderRadius: 8, marginTop: spacing.s + 2 },
  search: { height: 52, borderRadius: 26, marginTop: spacing.l },
  tiles: { flexDirection: 'row', gap: spacing.s + 2, marginTop: spacing.m },
  tile: { flex: 1, height: 104 },
  hero: { height: 190, marginTop: spacing.l, borderRadius: sizes.radius + 4 },
  sectionTitle: { width: '42%', height: 20, borderRadius: 8, marginTop: spacing.l },
  rail: { flexDirection: 'row', gap: spacing.m - 4, marginTop: spacing.s + 4 },
  card: { width: '62%', height: 150 },
  hint: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
    marginTop: spacing.l,
  },
});

export default HomeSkeleton;
