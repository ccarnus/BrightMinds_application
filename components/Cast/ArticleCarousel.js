import React from 'react';
import { FlatList, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, shadow, sizes, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';

const CARD_HEIGHT = 140;
const CARD_WIDTH = CARD_HEIGHT * 1.75;
const CARD_HEIGHT_TOTAL = 180;
const CARD_WIDTH_SPACING = CARD_WIDTH + spacing.l;

const ArticleCarousel = ({ list }) => {
  const navigation = useNavigation();

  return (
    <FlatList
      data={list}
      horizontal
      snapToInterval={CARD_WIDTH_SPACING}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      keyExtractor={item => item._id}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={{
            marginLeft: spacing.l,
            marginBottom: spacing.xl,
            marginRight: index === list.length - 1 ? spacing.l : 0,
          }}
          onPress={() => navigation.navigate('ArticleDetails', { selectedArticleId: item._id })}>
          <View style={[styles.card, shadow.dark]}>
            <View style={styles.titleBox}>
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <View style={styles.imageBox}>
              <Image
                source={{ uri: item.articleimageurl }}
                style={styles.image}
                onError={() => console.log(`Error loading image for ${item.title}`)}
              />
              <Text style={styles.duration}>{item.duration} min</Text>
              {item.watched && (
                <Image
                  source={require('../../assets/Cast_screen_icons/already_watched_icon.png')}
                  style={styles.watchedIcon}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT_TOTAL,
    marginVertical: 10,
    position: 'relative',
  },
  imageBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    elevation: 5,
    position: 'relative',
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    resizeMode: 'cover',
  },
  titleBox: {
    position: 'absolute',
    top: CARD_HEIGHT_TOTAL - 30,
    maxHeight: 50,
    width: '100%',
  },
  title: {
    fontSize: sizes.h45,
    color: colors.white,
    textAlign: 'left',
    fontFamily: "Montserrat",
  },
  duration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: sizes.h5,
  },
  watchedIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
  },
});

export default ArticleCarousel;
