import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getUniversityLogo } from '@shared/api/client';
import departments from '@shared/data/departments';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const { width, height } = Dimensions.get('window');

const doneAnimation = require('@assets/lotties/done.json');
const playIcon = require('@assets/Cast_icons/play_icon.png');
const nextIcon = require('@assets/Discover_icons/next.png');

const departmentsByName = Object.fromEntries(departments.map((dept) => [dept.name, dept]));

const formatDuration = (duration = 0) => {
  const minutes = Math.floor(duration);
  const seconds = Math.round((duration - minutes) * 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const DiscoverScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const finishedVideoId = route.params?.finishedVideoId;
  const [videos, setVideos] = useState([]);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!finishedVideoId) return;
    setFinishedVideos((prev) => (prev.includes(finishedVideoId) ? prev : [...prev, finishedVideoId]));
    navigation.setParams({ finishedVideoId: undefined });
  }, [finishedVideoId, navigation]);

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    setApiError(false);
    try {
      const { userId } = await getUser();
      const shouldFilterWatched = userId && !isGuestUser(userId);
      const [userResponse, castsResponse] = await Promise.all([
        shouldFilterWatched ? api.get(`/user/${userId}`) : null,
        api.get('/cast'),
      ]);

      const watchedCasts = new Set(
        (userResponse?.data?.evaluation_list || [])
          .filter((item) => item.type === 'cast' && item.watched)
          .map((item) => item.contentid)
      );
      const casts = (Array.isArray(castsResponse.data) ? castsResponse.data : []).filter(
        (cast) => !watchedCasts.has(cast._id)
      );
      const logos = await Promise.all(casts.map((cast) => getUniversityLogo(cast.university)));
      if (!mountedRef.current) return;

      setVideos(casts.map((cast, index) => ({ ...cast, universityLogo: logos[index] })));
      setFocusedIndex(0);
    } catch (error) {
      console.error('Error fetching discover casts:', error);
      if (mountedRef.current) setApiError(true);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const currentVideo = videos[focusedIndex];

  const handleNextVideoPress = () => {
    if (videos.length === 0) return;
    setFocusedIndex((index) => (index + 1) % videos.length);
  };

  // Removing the finished cast shifts the next one into the current index.
  const handleFinishedVideo = (finishedId) => {
    const remaining = videos.filter((video) => video._id !== finishedId);
    setFinishedVideos((prev) => prev.filter((id) => id !== finishedId));
    setVideos(remaining);
    setFocusedIndex((index) => (remaining.length ? index % remaining.length : 0));
  };

  const backButton = (
    <TouchableOpacity
      style={[styles.backButton, { top: insets.top + spacing.s }]}
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="chevron-back" size={28} color={colors.secondary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return <Loader />;
  }

  if (apiError || !currentVideo) {
    return (
      <View style={styles.container}>
        {apiError ? (
          <StateMessage
            icon="cloud-offline-outline"
            title="Whoops!"
            message="We couldn't load casts. Please check your connection and try again."
            actionLabel="Try again"
            onAction={loadVideos}
          />
        ) : (
          <StateMessage
            icon="checkmark-done-outline"
            title="You're all caught up!"
            message="You've watched every cast. Check back soon for new content."
            actionLabel="Back to Cast"
            onAction={() => navigation.goBack()}
          />
        )}
        {backButton}
      </View>
    );
  }

  const department = currentVideo.department ? departmentsByName[currentVideo.department] : null;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.titleView}>
          <Text style={styles.videoTitle}>{currentVideo.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => navigation.navigate('DiscoverVideoScreen', { selectedCastId: currentVideo._id })}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={`Play ${currentVideo.title}`}
        >
          <Image source={{ uri: currentVideo.castimageurl }} style={styles.image} resizeMode="contain" />
          {finishedVideos.includes(currentVideo._id) && (
            <LottieView
              source={doneAnimation}
              autoPlay
              loop={false}
              onAnimationFinish={() => handleFinishedVideo(currentVideo._id)}
              style={styles.lottieOverlay}
            />
          )}
          <View style={styles.playIconContainer}>
            <Image source={playIcon} style={styles.playIcon} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.middleband}>
          <View style={styles.column}>
            {!!department && (
              <View style={styles.departmentContainer}>
                <Image source={department.image} style={styles.departmentIcon} resizeMode="contain" />
                <Text style={styles.departmentLabel}>{department.display}</Text>
              </View>
            )}
          </View>
          <View style={styles.column}>
            {!!currentVideo.universityLogo && (
              <Image
                source={{ uri: currentVideo.universityLogo }}
                style={styles.universityIconMain}
                resizeMode="contain"
              />
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.durationText}>{formatDuration(currentVideo.duration)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.band, { paddingBottom: spacing.m + insets.bottom }]}>
        <Button
          mode="contained"
          onPress={handleNextVideoPress}
          disabled={videos.length < 2}
          buttonColor={colors.darkGreen}
          icon={nextIcon}
          contentStyle={styles.nextButtonContent}
          labelStyle={styles.nextButtonLabel}
          style={styles.nextButton}
        >
          Explore Next
        </Button>
      </View>
      {backButton}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  backButton: {
    position: 'absolute',
    left: spacing.m,
    zIndex: 10,
  },
  topSection: {
    flex: 1,
    marginTop: height * 0.1,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  band: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: spacing.m,
  },
  middleband: {
    flexDirection: 'row',
    paddingTop: spacing.s,
    width: '100%',
  },
  column: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  departmentContainer: { alignItems: 'center' },
  universityIconMain: {
    width: width * 0.18,
    height: width * 0.18,
  },
  departmentIcon: {
    width: width * 0.15,
    height: width * 0.15,
  },
  durationText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    width,
    height: width / 1.5,
  },
  image: { width, height: width / 1.5 },
  lottieOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height: width / 1.75,
    zIndex: 1,
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
    height: height * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: sizes.h1,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  departmentLabel: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: spacing.s,
  },
  nextButtonContent: { flexDirection: 'row-reverse' },
  nextButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
  nextButton: {
    marginBottom: spacing.s,
    borderRadius: sizes.buttonRadius,
  },
});

export default DiscoverScreen;
