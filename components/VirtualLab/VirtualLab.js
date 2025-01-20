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
import { RFValue } from "react-native-responsive-fontsize"; // Importing RFValue for responsive font sizes

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

  useEffect(() => {
  }, [topics]);

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
          source={require('../../assets/Loader/loader.json')} // Ensure this path is correct
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
              numberOfLines={3} // Allows up to three lines
              ellipsizeMode='tail' // Adds ellipsis at the end if text exceeds three lines
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
          {topics.length === 0 ? (
            <Text style={styles.noDataText}>No topics available.</Text>
          ) : (
            topics.map((topic) => (
              <TouchableOpacity
                key={topic._id}
                style={styles.topicContainer}
                onPress={() => handleTopicPress(topic._id)}
              >
                {/* Topic Name */}
                <Text 
                  style={styles.topicName}
                  numberOfLines={3} // Allows up to three lines
                  ellipsizeMode='tail' // Adds ellipsis at the end if text exceeds three lines
                >
                  {topic.name}
                </Text>

                {/* Icons and Counts */}
                <View style={styles.topicStats}>
                  {/* Articles */}
                  <View style={styles.statItem}>
                    <Image source={ArticleIcon} style={styles.statIcon} />
                    <Text style={styles.statText}>{topic.articleCount}</Text>
                  </View>

                  {/* Casts */}
                  <View style={styles.statItem}>
                    <Image source={CastIcon} style={styles.statIcon} />
                    <Text style={styles.statText}>{topic.castCount}</Text>
                  </View>
                </View>

                {/* Circular Gauge */}
                <View style={styles.gaugeContainer}>
                  <AnimatedCircularProgress
                    size={width * 0.35} // Responsive size
                    width={15}
                    fill={Math.floor(Math.random() * 100) + 1} // Replace with actual data
                    tintColor={colors.darkblue}
                    backgroundColor={colors.primaryBis}
                    rotation={-90} // Starts the progress from the left
                    arcSweepAngle={180} // Makes the gauge a semi-circle
                    lineCap="round" // Rounded ends
                  >
                    {
                      (fill) => (
                        <Text style={styles.gaugeText}>
                          {Math.ceil(fill)}%
                        </Text>
                      )
                    }
                  </AnimatedCircularProgress>
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
    flexShrink: 1, // Ensures content can shrink if necessary
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
    flexShrink: 1, // Allows the text to shrink if necessary
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
    marginBottom: spacing.m,
    padding: spacing.m,
    borderRadius: sizes.radius,
    elevation: 2,
  },
  topicName: {
    fontSize: RFValue(20), // Responsive font size
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    marginBottom: spacing.s,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.s, // Adds spacing before the gauge
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
  gaugeContainer: {
    alignItems: 'center',
    marginTop: spacing.m,
    marginBottom: -spacing.l,
  },
  gaugeText: {
    fontSize: RFValue(16), // Responsive font size
    color: colors.darkblue,
    fontFamily: 'Montserrat',
    position: 'absolute', // Centers the text within the gauge
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 18,
    margin: 18,
    borderRadius: sizes.radius,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: RFValue(22), // Responsive font size
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: RFValue(16), // Responsive font size
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
