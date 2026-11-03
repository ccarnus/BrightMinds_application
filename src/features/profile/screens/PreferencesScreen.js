import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import departments from '@shared/data/departments';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser } from '@shared/utils/UserStorage';

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
      navigation.reset({ index: 0, routes: [{ name: 'WelcomeScreen' }] });
    } catch (error) {
      console.error('Failed to set preferences:', error);
      Alert.alert(
        'Could not save your preferences',
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
        { paddingTop: 20 + insets.top, paddingBottom: 20 + insets.bottom },
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
      <Button
        mode="contained"
        onPress={handleConfirm}
        disabled={isButtonDisabled}
        loading={isSubmitting}
        buttonColor={colors.darkGreen}
        labelStyle={styles.buttonLabel}
        style={styles.button}
      >
        Confirm
      </Button>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.primaryBis,
  },
  title: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.s,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    marginTop: spacing.l,
  },
  subtitle: {
    fontSize: sizes.h3,
    textAlign: 'center',
    marginBottom: spacing.l,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  bubbleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bubble: {
    padding: 10,
    margin: 5,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  bubbleSelected: {
    backgroundColor: colors.secondary,
  },
  bubbleText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  bubbleTextSelected: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  button: {
    marginBottom: spacing.s,
    marginTop: spacing.l,
    borderRadius: sizes.buttonRadius,
  },
  buttonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
});

export default PreferencesScreen;
