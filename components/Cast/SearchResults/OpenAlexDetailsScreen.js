import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
  TouchableOpacity
} from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, sizes, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import departments from '../../../lists/departments';

const { width, height } = Dimensions.get('window');

// Mapping for department lookup (unchanged from your previous code)
const fieldMapping = {
  "Computer Science": "ComputerScience",
  "Medicine": "Medicine",
  "Chemistry": "Chemistry",
  "Biology": "BiochemistryGeneticsandMolecularBiology",
  "Materials Science": "MaterialsScience",
  "Physics": "PhysicsandAstronomy",
  "Geology": "EarthandPlanetarySciences",
  "Psychology": "Psychology",
  "Art": "ArtsandHumanities",
  "History": "ArtsandHumanities",
  "Geography": "EarthandPlanetarySciences",
  "Sociology": "SocialSciences",
  "Business": "BusinessManagementandAccounting",
  "Political Science": "SocialSciences",
  "Economics": "EconomicsEconometricsandFinance",
  "Philosophy": "ArtsandHumanities",
  "Mathematics": "Mathematics",
  "Engineering": "Engineering",
  "Environmental Science": "EnvironmentalScience",
  "Agricultural and Food Sciences": "AgriculturalandBiologicalSciences",
  "Education": "SocialSciences",
  "Law": "SocialSciences",
  "Linguistics": "ArtsandHumanities",
};

const OpenAlexDetailsScreen = ({ route }) => {
  // The parameter "articleId" (i.e. the work's short ID) is passed from the previous screen.
  const { articleId } = route.params;
  const navigation = useNavigation();
  const [work, setWork] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Retrieve user id if needed (kept for consistency with your previous screen)
  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  // Fetch the work details when the articleId is available.
  useEffect(() => {
    if (articleId) {
      fetchWork();
    }
  }, [articleId]);

  // Set a timeout to alert the user if loading takes too long.
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      if (!work) {
        Alert.alert("Error", "Loading took too long, please try again later.", [
          { text: "OK", onPress: () => navigation.navigate('BottomNav') }
        ]);
      }
    }, 20000);

    return () => clearTimeout(timeoutTimer);
  }, [work, navigation]);

  const fetchWork = async () => {
    setIsLoading(true);
    try {
      // Use the OpenAlex API endpoint with the passed work id.
      const response = await fetch(`https://api.openalex.org/works/${articleId}`);
      const data = await response.json();
      // If data is valid, set it to state; otherwise, try again after a delay.
      if (data && data.title) {
        setWork(data);
      } else {
        setTimeout(fetchWork, 2000);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching work details:', error);
      setIsLoading(false);
    }
  };

  // Helper to reconstruct an abstract from an inverted index.
  // It collects each word and its positions, sorts them, and then joins them.
  const reconstructAbstract = (abstractIndex) => {
    if (!abstractIndex) return '';
    const positions = [];
    Object.entries(abstractIndex).forEach(([word, posArray]) => {
      posArray.forEach(pos => positions.push({ pos, word }));
    });
    positions.sort((a, b) => a.pos - b.pos);
    const words = positions.map(entry => entry.word);
    return words.join(' ');
  };

  // Helper to convert the publication date into a "days ago" or "years ago" format.
  const getTimeSincePublication = (dateString) => {
    const publicationDate = new Date(dateString);
    const now = new Date();
    const diffMs = now - publicationDate;
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
    if (diffDays < 365) {
      return diffDays === 0 ? "today" : `${diffDays} days ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  // Helper to determine department details based on a field name.
  const getDepartmentDetails = (field) => {
    if (!field) return null;
    const mappedField = fieldMapping[field] || null;
    if (!mappedField) return null;
    return departments.find(dept =>
      dept.name.toLowerCase() === mappedField.toLowerCase()
    );
  };

  // Determine department details using the primary_topic's display_name.
  const department =
    work && work.primary_topic
      ? getDepartmentDetails(work.primary_topic.display_name)
      : null;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <LottieView
          source={require('../../../assets/Loader/loader.json')}
          autoPlay
          loop={true}
          style={styles.lottie}
        />
      </View>
    );
  }

  if (!work) {
    return (
      <View style={styles.centered}>
        <Text>Work not found</Text>
      </View>
    );
  }

  // Choose which abstract to display: try the v3 version first.
  const abstractText = work.abstract_inverted_index_v3
    ? reconstructAbstract(work.abstract_inverted_index_v3)
    : work.abstract_inverted_index
      ? reconstructAbstract(work.abstract_inverted_index)
      : "No abstract available.";

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerScroll}>
        <View style={styles.content}>
          <Text style={styles.title}>{work.title}</Text>
          {/* If a department is determined, display its icon and name as a clickable item */}
          {department && (
            <TouchableOpacity
              style={styles.topIconContainer}
              onPress={() =>
                navigation.navigate('VirtualLab', {
                  labId: department.name,
                  labDisplayName: department.display
                })
              }
            >
              <Image source={department.image} style={styles.icon} />
              <Text style={styles.iconTextDepartment}>{department.display}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {getTimeSincePublication(work.publication_date)}
            </Text>
          </View>
          <Text style={styles.description}>{abstractText}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('BottomNav', { screen: 'Cast' })}
            buttonColor={colors.darkGreen}
            icon={require('../../../assets/Cast_screen_icons/like.png')}
            labelStyle={{
              fontSize: sizes.h2,
              fontFamily: 'Montserrat',
              textAlign: 'center',
              paddingTop: spacing.s,
            }}
            style={{
              marginLeft: spacing.m,
              marginRight: spacing.m,
              marginBottom: height * 0.08,
              marginTop: spacing.l,
              paddingHorizontal: spacing.m,
              borderRadius: sizes.buttonRadius,
            }}
          >
            Got it!
          </Button>
        </View>
      </ScrollView>
      <View style={styles.fixedButtonContainer}>
        <Button
          mode="contained"
          onPress={() => {
            if (work && work.primary_location && work.primary_location.landing_page_url) {
              Linking.openURL(work.primary_location.landing_page_url).catch(err =>
                console.error('Failed to open URL:', err)
              );
            } else {
              alert('No link available for this work.');
            }
          }}
          buttonColor={colors.darkblue}
          icon={require('../../../assets/Cast_screen_icons/link.png')}
          labelStyle={{ fontSize: sizes.h3, fontFamily: 'Montserrat' }}
          style={{
            marginLeft: spacing.m,
            marginRight: spacing.m,
            marginBottom: spacing.s,
            marginTop: spacing.l,
            paddingHorizontal: spacing.s,
          }}
        >
          Access Full Research
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBis },
  containerScroll: { backgroundColor: colors.primaryBis },
  content: { padding: spacing.m },
  title: {
    fontSize: sizes.h1,
    marginBottom: spacing.l,
    marginTop: spacing.l,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
  description: {
    fontSize: sizes.h3,
    color: colors.text,
    textAlign: 'left',
    fontFamily: 'Montserrat',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: spacing.s,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: spacing.s,
  },
  iconTextDepartment: {
    fontSize: sizes.h3,
    color: colors.black,
    fontFamily: 'Montserrat',
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.s,
  },
  dateText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: spacing.l * 2,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: spacing.m,
  },
  lottie: { width: width * 0.6, height: width * 0.6 },
});

export default OpenAlexDetailsScreen;
