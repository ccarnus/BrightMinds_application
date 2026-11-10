import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';

// Ratio of the content cards where the cover is shown (cropped to fill, like here).
const CARD_RATIO = 980 / 560;

/** Article cover: an empty drop zone, or the chosen image with a "Change" chip. */
const CoverImagePicker = ({ image, onPress }) => (
  <View style={styles.container}>
    <Text style={styles.label}>Cover image</Text>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cover, !image && styles.empty, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={image ? 'Change the cover image' : 'Add a cover image'}
    >
      {image ? (
        <>
          <Image source={{ uri: image.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.changeChip}>
            <Ionicons name="images-outline" size={14} color={colors.textOnColor} />
            <Text style={styles.changeText}>Change</Text>
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={32} color={colors.accent} />
          <Text style={styles.placeholderTitle}>Add a cover image</Text>
          <Text style={styles.placeholderText}>Shown on your article's card. JPEG or PNG.</Text>
        </View>
      )}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.text,
    marginBottom: spacing.s,
  },
  cover: {
    width: '100%',
    aspectRatio: CARD_RATIO,
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.placeholder,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.m,
  },
  placeholderTitle: {
    ...typography.h3,
    color: colors.accent,
  },
  placeholderText: {
    ...typography.caption,
    textAlign: 'center',
  },
  changeChip: {
    position: 'absolute',
    right: spacing.s,
    bottom: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: sizes.buttonRadius,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  changeText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.textOnColor,
  },
});

export default CoverImagePicker;
