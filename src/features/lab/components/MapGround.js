import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { labColors } from '@shared/config/theme';
import { gridPath } from '@features/lab/utils/labMap';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The ground grid: its lines are what make the tilt and the zoom readable. One path, redrawn per frame. */
const MapGround = ({ view, camX, camY, zoom }) => {
  const animatedProps = useAnimatedProps(() => ({
    d: gridPath(view, camX.value, camY.value, zoom.value),
  }));

  return (
    <Svg width={view.width} height={view.height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatedPath animatedProps={animatedProps} stroke={labColors.grid} strokeWidth={1} fill="none" />
    </Svg>
  );
};

export default React.memo(MapGround);
