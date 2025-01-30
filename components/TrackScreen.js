import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, sizes, spacing } from './theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import departments from '../lists/departments';
import { Button } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from './APIConfig';

const { width } = Dimensions.get('window');

const TrackScreen = () => {
  // STATES
  const [trackingData, setTrackingData] = useState({ objective: '', progress: 0, target: 50 });
  const [history, setHistory] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const Learning = require('../assets/Track_icons/learning.png');
  const Progress = require('../assets/Track_icons/progress_illustration.png');
  // Use the same serverError image as in CastScreen
  const serverError = require('../assets/Cast_screen_icons/server_error.png');

  // NAVIGATIONS
  const handleReadyScreenPress = () => {
    navigation.navigate('Ready');
  };

  useFocusEffect(
    useCallback(() => {
      const getUserRole = async () => {
        try {
          const storedUserId = await AsyncStorage.getItem('userId');
          const storedUserRole = await AsyncStorage.getItem('userRole');
          setUserId(storedUserId);
          setUserRole(storedUserRole);
        } catch (error) {
          console.error('Error fetching user data from storage:', error);
        }
      };
      getUserRole();
    }, [])
  );

  // FETCHING FUNCTIONS
  const fetchTrackingData = async (id) => {
    // Use setApiError(false) here to reset error state before fetch
    setApiError(false);

    try {
      const response = await fetch(`${API_BASE_URL}/user/${id}/tracking`);
      const data = await response.json();

      // Optional: check response.ok or do your own error handling
      if (data.tracking) {
        setTrackingData({
          objective: data.tracking.objective,
          progress: data.tracking.progress / 100,
          target: data.target,
        });
        if (data.tracking.history) {
          setHistory(
            data.tracking.history.map((hist) => ({
              category: hist.category,
              progress: hist.count,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setApiError(true);
    }
  };

  const fetchUserData = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${id}`);
      const data = await response.json();

      if (data.evaluation_list) {
        const answeredEvaluations = data.evaluation_list.filter(
          (evaluation) => evaluation.answered
        ).length;
        setAnsweredCount(answeredEvaluations);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setApiError(true);
    }
  };

  // Combined fetch for both tracking + user data
  const fetchAllData = async () => {
    if (!userId) return;
    setIsLoading(true);
    setApiError(false);

    await Promise.all([fetchTrackingData(userId), fetchUserData(userId)]);

    setIsLoading(false);
  };

  // MOUNT/UPDATE
  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  // PULL TO REFRESH
  const onRefresh = useCallback(() => {
    if (userId) {
      setRefreshing(true);
      fetchAllData().then(() => setRefreshing(false));
    }
  }, [userId]);

  // ERROR LAYOUT
  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <Image source={serverError} style={styles.errorImage} />
        <Text style={styles.errorText}>Whoops!</Text>
        <Text style={styles.errorDetail}>
          Please try refreshing or come back later!
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setApiError(false);
            setIsLoading(true);
            fetchAllData();
          }}
        >
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // LOADING LAYOUT
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/Loader/loader.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  // MAIN LAYOUT
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Blue Gradient */}
        <LinearGradient
          colors={[colors.lightblue, colors.darkblue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoContainer}
        >
          <Text style={styles.infoText}>
            Understand the research shaping tomorrow's world
          </Text>
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

        {/* Progress Container (Teal Gradient) */}
        <LinearGradient
          colors={[colors.lightTeal, colors.darkTeal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ProgressContainer}
        >
          <Text style={styles.sectionTitle}>
            <Text style={styles.ProgressText}>{trackingData.objective}</Text>{' '}
            progress
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
              {(fill) => (
                <Text style={styles.gaugeText}>
                  {`${Math.round(trackingData.progress * 100)}%`}
                </Text>
              )}
            </AnimatedCircularProgress>
          </View>
        </LinearGradient>

        {/* Chart Container (Orange Gradient) */}
        <LinearGradient
          colors={[colors.lightOrange, colors.darkOrange]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ChartTitleContainer}
        >
          <View style={{ flexDirection: 'row' }}>
            <Image source={Progress} style={styles.infoImage2} />
            <Text
              style={{
                textAlign: 'left',
                fontSize: sizes.h2,
                fontFamily: 'Montserrat',
                flexShrink: 1,
                flexWrap: 'wrap',
                marginTop: spacing.s,
                marginLeft: spacing.s,
                marginRight: spacing.s,
              }}
            >
              What you are learning about
            </Text>
          </View>

          <View style={styles.circularGaugesContainer}>
            {history.length > 0 ? (
              history.map((item, index) => {
                const department = departments.find(
                  (dep) => dep.name === item.category
                );
                return (
                  <View style={styles.ChartandTextContainer} key={index}>
                    <View style={styles.circularGaugeItem}>
                      <AnimatedCircularProgress
                        size={width * 0.25} 
                        width={10}
                        fill={(item.progress / trackingData.target) * 100}
                        tintColor={colors.darkGreen}
                        backgroundColor={colors.primaryBis}
                        lineCap="round"
                        rotation={0}
                      >
                        {(fill) => (
                          <Text style={styles.gaugeText}>
                            {`${Math.round(
                              (item.progress / trackingData.target) * 100
                            )}%`}
                          </Text>
                        )}
                      </AnimatedCircularProgress>
                      <Text style={styles.departmentName}>
                        {department ? department.display : item.category}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>No learnings yet...</Text>
            )}
          </View>
        </LinearGradient>
      </ScrollView>

      {/* FLOATING BUTTON */}
      <View style={styles.fixedButtonContainer}>
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
            borderRadius: sizes.buttonRadius,
            marginBottom: spacing.s,
          }}
        >
          Test Yourself
        </Button>
      </View>
    </View>
  );
};

export default TrackScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollView: {
    flex: 1,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: spacing.m,
  },
  infoContainer: {
    padding: spacing.s,
    marginVertical: spacing.m,
    backgroundColor: colors.darkblue,
    marginLeft: spacing.m,
    marginRight: spacing.m,
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
  greenSectionTitle: {
    fontSize: sizes.h2,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    color: colors.primary,
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
  ProgressContainer: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
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
  gaugeText: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
  },
  ChartTitleContainer: {
    backgroundColor: colors.primary,
    padding: spacing.s,
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
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
  noDataText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 150,
  },
  ChartandTextContainer: {
    marginTop: spacing.s,
    marginInlineStart: 2,
    marginRight: 2,
  },

  /* LOADING & ERROR STYLES */
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.primaryBis,
  },
  errorImage: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: spacing.m,
    resizeMode: 'contain',
  },
  errorText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'MontserratBold',
  },
  errorDetail: {
    fontSize: sizes.h4,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    marginTop: spacing.s,
    marginBottom: spacing.m,
  },
  refreshButton: {
    backgroundColor: colors.secondary,
    padding: spacing.m,
    borderRadius: sizes.radius,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
});