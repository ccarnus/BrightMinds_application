import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, labColors, sizes } from '@shared/config/theme';
import { COS_P, clamp, project } from '@features/lab/utils/labMap';
import LabDisc, { discBox } from '@features/lab/components/LabDisc';

// Labs are drawn once at this radius (pixels) and scaled to their size on screen.
const REF = 50;
const BOX = discBox(REF);
const ISLAND_DIAMETER = 100;
const LABEL_WIDTH = 132;
// A name shows once its lab is at least this big on screen (pixels of radius).
const LABEL_MIN_RADIUS = 19;
const LABEL_FADE = 2.5;
const ENTER = { damping: 14, stiffness: 150, mass: 0.8 };
const PRESS = { damping: 16, stiffness: 320, mass: 0.5 };

const useDimmed = (dimmed) => {
  const dim = useSharedValue(1);
  useEffect(() => {
    dim.value = withTiming(dimmed ? 0.2 : 1, { duration: 220 });
  }, [dim, dimmed]);
  return dim;
};

/** The colored ground under a lab. Overlapping islands of one region merge into a landmass. */
export const IslandPad = React.memo(({ node, index, view, camX, camY, zoom }) => {
  const { x, y, island } = node;
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(index * 22, withSpring(1, ENTER));
  }, [enter, index]);

  const style = useAnimatedStyle(() => {
    const p = project(view, camX.value, camY.value, zoom.value, x, y);
    const s = ((island * p.scale * p.f) / (ISLAND_DIAMETER / 2)) * enter.value;
    return {
      opacity: p.behind ? 0 : 1,
      transform: [
        { translateX: p.x - ISLAND_DIAMETER / 2 },
        { translateY: p.y - ISLAND_DIAMETER / 2 },
        { scaleX: s },
        { scaleY: s * COS_P },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.island,
        { backgroundColor: (labColors.regions[node.region] || labColors.regions.science).island },
        style,
      ]}
    />
  );
});

/** A lab on the map: the disc follows the camera and scales with its research. */
export const LabBody = React.memo(
  ({ node, index, view, camX, camY, zoom, pressed, dimmed, onOpen }) => {
    const { x, y, radius } = node;
    const enter = useSharedValue(0);
    const press = useSharedValue(0);
    const dim = useDimmed(dimmed);

    useEffect(() => {
      enter.value = withDelay(260 + index * 30, withSpring(1, ENTER));
    }, [enter, index]);
    useAnimatedReaction(
      () => pressed.value === index,
      (isPressed, wasPressed) => {
        if (isPressed !== wasPressed) press.value = withSpring(isPressed ? 1 : 0, PRESS);
      }
    );

    const style = useAnimatedStyle(() => {
      const p = project(view, camX.value, camY.value, zoom.value, x, y);
      const s = ((radius * p.scale * p.f) / REF) * (1 - 0.07 * press.value) * enter.value;
      return {
        opacity: p.behind ? 0 : dim.value,
        transform: [{ translateX: p.x - BOX / 2 }, { translateY: p.y - BOX / 2 }, { scale: s }],
      };
    });

    const active = node.casts > 0;
    return (
      <Animated.View
        style={[styles.box, style]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={node.display}
        onAccessibilityTap={() => onOpen(index)}
      >
        <LabDisc unit={REF} region={node.region} icon={node.icon} active={active} dot={active} />
      </Animated.View>
    );
  }
);

/**
 * The name of a lab. It stays upright and unscaled (crisp), is drawn above every disc so it is never
 * covered, and appears once the lab is big enough on screen: the biggest first, all when zoomed in.
 */
export const LabLabel = React.memo(
  ({ node, index, view, camX, camY, zoom, dimmed, emphasized }) => {
    const { x, y, radius } = node;
    const enter = useSharedValue(0);
    const emphasis = useSharedValue(0);
    const dim = useDimmed(dimmed);

    useEffect(() => {
      enter.value = withDelay(260 + index * 30, withSpring(1, ENTER));
    }, [enter, index]);
    useEffect(() => {
      emphasis.value = withTiming(emphasized ? 1 : 0, { duration: 220 });
    }, [emphasis, emphasized]);

    const style = useAnimatedStyle(() => {
      const p = project(view, camX.value, camY.value, zoom.value, x, y);
      const r = radius * p.scale * p.f;
      const visible = Math.max(clamp((r - LABEL_MIN_RADIUS) / LABEL_FADE, 0, 1), emphasis.value);
      return {
        opacity: p.behind ? 0 : visible * dim.value * enter.value,
        transform: [{ translateX: p.x - LABEL_WIDTH / 2 }, { translateY: p.y + r * COS_P + 3 }],
      };
    });

    return (
      <Animated.View pointerEvents="none" style={[styles.label, style]}>
        <Text style={styles.labelText} numberOfLines={1}>
          {node.short}
        </Text>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  island: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ISLAND_DIAMETER,
    height: ISLAND_DIAMETER,
    borderRadius: ISLAND_DIAMETER / 2,
  },
  box: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BOX,
    height: BOX,
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: LABEL_WIDTH,
    alignItems: 'center',
  },
  labelText: {
    fontFamily: fonts.bold,
    fontSize: sizes.small,
    color: colors.text,
    textAlign: 'center',
    textShadowColor: colors.surface,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
});
