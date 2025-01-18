import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, sizes, spacing } from './theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import departments from '../lists/departments';
import { Button } from 'react-native-paper';
import { API_BASE_URL } from './APIConfig';

const { width } = Dimensions.get('window');

const TrackScreen = () => {
  const [trackingData, setTrackingData] = useState({ objective: '', progress: 0, target: 50 });
  const [history, setHistory] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [castCount, setCastCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const navigation = useNavigation();
  const Learning = require('../assets/Track_icons/learning.png');
  const Progress = require('../assets/Track_icons/progress_illustration.png');

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

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/tracking`);
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
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
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

  useEffect(() => {
    if (userId) {
      fetchData();
      fetchUserData();
    }
  }, [userId]);

  const onRefresh = React.useCallback(() => {
    if (userId) {
      setRefreshing(true);
      fetchData();
      fetchUserData();
      setRefreshing(false);
    }
  }, [userId]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
            <Text style={styles.questionsansweredText}>Topic Learned</Text>
          </View>
          <View style={styles.infoBottomContainerRight}>
            <Image source={Learning} style={styles.infoImage} />
          </View>
        </View>
      </LinearGradient>
      {(userRole === 'Professor' || userRole === 'Researcher' || userRole === 'PhD Student') && (
        <LinearGradient
          colors={[colors.lightGreen, colors.darkGreen]}
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
      <LinearGradient
        colors={[colors.lightGreen, colors.darkGreen]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ProgressContainer}
      >
        <Text style={styles.sectionTitle}>
          <Text style={styles.ProgressText}>{trackingData.objective}</Text> progress
        </Text>
          <View style={styles.gaugeContainer}>
            <AnimatedCircularProgress
              size={150}
              width={15}
              fill={trackingData.progress * 100}
              tintColor={colors.darkGreen}
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
      </LinearGradient>
      <LinearGradient
        colors={[colors.lightOrange, colors.darkOrange]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ChartTitleContainer}
      >
        <View style={{flexDirection: 'row'}}>
          <Image source={Progress} style={styles.infoImage2} />
          <Text style={{textAlign: "left", fontSize: sizes.h2, fontFamily: 'Montserrat', flexShrink: 1,
      flexWrap: 'wrap', marginTop: spacing.s, marginLeft: spacing.s, marginRight: spacing.s}}>What you are learning about</Text>
        </View>
        <View style={styles.circularGaugesContainer}>
          {history.length > 0 ? (
            history.map((item, index) => {
              const department = departments.find(dep => dep.name === item.category);
              return (
                <View style={styles.ChartandTextContainer}>
                  <View key={index} style={styles.circularGaugeItem}>
                    <AnimatedCircularProgress
                      size={width * 0.25}  // Gauge size is 25% of the screen width
                      width={10}
                      fill={(item.progress / trackingData.target) * 100}
                      tintColor={colors.darkGreen}
                      backgroundColor={colors.primaryBis}
                      lineCap="round"
                      rotation={0}
                    >
                      {fill => (
                        <Text style={styles.gaugeText}>
                          {`${Math.round((item.progress / trackingData.target) * 100)}%`}
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                    <Text style={styles.departmentName}>{department ? department.display : item.category}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>No learnings yet...</Text>
          )}
        </View>
      </LinearGradient>
      <Button
        mode="contained"
        onPress={handleReadyScreenPress}
        buttonColor={colors.darkGreen}
        icon={require('../assets/Track_icons/test.png')}
        labelStyle={{
          fontSize: sizes.h2,
          fontFamily: 'Montserrat',
          textAlign: 'center',
          paddingTop: spacing.s,
        }}
        style={{
          marginLeft: spacing.m,
          marginRight: spacing.m,
          marginBottom: spacing.l,
          marginTop: spacing.l,
          borderRadius: sizes.buttonRadius,
        }}
      >
        Test Yourself
      </Button>
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
  LearningImageConainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  infoImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  infoImage2: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginLeft: spacing.s,
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
    fontFamily: 'Montserrat',
    color: colors.primary,
  },
  learningSectionTitle: {
    fontSize: sizes.h2,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  sectionTitle: {
    fontSize: sizes.h2,
    color: colors.primaryBis,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
  },
  ProgressText: {
    fontFamily: 'MontserratBold',
    color: colors.secondary,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.s,
  },
  ChartandTextContainer: {
    marginTop: spacing.s,
    marginInlineStart: 2,
    marginRight: 2,
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
    justifyContent: 'space-between',
    marginHorizontal: spacing.s,
  },
  circularGaugeItem: {
    alignItems: 'center',
    width: width * 0.25,
    marginBottom: spacing.m,
  },
  departmentName: {
    fontSize: sizes.h5,
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  gaugeText: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
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
