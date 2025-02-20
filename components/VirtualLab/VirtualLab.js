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
import ArticleIcon from '../../assets/Cast_screen_icons/article_logo.png';
import CastIcon from '../../assets/Cast_screen_icons/cast_logo.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import departments from '../../lists/departments';
import { Modal, Portal, Button, Provider } from 'react-native-paper';
import { API_BASE_URL } from '../APIConfig';
import LottieView from 'lottie-react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { RFValue } from "react-native-responsive-fontsize";

const { width, height } = Dimensions.get('window');

const departmentImages = {
  Medicine: require('../../assets/Virtual_labs/Medicine.png'),
  SocialSciences: require('../../assets/Virtual_labs/SocialSciences.png'),
  Engineering: require('../../assets/Virtual_labs/Engineering.png'),
  ArtsandHumanities: require('../../assets/Virtual_labs/ArtsandHumanities.png'),
  ComputerScience: require('../../assets/Virtual_labs/ComputerScience.png'),
  BiochemistryGeneticsandMolecularBiology: require('../../assets/Virtual_labs/BiochemistryGeneticsandMolecularBiology.png'),
  AgriculturalandBiologicalSciences: require('../../assets/Virtual_labs/AgriculturalandBiologicalSciences.png'),
  EnvironmentalScience: require('../../assets/Virtual_labs/EnvironmentalScience.png'),
  MaterialsScience: require('../../assets/Virtual_labs/MaterialsScience.png'),
  PhysicsandAstronomy: require('../../assets/Virtual_labs/PhysicsandAstronomy.png'),
  BusinessManagementandAccounting: require('../../assets/Virtual_labs/BusinessManagementandAccounting.png'),
  HealthProfessions: require('../../assets/Virtual_labs/HealthProfessions.png'),
  EconomicsEconometricsandFinance: require('../../assets/Virtual_labs/EconomicsEconometricsandFinance.png'),
  Psychology: require('../../assets/Virtual_labs/Psychology.png'),
  Chemistry: require('../../assets/Virtual_labs/Chemistry.png'),
  EarthandPlanetarySciences: require('../../assets/Virtual_labs/EarthandPlanetarySciences.png'),
  Neuroscience: require('../../assets/Virtual_labs/Neuroscience.png'),
  Mathematics: require('../../assets/Virtual_labs/Neuroscience.png'),
  ImmunologyandMicrobiology: require('../../assets/Virtual_labs/ImmunologyandMicrobiology.png'),
  DecisionSciences: require('../../assets/Virtual_labs/DecisionSciences.png'),
  Energy: require('../../assets/Virtual_labs/Energy.png'),
  Nursing: require('../../assets/Virtual_labs/Nursing.png'),
  PharmacologyToxicologyandPharmaceutics: require('../../assets/Virtual_labs/PharmacologyToxicologyandPharmaceutics.png'),
  Dentistry: require('../../assets/Virtual_labs/Dentistry.png'),
  ChemicalEngineering: require('../../assets/Virtual_labs/ChemicalEngineering.png'),
  Veterinary: require('../../assets/Virtual_labs/Veterinary.png'),
};

const VirtualLab = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const [infoVisible, setInfoVisible] = useState(false);
  const [departmentDescription, setDepartmentDescription] = useState('');
  const departmentImageSource =
    departmentImages[labId] || departmentImages[labDisplayName] || null;

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/topic/department/${labId}`);
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicPress = (topicId) => {
    navigation.navigate('TopicDetailScreen', { selectedTopicId: topicId });
  };

  const showInfoModal = () => {
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

  // Helper function to determine font size based on text length
  const getFontSize = (text) => {
    const maxLength = 30; // Adjust as needed
    if (text.length > maxLength) {
      return RFValue(18); // Smaller font size for longer text
    }
    return RFValue(24); // Default font size
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/Loader/loader.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  const maxActivity = topics.length > 0 ? Math.max(...topics.map(t => t.activity)) : 1;
  const maxImpact = topics.length > 0 ? Math.max(...topics.map(t => t.impact)) : 1;

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
            <Text 
              style={[
                styles.labTitle, 
                { fontSize: getFontSize(labDisplayName || 'Virtual Laboratory') }
              ]}
              numberOfLines={3}
              ellipsizeMode='tail'
            >
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
          <View style={{ marginBottom: spacing.l }} >
            {topics.length === 0 ? (
              <Text style={styles.noDataText}>No topics available.</Text>
            ) : (
              topics.map((topic) => {
                // Normalize the gauge values to a 0-100 fill range.
                const activityFill = maxActivity ? (topic.activity / maxActivity) * 100 : 0;
                const impactFill = maxImpact ? (topic.impact / maxImpact) * 100 : 0;

                return (
                  <TouchableOpacity
                    key={topic._id}
                    style={styles.topicContainer}
                    onPress={() => handleTopicPress(topic._id)}
                  >
                    <Text 
                      style={styles.topicName}
                      numberOfLines={3}
                      ellipsizeMode='tail'
                    >
                      {topic.name}
                    </Text>

                    <View style={styles.topicStats}>
                      <View style={styles.statItem}>
                        <Image source={ArticleIcon} style={styles.statIcon} />
                        <Text style={styles.statText}>{topic.articleCount}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Image source={CastIcon} style={styles.statIcon} />
                        <Text style={styles.statText}>{topic.castCount}</Text>
                      </View>
                    </View>

                    {/* Two gauges side by side */}
                    <View style={styles.gaugeRow}>
                      <View style={styles.gaugeContainer}>
                        <AnimatedCircularProgress
                          size={width * 0.35}
                          width={10}
                          fill={activityFill}
                          tintColor={colors.lightTeal}
                          backgroundColor={colors.primaryBis}
                          rotation={-115}
                          arcSweepAngle={230}
                          lineCap="round"
                        >
                          {(fill) => (
                            <Text style={styles.gaugeText}>
                              {topic.activity.toFixed(2)}
                            </Text>
                          )}
                        </AnimatedCircularProgress>
                        <Text style={styles.gaugeLabel}>Activity</Text>
                      </View>

                      <View style={styles.gaugeContainer}>
                        <AnimatedCircularProgress
                          size={width * 0.35}
                          width={10}
                          fill={impactFill}
                          tintColor={colors.darkTeal}
                          backgroundColor={colors.primaryBis}
                          rotation={-115}
                          arcSweepAngle={230}
                          lineCap="round"
                        >
                          {(fill) => (
                            <Text style={styles.gaugeText}>
                              {topic.impact.toFixed(2)}
                            </Text>
                          )}
                        </AnimatedCircularProgress>
                        <Text style={styles.gaugeLabel}>Impact</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
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
    flexShrink: 1,
  },
  departmentImage: {
    width: 80,
    height: 80,
    marginRight: spacing.m,
  },
  labTitle: {
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
  noDataText: {
    fontSize: sizes.body,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  topicContainer: {
    backgroundColor: 'white',
    marginHorizontal: spacing.m,
    marginBottom: spacing.l,
    padding: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  topicName: {
    fontSize: RFValue(20),
    color: colors.secondary,
    fontFamily: 'Montserrat',
    marginBottom: spacing.s,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.s,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  statIcon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  statText: {
    fontSize: sizes.body,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  // New style for displaying two gauges in a row
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.m,
    marginBottom: -spacing.l,
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  gaugeText: {
    fontSize: RFValue(16),
    color: colors.darkblue,
    fontFamily: 'Montserrat',
    position: 'absolute',
  },
  gaugeLabel: {
    fontSize: RFValue(14),
    color: colors.secondary,
    fontFamily: 'Montserrat',
    marginTop: spacing.s / 2,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 18,
    margin: 18,
    borderRadius: sizes.radius,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: RFValue(22),
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: RFValue(16),
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalButton: {
    marginTop: spacing.m,
    alignSelf: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  lottie: {
    width: 200,
    height: 200,
  },
});

export default VirtualLab;
