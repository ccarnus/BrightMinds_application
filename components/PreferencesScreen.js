import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import departments from '../lists/departments';
import { colors, sizes, spacing } from './theme';
import { API_BASE_URL } from './APIConfig';

const PreferencesScreen = ({ navigation }) => {
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const toggleDepartmentSelection = (department) => {
    setSelectedDepartments((prevSelected) =>
      prevSelected.includes(department)
        ? prevSelected.filter((d) => d !== department)
        : [...prevSelected, department]
    );
  };

  useEffect(() => {
    setIsButtonDisabled(selectedDepartments.length < 3);
  }, [selectedDepartments]);

  const handleConfirm = async () => {
    const userId = await AsyncStorage.getItem('userId');

    try {
      for (const department of selectedDepartments) {
        await axios.post(`${API_BASE_URL}/user/${userId}/preferences`, {
          category: department,
          modification: 'positive',
        });
      }
      navigation.navigate('WelcomeScreen');
    } catch (error) {
      console.error('Failed to set preferences:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>What do you want to learn about?</Text>
      <Text style={styles.subtitle}>At least 3</Text>
      <View style={styles.bubbleContainer}>
        {departments.map(({ display, name }) => (
          <TouchableOpacity
            key={name}
            style={[
              styles.bubble,
              selectedDepartments.includes(name) && styles.bubbleSelected
            ]}
            onPress={() => toggleDepartmentSelection(name)}
          >
            <Text
              style={[
                styles.bubbleText,
                selectedDepartments.includes(name) && styles.bubbleTextSelected
              ]}
            >
              {display}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button
        mode="contained"
        onPress={handleConfirm}
        disabled={isButtonDisabled}
        buttonColor={colors.darkGreen}
        labelStyle={{
          fontSize: sizes.h2,
          fontFamily: 'Montserrat',
          textAlign: 'center',
          paddingTop: spacing.s,
        }}
        style={{
          marginBottom: spacing.s,
          marginTop: spacing.l,
          borderRadius: sizes.buttonRadius,
        }}
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
  button: {
    backgroundColor: colors.secondary,
    marginTop: spacing.l,
    fontFamily: 'Montserrat',
  },
});

export default PreferencesScreen;
