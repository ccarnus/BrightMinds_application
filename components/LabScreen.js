import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';
import departmentsList from '../lists/departments';
import { API_BASE_URL } from './APIConfig';

const departmentImages = {
  Medicine: require('../assets/Virtual_labs/Medicine.png'),
  SocialSciences: require('../assets/Virtual_labs/SocialSciences.png'),
  Engineering: require('../assets/Virtual_labs/Engineering.png'),
  ArtsandHumanities: require('../assets/Virtual_labs/ArtsandHumanities.png'),
  ComputerScience: require('../assets/Virtual_labs/ComputerScience.png'),
  BiochemistryGeneticsandMolecularBiology: require('../assets/Virtual_labs/BiochemistryGeneticsandMolecularBiology.png'),
  AgriculturalandBiologicalSciences: require('../assets/Virtual_labs/AgriculturalandBiologicalSciences.png'),
  EnvironmentalScience: require('../assets/Virtual_labs/EnvironmentalScience.png'),
  MaterialsScience: require('../assets/Virtual_labs/MaterialsScience.png'),
  PhysicsandAstronomy: require('../assets/Virtual_labs/PhysicsandAstronomy.png'),
  BusinessManagementandAccounting: require('../assets/Virtual_labs/BusinessManagementandAccounting.png'),
  HealthProfessions: require('../assets/Virtual_labs/HealthProfessions.png'),
  EconomicsEconometricsandFinance: require('../assets/Virtual_labs/EconomicsEconometricsandFinance.png'),
  Psychology: require('../assets/Virtual_labs/Psychology.png'),
  Chemistry: require('../assets/Virtual_labs/Chemistry.png'),
  EarthandPlanetarySciences: require('../assets/Virtual_labs/EarthandPlanetarySciences.png'),
  Neuroscience: require('../assets/Virtual_labs/Neuroscience.png'),
  Mathematics: require('../assets/Virtual_labs/Neuroscience.png'),
  ImmunologyandMicrobiology: require('../assets/Virtual_labs/ImmunologyandMicrobiology.png'),
  DecisionSciences: require('../assets/Virtual_labs/DecisionSciences.png'),
  Energy: require('../assets/Virtual_labs/Energy.png'),
  Nursing: require('../assets/Virtual_labs/Nursing.png'),
  PharmacologyToxicologyandPharmaceutics: require('../assets/Virtual_labs/PharmacologyToxicologyandPharmaceutics.png'),
  Dentistry: require('../assets/Virtual_labs/Dentistry.png'),
  ChemicalEngineering: require('../assets/Virtual_labs/ChemicalEngineering.png'),
  Veterinary: require('../assets/Virtual_labs/Veterinary.png'),
};

const LabScreen = () => {
  const navigation = useNavigation();
  const [labs, setLabs] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  const getDisplayName = (name) => {
    const department = departmentsList.find(dept => dept.name === name);
    return department ? department.display : name;
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/cast/popular/department`);
        const departments = response.data.map(dept => ({
          name: dept._id,  // Dept name from API
          display: getDisplayName(dept._id),  // Get display name from your static list
          count: dept.count,
        }));
  
        // Set all departments at once
        setLabs(departments);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
  
    fetchDepartments();
  }, []);

  // Render the rows of labs as before
  const renderLabRow = (rowLabs, rowIndex) => (
    <View key={rowIndex} style={styles.labRow}>
      {rowLabs.map((lab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.labContainer}
          onPress={() => navigation.navigate('VirtualLab', { labId: lab.name, labDisplayName: lab.display })}
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
    width: '48%',
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
