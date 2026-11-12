import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors, labColors } from '@shared/config/theme';
import { COS_P } from '@features/lab/utils/labMap';

// A lab drawn as a short cylinder seen from above, with its icon standing on the top face.
// `unit` is the radius of the disc in pixels; everything else is a fraction of it.
const WALL = 0.34;

/** Side of the square a LabDisc of this unit occupies. */
export const discBox = (unit) => unit * 3;

/** `dot` marks a lab that has casts to watch; a lab without any is drawn muted (`active` false). */
const LabDisc = ({ unit, region, icon, active = true, dot = false }) => {
  const styles = useMemo(() => {
    const palette = labColors.regions[region] || labColors.regions.science;
    const look = active
      ? { face: labColors.face, rim: palette.rim, side: palette.side, ring: palette.island }
      : { face: labColors.muted.face, rim: labColors.muted.rim, side: labColors.muted.side, ring: labColors.muted.rim };
    const box = discBox(unit);
    const center = box / 2;
    const wall = WALL * unit;
    const topY = center - wall;

    // A tilted circle is an ellipse: React Native cannot round a rectangle into one.
    const flat = (diameter, x, y, extra) => ({
      position: 'absolute',
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      left: x - diameter / 2,
      top: y - diameter / 2,
      transform: [{ scaleY: COS_P }],
      ...extra,
    });

    return StyleSheet.create({
      box: { width: box, height: box },
      shadow: flat(unit * 2.2, center + unit * 0.14, center + unit * 0.1, {
        backgroundColor: labColors.shadow,
      }),
      base: flat(unit * 2, center, center, { backgroundColor: look.side }),
      wall: {
        position: 'absolute',
        left: center - unit,
        top: topY,
        width: unit * 2,
        height: wall,
        backgroundColor: look.side,
      },
      top: flat(unit * 2, center, topY, {
        backgroundColor: look.face,
        borderWidth: unit * 0.085,
        borderColor: look.rim,
      }),
      ring: flat(unit * 1.5, center, topY, {
        borderWidth: unit * 0.04,
        borderColor: look.ring,
      }),
      icon: {
        position: 'absolute',
        width: unit * 1.3,
        height: unit * 1.3,
        left: center - unit * 0.65,
        top: topY - unit * 0.3 - unit * 0.65,
        opacity: active ? 1 : 0.5,
      },
      dot: {
        position: 'absolute',
        width: unit * 0.42,
        height: unit * 0.42,
        borderRadius: unit * 0.21,
        left: center + unit * 0.74 - unit * 0.21,
        top: topY - unit * 0.5 - unit * 0.21,
        backgroundColor: colors.action,
        borderWidth: unit * 0.07,
        borderColor: colors.surface,
      },
    });
  }, [unit, region, active]);

  return (
    <View style={styles.box} pointerEvents="none">
      <View style={styles.shadow} />
      <View style={styles.base} />
      <View style={styles.wall} />
      <View style={styles.top} />
      <View style={styles.ring} />
      {icon ? <Image source={icon} style={styles.icon} resizeMode="contain" /> : null}
      {dot ? <View style={styles.dot} /> : null}
    </View>
  );
};

export default React.memo(LabDisc);
