import React, { useState, useCallback, useRef } from 'react';
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
import { colors, sizes, spacing } from '@shared/config/theme';
import { LinearGradient } from 'expo-linear-gradient';
import departments from '@shared/data/departments';
import { Button } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { api } from '@shared/api/client';
import { getUser, isGuestUser, clearUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import Loader from '@shared/components/Loader';

const { width } = Dimensions.get('window');
const Learning = require('@assets/Track_icons/learning.png');
const Progress = require('@assets/Track_icons/progress_illustration.png');
const serverError = require('@assets/Cast_screen_icons/server_error.png');

const toPercent = (ratio) => Math.min(Math.max(Number.isFinite(ratio) ? ratio : 0, 0), 1) * 100;

const TrackScreen = () => {
  const [trackingData, setTrackingData] = useState({ objective: '', progress: 0 });
  const [history, setHistory] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const hasLoadedRef = useRef(false);

  const fetchAllData = useCallback(async ({ isActive = () => true } = {}) => {
    try {
      const { userId } = await getUser();
      const guest = !userId || isGuestUser(userId);
      if (!isActive()) return;
      setIsGuest(guest);
      // Guests have no tracking data; the sign-in overlay is shown instead.
      if (guest) return;

      const [trackingResponse, userResponse] = await Promise.all([
        api.get(`/user/${userId}/tracking`),
        api.get(`/user/${userId}`),
      ]);
      if (!isActive()) return;

      const tracking = trackingResponse.data?.tracking;
      if (tracking) {
        setTrackingData({
          objective: tracking.objective,
          progress: tracking.target ? tracking.progress / tracking.target : 0,
        });
        setHistory(
          (tracking.history || []).map((hist) => ({
            category: hist.category,
            progress: hist.count,
          }))
        );
      }
      const evaluationList = userResponse.data?.evaluation_list || [];
      setAnsweredCount(evaluationList.filter((evaluation) => evaluation.answered).length);
      setApiError(false);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      // A failed background refresh keeps the data already on screen.
      if (isActive() && !hasLoadedRef.current) setApiError(true);
    } finally {
      if (isActive()) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refetch on focus so progress is up to date after finishing a quiz.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchAllData({ isActive: () => active });
      return () => {
        active = false;
      };
    }, [fetchAllData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  const retry = () => {
    setApiError(false);
    setIsLoading(true);
    fetchAllData();
  };

  const handleSignIn = async () => {
    await clearUser();
    resetToAuthChoice(navigation);
  };

  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <Image source={serverError} style={styles.errorImage} />
        <Text style={styles.errorText}>Whoops!</Text>
        <Text style={styles.errorDetail}>
          Please try refreshing or come back later!
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={retry} accessibilityRole="button">
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          isGuest ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

        {/* Progress Container */}
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
              fill={toPercent(trackingData.progress)}
              tintColor={colors.darkGreen}
              backgroundColor={colors.primaryBis}
              lineCap="round"
              rotation={0}
            >
              {() => (
                <Text style={styles.gaugeText}>
                  {`${Math.round(toPercent(trackingData.progress))}%`}
                </Text>
              )}
            </AnimatedCircularProgress>
          </View>
        </LinearGradient>

        {/* Chart Container */}
        <LinearGradient
          colors={[colors.lightOrange, colors.darkOrange]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ChartTitleContainer}
        >
          <View style={{ flexDirection: 'row' }}>
            <Image source={Progress} style={styles.infoImage2} />
            <Text style={styles.chartTitle}>What you are learning about</Text>
          </View>
          <View style={styles.circularGaugesContainer}>
            {history.length > 0 ? (
              history.map((item, index) => {
                const department = departments.find(
                  (dep) => dep.name === item.category
                );
                const percent = toPercent(item.progress / 10);
                return (
                  <View style={styles.ChartandTextContainer} key={item.category || index}>
                    <View style={styles.circularGaugeItem}>
                      <AnimatedCircularProgress
                        size={width * 0.25}
                        width={10}
                        fill={percent}
                        tintColor={colors.darkGreen}
                        backgroundColor={colors.primaryBis}
                        lineCap="round"
                        rotation={0}
                      >
                        {() => (
                          <Text style={styles.gaugeText}>{`${Math.round(percent)}%`}</Text>
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

      {/* Floating Button */}
      <View style={styles.fixedButtonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Ready')}
          buttonColor={colors.darkGreen}
          icon={require('@assets/Track_icons/test.png')}
          labelStyle={styles.buttonLabel}
          style={styles.button}
        >
          Test Yourself
        </Button>
      </View>

      {/* Guest Overlay */}
      {isGuest && (
        <BlurView intensity={80} style={StyleSheet.absoluteFill}>
          <View style={styles.overlayContainer}>
            <Text style={styles.overlayText}>Create an account to access all features.</Text>
            <Button
              mode="contained"
              onPress={handleSignIn}
              buttonColor={colors.darkGreen}
              icon={require('@assets/Track_icons/user.png')}
              labelStyle={styles.buttonLabel}
              style={styles.button}
            >
              Log in
            </Button>
          </View>
        </BlurView>
      )}
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
    fontSize: sizes.h3,
    textAlign: 'left',
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
    marginTop: spacing.xs,
    padding: 5,
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
    fontSize: sizes.h3,
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
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: spacing.l,
  },
  overlayText: {
    fontSize: sizes.h1,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  chartTitle: {
    textAlign: 'left',
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    flexShrink: 1,
    flexWrap: 'wrap',
    marginTop: spacing.s,
    marginLeft: spacing.s,
    marginRight: spacing.s,
  },
  button: {
    borderRadius: sizes.buttonRadius,
    marginBottom: spacing.s,
  },
  buttonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
});