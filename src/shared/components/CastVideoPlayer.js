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
import { api, getUniversityLogo, notFoundError } from '@shared/api/client';
import { colors, fonts, sizes, spacing } from '@shared/config/theme';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import { parseSRT, findCaptionAt, formatMillis } from '@shared/utils/media';
import ErrorState from '@shared/components/ErrorState';

const WATCHED_THRESHOLD = 0.85;
const captionOnIcon = require('@assets/Cast_screen_icons/caption_on.png');
const captionOffIcon = require('@assets/Cast_screen_icons/caption_off.png');
const shareIcon = require('@assets/Cast_screen_icons/share.png');

const CloseButton = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={[styles.closeButton, { top: insets.top + spacing.s }]}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Close video"
    >
      <Ionicons name="close" size={30} color={colors.primary} />
    </TouchableOpacity>
  );
};

/** Plays a loaded cast: mounted only once its video URL is known. */
const CastPlayback = ({ video, castId, navigation, onExit }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userIdRef = useRef(null);
  const watchedRef = useRef(false);
  const prevProgress = useRef(0);
  const isSeeking = useRef(false);
  const mountedRef = useRef(true);
  // Playback position (seconds) to restore after reloading a failed stream.
  const resumeAtRef = useRef(0);

  const [universityLogo, setUniversityLogo] = useState(null);
  const [playbackError, setPlaybackError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState('');

  // Created with its source. A player created empty and given the URL later is fragile: Android
  // reports the empty player as played to the end (which closed the screen), and the play request
  // can be lost while the source is swapped in.
  // expo-video uses the iOS "playback" audio session, so casts are audible in silent mode.
  const player = useVideoPlayer(video.casturl, (instance) => {
    instance.timeUpdateEventInterval = 0.25;
  });

  useEffect(() => {
    mountedRef.current = true;
    getUser().then(({ userId }) => {
      userIdRef.current = userId;
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // The logo is decoration: it loads alongside playback instead of delaying it.
  useEffect(() => {
    if (!video.university) return undefined;
    let active = true;
    getUniversityLogo(video.university).then((logo) => {
      if (active) setUniversityLogo(logo);
    });
    return () => {
      active = false;
    };
  }, [video.university]);

  useEffect(() => {
    if (!video.subtitleurl) {
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
  }, [video.subtitleurl]);

  const exit = useCallback(() => {
    onExit({ watched: watchedRef.current, castId: video._id || castId });
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
    if (watchedRef.current || !userId || isGuestUser(userId)) return;
    watchedRef.current = true;
    api
      .post(`/user/add/content/${userId}`, { contentId: video._id })
      .catch(() => {
        watchedRef.current = false;
      });
  };

  useEffect(() => {
    if (isPlaying) player.play();
    else player.pause();
  }, [player, isPlaying]);

  useEventListener(player, 'statusChange', ({ status, error }) => {
    setIsBuffering(status === 'loading');
    if (status === 'error') {
      console.error('Cast playback error:', error?.message);
      setPlaybackError(error || { message: 'Playback failed' });
    } else if (status === 'readyToPlay') {
      setPlaybackError(null);
      if (resumeAtRef.current > 0) {
        player.currentTime = resumeAtRef.current;
        resumeAtRef.current = 0;
      }
      // play() is requested before the source has loaded, which not every native version keeps.
      if (isPlaying && !player.playing) player.play();
    }
  });

  // Reloads the stream after a playback failure (e.g. lost connection) and resumes where it stopped.
  const retryPlayback = useCallback(async () => {
    resumeAtRef.current = position / 1000;
    setPlaybackError(null);
    setIsBuffering(true);
    try {
      await player.replaceAsync(video.casturl);
      if (mountedRef.current && isPlaying) player.play();
    } catch (error) {
      console.error('Error reloading cast:', error);
      if (mountedRef.current) setPlaybackError(error);
    }
  }, [player, video.casturl, position, isPlaying]);

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
    // Android also reports a failed stream as ended; that one shows the retry message instead.
    if (player.status === 'error') return;
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

      {isBuffering && isPlaying && !playbackError && (
        <ActivityIndicator style={styles.centerOverlay} size="large" color={colors.primary} pointerEvents="none" />
      )}
      {!isPlaying && !playbackError && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <Ionicons name="play" size={72} color="rgba(255,255,255,0.85)" />
        </View>
      )}
      {!!playbackError && (
        <View style={styles.errorOverlay}>
          <ErrorState
            dark
            compact
            error={playbackError}
            onRetry={retryPlayback}
            fallbackTitle="Playback problem"
            fallbackMessage="We couldn't play this cast. Please try again."
          />
        </View>
      )}

      <CloseButton onPress={exit} />

      {!!universityLogo && (
        <Image
          source={{ uri: universityLogo }}
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

/**
 * Full-screen cast player shared by the Cast, Discover and Virtual Lab flows.
 * Marks the cast as watched once playback crosses 85% and calls
 * `onExit({ watched, castId })` when the user leaves or playback ends.
 */
const CastVideoPlayer = ({ castId, navigation, onExit }) => {
  useKeepAwake();
  const mountedRef = useRef(true);
  const [video, setVideo] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadVideo = useCallback(async () => {
    setLoadError(null);
    try {
      const { data } = await api.get(`/cast/${encodeURIComponent(castId)}`);
      if (!data?.casturl) throw notFoundError();
      if (mountedRef.current) setVideo(data);
    } catch (error) {
      console.error('Error fetching cast:', error);
      if (mountedRef.current) setLoadError(error);
    }
  }, [castId]);

  useEffect(() => {
    if (castId) loadVideo();
  }, [castId, loadVideo]);

  const close = useCallback(() => onExit({ watched: false, castId }), [onExit, castId]);

  // Until the cast is loaded; playback then handles the back button itself.
  useEffect(() => {
    if (video) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [video, close]);

  if (!video) {
    return (
      <View style={styles.centered}>
        {loadError ? (
          <ErrorState
            dark
            error={loadError}
            onRetry={loadVideo}
            fallbackMessage="We couldn't load this cast."
            notFoundTitle="Cast not available"
            notFoundMessage="This cast may have been removed."
            secondaryActionLabel="Close"
            onSecondaryAction={close}
          />
        ) : (
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading cast" />
        )}
        <CloseButton onPress={close} />
      </View>
    );
  }

  return <CastPlayback video={video} castId={castId} navigation={navigation} onExit={onExit} />;
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
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
  },
});

export default CastVideoPlayer;
