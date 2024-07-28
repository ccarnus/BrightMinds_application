import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Modal } from 'react-native';
import { Video } from 'expo-av';
import { Dimensions } from 'react-native';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';

const { width, height } = Dimensions.get('window');

const DiscoverScreen = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [bookmarkedCasts, setBookmarkedCasts] = useState([]);
  const videoRefs = useRef([]);
  const userId = "6474e4001eec5ee1ecd40180";

  useEffect(() => {
    fetch('http://3.17.219.54/cast')
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const fetchUniversityLogosAndApprovalStatus = data.map(cast =>
            Promise.all([
              fetch(`http://3.17.219.54/university/by/name/${cast.university}`)
                .then(res => res.json())
                .then(universityData => ({ ...cast, universityLogo: universityData.iconurl })),
              fetch(`http://3.17.219.54/cast/verification/${cast._id}`)
                .then(res => res.json())
                .then(verificationData => ({ ...cast, isApproved: verificationData.approvals >= 5 }))
            ]).then(results => Object.assign({}, ...results))
          );
          return Promise.all(fetchUniversityLogosAndApprovalStatus);
        }
        return [];
      })
      .then(dataWithLogosAndApproval => {
        setVideos(dataWithLogosAndApproval);
        setVideoStatus(dataWithLogosAndApproval.map(() => false));
      })
      .catch(error => {
        console.error('Fetching error:', error);
      });

    axios
      .get(`http://3.17.219.54/user/bookmarks/${userId}`)
      .then(response => {
        setBookmarkedCasts(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  const getDepartmentIcon = (department) => {
    switch (department) {
      case 'MedicineandHealthSciences':
        return require('../assets/Virtual_labs/MedicineandHealthSciences.png');
      case 'History':
        return require('../assets/Virtual_labs/History.png');
      case 'ComputerScience':
        return require('../assets/Virtual_labs/ComputerScience.png');
      case 'Biology':
        return require('../assets/Virtual_labs/Biology.png');
      case 'Chemistry':
        return require('../assets/Virtual_labs/Chemistry.png');
      // Add cases for other departments as needed
      default:
        return null; // Return a default icon or null if no match is found
    }
  };

  const togglePlay = () => {
    setShowVideo(true);
    setVideoStatus(videoStatus.map((status, idx) => idx === focusedIndex ? !status : status));
  };

  const togglePlayVideoFocused = async () => {
    if (videoRefs.current[focusedIndex]) {
      const status = await videoRefs.current[focusedIndex].getStatusAsync();
      if (status.isPlaying) {
        await videoRefs.current[focusedIndex].pauseAsync();
      } else {
        await videoRefs.current[focusedIndex].playAsync();
      }
    }
  };

  const handleCastDonePlaying = () => {
    const castId = videos[focusedIndex]._id;

    axios
      .post(`http://3.17.219.54/user/add/content/${userId}`, { contentId: castId, type: "cast" })
      .catch(error => {
        console.error(error);
      });
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration);
    const seconds = Math.round((duration - minutes) * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };  

  const handleNextVideoPress = () => {
    const nextIndex = (focusedIndex + 1) % videos.length;
    setFocusedIndex(nextIndex);
    setVideoStatus(videoStatus.map((_, idx) => idx === nextIndex ? false : false));
  };

  const handleBookmarkPress = () => {
    const castId = videos[focusedIndex]._id;

    if (bookmarkedCasts.some(cast => cast.castId === castId)) {
      axios
        .delete(`http://3.17.219.54/user/remove/bookmarks/${userId}/${castId}`)
        .then(response => {
          setBookmarkedCasts(bookmarkedCasts.filter(cast => cast.castId !== castId));
          videos[focusedIndex].bookmarkIcon = require('../assets/Cast_icons/bookmark_icon.png');
        })
        .catch(error => {
          console.error(error);
        });
      return;
    }

    videos[focusedIndex].bookmarkIcon = require('../assets/Cast_icons/bookmark_filled_icon.png');

    axios
      .post(`http://3.17.219.54/user/add/bookmarks/${userId}`, { castId: castId })
      .then(response => {
        setBookmarkedCasts([...bookmarkedCasts, { castId }]);
      })
      .catch(error => {
        console.error(error);
      });
  };

  return (
    <View style={styles.container}>
      {videos.length > 0 && videos[focusedIndex] && (
        <>
          <View style={styles.titleView}>
            <Text style={styles.videoTitle}>{videos[focusedIndex] ? videos[focusedIndex].title : ''}</Text>
          </View>
          <TouchableOpacity
            style={[styles.imageContainer, { height: width / 1.5 }]}
            onPress={togglePlay}
            activeOpacity={1}
          >
            <Image
              source={{ uri: videos[focusedIndex].castimageurl }}
              style={{ width: width, height: width /1.5 }}
              resizeMode="contain"
            />
            {!videoStatus[focusedIndex] && (
              <View style={styles.playIconContainer}>
                <Image
                  source={require('../assets/Cast_icons/play_icon.png')}
                  style={styles.playIcon}
                />
              </View>
            )}
            {videos[focusedIndex].isApproved && (
                <Image
                  source={require('../assets/Cast_icons/approved_badge.png')}
                  style={styles.approvedIcon}
                  resizeMode="contain"
                />
              )}
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={false}
            visible={showVideo}
            onRequestClose={() => {
              setShowVideo(false);
              setVideoStatus(videoStatus.map((status, idx) => idx === focusedIndex ? false : status));
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ flex: 1 }}
              onPress={togglePlayVideoFocused}
            >
              <View style={{ flex: 1, backgroundColor: 'white' }}>
                <Video
                  ref={ref => (videoRefs.current[focusedIndex] = ref)}
                  source={{ uri: videos[focusedIndex].casturl }}
                  shouldPlay={videoStatus[focusedIndex]}
                  resizeMode="contain"
                  style={{ width: '100%', height: '100%' }}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.didJustFinish) {
                      handleCastDonePlaying();
                    }
                  }}
                />
                <View style={styles.buttonUniversityContainer}>
                  <Image
                    source={{ uri: videos[focusedIndex].universityLogo }}
                    style={styles.universityIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.buttonBookmarkContainer}>
                  <TouchableOpacity style={styles.buttonBookmark} onPress={handleBookmarkPress}>
                    <Image
                      source={
                        bookmarkedCasts.some(cast => cast.castId === videos[focusedIndex]._id)
                          ? require('../assets/Cast_icons/bookmark_filled_icon.png')
                          : require('../assets/Cast_icons/bookmark_icon.png')
                      }
                      style={styles.iconBookmark}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}
      <View style={styles.bottomSection}>
        <View style={styles.middleband}>
          <View style={styles.leftColumn}>
            {videos[focusedIndex] && videos[focusedIndex].department && (
              <Image
                source={getDepartmentIcon(videos[focusedIndex].department)}
                style={styles.departmentIcon}
                resizeMode="contain"
              />
            )}
          </View>
          <View style={styles.separator} />
          <View style={styles.middleColumn}>
            {videos[focusedIndex] && videos[focusedIndex].universityLogo && (
              <Image
                source={{ uri: videos[focusedIndex].universityLogo }}
                style={styles.universityIconMain}
                resizeMode="contain"
              />
            )}
          </View>
          <View style={styles.separator} />
          <View style={styles.rightColumn}>
            <Text style={styles.durationText}>
              {videos[focusedIndex] ? formatDuration(videos[focusedIndex].duration) : '00:00'}
            </Text>
          </View>
        </View>
        <View style={styles.band}>
          <TouchableOpacity style={styles.button} onPress={handleNextVideoPress}>
            <Text style={styles.buttonText}>Find Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  band: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  middleband: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: colors.secondary,
  },
  middleColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  universityIconMain: {
    width: width*0.25,
    height: width*0.25,
  },
  departmentIcon: {
    width: width*0.15,
    height: width*0.15,
  },
  durationText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  button: {
    padding: 15,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    borderRadius: sizes.radius,
    width: "80%",
    elevation: 5,
  },
  buttonText: {
    fontSize: sizes.h3,
    color: colors.primaryBis,
    fontFamily: 'MontserratBold',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: width,
    height: width / 1.75,
  },
  approvedIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 50,
  },
  playIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  playIcon: {
    width: 54,
    height: 54,
  },
  titleView: {
    marginLeft: spacing.s,
    marginRight: spacing.s,
    height: height*0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: sizes.h1,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
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
    width: 62,
    height: 62,
    position: 'absolute',
    bottom: spacing.m + 64,
    right: spacing.m,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 50,
  },
  icon: {
    width: 42,
    height: 42,
    tintColor: colors.darkblue,
    marginHorizontal: 12,
  },
  universityIcon: {
    width: "100%",
    height: "100%",
    marginHorizontal: 12,
  },  
  iconBookmark: {
    width: 32,
    height: 32,
    tintColor: colors.darkblue,
    marginHorizontal: 12,
  }
});

export default DiscoverScreen;
