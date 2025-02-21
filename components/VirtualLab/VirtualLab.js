import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Image, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { colors, sizes, spacing } from '../theme';
import InfoIcon from '../../assets/Virtual_lab_icons/info_icon.png';
import ActivityImage from '../../assets/Virtual_lab_icons/activity.png';
import ImpactImage from '../../assets/Virtual_lab_icons/impact.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import departments from '../../lists/departments';
import { Modal, Portal, Button, Provider, Searchbar } from 'react-native-paper';
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

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const VirtualLab = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const [infoVisible, setInfoVisible] = useState(false);
  const [departmentDescription, setDepartmentDescription] = useState('');
  const departmentImageSource =
    departmentImages[labId] || departmentImages[labDisplayName] || null;

  const scrollY = useRef(new Animated.Value(0)).current;
  const initialHeaderHeight = height / 4;
  const minHeaderHeight = height / 9;
  const headerShrinkRange = initialHeaderHeight - minHeaderHeight;

  // Interpolated values for the header, image, title, and info icon.
  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [initialHeaderHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });
  const imageSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [80, 40],
    extrapolate: 'clamp',
  });
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [RFValue(sizes.h2), RFValue(sizes.h3)],
    extrapolate: 'clamp',
  });
  const infoIconSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [RFValue(30), RFValue(20)],
    extrapolate: 'clamp',
  });

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
    console.log('Topic ID:', topicId);
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

  // Filter topics based on the search query (case-insensitive)
  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxActivity = topics.length > 0 ? Math.max(...topics.map(t => t.activity)) : 1;
  const maxImpact = topics.length > 0 ? Math.max(...topics.map(t => t.impact)) : 1;

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

  return (
    <Provider>
      <View style={styles.container}>
        {/* Animated Header */}
        <AnimatedLinearGradient
          colors={[colors.secondary, colors.primaryBis]}
          style={[styles.topSection, { height: headerHeight }]}
        >
          <View style={styles.headerContent}>
            {departmentImageSource && (
              <Animated.Image
                source={departmentImageSource}
                style={[styles.departmentImage, { width: imageSize, height: imageSize }]}
                resizeMode="contain"
              />
            )}
            <Animated.Text style={[styles.labTitle, { fontSize: titleFontSize }]}>
              {labDisplayName || 'Virtual Laboratory'}
            </Animated.Text>
          </View>
          <View style={styles.topRightButtons}>
            <TouchableOpacity onPress={showInfoModal}>
              <Animated.Image 
                source={InfoIcon} 
                style={[styles.topRightIcon, { width: infoIconSize, height: infoIconSize }]} 
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </AnimatedLinearGradient>

        {/* Scrollable Content */}
        <Animated.ScrollView
          style={styles.bottomSection}
          contentContainerStyle={{ paddingTop: initialHeaderHeight }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <Searchbar
            placeholder="Search topics..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <View style={{ marginBottom: spacing.l }}>
            {filteredTopics.length === 0 ? (
              <Text style={styles.noDataText}>No topics available.</Text>
            ) : (
              filteredTopics.map((topic) => {
                const activityFill = maxActivity ? (topic.activity / maxActivity) * 100 : 0;
                const impactFill = maxImpact ? (topic.impact / maxImpact) * 100 : 0;
                return (
                  <View key={topic._id} style={styles.topicContainer}>
                    <TouchableOpacity onPress={() => handleTopicPress(topic._id)} activeOpacity={0.8}>
                      <Text 
                        style={styles.topicName}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {topic.name}
                      </Text>
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
                            {() => (
                              <Image 
                                source={ActivityImage} 
                                style={styles.gaugeIcon} 
                                resizeMode="contain"
                              />
                            )}
                          </AnimatedCircularProgress>
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
                            {() => (
                              <Image 
                                source={ImpactImage} 
                                style={styles.gaugeIcon} 
                                resizeMode="contain"
                              />
                            )}
                          </AnimatedCircularProgress>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {/* Explore Button */}
                    <Button
                      mode="contained"
                      onPress={() => handleTopicPress(topic._id)}
                      buttonColor={colors.darkGreen}
                      contentStyle={{ flexDirection: 'row-reverse' }}
                      icon={require('../../assets/Discover_icons/next.png')}
                      labelStyle={{
                        fontSize: sizes.h3,
                        fontFamily: 'Montserrat',
                        textAlign: 'center'
                      }}
                      style={{
                        marginTop: spacing.m,
                        marginHorizontal: spacing.xs,
                        borderRadius: sizes.buttonRadius,
                      }}
                    >
                      Explore
                    </Button>
                  </View>
                );
              })
            )}
          </View>
        </Animated.ScrollView>

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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    zIndex: 1000,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // vertically centered
    justifyContent: 'center', // centers the row horizontally
  },
  departmentImage: {
    marginRight: spacing.m,
  },
  labTitle: {
    color: colors.primary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  topRightButtons: {
    position: 'absolute',
    right: spacing.m,
    bottom: spacing.m, // placed at the bottom right of the header
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightIcon: {
    tintColor: colors.primary,
  },
  bottomSection: {
    backgroundColor: colors.primaryBis,
  },
  searchBar: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    backgroundColor: colors.primary,
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
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.m,
    marginBottom: -spacing.l,
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  gaugeIcon: {
    width: RFValue(48),
    height: RFValue(48),
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 18,
    margin: 18,
    borderRadius: sizes.radius,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: RFValue(sizes.h1),
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
