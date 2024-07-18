import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { Video } from 'expo-av';
import { Dimensions } from 'react-native';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

const TrendingScreen = ({ route, navigation }) => {
  const { selectedVideoId } = route.params;
  const [video, setVideo] = useState(null);
  const [videoStatus, setVideoStatus] = useState(true);
  const [bookmarkedCasts, setBookmarkedCasts] = useState([]);
  const videoRef = useRef(null);
  const userId = "6474e4001eec5ee1ecd40180";

  useEffect(() => {
    // Fetch the selected video and its university logo
    fetch(`http://3.17.219.54/cast/${selectedVideoId}`)
      .then(response => response.json())
      .then(videoData => {
        fetch(`http://3.17.219.54/university/by/name/${videoData.university}`)
          .then(res => res.json())
          .then(universityData => {
            setVideo({ ...videoData, universityLogo: universityData.iconurl });
          });
      })
      .catch(error => console.error(error));

    // Fetch bookmarked casts
    axios
      .get(`http://3.17.219.54/user/bookmarks/${userId}`)
      .then(response => {
        setBookmarkedCasts(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, [selectedVideoId]);

  const handleBookmarkPress = () => {
    if (!video) return;

    const castId = video._id;

    if (bookmarkedCasts.some(cast => cast.castId === castId)) {
      axios
        .delete(`http://3.17.219.54/user/remove/bookmarks/${userId}/${castId}`)
        .then(response => {
          setBookmarkedCasts(bookmarkedCasts.filter(cast => cast.castId !== castId));
          setVideo({ ...video, bookmarkIcon: require('../../assets/Cast_icons/bookmark_icon.png') });
        })
        .catch(error => {
          console.error(error);
        });
      return;
    }

    setVideo({ ...video, bookmarkIcon: require('../../assets/Cast_icons/bookmark_filled_icon.png') });

    axios
      .post(`http://3.17.219.54/user/add/bookmarks/${userId}`, { castId: castId })
      .then(response => {
        setBookmarkedCasts([...bookmarkedCasts, { castId }]);
      })
      .catch(error => {
        console.error(error);
      });
  };

  const handleCastDonePlaying = () => {
    if (!video) return;

    const castId = video._id;

    axios
      .post(`http://3.17.219.54/user/add/content/${userId}`, { contentId: castId, type: "cast" })
      .then(response => {
        setBookmarkedCasts([...bookmarkedCasts, { castId }]);
      })
      .catch(error => {
        console.error(error);
      });
  };

  useEffect(() => {
    // Pause the video when the screen loses focus
    const pauseVideo = () => {
      setVideoStatus(false);
    };
    const unsubscribe = navigation.addListener('blur', pauseVideo);
    return unsubscribe;
  }, [navigation]);

  if (!video) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={() => setVideoStatus(!videoStatus)}
      >
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: video.casturl }}
            shouldPlay={videoStatus}
            resizeMode="contain"
            style={styles.video}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                videoRef.current.setPositionAsync(0);
                handleCastDonePlaying();
              }
            }}
          />
        </View>
        <View style={styles.buttonUniversityContainer}>
          <Image
            source={{ uri: video.universityLogo }}
            style={styles.universityIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.buttonBookmarkContainer}>
          <TouchableOpacity style={styles.button} onPress={handleBookmarkPress}>
            <Image
              source={
                bookmarkedCasts.some(cast => cast.castId === video._id)
                  ? require('../../assets/Cast_icons/bookmark_filled_icon.png')
                  : require('../../assets/Cast_icons/bookmark_icon.png')
              }
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: windowWidth,
    height: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
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
  icon: {
    width: 32,
    height: 32,
    tintColor: colors.darkblue,
    marginHorizontal: 12,
  },
  universityIcon: {
    width: "100%",
    height: "100%",
    marginHorizontal: 12,
  },
  buttonBookmarkContainer: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 64,
    backgroundColor: colors.primaryBis,
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

export default TrendingScreen;
