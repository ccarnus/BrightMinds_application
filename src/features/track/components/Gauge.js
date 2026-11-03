import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, sizes } from '@shared/config/theme';

const Gauge = ({ total, current }) => {
  const ratio = total > 0 ? Math.min((current + 1) / total, 1) : 0;
  return (
    <View
      style={styles.gaugeContainer}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: Math.min(current + 1, total) }}
    >
      <View style={styles.gaugeBar}>
        <View style={[styles.gaugeFill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  gaugeBar: {
    backgroundColor: colors.lightGray,
    width: '80%',
    height: sizes.gauge,
    borderRadius: 5,
  },
  gaugeFill: {
    backgroundColor: colors.darkblue,
    height: sizes.gauge,
    borderRadius: 5,
  },
});

export default Gauge;