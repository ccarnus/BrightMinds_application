import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { colors, sizes, spacing } from '../theme';
import InfoIcon from '../../assets/Virtual_lab_icons/info_icon.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import departments from '../../lists/departments';
import { Modal, Portal, Button, Provider } from 'react-native-paper';
import { API_BASE_URL } from '../APIConfig';

const { width, height } = Dimensions.get('window');

// Your department images
const departmentImages = {
  Physics: require('../../assets/Virtual_labs/Physics.png'),
  Chemistry: require('../../assets/Virtual_labs/Chemistry.png'),
  SpaceExploration: require('../../assets/Virtual_labs/SpaceExploration.png'),
  Robotics: require('../../assets/Virtual_labs/Robotics.png'),
  Biology: require('../../assets/Virtual_labs/Biology.png'),
  EarthSciences: require('../../assets/Virtual_labs/EarthSciences.png'),
  Oceanography: require('../../assets/Virtual_labs/Oceanography.png'),
  EnvironmentalScience: require('../../assets/Virtual_labs/EnvironmentalScience.png'),
  Mathematics: require('../../assets/Virtual_labs/Mathematics.png'),
  ComputerScience: require('../../assets/Virtual_labs/ComputerScience.png'),
  Psychology: require('../../assets/Virtual_labs/Psychology.png'),
  Sociology: require('../../assets/Virtual_labs/Sociology.png'),
  CulturalStudies: require('../../assets/Virtual_labs/CulturalStudies.png'),
  Economics: require('../../assets/Virtual_labs/Economics.png'),
  PoliticalScience: require('../../assets/Virtual_labs/PoliticalScience.png'),
  Engineering: require('../../assets/Virtual_labs/Engineering.png'),
  MedicineandHealthSciences: require('../../assets/Virtual_labs/MedicineandHealthSciences.png'),
  Agriculture: require('../../assets/Virtual_labs/Agriculture.png'),
  History: require('../../assets/Virtual_labs/History.png'),
  Philosophy: require('../../assets/Virtual_labs/Philosophy.png'),
  Linguistics: require('../../assets/Virtual_labs/Linguistics.png'),
  Neuroscience: require('../../assets/Virtual_labs/Neuroscience.png'),
  ArtificialIntelligence: require('../../assets/Virtual_labs/ArtificialIntelligence.png'),
  Law: require('../../assets/Virtual_labs/Law.png'),
  Materials: require('../../assets/Virtual_labs/Materials.png'),
  Meteorology: require('../../assets/Virtual_labs/Meteorology.png'),
  NanoTechnology: require('../../assets/Virtual_labs/NanoTechnology.png'),
  Nutrition: require('../../assets/Virtual_labs/Nutrition.png'),
  Paleontology: require('../../assets/Virtual_labs/Paleontology.png'),
  Pediatrics: require('../../assets/Virtual_labs/Pediatrics.png'),
  Literature: require('../../assets/Virtual_labs/Literature.png'),
  Genetics: require('../../assets/Virtual_labs/Genetics.png'),
  Education: require('../../assets/Virtual_labs/Education.png'),
  Astronomy: require('../../assets/Virtual_labs/Astronomy.png'),
  Archaeology: require('../../assets/Virtual_labs/Archaeology.png'),
  Art: require('../../assets/Virtual_labs/Art.png'),
};

const VirtualLab = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const [labData, setLabData] = useState([]);
  const navigation = useNavigation();
  const [infoVisible, setInfoVisible] = useState(false);
  const [departmentDescription, setDepartmentDescription] = useState('');

  // Determine the correct image source for the current lab
  const departmentImageSource =
    departmentImages[labId] || departmentImages[labDisplayName] || null;

  useEffect(() => {
    fetchLabData();
  }, []);

  const fetchLabData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cast/department/${labId}`);
      const data = await response.json();
      setLabData(data);
    } catch (error) {
      console.error('Error fetching lab data:', error);
    }
  };

  const handleCastPress = (castId) => {
    navigation.navigate('VirtualLabVideoScreen', { selectedCastId: castId });
  };

  const showInfoModal = () => {
    // Find the current department based on labDisplayName or labId
    const department = departments.find(
      (dep) =>
        dep.display.toLowerCase() === labDisplayName?.toLowerCase() ||
        dep.name.toLowerCase() === labId?.toLowerCase()
    );

    if (department) {
      setDepartmentDescription(department.description);
    } else {
      setDepartmentDescription('Description not available.');
    }

    setInfoVisible(true);
  };

  const hideInfoModal = () => {
    setInfoVisible(false);
    setDepartmentDescription('');
  };

  return (
    <Provider>
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.secondary, colors.primaryBis]}
          style={styles.topSection}
        >
          <View style={styles.headerContent}>
            {/* Department Image */}
            {departmentImageSource && (
              <Image
                source={departmentImageSource}
                style={styles.departmentImage}
                resizeMode="contain"
              />
            )}

            {/* Lab Title */}
            <Text style={styles.labTitle}>
              {labDisplayName || 'Virtual Laboratory'}
            </Text>
          </View>

          <View style={styles.topRightButtons}>
            <TouchableOpacity onPress={showInfoModal}>
              <Image source={InfoIcon} style={styles.topRightIcon} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.bottomSection}>
          {labData.length === 0 ? (
            <Text style={styles.noDataText}>No data available.</Text>
          ) : (
            labData.map((cast, index) => (
              <TouchableOpacity
                key={index}
                style={styles.castContainer}
                onPress={() => handleCastPress(cast._id)}
              >
                <Image
                  source={{ uri: cast.castimageurl }}
                  style={styles.castImage}
                />
                <View style={styles.castTextContainer}>
                  {/* Title in bold, left-aligned */}
                  <Text style={styles.castTitle}>{cast.title}</Text>
                  {/* Topic just underneath the title */}
                  <Text style={styles.castTopic}>{cast.topic}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Info Modal */}
        <Portal>
          <Modal
            visible={infoVisible}
            onDismiss={hideInfoModal}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>{labDisplayName} Department</Text>
            <Text style={styles.modalDescription}>
              {departmentDescription}
            </Text>
            <Button
              mode="contained"
              onPress={hideInfoModal}
              style={styles.modalButton}
              buttonColor={colors.secondary}
            >
              Close
            </Button>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    height: height / 4,
    backgroundColor: colors.secondary,
    elevation: 5,
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  departmentImage: {
    width: 80,
    height: 80,
    marginRight: spacing.m,
  },
  labTitle: {
    fontSize: sizes.title,
    color: colors.primary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    flexShrink: 1,
  },
  topRightButtons: {
    position: 'absolute',
    right: spacing.m,
    bottom: spacing.l,
    alignItems: 'center',
  },
  topRightIcon: {
    width: 30,
    height: 30,
    marginVertical: spacing.s,
    tintColor: colors.primary,
  },
  bottomSection: {
    backgroundColor: colors.primaryBis,
    paddingVertical: spacing.m,
    width: width,
  },
  castContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.m,
  },
  castImage: {
    width: 150,
    height: 100,
    resizeMode: 'cover',
  },
  castTextContainer: {
    marginLeft: spacing.s,
    justifyContent: 'flex-start',
    flex: 1,
  },
  castTitle: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    textAlign: 'left',
    marginBottom: spacing.s,
  },
  castTopic: {
    fontSize: sizes.body,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    textAlign: 'left',
  },
  noDataText: {
    fontSize: sizes.body,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  // Modal Styles
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: sizes.h3,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: sizes.body,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalButton: {
    marginTop: spacing.m,
    alignSelf: 'stretch',
  },
});

export default VirtualLab;
