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

const SearchArticleResults = ({ route }) => {
  const { articleId } = route.params;
  const navigation = useNavigation();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  // 20-second timeout for excessive loading time
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      if (!article) {
        Alert.alert("Error", "Loading took too long, please try again later.", [
          { text: "OK", onPress: () => navigation.navigate('BottomNav') }
        ]);
      }
    }, 20000);

    return () => clearTimeout(timeoutTimer);
  }, [article, navigation]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${articleId}?fields=title,abstract,url,publicationDate,fieldsOfStudy`
      );
      const data = await response.json();
      // Accept the response if all required fields are present
      if (data && data.title && data.abstract && data.url && data.publicationDate) {
        setArticle(data);
        setIsLoading(false);
      } else {
        setTimeout(fetchArticle, 2000);
      }
    } catch (error) {
      console.error('Error fetching article details:', error);
      setIsLoading(false);
    }
  };

  // Helper: convert publication date to "days ago" or "years ago"
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

  // Modified helper: use the mapping to return the department from the imported list.
  const getDepartmentDetails = (field) => {
    if (!field) return null;
    const mappedField = fieldMapping[field] || null;
    if (!mappedField) return null;
    return departments.find(dept => 
      dept.name.toLowerCase() === mappedField.toLowerCase()
    );
  };

  // Determine department from the first fieldOfStudy
  const department = article && article.fieldsOfStudy && article.fieldsOfStudy.length > 0
    ? getDepartmentDetails(article.fieldsOfStudy[0])
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

  if (!article) {
    return (
      <View style={styles.centered}>
        <Text>Article not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerScroll}>
        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>
          {/* Render department info if available and make it clickable */}
          {department && (
            <TouchableOpacity 
              style={styles.topIconContainer}
              onPress={() => navigation.navigate('VirtualLab', { labId: department.name, labDisplayName: department.display })}
            >
              <Image source={department.image} style={styles.icon} />
              <Text style={styles.iconTextDepartment}>{department.display}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {getTimeSincePublication(article.publicationDate)}
            </Text>
          </View>
          <Text style={styles.description}>{article.abstract}</Text>
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
            if (article && article.url) {
              Linking.openURL(article.url).catch(err => console.error('Failed to open URL:', err));
            } else {
              alert('No link available for this article.');
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
            paddingHorizontal: spacing.s
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

export default SearchArticleResults;
