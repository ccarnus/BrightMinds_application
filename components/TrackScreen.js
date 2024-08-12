import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, sizes, spacing } from './theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TrackScreen = () => {
  const [trackingData, setTrackingData] = useState({ objective: '', progress: 0, target: 50 });
  const [history, setHistory] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [castCount, setCastCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const navigation = useNavigation();
  const BrightMindsMascot = require('../assets/Track_icons/BrightMindsMascot.png');

  const handleReadyScreenPress = () => {
    navigation.navigate('Ready');
  };

  const handleNavigateToPublications = (type) => {
    if (type === 'cast') {
      navigation.navigate('CastPublicationsScreen');
    } else if (type === 'article') {
      navigation.navigate('ArticlePublicationsScreen');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const getUserRole = async () => {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUserRole = await AsyncStorage.getItem('userRole');
        setUserId(storedUserId);
        setUserRole(storedUserRole);
      };
      getUserRole();
    }, [])
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://3.17.219.54/user/${userId}/tracking`);
        const data = await response.json();
        if (data.tracking) {
          setTrackingData({
            objective: data.tracking.objective,
            progress: data.tracking.progress / 100,
            target: data.target,
          });
          if (data.tracking.history) {
            setHistory(data.tracking.history.map(history => ({
              category: history.category,
              progress: history.count,
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching tracking data:', error);
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://3.17.219.54/user/${userId}`);
        const data = await response.json();
        if (data.evaluation_list) {
          const answeredEvaluations = data.evaluation_list.filter(evaluation => evaluation.answered).length;
          setAnsweredCount(answeredEvaluations);
        }
        setCastCount(data.castPublications.length);
        setArticleCount(data.articlePublications.length);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchData();
      fetchUserData();
    }
  }, [userId]);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.lightblue, colors.darkblue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.infoContainer}
      >
        <Text style={styles.infoText}>Understand the research shaping tomorrow's world</Text>
        <View style={styles.infoBottomContainer}>
          <View style={styles.infoBottomContainerLeft}>
            <Text style={styles.questionsansweredNumber}>{answeredCount}</Text>
            <Text style={styles.questionsansweredText}>Things learned</Text>
          </View>
          <View style={styles.infoBottomContainerRight}>
            <Image source={BrightMindsMascot} style={styles.infoImage} />
          </View>
        </View>
      </LinearGradient>
      {(userRole === 'Professor' || userRole === 'Researcher' || userRole === 'PhD Student') && (
        <LinearGradient
          colors={['#3CB371', '#2E8B57']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greenSection}
        >
          <Text style={styles.greenSectionTitle}>Publications</Text>
          <View style={styles.greenSectionContent}>
            <TouchableOpacity style={styles.greenSectionColumn} onPress={() => handleNavigateToPublications('article')}>
              <Image source={require('../assets/Cast_screen_icons/article_logo.png')} style={styles.greenSectionIcon} />
              <Text style={styles.greenSectionText}>{articleCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.greenSectionColumn} onPress={() => handleNavigateToPublications('cast')}>
              <Image source={require('../assets/Cast_screen_icons/cast_logo.png')} style={styles.greenSectionIcon} />
              <Text style={styles.greenSectionText}>{castCount}</Text>
            </TouchableOpacity>
            <View style={styles.greenSectionColumn}>
              <Image source={require('../assets/Cast_screen_icons/podcast_logo.png')} style={styles.greenSectionIcon} />
              <Text style={styles.greenSectionText}>0</Text>
            </View>
          </View>
        </LinearGradient>
      )}
      <View style={styles.ProgressContainer}>
        <Text style={styles.sectionTitle}>
          <Text style={styles.ProgressText}>{trackingData.objective}</Text> progress
        </Text>
        <View style={styles.gaugeContainer}>
          <AnimatedCircularProgress
            size={150}
            width={15}
            fill={trackingData.progress * 100}
            tintColor={colors.secondary}
            backgroundColor={colors.primaryBis}
            lineCap="round"
            rotation={0}
          >
            {fill => (
              <Text style={styles.gaugeText}>
                {`${Math.round(trackingData.progress * 100)}%`}
              </Text>
            )}
          </AnimatedCircularProgress>
        </View>
      </View>
      <View style={styles.ChartTitleContainer}>
        <Text style={styles.sectionTitle}>Learnings</Text>
        <View style={styles.circularGaugesContainer}>
          {history.length > 0 ? (
            history.map((item, index) => (
              <View key={index} style={styles.circularGaugeItem}>
                <Text style={styles.departmentName}>{item.category}</Text>
                <AnimatedCircularProgress
                  size={120}
                  width={10}
                  fill={(item.progress/trackingData.target)*100}
                  tintColor={colors.secondary}
                  backgroundColor={colors.primaryBis}
                  lineCap="round"
                  rotation={0}
                >
                  {fill => (
                    <Text style={styles.gaugeText}>
                      {`${Math.round((item.progress/trackingData.target)*100)}%`}
                    </Text>
                  )}
                </AnimatedCircularProgress>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No learnings yet...</Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.buttonStartWeeklyEvaluation} onPress={handleReadyScreenPress}>
        <Text style={styles.buttonText}>Take Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: spacing.s,
    marginVertical: spacing.m,
    backgroundColor: colors.darkblue,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  infoBottomContainer: {
    flexDirection: 'row',
  },
  infoBottomContainerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  infoBottomContainerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  infoImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  questionsansweredNumber: {
    fontSize: sizes.title * 2,
    textAlign: 'center',
    fontFamily: 'MontserratBold',
    color: colors.primaryBis,
    marginTop: spacing.xs,
  },
  questionsansweredText: {
    fontSize: sizes.h4,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
    marginTop: spacing.xs,
  },
  infoText: {
    fontSize: sizes.h2,
    textAlign: 'left',
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
    marginTop: spacing.xs,
    padding: 5,
  },
  greenSection: {
    padding: spacing.s,
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  greenSectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  greenSectionColumn: {
    alignItems: 'center',
  },
  greenSectionIcon: {
    width: 48,
    height: 48,
    marginBottom: spacing.s,
  },
  greenSectionText: {
    fontSize: sizes.h2,
    color: colors.primaryBis,
    fontFamily: 'MontserratBold',
  },
  greenSectionTitle: {
    fontSize: sizes.h2,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: sizes.h2,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
  },
  ProgressText: {
    fontFamily: 'MontserratBold',
    color: colors.secondary,
  },
  buttonStartWeeklyEvaluation: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    elevation: 5,
    width: '80%',
    marginLeft: '10%',
    padding: 15,
    borderRadius: sizes.radius,
    marginTop: spacing.m,
  },
  buttonText: {
    fontSize: sizes.h3,
    color: colors.primaryBis,
    fontFamily: 'MontserratBold',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.s,
  },
  gaugeText: {
    fontSize: sizes.h2,
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  WatchTimeText: {
    fontSize: 16,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
  },
  ProgressContainer: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    marginVertical: spacing.m,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  ChartTitleContainer: {
    backgroundColor: colors.primary,
    padding: spacing.s,
    marginVertical: spacing.m,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularGaugesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: spacing.m,
  },
  circularGaugeItem: {
    alignItems: 'center',
    marginVertical: spacing.m,
    width: '45%',
  },
  departmentName: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    marginBottom: spacing.s,
  },
  noDataText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 150,
  },
});

export default TrackScreen;
