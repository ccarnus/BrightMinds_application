import React, { useState } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, shadow, sizes, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

const CARD_HEIGHT = 140;
const CARD_WIDTH = CARD_HEIGHT * 1.75;
const CARD_HEIGHT_TOTAL = 175;
const CARD_WIDTH_SPACING = CARD_WIDTH + spacing.l;

const Carousel = ({ list, carouselType }) => {
  const navigation = useNavigation();
  const [errorStates, setErrorStates] = useState({});

  const handleImageError = (id) => {
    setErrorStates((prevState) => ({
      ...prevState,
      [id]: true, // Mark the image with the specific `id` as having an error
    }));
  };

  return (
    <FlatList
      data={list}
      horizontal
      snapToInterval={CARD_WIDTH_SPACING}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => {
        const minutes = Math.floor(item.duration);
        const seconds = Math.round((item.duration - minutes) * 60);
        const durationString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const hasError = errorStates[item.id];

        return (
          <TouchableOpacity
            style={{
              marginLeft: spacing.l,
              marginRight: index === list.length - 1 ? spacing.l : 0,
            }}
            onPress={() =>
              navigation.navigate(
                carouselType === 'trending' ? 'Trending' : 'SuggestedForYou',
                { selectedVideoId: item.id }
              )
            }
          >
            <View style={[styles.card, shadow.dark]}>
              <View style={styles.imageBox}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.image}
                  onError={() => console.log(`Error loading image for ${item.title}`)}
                />
                <Text style={styles.duration}>{durationString}</Text>
                {/* Conditionally render the "already seen" icon */}
                {item.watched && (
                  <FastImage
                    source={require('../../assets/Cast_screen_icons/already_watched_icon.png')}
                    style={styles.alreadySeenIcon}
                  />
                )}
              </View>
              <View style={styles.titleBox}>
                <Text style={styles.title}>{item.title}</Text>
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
    position: 'relative',
    elevation: 5,
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
    fontFamily: 'Montserrat',
  },
  duration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: sizes.h5,
  },
  alreadySeenIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24, // Adjust the size as needed
    height: 24, // Adjust the size as needed
    resizeMode: 'contain',
  },
});

export default Carousel;
