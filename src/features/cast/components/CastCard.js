import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { colors, fonts, scale, scrim, sizes, spacing } from '@shared/config/theme';
import PressableScale from '@shared/components/PressableScale';
import { formatCastDuration } from '@features/cast/utils/home';

const doneAnimation = require('@assets/lotties/done.json');

const FALLBACK_GRADIENT = [colors.darkblue, colors.lightblue];
// Gold, silver and bronze for the podium of the trending rail.
const RANK_COLORS = ['#F5A623', '#9AA7B2', '#C77C3B'];
const ENTRANCE_STAGGER_MS = 70;
const MAX_STAGGERED_CARDS = 6;

/**
 * Cast poster: thumbnail with a fade for the title, duration, a "new" tag and, in the trending
 * rail, the rank. Springs while pressed and slides in with the rail.
 * `item` is `{ id, image, title, duration, university, isNew }` (see `toCastCard`).
 */
const CastCard = ({ item, index = 0, rank, width, height, finished, onFinish, onPress }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!item.image && !imageFailed;
  const rankColor = rank ? RANK_COLORS[rank - 1] || 'rgba(0, 0, 0, 0.55)' : null;

  return (
    <Animated.View
      entering={FadeInRight.delay(Math.min(index, MAX_STAGGERED_CARDS) * ENTRANCE_STAGGER_MS).duration(420)}
    >
      <PressableScale
        style={[styles.card, { width, height }]}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${formatCastDuration(item.duration)}`}
      >
        {showImage ? (
          <Image
            source={{ uri: item.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <LinearGradient colors={FALLBACK_GRADIENT} style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Ionicons name="play-circle" size={scale(44)} color="rgba(255, 255, 255, 0.55)" />
          </LinearGradient>
        )}
        <LinearGradient colors={scrim} style={styles.scrim} pointerEvents="none" />

        <View style={styles.topRow} pointerEvents="none">
          {rank ? (
            <View style={[styles.pill, { backgroundColor: rankColor }]}>
              <MaterialCommunityIcons name="trending-up" size={scale(13)} color={colors.textOnColor} />
              <Text style={styles.pillText}>#{rank}</Text>
            </View>
          ) : (
            <View />
          )}
          {item.isNew && (
            <View style={[styles.pill, { backgroundColor: colors.action }]}>
              <Text style={styles.pillText}>NEW</Text>
            </View>
          )}
        </View>

        <View style={styles.bottom} pointerEvents="none">
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {!!item.university && (
              <Text style={styles.meta} numberOfLines={1}>
                {item.university}
              </Text>
            )}
          </View>
          <View style={styles.duration}>
            <Ionicons name="play" size={scale(10)} color={colors.textOnColor} />
            <Text style={styles.durationText}>{formatCastDuration(item.duration)}</Text>
          </View>
        </View>

        {finished && (
          <LottieView
            source={doneAnimation}
            autoPlay
            loop={false}
            onAnimationFinish={() => onFinish?.(item.id)}
            style={styles.done}
          />
        )}
      </PressableScale>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.placeholder,
  },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '68%',
  },
  topRow: {
    position: 'absolute',
    top: spacing.s + 2,
    left: spacing.s + 2,
    right: spacing.s + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: sizes.buttonRadius,
  },
  pillText: {
    fontFamily: fonts.bold,
    fontSize: sizes.small,
    color: colors.textOnColor,
  },
  bottom: {
    position: 'absolute',
    left: spacing.s + 4,
    right: spacing.s + 4,
    bottom: spacing.s + 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.s,
  },
  titleBlock: { flex: 1 },
  title: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    lineHeight: Math.round(sizes.h4 * 1.25),
    color: colors.textOnColor,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: sizes.small,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  durationText: {
    fontFamily: fonts.bold,
    fontSize: sizes.small,
    color: colors.textOnColor,
  },
  done: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});

export default CastCard;
