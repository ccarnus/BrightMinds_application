import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Dimensions, 
  Linking, 
  Alert 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, sizes, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

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

  // Start a 15-second timeout to handle excessive loading time
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
        `https://api.semanticscholar.org/graph/v1/paper/${articleId}?fields=title,abstract,url,publicationDate`
      );
      const data = await response.json();
      // Ensure all required fields are present
      if (data && data.title && data.abstract && data.url && data.publicationDate) {
        setArticle(data);
        setIsLoading(false);
      } else {
        // If fields are missing, retry after 2 seconds
        setTimeout(fetchArticle, 2000);
      }
    } catch (error) {
      console.error('Error fetching article details:', error);
      setIsLoading(false);
    }
  };

  // Navigate back to the Cast screen
  const handleAddToCastList = async () => {
    navigation.navigate('BottomNav', { screen: 'Cast' });
  };

  // Open the full research URL
  const handleAccessFullResearch = () => {
    if (article && article.url) {
      Linking.openURL(article.url).catch((err) =>
        console.error('Failed to open URL:', err)
      );
    } else {
      alert('No link available for this article.');
    }
  };

  // Helper: Display publication time as "days ago" or "years ago"
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
        {/* Placeholder image since Semantic Scholar doesn't return one */}
        <Image 
          source={{ uri: 'https://via.placeholder.com/600x300?text=Research+Article' }} 
          style={styles.image} 
        />
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {getTimeSincePublication(article.publicationDate)}
          </Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.description}>{article.abstract}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleAddToCastList}
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
          onPress={handleAccessFullResearch}
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
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  containerScroll: {
    backgroundColor: colors.primaryBis,
  },
  image: {
    width: '100%',
    height: height * 0.3,
    resizeMode: 'cover',
    marginBottom: spacing.s,
  },
  content: {
    padding: spacing.m,
  },
  title: {
    fontSize: sizes.h1,
    marginBottom: spacing.l,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
  description: {
    fontSize: sizes.h3,
    color: colors.text,
    textAlign: 'left',
    fontFamily: 'Montserrat',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: spacing.s,
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
  lottie: {
    width: width * 0.6,
    height: width * 0.6,
  },
});

export default SearchArticleResults;
