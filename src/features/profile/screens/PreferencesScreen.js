import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import departments from '@shared/data/departments';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser } from '@shared/utils/UserStorage';
import AppButton from '@shared/components/AppButton';

const MIN_SELECTION = 3;

const PreferencesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Departments already saved, so a retry after a partial failure doesn't double-count them.
  const savedDepartmentsRef = useRef(new Set());
  const isButtonDisabled = selectedDepartments.length < MIN_SELECTION || isSubmitting;

  const toggleDepartmentSelection = (department) => {
    setSelectedDepartments((prevSelected) =>
      prevSelected.includes(department)
        ? prevSelected.filter((d) => d !== department)
        : [...prevSelected, department]
    );
  };

  const handleConfirm = async () => {
    if (isButtonDisabled) return;
    setIsSubmitting(true);
    try {
      const { userId } = await getUser();
      if (!userId) throw new Error('No signed-in user');
      // Sequential on purpose: each request updates the same preferences document.
      for (const department of selectedDepartments) {
        if (savedDepartmentsRef.current.has(department)) continue;
        await api.post(`/user/${userId}/preferences`, {
          category: department,
          modification: 'positive',
        });
        savedDepartmentsRef.current.add(department);
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'LearningPathPicker', params: { mode: 'onboarding' } }],
      });
    } catch (error) {
      console.error('Failed to set preferences:', error);
      Alert.alert(
        "Couldn't save your preferences",
        getErrorMessage(error, 'Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.container,
        { paddingTop: spacing.l + insets.top, paddingBottom: spacing.l + insets.bottom },
      ]}
    >
      <Text style={styles.title}>What do you want to learn about?</Text>
      <Text style={styles.subtitle}>At least {MIN_SELECTION}</Text>
      <View style={styles.bubbleContainer}>
        {departments.map(({ display, name }) => {
          const isSelected = selectedDepartments.includes(name);
          return (
            <TouchableOpacity
              key={name}
              style={[styles.bubble, isSelected && styles.bubbleSelected]}
              onPress={() => toggleDepartmentSelection(name)}
              disabled={isSubmitting}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled: isSubmitting }}
            >
              <Text style={[styles.bubbleText, isSelected && styles.bubbleTextSelected]}>
                {display}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <AppButton
        fullWidth
        onPress={handleConfirm}
        disabled={isButtonDisabled}
        loading={isSubmitting}
        style={styles.button}
      >
        Confirm
      </AppButton>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    ...contentWidth,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.l,
  },
  bubbleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.s,
  },
  bubble: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bubbleSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  bubbleText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  bubbleTextSelected: {
    color: colors.textOnColor,
  },
  button: {
    marginTop: spacing.l,
  },
});

export default PreferencesScreen;
