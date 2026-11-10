import React, { useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { colors, fonts, scale, sizes, spacing, typography } from '@shared/config/theme';

const IMAGE_HEIGHT = scale(140);
const CARD_WIDTH = Math.round(IMAGE_HEIGHT * 1.75);
const CARD_GAP = spacing.m;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const doneAnimation = require('@assets/lotties/done.json');

const formatCastDuration = (duration = 0) => {
  const minutes = Math.floor(duration);
  const seconds = Math.round((duration - minutes) * 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const VARIANTS = {
  cast: {
    formatDuration: formatCastDuration,
    route: 'VideoScreen',
    getParams: (id) => ({ selectedVideoId: id }),
  },
  article: {
    formatDuration: (duration) => `${duration} min`,
    route: 'ArticleDetails',
    getParams: (id) => ({ selectedArticleId: id }),
  },
};

const Separator = () => <View style={{ width: CARD_GAP }} />;

/**
 * Horizontal content carousel used for casts and articles.
 * `list` items must be normalized to `{ id, image, title, duration }`.
 */
const Carousel = ({ list, variant = 'cast', finishedIds = [], onAnimationFinish }) => {
  const navigation = useNavigation();
  const config = VARIANTS[variant] || VARIANTS.cast;

  const renderItem = useCallback(
    ({ item }) => {
      const isFinished = finishedIds.includes(item.id);
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate(config.route, config.getParams(item.id))}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <View style={styles.imageBox}>
            <Image source={{ uri: item.image }} style={styles.image} />
            {isFinished && (
              <LottieView
                source={doneAnimation}
                autoPlay
                loop={false}
                onAnimationFinish={() => onAnimationFinish?.(item.id)}
                style={styles.lottieOverlay}
              />
            )}
            <Text style={styles.duration}>{config.formatDuration(item.duration)}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        </TouchableOpacity>
      );
    },
    [config, finishedIds, navigation, onAnimationFinish]
  );

  return (
    <FlatList
      data={list}
      horizontal
      snapToInterval={SNAP_INTERVAL}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      extraData={finishedIds}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  card: {
    width: CARD_WIDTH,
  },
  imageBox: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.placeholder,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  title: {
    ...typography.bodySmall,
    marginTop: spacing.s,
    color: colors.text,
  },
  duration: {
    position: 'absolute',
    bottom: spacing.s,
    right: spacing.s,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    color: colors.textOnColor,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    fontFamily: fonts.bold,
    fontSize: sizes.small,
    zIndex: 2,
  },
});

export default Carousel;
