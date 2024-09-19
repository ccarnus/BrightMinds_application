import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, sizes, spacing } from './theme';
import departments from '../lists/departments';

const departmentImages = {
  'Physics': require('../assets/Virtual_labs/Physics.png'),
  'Chemistry': require('../assets/Virtual_labs/Chemistry.png'),
  'Robotics': require('../assets/Virtual_labs/Robotics.png'),
  'Biology': require('../assets/Virtual_labs/Biology.png'),
  'EarthSciences': require('../assets/Virtual_labs/EarthSciences.png'),
  'CitiesofTheFuture': require('../assets/Virtual_labs/CitiesoftheFuture.png'),
  'Geology': require('../assets/Virtual_labs/Geology.png'),
  'Oceanography': require('../assets/Virtual_labs/Oceanography.png'),
  'SpaceExploration': require('../assets/Virtual_labs/SpaceExploration.png'),
  'EnvironmentalSciences': require('../assets/Virtual_labs/EnvironmentalScience.png'),
  'Mathematics': require('../assets/Virtual_labs/Mathematics.png'),
  'ComputerScience': require('../assets/Virtual_labs/ComputerScience.png'),
  'Statistics': require('../assets/Virtual_labs/Statistics.png'),
  'Psychology': require('../assets/Virtual_labs/Psychology.png'),
  'Sociology': require('../assets/Virtual_labs/Sociology.png'),
  'CulturalStudies': require('../assets/Virtual_labs/CulturalStudies.png'),
  'Economics': require('../assets/Virtual_labs/Economics.png'),
  'PoliticalScience': require('../assets/Virtual_labs/PoliticalScience.png'),
  'Engineering': require('../assets/Virtual_labs/Engineering.png'),
  'MedicineandHealthSciences': require('../assets/Virtual_labs/MedicineandHealthSciences.png'),
  'Agriculture': require('../assets/Virtual_labs/Agriculture.png'),
  'HistoryandGeography': require('../assets/Virtual_labs/HistoryandGeography.png'),
  'Philosophy': require('../assets/Virtual_labs/Philosophy.png'),
  'Linguistics': require('../assets/Virtual_labs/Linguistics.png'),
  'Neuroscience': require('../assets/Virtual_labs/Neuroscience.png'),
  'ArtificialIntelligence': require('../assets/Virtual_labs/ArtificialIntelligence.png'),
  'Law': require('../assets/Virtual_labs/Law.png'),
  'Materials': require('../assets/Virtual_labs/Materials.png'),
  'Mechanics': require('../assets/Virtual_labs/Mechanics.png'),
  'MedicalImaging': require('../assets/Virtual_labs/MedicalImaging.png'),
  'Meteorology': require('../assets/Virtual_labs/Meteorology.png'),
  'NanoTechnology': require('../assets/Virtual_labs/NanoTechnology.png'),
  'Nutrition': require('../assets/Virtual_labs/Nutrition.png'),
  'Paleontology': require('../assets/Virtual_labs/Paleontology.png'),
  'Pediatrics': require('../assets/Virtual_labs/Pediatrics.png'),
  'SportSciences': require('../assets/Virtual_labs/SportSciences.png'),
  'Transportation': require('../assets/Virtual_labs/Transportation.png'),
  'Literature': require('../assets/Virtual_labs/Literature.png'),
  'Genetics': require('../assets/Virtual_labs/Genetics.png'),
  'Education': require('../assets/Virtual_labs/Education.png'),
  'Astronomy': require('../assets/Virtual_labs/Astronomy.png'),
  'Archaeology': require('../assets/Virtual_labs/Archaeology.png'),
  'Art': require('../assets/Virtual_labs/Art.png'),
};

const LabScreen = () => {
  const navigation = useNavigation();
  const [labs, setLabs] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const timeoutIds = departments.map((department, index) => {
      return setTimeout(() => {
        setLabs((prevLabs) => [...prevLabs, department]);
      }, index * 120);
    });

    return () => {
      timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const renderLabRow = (rowLabs, rowIndex) => (
    <View key={rowIndex} style={styles.labRow}>
      {rowLabs.map((lab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.labContainer}
          onPress={() => navigation.navigate('LabChoiceScreen', { labId: lab.name, labDisplayName: lab.display })}
        >
          <Image source={departmentImages[lab.name]} style={styles.labImage} resizeMode="contain" />
          <Text style={styles.labText}>{lab.display}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const groupedLabs = [];
  for (let i = 0; i < labs.length; i += 2) {
    groupedLabs.push(labs.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {groupedLabs.map(renderLabRow)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollView: {
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.m,
  },
  labRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  labContainer: {
    width: '48%', // Adjusted to fit two items per row with some spacing
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.s,
    backgroundColor: colors.primary,
    elevation: 5,
  },
  labImage: {
    width: 80,
    height: 80,
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
