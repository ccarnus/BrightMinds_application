import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { colors, contentWidth, layout, scale, sizes, spacing, typography } from '@shared/config/theme';
import { api, getUniversityLogo } from '@shared/api/client';
import departments from '@shared/data/departments';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';

const doneAnimation = require('@assets/lotties/done.json');
const playIcon = require('@assets/Cast_icons/play_icon.png');
const nextIcon = require('@assets/Discover_icons/next.png');

const PLAY_ICON_SIZE = 56;
const DEPARTMENT_ICON_SIZE = Math.min(scale(56), 64);
const UNIVERSITY_LOGO_SIZE = Math.min(scale(68), 80);

const departmentsByName = Object.fromEntries(departments.map((dept) => [dept.name, dept]));

const formatDuration = (duration = 0) => {
  const minutes = Math.floor(duration);
  const seconds = Math.round((duration - minutes) * 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const DiscoverScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const finishedVideoId = route.params?.finishedVideoId;
  const [videos, setVideos] = useState([]);
  const [universityLogos, setUniversityLogos] = useState({});
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
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
    setLoadError(null);
    try {
      const { userId } = await getUser();
      const shouldFilterWatched = userId && !isGuestUser(userId);
      const [userResponse, castsResponse] = await Promise.all([
        // Without the profile, already-watched casts are simply not filtered out.
        shouldFilterWatched
          ? api.get(`/user/${userId}`).catch((error) => {
              console.warn('Could not load watched casts:', error?.message);
              return null;
            })
          : null,
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
      if (!mountedRef.current) return;

      setVideos(casts);
      setFocusedIndex(0);
    } catch (error) {
      console.error('Error fetching discover casts:', error);
      if (mountedRef.current) setLoadError(error);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Logos are optional decoration: they load after the casts and never delay the screen.
  useEffect(() => {
    const universities = [...new Set(videos.map((video) => video.university).filter(Boolean))];
    if (universities.length === 0) return undefined;
    let active = true;
    Promise.all(universities.map((university) => getUniversityLogo(university))).then((logos) => {
      if (!active) return;
      setUniversityLogos((prev) => {
        const next = { ...prev };
        universities.forEach((university, index) => {
          if (logos[index]) next[university] = logos[index];
        });
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [videos]);

  const currentVideo = videos[focusedIndex];
  const currentLogo = currentVideo ? universityLogos[currentVideo.university] : null;

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

  const backButton = <BackButton onPress={() => navigation.goBack()} />;

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (loadError || !currentVideo) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {loadError ? (
          <ErrorState
            error={loadError}
            onRetry={loadVideos}
            fallbackMessage="We couldn't load casts to discover."
            secondaryActionLabel="Back to Cast"
            onSecondaryAction={() => navigation.goBack()}
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
  const imageWidth = Math.min(windowWidth - spacing.m * 2, layout.maxContentWidth);
  const imageHeight = Math.min((imageWidth * 9) / 16, windowHeight * 0.4);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.s + BACK_BUTTON_SIZE, paddingBottom: Math.max(insets.bottom, spacing.m) },
      ]}
    >
      <View style={styles.titleArea}>
        <Text style={styles.videoTitle} numberOfLines={3}>
          {currentVideo.title}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}
        onPress={() => navigation.navigate('DiscoverVideoScreen', { selectedCastId: currentVideo._id })}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Play ${currentVideo.title}`}
      >
        <Image source={{ uri: currentVideo.castimageurl }} style={styles.image} resizeMode="cover" />
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

      <View style={styles.metaRow}>
        <View style={styles.column}>
          {!!department && (
            <>
              <Image source={department.image} style={styles.departmentIcon} resizeMode="contain" />
              <Text style={styles.departmentLabel} numberOfLines={2}>
                {department.display}
              </Text>
            </>
          )}
        </View>
        <View style={styles.column}>
          {!!currentLogo && (
            <Image source={{ uri: currentLogo }} style={styles.universityLogo} resizeMode="contain" />
          )}
        </View>
        <View style={styles.column}>
          <Text style={styles.durationText}>{formatDuration(currentVideo.duration)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton
          variant="primary"
          iconPosition="right"
          fullWidth
          onPress={handleNextVideoPress}
          disabled={videos.length < 2}
          icon={nextIcon}
        >
          Explore Next
        </AppButton>
      </View>
      {backButton}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleArea: {
    ...contentWidth,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
  },
  videoTitle: {
    ...typography.h1,
    textAlign: 'center',
  },
  imageContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.placeholder,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: PLAY_ICON_SIZE,
    height: PLAY_ICON_SIZE,
  },
  metaRow: {
    ...contentWidth,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
  },
  column: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  departmentIcon: {
    width: DEPARTMENT_ICON_SIZE,
    height: DEPARTMENT_ICON_SIZE,
  },
  departmentLabel: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  universityLogo: {
    width: UNIVERSITY_LOGO_SIZE,
    height: UNIVERSITY_LOGO_SIZE,
  },
  durationText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  footer: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
  },
});

export default DiscoverScreen;
