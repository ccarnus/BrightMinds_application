import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { Video } from 'expo-av';
import { Dimensions } from 'react-native';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

const CategoryScreen = ({ route, navigation }) => {
  const { selectedCastId, category } = route.params;
  const [casts, setCasts] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState([]);
  const [contentSubmitted, setContentSubmitted] = useState([]);
  const videoRefs = useRef([]);
  const userId = "6474e4001eec5ee1ecd40180";

  useEffect(() => {
    fetch(`http://3.17.219.54/cast/department/${category}`)
      .then(response => response.json())
      .then(data => {
        const fetchUniversityLogos = data.map(cast =>
          fetch(`http://3.17.219.54/university/by/name/${cast.university}`)
            .then(res => res.json())
            .then(universityData => ({ ...cast, universityLogo: universityData.iconurl }))
        );
        return Promise.all(fetchUniversityLogos);
      })
      .then(dataWithLogos => {
        const selectedIndex = dataWithLogos.findIndex(cast => cast._id === selectedCastId);
        setFocusedIndex(selectedIndex);
        setCasts([dataWithLogos[selectedIndex], ...dataWithLogos.slice(0, selectedIndex), ...dataWithLogos.slice(selectedIndex + 1)]);
      })
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    setVideoStatus(casts.map((_, index) => index === 0));
    setContentSubmitted(casts.map(() => false));  // Initialize contentSubmitted array
  }, [casts]);

  const handleVideoPress = index => {
    setFocusedIndex(index);
    setVideoStatus(prevStatus => prevStatus.map((status, idx) => (idx === index ? !status : false)));
  };

  const handleCastWatched = (index) => {
    if (!casts[index] || contentSubmitted[index]) return;

    const castId = casts[index]._id;

    axios
      .post(`http://3.17.219.54/user/add/content/${userId}`, { contentId: castId, type: "cast" })
      .then(() => {
        setContentSubmitted(prevSubmitted => prevSubmitted.map((submitted, idx) => idx === index ? true : submitted));
        console.log("Content marked as watched at 85%");
      })
      .catch(error => {
        console.error(error);
      });
  };

  const handleCastDonePlaying = () => {
    navigation.goBack(); // Close the video and navigate back
  };

  useEffect(() => {
    // Pause the video when the screen loses focus
    const pauseVideo = () => {
      setVideoStatus(prevStatus => prevStatus.map(() => false));
    };
    const unsubscribe = navigation.addListener('blur', pauseVideo);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / windowWidth);
          setFocusedIndex(index);
          setVideoStatus(prevStatus =>
            prevStatus.map((status, idx) => (idx === index ? !status : false))
          );
        }}
      >
        {casts.map((cast, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.videoContainer,
              {
                width: windowWidth,
                height: windowHeight,
                opacity: focusedIndex === index ? 1 : 0.7,
              },
            ]}
            onPress={() => handleVideoPress(index)}
          >
            <View style={styles.videoWrapper}>
              <Video
                ref={ref => (videoRefs.current[index] = ref)}
                source={{ uri: cast.casturl }}
                shouldPlay={videoStatus[index]}
                resizeMode="contain"
                style={styles.video}
                onPlaybackStatusUpdate={(status) => {
                  const progress = status.positionMillis / status.durationMillis;

                  if (progress >= 0.85 && !contentSubmitted[index]) {
                    handleCastWatched(index); // Mark content as watched at 85%
                  }

                  if (status.didJustFinish) {
                    videoRefs.current[index].setPositionAsync(0);
                    handleCastDonePlaying();
                  }
                }}
              />
            </View>
            <View style={styles.buttonUniversityContainer}>
              <Image
                source={{ uri: cast.universityLogo }}
                style={styles.universityIcon}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  universityIcon: {
    width: "100%",
    height: "100%",
    marginHorizontal: 12,
  },
  buttonUniversityContainer: {
    width: 54,
    height: 54,
    position: 'absolute',
    bottom: spacing.m + 64,
    right: spacing.m,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 50,
  },
});

export default CategoryScreen;
