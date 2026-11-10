import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { rewardColors } from '@shared/config/theme';

const DURATION_MS = 2200;
const GRAVITY = 1100;

const random = (min, max) => min + Math.random() * (max - min);

const makePieces = (count, power) =>
  Array.from({ length: count }, (_, index) => {
    // Mostly upward, fanning out to both sides.
    const angle = random(-Math.PI * 0.95, -Math.PI * 0.05);
    const shape = index % 3;
    return {
      angle,
      speed: random(0.45, 1) * power,
      drift: random(-40, 40),
      spin: random(360, 1080) * (Math.random() > 0.5 ? 1 : -1),
      width: shape === 2 ? 4 : random(7, 11),
      height: shape === 2 ? random(12, 16) : random(7, 11),
      radius: shape === 1 ? 6 : 1,
      color: rewardColors.confetti[index % rewardColors.confetti.length],
    };
  });

const Piece = ({ piece, progress, originX, originY }) => {
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t === 0 ? 0 : t > 0.8 ? (1 - t) / 0.2 : 1,
      transform: [
        { translateX: originX + Math.cos(piece.angle) * piece.speed * t + piece.drift * t },
        { translateY: originY + Math.sin(piece.angle) * piece.speed * t + GRAVITY * t * t },
        { rotate: `${piece.spin * t}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { width: piece.width, height: piece.height, borderRadius: piece.radius, backgroundColor: piece.color },
        style,
      ]}
    />
  );
};

/**
 * Full-screen confetti burst (Reanimated, no assets). Fires every time `trigger` changes to a
 * truthy value. `origin` is a fraction of the window ({ x: 0.5, y: 0.4 } = slightly above center).
 */
const ConfettiBurst = ({ trigger, count = 48, origin = { x: 0.5, y: 0.4 }, power = 1 }) => {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const pieces = useMemo(
    () => makePieces(count, Math.min(width, 520) * 0.9 * power),
    // A new trigger reshuffles the pieces so consecutive bursts look different.
    [count, width, power, trigger]
  );

  useEffect(() => {
    if (!trigger) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION_MS, easing: Easing.out(Easing.quad) });
  }, [trigger, progress]);

  if (!trigger) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => (
        <Piece
          key={`${trigger}-${index}`}
          piece={piece}
          progress={progress}
          originX={width * origin.x}
          originY={height * origin.y}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default ConfettiBurst;
