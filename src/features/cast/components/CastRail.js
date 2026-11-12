import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '@shared/config/theme';
import CastCard from '@features/cast/components/CastCard';

const GAP = spacing.m - 4;
const MIN_CARD_WIDTH = 220;
const MAX_CARD_WIDTH = 300;
const CARD_ASPECT = 0.68;

const Separator = () => <View style={{ width: GAP }} />;

/**
 * Horizontal rail of cast posters that snaps card by card. Sized from the window, so a card is
 * about two thirds of a phone and a peek of the next one always shows. `ranked` numbers the
 * cards (trending). `list` items come from `toCastCard`.
 */
const CastRail = ({ list, ranked = false, finishedIds = [], onFinish }) => {
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.round(Math.min(Math.max(windowWidth * 0.64, MIN_CARD_WIDTH), MAX_CARD_WIDTH));
  const cardHeight = Math.round(cardWidth * CARD_ASPECT);

  const openCast = useCallback(
    (item) => navigation.navigate('VideoScreen', { selectedCastId: item.id }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <CastCard
        item={item}
        index={index}
        rank={ranked ? index + 1 : undefined}
        width={cardWidth}
        height={cardHeight}
        finished={finishedIds.includes(item.id)}
        onFinish={onFinish}
        onPress={openCast}
      />
    ),
    [ranked, cardWidth, cardHeight, finishedIds, onFinish, openCast]
  );

  return (
    <FlatList
      data={list}
      horizontal
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      extraData={finishedIds}
      initialNumToRender={3}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
  },
});

export default CastRail;
