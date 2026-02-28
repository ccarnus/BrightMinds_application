import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {colors, shadow, sizes, spacing} from '@shared/config/theme';

const Gauge = ({ total, current }) => {
  return (
    <View style={styles.gaugeContainer}>
      {/*<Text style={styles.gaugeText}>{` ${current + 1} / ${total}`}</Text>*/}
      <View style={styles.gaugeBar}>
        <View
          style={{
            width: `${((current + 1) / total) * 100}%`,
            backgroundColor: colors.darkblue,
            height: sizes.gauge,
            borderRadius: 5,
          }}
        />
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
  gaugeText: {
    fontSize: sizes.h3,
  },
  gaugeBar: {
    backgroundColor: colors.lightGray,
    width: '80%',
    height: sizes.gauge,
    borderRadius: 5,
  },
});

export default Gauge;
