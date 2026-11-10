import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';
import { formatMillis } from '@shared/utils/media';

// The server cuts a 980×560 card from the frame, centered like this preview.
const CARD_RATIO = 980 / 560;
// Same starting point as the server's automatic choice: past title cards and fade-ins.
const DEFAULT_POSITION = 0.15;
const THUMB_TOUCH_SIZE = { width: 48, height: 48 };

const roundTenth = (value) => Math.round(value * 10) / 10;

/**
 * Picks the moment of the video shown as the cast's thumbnail: slide to it, or play and pause on
 * it. `value` is in seconds (null until the video duration is known). Remount with a `key` for a
 * new video.
 */
const ThumbnailPicker = ({ uri, initialDuration = 0, value, onChange }) => {
  const [duration, setDuration] = useState(initialDuration);
  // The default moment waits for the player's own duration: picker metadata varies by platform.
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  // Playback started by the user: only then does the video drive the value. Players may also start
  // on their own (expo-video on web plays a new source automatically); that is paused.
  const userPlayingRef = useRef(false);
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = true;
    instance.timeUpdateEventInterval = 0.25;
  });

  useEffect(() => {
    if (value === null && loaded && duration > 0) onChange(roundTenth(duration * DEFAULT_POSITION));
  }, [value, loaded, duration, onChange]);

  // Shows the chosen frame; while the user plays the video, the player drives the value instead.
  useEffect(() => {
    if (value !== null && !userPlayingRef.current) player.currentTime = value;
  }, [player, value]);

  // Duration and the pending seek, whichever of these events the platform emits first.
  const onLoaded = (loadedDuration) => {
    if (loadedDuration > 0) setDuration(loadedDuration);
    setLoaded(true);
    // A seek requested before the video was loaded may have been ignored.
    if (valueRef.current !== null && !userPlayingRef.current) player.currentTime = valueRef.current;
  };
  useEventListener(player, 'sourceLoad', (event) => onLoaded(event.duration));
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') onLoaded(player.duration);
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying && !userPlayingRef.current) {
      player.pause();
      return;
    }
    if (!isPlaying) userPlayingRef.current = false;
    setPlaying(isPlaying);
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (userPlayingRef.current) onChange(roundTenth(currentTime));
  });

  const togglePlay = () => {
    if (userPlayingRef.current) {
      player.pause();
    } else {
      userPlayingRef.current = true;
      if (duration > 0 && value >= duration - 0.2) player.currentTime = 0;
      player.play();
    }
  };

  const slide = (next) => {
    if (userPlayingRef.current) {
      userPlayingRef.current = false;
      player.pause();
    }
    onChange(roundTenth(Array.isArray(next) ? next[0] : next));
  };

  const position = value ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Thumbnail</Text>
      <Text style={styles.caption}>
        Slide, or play and pause, to choose the moment shown on your cast's card.
      </Text>

      <View style={styles.preview}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
        <Pressable
          onPress={togglePlay}
          style={styles.playButton}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause the video' : 'Play the video'}
          hitSlop={8}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.textOnColor} />
        </Pressable>
        <View style={styles.timeBadge}>
          <Ionicons name="image-outline" size={14} color={colors.textOnColor} />
          <Text style={styles.timeText}>{formatMillis(position * 1000)}</Text>
        </View>
      </View>

      <Slider
        value={position}
        onValueChange={slide}
        minimumValue={0}
        maximumValue={Math.max(duration, 0.1)}
        step={0.1}
        disabled={!(duration > 0)}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.lightGray}
        thumbTouchSize={THUMB_TOUCH_SIZE}
        containerStyle={styles.slider}
        trackStyle={styles.sliderTrack}
        thumbStyle={styles.sliderThumb}
        accessibilityLabel="Thumbnail moment"
      />
      <View style={styles.times}>
        <Text style={styles.time}>{formatMillis(0)}</Text>
        <Text style={styles.time}>{formatMillis(duration * 1000)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.l,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.text,
  },
  caption: {
    ...typography.caption,
    marginTop: 2,
    marginBottom: spacing.s,
  },
  preview: {
    width: '100%',
    aspectRatio: CARD_RATIO,
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  playButton: {
    position: 'absolute',
    left: spacing.s,
    bottom: spacing.s,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  timeBadge: {
    position: 'absolute',
    right: spacing.s,
    bottom: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: sizes.buttonRadius,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  timeText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.textOnColor,
  },
  slider: {
    width: '100%',
    marginTop: spacing.s,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    ...typography.caption,
  },
});

export default ThumbnailPicker;
