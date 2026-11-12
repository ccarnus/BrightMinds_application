import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  contentWidth,
  fonts,
  scale,
  scrim,
  shadow,
  sizes,
  spacing,
  typography,
} from '@shared/config/theme';
import PressableScale from '@shared/components/PressableScale';
import { formatCastDuration } from '@features/cast/utils/home';

const FALLBACK_GRADIENT = [colors.darkblue, colors.lightblue];
const ASPECT_RATIO = 1.62;
const PLAY_SIZE = scale(52);

/**
 * Big card of the cast picked for the user: slowly settling thumbnail, title over a fade, the
 * duration and a green play button. `cast` comes from `toCastCard`.
 */
const FeaturedCast = ({ cast, label = 'Picked for you', onPress }) => {
  const { width } = useWindowDimensions();
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = !!cast.image && !imageFailed;
  // The card is capped like the other content, so it keeps its shape on tablets.
  const cardHeight = Math.round(Math.min(width - spacing.m * 2, contentWidth.maxWidth) / ASPECT_RATIO);

  const zoom = useSharedValue(1.12);
  useEffect(() => {
    zoom.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [cast.id, zoom]);
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(480)} style={styles.wrapper}>
      <PressableScale
        scaleTo={0.98}
        onPress={() => onPress(cast)}
        style={[styles.card, { height: cardHeight }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${cast.title}. Watch now`}
      >
        <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
          {showImage ? (
            <Image
              source={{ uri: cast.image }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <LinearGradient colors={FALLBACK_GRADIENT} style={StyleSheet.absoluteFill} />
          )}
        </Animated.View>
        <LinearGradient colors={scrim} style={styles.scrim} pointerEvents="none" />

        <View style={styles.tag} pointerEvents="none">
          <Ionicons name="sparkles" size={scale(13)} color={colors.textOnColor} />
          <Text style={styles.tagText}>{label}</Text>
        </View>
        <View style={styles.play} pointerEvents="none">
          <Ionicons name="play" size={scale(22)} color={colors.textOnColor} style={styles.playIcon} />
        </View>

        <View style={styles.bottom} pointerEvents="none">
          <Text style={styles.title} numberOfLines={2}>
            {cast.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatCastDuration(cast.duration)}
            {cast.university ? `  ·  ${cast.university}` : ''}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
  },
  card: {
    borderRadius: sizes.radius + 4,
    overflow: 'hidden',
    backgroundColor: colors.placeholder,
    ...shadow.soft,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75%',
  },
  tag: {
    position: 'absolute',
    top: spacing.s + 4,
    left: spacing.s + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: sizes.buttonRadius,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.textOnColor,
  },
  bottom: {
    position: 'absolute',
    left: spacing.m - 2,
    right: spacing.m - 2,
    bottom: spacing.m - 2,
  },
  title: {
    ...typography.h2,
    color: colors.textOnColor,
  },
  meta: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 3,
  },
  // Top right, so the title can use the full width of the card.
  play: {
    position: 'absolute',
    top: spacing.s + 2,
    right: spacing.s + 4,
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
  },
  // A play triangle looks centered when nudged a little to the right.
  playIcon: { marginLeft: 3 },
});

export default FeaturedCast;
