import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
  Image,
  Share,
  BackHandler,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { api, getUniversityLogo } from '@shared/api/client';
import { colors, sizes, spacing } from '@shared/config/theme';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import { parseSRT, findCaptionAt, formatMillis } from '@shared/utils/media';

const WATCHED_THRESHOLD = 0.85;
const captionOnIcon = require('@assets/Cast_screen_icons/caption_on.png');
const captionOffIcon = require('@assets/Cast_screen_icons/caption_off.png');
const shareIcon = require('@assets/Cast_screen_icons/share.png');

/**
 * Full-screen cast player shared by the Cast, Discover and Virtual Lab flows.
 * Marks the cast as watched once playback crosses 85% and calls
 * `onExit({ watched, castId })` when the user leaves or playback ends.
 */
const CastVideoPlayer = ({ castId, navigation, onExit }) => {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userIdRef = useRef(null);
  const watchedRef = useRef(false);
  const prevProgress = useRef(0);
  const isSeeking = useRef(false);

  const [video, setVideo] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState('');

  // expo-video uses the iOS "playback" audio session, so casts are audible in silent mode.
  const player = useVideoPlayer(video?.casturl ?? null, (instance) => {
    instance.timeUpdateEventInterval = 0.25;
  });

  useEffect(() => {
    getUser().then(({ userId }) => {
      userIdRef.current = userId;
    });
  }, []);

  const loadVideo = useCallback(async () => {
    setLoadError(false);
    try {
      const { data } = await api.get(`/cast/${castId}`);
      const universityLogo = await getUniversityLogo(data.university);
      setVideo({ ...data, universityLogo });
    } catch (error) {
      setLoadError(true);
    }
  }, [castId]);

  useEffect(() => {
    if (castId) loadVideo();
  }, [castId, loadVideo]);

  useEffect(() => {
    if (!video?.subtitleurl) {
      setCaptions([]);
      return undefined;
    }
    let cancelled = false;
    fetch(video.subtitleurl)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) setCaptions(parseSRT(text));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [video?.subtitleurl]);

  const exit = useCallback(() => {
    onExit({ watched: watchedRef.current, castId: video?._id || castId });
  }, [onExit, video, castId]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      exit();
      return true;
    });
    return () => subscription.remove();
  }, [exit]);

  useEffect(() => navigation.addListener('blur', () => setIsPlaying(false)), [navigation]);

  const markAsWatched = () => {
    const userId = userIdRef.current;
    if (!video || watchedRef.current || !userId || isGuestUser(userId)) return;
    watchedRef.current = true;
    api
      .post(`/user/add/content/${userId}`, { contentId: video._id, type: 'cast' })
      .catch(() => {
        watchedRef.current = false;
      });
  };

  useEffect(() => {
    if (!video) return;
    if (isPlaying) player.play();
    else player.pause();
  }, [player, video, isPlaying]);

  useEventListener(player, 'statusChange', ({ status }) => {
    setIsBuffering(status === 'loading');
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const positionMillis = currentTime * 1000;
    const durationMillis = (player.duration || 0) * 1000;
    if (!isSeeking.current) setPosition(positionMillis);
    setDuration(durationMillis);

    if (durationMillis) {
      const progress = positionMillis / durationMillis;
      if (progress >= WATCHED_THRESHOLD && prevProgress.current < WATCHED_THRESHOLD) {
        markAsWatched();
      }
      prevProgress.current = progress;
    }

    const nextCaption = captionsEnabled ? findCaptionAt(captions, positionMillis) : '';
    setCurrentCaption((prev) => (prev === nextCaption ? prev : nextCaption));
  });

  useEventListener(player, 'playToEnd', () => {
    markAsWatched();
    exit();
  });

  const handleSeek = (value) => {
    isSeeking.current = false;
    if (duration) {
      const target = value * duration;
      setPosition(target);
      player.currentTime = target / 1000;
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out this cast on BrightMinds: ${video.casturl}` });
    } catch (error) {
      // User dismissed or sharing is unavailable; nothing to do.
    }
  };

  const closeButton = (
    <TouchableOpacity
      style={[styles.closeButton, { top: insets.top + spacing.s }]}
      onPress={exit}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Close video"
    >
      <Ionicons name="close" size={30} color={colors.primary} />
    </TouchableOpacity>
  );

  if (!video) {
    return (
      <View style={styles.centered}>
        {loadError ? (
          <>
            <Text style={styles.message}>We couldn't load this cast.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadVideo}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
        {closeButton}
      </View>
    );
  }

  const iconSize = width / 9;
  const hasCaptions = captions.length > 0;

  return (
    <View style={styles.container}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => setIsPlaying((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
      >
        <VideoView
          player={player}
          contentFit="contain"
          nativeControls={false}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Pressable>

      {isBuffering && isPlaying && (
        <ActivityIndicator style={styles.centerOverlay} size="large" color={colors.primary} pointerEvents="none" />
      )}
      {!isPlaying && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <Ionicons name="play" size={72} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      {closeButton}

      {!!video.universityLogo && (
        <Image
          source={{ uri: video.universityLogo }}
          style={[styles.universityIcon, { top: insets.top + spacing.s, width: width / 6, height: width / 6 }]}
          resizeMode="contain"
        />
      )}

      {currentCaption !== '' && (
        <View style={[styles.captionOverlay, { bottom: width / 3 }]} pointerEvents="none">
          <Text style={styles.captionText}>{currentCaption}</Text>
        </View>
      )}

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.s }]}>
        <View style={styles.buttonsRow}>
          {hasCaptions && (
            <TouchableOpacity
              onPress={() => setCaptionsEnabled((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={captionsEnabled ? 'Hide captions' : 'Show captions'}
            >
              <Image
                source={captionsEnabled ? captionOnIcon : captionOffIcon}
                style={[styles.icon, { width: iconSize, height: iconSize }]}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share cast">
            <Image source={shareIcon} style={[styles.icon, { width: iconSize, height: iconSize }]} />
          </TouchableOpacity>
        </View>
        <Slider
          style={styles.progressSlider}
          value={duration ? position / duration : 0}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.lightGray}
          thumbTintColor={colors.primary}
          onSlidingStart={() => {
            isSeeking.current = true;
          }}
          onSlidingComplete={handleSeek}
        />
        <Text style={styles.duration}>
          {formatMillis(position)} / {formatMillis(duration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  message: {
    color: colors.primary,
    fontFamily: 'Montserrat',
    fontSize: sizes.h3,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.m,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.secondary,
    fontFamily: 'MontserratBold',
  },
  closeButton: {
    position: 'absolute',
    left: spacing.m,
    padding: spacing.xs,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  universityIcon: {
    position: 'absolute',
    right: spacing.l,
  },
  captionOverlay: {
    position: 'absolute',
    left: spacing.m,
    right: spacing.m,
    alignItems: 'center',
  },
  captionText: {
    color: colors.primary,
    fontSize: sizes.h2,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: 'Montserrat',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: spacing.s,
    tintColor: colors.primary,
  },
  progressSlider: {
    width: '90%',
  },
  duration: {
    color: colors.primary,
    fontFamily: 'Montserrat',
  },
});

export default CastVideoPlayer;
