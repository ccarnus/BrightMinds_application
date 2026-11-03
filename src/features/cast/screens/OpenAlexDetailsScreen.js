import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, Linking, Alert, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@shared/config/theme';
import { openAlex, getErrorMessage } from '@shared/api/client';
import departments from '@shared/data/departments';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const { height } = Dimensions.get('window');

// OpenAlex ships abstracts as an inverted index ({ word: [positions] }).
const reconstructAbstract = (invertedIndex) => {
  if (!invertedIndex) return '';
  const positions = [];
  Object.entries(invertedIndex).forEach(([word, posArray]) => {
    posArray.forEach((pos) => positions.push({ pos, word }));
  });
  positions.sort((a, b) => a.pos - b.pos);
  return positions.map((entry) => entry.word).join(' ');
};

const getTimeSincePosted = (dateString) => {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
  if (Number.isNaN(diffDays)) return '';
  if (diffDays < 365) {
    if (diffDays <= 0) return 'today';
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const OpenAlexDetailsScreen = ({ route, navigation }) => {
  // Short OpenAlex work id, e.g. "W2935714482".
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
  const [work, setWork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchWork = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await openAlex.get(`/works/${encodeURIComponent(articleId)}`);
      if (!mountedRef.current) return;
      setWork(data?.title ? data : null);
    } catch (error) {
      console.error('Error fetching work details:', error);
      if (mountedRef.current) {
        setLoadError(getErrorMessage(error, 'We could not load this research paper.'));
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchWork();
  }, [fetchWork]);

  const abstractText = useMemo(() => {
    const index = work?.abstract_inverted_index_v3 || work?.abstract_inverted_index;
    return index ? reconstructAbstract(index) : 'No abstract available.';
  }, [work]);

  const goToCast = () => navigation.popTo('BottomNav', { screen: 'Cast' });

  const openFullResearch = () => {
    const url = work?.primary_location?.landing_page_url;
    if (!url) {
      Alert.alert('Unavailable', 'No link available for this work.');
      return;
    }
    Linking.openURL(url).catch((error) => {
      console.error('Failed to open URL:', error);
      Alert.alert('Error', 'Unable to open the research link.');
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
      <Ionicons name="chevron-back" size={28} color={colors.secondary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (loadError || !work) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StateMessage
          icon={loadError ? 'cloud-offline-outline' : 'document-text-outline'}
          title={loadError ? 'Something went wrong' : 'Research paper not found'}
          message={loadError || 'This work is not available right now.'}
          actionLabel={loadError ? 'Try again' : 'Back to Cast'}
          onAction={loadError ? fetchWork : goToCast}
        />
        {backButton}
      </View>
    );
  }

  const fieldId = work.primary_topic?.field?.id;
  const departmentDetails = fieldId ? departments.find((dept) => dept.id === fieldId) : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.containerScroll}
        contentContainerStyle={{ paddingTop: insets.top + spacing.s }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{work.title}</Text>
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
            <Text style={styles.dateText}>{getTimeSincePosted(work.publication_date)}</Text>
          </View>
          <Text style={styles.description}>{abstractText}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={goToCast}
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
          onPress={openFullResearch}
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
  container: { flex: 1, backgroundColor: colors.primaryBis },
  containerScroll: { backgroundColor: colors.primaryBis },
  backButton: {
    position: 'absolute',
    left: spacing.m,
    zIndex: 10,
  },
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
    width: 48,
    height: 48,
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

export default OpenAlexDetailsScreen;
