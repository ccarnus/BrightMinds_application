import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Animated } from 'react-native'; // Import Animated from react-native
import { useNavigation } from '@react-navigation/native';
import { colors, sizes, spacing } from './theme';
import departments from '../lists/departments'; // Adjust the import path as needed

// Mapping object for department images
const departmentImages = {
  'Physics': require('../assets/Virtual_labs/Physics.png'),
  'Chemistry': require('../assets/Virtual_labs/Chemistry.png'),
  'Robotics': require('../assets/Virtual_labs/Robotics.png'),
  'Biology': require('../assets/Virtual_labs/Biology.png'),
  'EarthSciences': require('../assets/Virtual_labs/EarthSciences.png'),
  'Geology': require('../assets/Virtual_labs/Geology.png'),
  'Oceanography': require('../assets/Virtual_labs/Oceanography.png'),
  'AstronomyandSpaceScience': require('../assets/Virtual_labs/AstronomyandSpaceScience.png'),
  'EnvironmentalScience': require('../assets/Virtual_labs/EnvironmentalScience.png'),
  'Mathematics': require('../assets/Virtual_labs/Mathematics.png'),
  'ComputerScience': require('../assets/Virtual_labs/ComputerScience.png'),
  'Statistics': require('../assets/Virtual_labs/Statistics.png'),
  'Psychology': require('../assets/Virtual_labs/Psychology.png'),
  'Sociology': require('../assets/Virtual_labs/Sociology.png'),
  'Anthropology': require('../assets/Virtual_labs/Anthropology.png'),
  'Economics': require('../assets/Virtual_labs/Economics.png'),
  'PoliticalScience': require('../assets/Virtual_labs/PoliticalScience.png'),
  'Engineering': require('../assets/Virtual_labs/Engineering.png'),
  'MedicineandHealthSciences': require('../assets/Virtual_labs/MedicineandHealthSciences.png'),
  'AgriculturalSciences': require('../assets/Virtual_labs/AgriculturalSciences.png'),
  'History': require('../assets/Virtual_labs/History.png'),
  'Philosophy': require('../assets/Virtual_labs/Philosophy.png'),
  'Linguistics': require('../assets/Virtual_labs/Linguistics.png'),
  'Neuroscience': require('../assets/Virtual_labs/Neuroscience.png'),
  'Biophysics': require('../assets/Virtual_labs/Biophysics.png'),
  'DataScience': require('../assets/Virtual_labs/DataScience.png'),
  'ArtificialIntelligence': require('../assets/Virtual_labs/ArtificialIntelligence.png')
};

const LabScreen = () => {
  const navigation = useNavigation();
  const [labs, setLabs] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0)); // Initialize fade animation value

  useEffect(() => {
    // Simulate staggered appearance with setTimeout
    const timeoutIds = departments.map((department, index) => {
      return setTimeout(() => {
        setLabs((prevLabs) => [...prevLabs, department]);
      }, index * 200);
    });

    // Clean up timeouts
    return () => {
      timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const renderLab = (lab, index) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.labContainer}
        onPress={() => navigation.navigate('VirtualLab', { labId: lab.name, labDisplayName: lab.display })}
      >
        <Image source={departmentImages[lab.name]} style={styles.labImage} resizeMode="contain" />
        <Text style={styles.labText}>{lab.display}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {labs.map(renderLab)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    overflow: 'visible',
  },
  scrollView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.m,
    overflow: 'visible',
  },
  labContainer: {
    width: '90%',
    minHeight: 100, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.s,
    marginVertical: spacing.m,
    backgroundColor: colors.primary,
    marginLeft: spacing.s,
    marginRight: spacing.s,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    overflow: 'visible',
    elevation: 5,
  },
  labImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  labText: {
    fontSize: sizes.h3,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    color: colors.secondary,
    marginTop: spacing.xs,
  },
});

export default LabScreen;
