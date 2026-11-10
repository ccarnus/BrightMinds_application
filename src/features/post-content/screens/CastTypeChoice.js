import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, contentWidth, scale, sizes, spacing, typography } from '@shared/config/theme';
import BackButton from '@shared/components/BackButton';

const FADE_IN_DURATION = 400;
const ICON_SIZE = Math.min(scale(56), 72);

const CHOICES = [
  { route: 'PostCast', label: 'Clip', icon: require('@assets/Cast_screen_icons/cast_logo.png') },
  { route: 'PostArticle', label: 'Article', icon: require('@assets/Cast_screen_icons/article_logo.png') },
];

const CastTypeChoice = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const fadeAnims = useRef(CHOICES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.stagger(
      FADE_IN_DURATION,
      fadeAnims.map((value) =>
        Animated.timing(value, { toValue: 1, duration: FADE_IN_DURATION, useNativeDriver: true })
      )
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnims]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.choices}>
        {CHOICES.map((choice, index) => (
          <Animated.View key={choice.route} style={{ opacity: fadeAnims[index] }}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate(choice.route)}
              accessibilityRole="button"
              accessibilityLabel={`Post a ${choice.label.toLowerCase()}`}
            >
              <Image source={choice.icon} style={styles.icon} resizeMode="contain" />
              <Text style={styles.label}>{choice.label}</Text>
              <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  choices: {
    ...contentWidth,
    maxWidth: 420,
    paddingHorizontal: spacing.l,
    gap: spacing.m,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    padding: spacing.m,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  label: {
    ...typography.h2,
    flex: 1,
  },
});

export default CastTypeChoice;
