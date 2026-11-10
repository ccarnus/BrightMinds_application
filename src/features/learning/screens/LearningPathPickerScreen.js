import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import haptics from '@shared/utils/haptics';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';
import PathOptionCard from '@features/learning/components/PathOptionCard';
import FocusFieldPicker from '@features/learning/components/FocusFieldPicker';
import {
  fetchLearningPaths,
  fetchLearningProfile,
  updateLearningPath,
} from '@features/learning/utils/learningApi';
import { pathStyle } from '@features/learning/utils/pathStyles';

const preferredFieldsOf = (preferences = []) =>
  preferences
    .filter((pref) => Number(pref.weight) > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((pref) => pref.category);

/**
 * Picks the learning path. `mode: 'onboarding'` (after choosing fields, then the welcome screen)
 * or `'change'` (from the path screen, back to it once saved).
 */
const LearningPathPickerScreen = ({ navigation, route }) => {
  const onboarding = route.params?.mode === 'onboarding';
  const insets = useSafeAreaInsets();
  const [paths, setPaths] = useState([]);
  const [current, setCurrent] = useState(null);
  const [preferredFields, setPreferredFields] = useState([]);
  const [selected, setSelected] = useState(null);
  const [focusField, setFocusField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const userIdRef = useRef(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { userId } = await getUser();
      userIdRef.current = userId;
      const signedIn = !!userId && !isGuestUser(userId);
      const [catalog, profile, preferences] = await Promise.all([
        fetchLearningPaths(),
        signedIn ? fetchLearningProfile(userId) : null,
        // Preferences only order the focus fields: the picker works without them.
        signedIn
          ? api
              .get(`/user/${userId}/preferences`)
              .then(({ data }) => data?.preferences || [])
              .catch(() => [])
          : [],
      ]);
      if (!mountedRef.current) return;
      const ranked = preferredFieldsOf(preferences);
      setPaths(catalog);
      setPreferredFields(ranked);
      setCurrent(profile?.path ? { path: profile.path, focusField: profile.focusField } : null);
      setSelected(profile?.path || null);
      setFocusField(profile?.focusField || ranked[0] || null);
    } catch (loadError) {
      console.error('Error loading learning paths:', loadError);
      if (mountedRef.current) setError(loadError);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const finishOnboarding = () => navigation.reset({ index: 0, routes: [{ name: 'WelcomeScreen' }] });

  const selectedPath = paths.find((path) => path.key === selected);
  const needsFocus = !!selectedPath?.usesFocusField;
  const unchanged =
    !!current && current.path === selected && (!needsFocus || current.focusField === focusField);
  const canSave = !!selectedPath && (!needsFocus || !!focusField) && !unchanged && !saving;

  const choose = (key) => {
    if (key === selected) return;
    haptics.tap();
    setSelected(key);
  };

  const save = async () => {
    if (!canSave) return;
    const userId = userIdRef.current;
    if (!userId || isGuestUser(userId)) {
      Alert.alert('Sign in required', 'Log in to choose a learning path.');
      return;
    }
    setSaving(true);
    try {
      const { newMilestones } = await updateLearningPath(userId, {
        path: selected,
        focusField: needsFocus ? focusField : undefined,
      });
      haptics.success();
      if (onboarding) {
        finishOnboarding();
      } else {
        navigation.popTo('LearningPath', { celebrate: newMilestones.length, at: Date.now() });
      }
    } catch (saveError) {
      console.error('Error saving the learning path:', saveError);
      Alert.alert("Couldn't save your learning path", getErrorMessage(saveError, 'Please try again.'));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const backButton = onboarding ? null : <BackButton onPress={() => navigation.goBack()} />;

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ErrorState
          error={error}
          onRetry={load}
          fallbackMessage="We couldn't load the learning paths."
          secondaryActionLabel={onboarding ? 'Decide later' : 'Go back'}
          onSecondaryAction={onboarding ? finishOnboarding : () => navigation.goBack()}
        />
        {backButton}
      </View>
    );
  }

  let buttonLabel = 'Start this path';
  if (unchanged) buttonLabel = 'Your current path';
  else if (current && selectedPath) buttonLabel = `Switch to ${selectedPath.title}`;
  if (needsFocus && !focusField) buttonLabel = 'Choose a focus field';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + (onboarding ? spacing.l : BACK_BUTTON_SIZE + spacing.s) },
        ]}
      >
        <Text style={styles.title} accessibilityRole="header">
          {current ? 'Change your learning path' : 'Choose your learning path'}
        </Text>
        <Text style={styles.subtitle}>
          {current
            ? "Everything you've learned keeps counting: milestones the new path already covers unlock right away."
            : 'Each path has 5 milestones and shapes your "For You" feed. You can change it at any time.'}
        </Text>

        {paths.map((path, index) => (
          <Animated.View
            key={path.key}
            entering={FadeInDown.delay(index * 80)}
            layout={LinearTransition.duration(220)}
            style={styles.option}
          >
            <PathOptionCard
              path={path}
              selected={path.key === selected}
              current={current?.path === path.key}
              onPress={() => choose(path.key)}
            >
              {path.usesFocusField && (
                <FocusFieldPicker
                  value={focusField}
                  onChange={setFocusField}
                  preferredFields={preferredFields}
                  color={pathStyle(path.key).colors[1]}
                />
              )}
            </PathOptionCard>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.m + insets.bottom }]}>
        <AppButton fullWidth onPress={save} disabled={!canSave} loading={saving}>
          {buttonLabel}
        </AppButton>
        {onboarding && (
          <AppButton variant="link" size="medium" onPress={finishOnboarding} disabled={saving}>
            Decide later
          </AppButton>
        )}
      </View>

      {backButton}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.l,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.s,
    marginBottom: spacing.l,
  },
  option: {
    marginBottom: spacing.s + 4,
  },
  footer: {
    ...contentWidth,
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
  },
});

export default LearningPathPickerScreen;
