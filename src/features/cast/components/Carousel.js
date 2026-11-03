import React, { useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { colors, shadow, sizes, spacing } from '@shared/config/theme';

const CARD_HEIGHT = 140;
const CARD_WIDTH = CARD_HEIGHT * 1.75;
const CARD_WIDTH_SPACING = CARD_WIDTH + spacing.l;

const doneAnimation = require('@assets/lotties/done.json');

const formatCastDuration = (duration = 0) => {
  const minutes = Math.floor(duration);
  const seconds = Math.round((duration - minutes) * 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const VARIANTS = {
  cast: {
    cardHeight: 200,
    titleOffset: 55,
    titleMaxHeight: 70,
    itemMarginBottom: 0,
    formatDuration: formatCastDuration,
    route: 'VideoScreen',
    getParams: (id) => ({ selectedVideoId: id }),
  },
  article: {
    cardHeight: 180,
    titleOffset: 30,
    titleMaxHeight: 50,
    itemMarginBottom: spacing.xl,
    formatDuration: (duration) => `${duration} min`,
    route: 'ArticleDetails',
    getParams: (id) => ({ selectedArticleId: id }),
  },
};

/**
 * Horizontal content carousel used for casts and articles.
 * `list` items must be normalized to `{ id, image, title, duration }`.
 */
const Carousel = ({ list, variant = 'cast', finishedIds = [], onAnimationFinish }) => {
  const navigation = useNavigation();
  const config = VARIANTS[variant] || VARIANTS.cast;

  const renderItem = useCallback(
    ({ item, index }) => {
      const isFinished = finishedIds.includes(item.id);
      return (
        <TouchableOpacity
          style={{
            marginLeft: spacing.l,
            marginBottom: config.itemMarginBottom,
            marginRight: index === list.length - 1 ? spacing.l : 0,
          }}
          onPress={() => navigation.navigate(config.route, config.getParams(item.id))}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <View style={[styles.card, { height: config.cardHeight }, shadow.dark]}>
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
            <View
              style={[
                styles.titleBox,
                { top: config.cardHeight - config.titleOffset, maxHeight: config.titleMaxHeight },
              ]}
            >
              <Text style={styles.title}>{item.title}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [config, finishedIds, list.length, navigation, onAnimationFinish]
  );

  return (
    <FlatList
      data={list}
      horizontal
      snapToInterval={CARD_WIDTH_SPACING}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      extraData={finishedIds}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginVertical: 10,
    position: 'relative',
  },
  imageBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    elevation: 5,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    resizeMode: 'cover',
  },
  lottieOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 1,
  },
  titleBox: {
    position: 'absolute',
    width: '100%',
  },
  title: {
    fontSize: sizes.h4,
    color: colors.black,
    textAlign: 'left',
    fontFamily: 'Montserrat',
  },
  duration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    color: colors.primary,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: sizes.h5,
    zIndex: 2,
  },
});

export default Carousel;
