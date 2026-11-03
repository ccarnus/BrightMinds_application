import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import BottomNavigation from '@navigation/BottomNavigation';
import Banner from '@shared/components/Banner';
import { getUser, hasCompletedOnboarding } from '@shared/utils/UserStorage';
import OnboardingScreen from '@features/onboarding/screens/OnboardingScreen';
import AuthChoiceScreen from '@features/onboarding/screens/AuthChoiceScreen';
import WelcomeScreen from '@features/onboarding/screens/WelcomeScreen';
import LoginScreen from '@features/auth/screens/LoginScreen';
import SignupScreen from '@features/auth/screens/SignupScreen';
import ForgotPasswordScreen from '@features/auth/screens/ForgotPasswordScreen';
import ProfileScreen from '@features/profile/screens/ProfileScreen';
import EditProfileScreen from '@features/profile/screens/EditProfileScreen';
import PreferencesScreen from '@features/profile/screens/PreferencesScreen';
import Objective from '@features/profile/components/Objective';
import Ready from '@features/track/screens/Ready';
import Evaluation from '@features/track/screens/Evaluation';
import Finish from '@features/track/screens/Finish';
import CastPublicationsScreen from '@features/track/screens/CastPublicationsScreen';
import ArticlePublicationsScreen from '@features/track/screens/ArticlePublicationsScreen';
import CastTypeChoice from '@features/post-content/screens/CastTypeChoice';
import PostCast from '@features/post-content/screens/PostCast';
import PostArticle from '@features/post-content/screens/PostArticle';
import VideoScreen from '@features/cast/screens/VideoScreen';
import DiscoverScreen from '@features/cast/screens/DiscoverScreen';
import DiscoverVideoScreen from '@features/cast/screens/DiscoverVideoScreen';
import ArticleDetailsScreen from '@features/cast/screens/ArticleDetailsScreen';
import OpenAlexDetailsScreen from '@features/cast/screens/OpenAlexDetailsScreen';
import SearchTopicResult from '@features/cast/screens/SearchTopicResult';
import VirtualLab from '@features/lab/screens/VirtualLab';
import VirtualLabVideoScreen from '@features/lab/screens/VirtualLabVideoScreen';
import TopicDetailScreen from '@features/lab/screens/TopicDetailScreen';
import CastListScreen from '@features/lab/screens/CastListScreen';
import WorksListScreen from '@features/lab/screens/WorksListScreen';

const Stack = createStackNavigator();

const withBanner = { headerShown: true, header: () => <Banner /> };
const fullScreenVideo = { gestureEnabled: false };

// Back gestures/buttons on these screens return to a tab instead of the previous screen
// (e.g. leaving a quiz should not land back on the "Ready" screen).
const BACK_ACTIONS = ['GO_BACK', 'POP'];
const redirectBackToTab = (tab) => ({ navigation }) => ({
  beforeRemove: (e) => {
    if (!BACK_ACTIONS.includes(e.data.action.type)) return;
    e.preventDefault();
    navigation.navigate('BottomNav', { screen: tab });
  },
});

const getInitialRoute = async () => {
  const [{ userId }, onboarded] = await Promise.all([getUser(), hasCompletedOnboarding()]);
  if (!onboarded) return 'Onboarding';
  return userId ? 'BottomNav' : 'AuthChoice';
};

const MainNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    getInitialRoute()
      .catch(() => 'Onboarding')
      .then(setInitialRoute);
  }, []);

  useEffect(() => {
    if (initialRoute) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [initialRoute]);

  // The native splash screen stays visible until the initial route is known.
  if (!initialRoute) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        {/* Onboarding & authentication */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="PreferencesScreen" component={PreferencesScreen} />
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />

        {/* Main tabs */}
        <Stack.Screen name="BottomNav" component={BottomNavigation} options={withBanner} />

        {/* Cast */}
        <Stack.Screen name="VideoScreen" component={VideoScreen} options={fullScreenVideo} />
        <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} />
        <Stack.Screen name="DiscoverVideoScreen" component={DiscoverVideoScreen} options={fullScreenVideo} />
        <Stack.Screen name="ArticleDetails" component={ArticleDetailsScreen} />
        <Stack.Screen name="OpenAlexDetailsScreen" component={OpenAlexDetailsScreen} />
        <Stack.Screen name="SearchTopicResult" component={SearchTopicResult} />

        {/* Track */}
        <Stack.Screen name="Ready" component={Ready} />
        <Stack.Screen name="Evaluation" component={Evaluation} options={withBanner} listeners={redirectBackToTab('Track')} />
        <Stack.Screen name="Finish" component={Finish} listeners={redirectBackToTab('Track')} />

        {/* Lab */}
        <Stack.Screen name="VirtualLab" component={VirtualLab} listeners={redirectBackToTab('Lab')} />
        <Stack.Screen name="VirtualLabVideoScreen" component={VirtualLabVideoScreen} options={fullScreenVideo} />
        <Stack.Screen name="TopicDetailScreen" component={TopicDetailScreen} />
        <Stack.Screen name="CastListScreen" component={CastListScreen} />
        <Stack.Screen name="WorksListScreen" component={WorksListScreen} />

        {/* Library & content creation */}
        <Stack.Screen name="CastPublicationsScreen" component={CastPublicationsScreen} />
        <Stack.Screen name="ArticlePublicationsScreen" component={ArticlePublicationsScreen} />
        <Stack.Screen name="CastTypeChoice" component={CastTypeChoice} />
        <Stack.Screen name="PostCast" component={PostCast} />
        <Stack.Screen name="PostArticle" component={PostArticle} />

        {/* Profile */}
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="Objective" component={Objective} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
