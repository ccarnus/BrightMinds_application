import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Linking,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@shared/config/theme';
import departments from '@shared/data/departments';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const { height } = Dimensions.get('window');

const getTimeSincePosted = (dateString) => {
  const diffInDays = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
  if (Number.isNaN(diffInDays)) return '';
  if (diffInDays < 365) {
    if (diffInDays <= 0) return 'today';
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
  const years = Math.floor(diffInDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const ArticleDetailsScreen = ({ route, navigation }) => {
  const { selectedArticleId } = route.params;
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState(null);
  const [university, setUniversity] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    getUser()
      .then(({ userId: storedUserId }) => mountedRef.current && setUserId(storedUserId))
      .catch((error) => console.error('Error reading user session:', error));
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get(`/article/${encodeURIComponent(selectedArticleId)}`);
      if (!mountedRef.current) return;
      setArticle(data || null);
      setIsLoading(false);

      if (data?.university) {
        try {
          const { data: universityData } = await api.get(
            `/university/by/name/${encodeURIComponent(data.university)}`
          );
          if (mountedRef.current && universityData?.iconurl) {
            setUniversity({ logo: universityData.iconurl, name: universityData.displayedName });
          }
        } catch (error) {
          console.error('Error fetching university logo:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      if (mountedRef.current) {
        setLoadError(getErrorMessage(error, 'We could not load this article.'));
        setIsLoading(false);
      }
    }
  }, [selectedArticleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const promptSignIn = () => {
    Alert.alert('Sign in required', 'Create an account or sign in to track the articles you read.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Sign in', onPress: () => resetToAuthChoice(navigation) },
    ]);
  };

  const handleAddToCastList = async () => {
    if (isSubmitting) return;
    if (!userId || isGuestUser(userId)) {
      promptSignIn();
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/user/add/content/${userId}`, { contentId: selectedArticleId, type: 'article' });
      navigation.popTo('BottomNav', {
        screen: 'Cast',
        params: { finishedArticleId: selectedArticleId },
      });
    } catch (error) {
      console.error('Error adding article to list:', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to add article to your list.'));
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  const handleAccessFullResearch = () => {
    if (!article?.link) {
      Alert.alert('Unavailable', 'No link available for this article.');
      return;
    }
    Linking.openURL(article.link).catch((error) => {
      console.error('Failed to open URL:', error);
      Alert.alert('Error', 'Unable to open the article link.');
    });
  };

  const backButton = (
    <TouchableOpacity
      style={[styles.backButton, { top: insets.top + spacing.s }]}
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="chevron-back" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (loadError || !article) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StateMessage
          icon={loadError ? 'cloud-offline-outline' : 'document-text-outline'}
          title={loadError ? 'Something went wrong' : 'Article not found'}
          message={loadError || 'This article may have been removed.'}
          actionLabel={loadError ? 'Try again' : 'Go back'}
          onAction={loadError ? fetchArticle : () => navigation.goBack()}
        />
        {backButton}
      </View>
    );
  }

  const departmentDetails = departments.find((dept) => dept.name === article.department);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerScroll}>
        <Image source={{ uri: article.articleimageurl }} style={styles.image} />

        {!!university && (
          <View style={styles.topIconContainer}>
            <Image source={{ uri: university.logo }} style={styles.icon} />
            <Text style={styles.iconText}>{university.name}</Text>
          </View>
        )}

        {!!departmentDetails && (
          <TouchableOpacity
            style={styles.topIconContainer}
            onPress={() =>
              navigation.navigate('VirtualLab', {
                labId: departmentDetails.name,
                labDisplayName: departmentDetails.display,
              })
            }
            accessibilityRole="button"
          >
            <Image source={departmentDetails.image} style={styles.icon} />
            <Text style={styles.iconTextDepartment}>{departmentDetails.display}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{getTimeSincePosted(article.dateadded)}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.description}>{article.description}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleAddToCastList}
            loading={isSubmitting}
            disabled={isSubmitting}
            buttonColor={colors.darkGreen}
            icon={require('@assets/Cast_screen_icons/like.png')}
            labelStyle={styles.gotItLabel}
            style={styles.gotItButton}
          >
            Got it!
          </Button>
        </View>
      </ScrollView>
      <View style={[styles.fixedButtonContainer, { paddingBottom: spacing.m + insets.bottom }]}>
        <Button
          mode="contained"
          onPress={handleAccessFullResearch}
          buttonColor={colors.darkblue}
          icon={require('@assets/Cast_screen_icons/link.png')}
          labelStyle={styles.researchLabel}
          style={styles.researchButton}
        >
          Access Full Research
        </Button>
      </View>
      {backButton}
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
  backButton: {
    position: 'absolute',
    left: spacing.m,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    color: colors.black,
    textAlign: 'left',
    fontFamily: 'Montserrat',
  },
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
  iconText: {
    fontSize: sizes.h3,
    color: colors.black,
    fontFamily: 'Montserrat',
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
    width: '70%',
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
  gotItLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
  gotItButton: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: height * 0.08,
    marginTop: spacing.l,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.buttonRadius,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: spacing.m,
  },
  researchLabel: { fontSize: sizes.h3, fontFamily: 'Montserrat' },
  researchButton: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.s,
    marginTop: spacing.l,
    paddingHorizontal: spacing.s,
  },
});

export default ArticleDetailsScreen;
