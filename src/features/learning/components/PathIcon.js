import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@shared/config/theme';
import { pathStyle } from '@features/learning/utils/pathStyles';

/** Round gradient medallion with the path's icon; `ring` adds a white border (on colored headers). */
const PathIcon = ({ pathKey, size = 48, ring = false, style }) => {
  const { icon, colors: gradient } = pathStyle(pathKey);
  const outer = ring ? size + 8 : size;
  return (
    <View
      style={[
        styles.ring,
        { width: outer, height: outer, borderRadius: outer / 2 },
        ring && styles.ringVisible,
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.medal, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <MaterialCommunityIcons name={icon} size={Math.round(size * 0.5)} color={colors.textOnColor} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringVisible: {
    backgroundColor: colors.surface,
  },
  medal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PathIcon;
