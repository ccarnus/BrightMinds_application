import React from 'react';
import { FlatList, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, shadow, sizes, spacing } from '@shared/config/theme';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

const CARD_HEIGHT = 140;
const CARD_WIDTH = CARD_HEIGHT * 1.75;
const CARD_HEIGHT_TOTAL = 180;
const CARD_WIDTH_SPACING = CARD_WIDTH + spacing.l;

const ArticleCarousel = ({ list, finishedArticles = [], onAnimationFinish }) => {
  const navigation = useNavigation();

  return (
    <FlatList
      data={list}
      horizontal
      snapToInterval={CARD_WIDTH_SPACING}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item._id}
      renderItem={({ item, index }) => {
        const isFinished = finishedArticles.includes(item._id);
        return (
          <TouchableOpacity
            style={{
              marginLeft: spacing.l,
              marginBottom: spacing.xl,
              marginRight: index === list.length - 1 ? spacing.l : 0,
            }}
            onPress={() =>
              navigation.navigate('ArticleDetails', { selectedArticleId: item._id })
            }
          >
            <View style={[styles.card, shadow.dark]}>
              <View style={styles.titleBox}>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <View style={styles.imageBox}>
                {/* Always render the image as background */}
                <Image
                  source={{ uri: item.articleimageurl }}
                  style={styles.image}
                  onError={() =>
                    console.log(`Error loading image for ${item.title} with url ${item.articleimageurl}`)
                  }
                />
                {/* Overlay the Lottie animation if the article is finished */}
                {isFinished && (
                  <LottieView
                    source={require('@assets/lotties/done.json')}
                    autoPlay
                    loop={false}
                    onAnimationFinish={() => onAnimationFinish(item._id)}
                    style={styles.lottieOverlay}
                  />
                )}
                <Text style={styles.duration}>{item.duration} min</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
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
});

export default ArticleCarousel;
