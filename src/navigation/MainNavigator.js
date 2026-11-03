import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from '@navigation/BottomNavigation';
import PostCast from '@features/post-content/screens/PostCast';
import PostArticle from '@features/post-content/screens/PostArticle';
import CastTypeChoice from '@features/post-content/screens/CastTypeChoice';
import Ready from '@features/track/screens/Ready';
import Evaluation from '@features/track/screens/Evaluation';
import Banner from '@shared/components/Banner';
import ProfileScreen from '@features/profile/screens/ProfileScreen';
import SimpleHeader from '@features/profile/components/SimpleHeader';
import Objective from '@features/profile/components/Objective';
import Finish from '@features/track/screens/Finish';
import VirtualLab from '@features/lab/screens/VirtualLab';
import ArticleDetailsScreen from '@features/cast/screens/ArticleDetailsScreen';
import LoginScreen from '@features/auth/screens/LoginScreen';
import SignupScreen from '@features/auth/screens/SignupScreen';
import PreferencesScreen from '@features/profile/screens/PreferencesScreen';
import CastPublicationsScreen from '@features/track/screens/CastPublicationsScreen';
import ArticlePublicationsScreen from '@features/track/screens/ArticlePublicationsScreen';
import EditProfileScreen from '@features/profile/screens/EditProfileScreen';
import ForgotPasswordScreen from '@features/auth/screens/ForgotPasswordScreen';
import DiscoverScreen from '@features/cast/screens/DiscoverScreen';
import LoadingScreen from '@features/onboarding/screens/LoadingScreen';
import OnboardingScreen from '@features/onboarding/screens/OnboardingScreen';
import AuthChoiceScreen from '@features/onboarding/screens/AuthChoiceScreen';
import VideoScreen from '@features/cast/screens/VideoScreen';
import VirtualLabVideoScreen from '@features/lab/screens/VirtualLabVideoScreen';
import DiscoverVideoScreen from '@features/cast/screens/DiscoverVideoScreen';
import WelcomeScreen from '@features/onboarding/screens/WelcomeScreen';
import TopicDetailScreen from '@features/lab/screens/TopicDetailScreen';
import OpenAlexDetailsScreen from '@features/cast/screens/OpenAlexDetailsScreen';
import SearchTopicResult from '@features/cast/screens/SearchTopicResult';
import CastListScreen from '@features/lab/screens/CastListScreen';
import WorksListScreen from '@features/lab/screens/WorksListScreen';
import { getUser } from '@shared/utils/UserStorage';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { userId } = await getUser();
        const onboarded = await AsyncStorage.getItem('hasOnboarded');
        setIsLoggedIn(!!userId);
        setHasOnboarded(!!onboarded);
      } catch (error) {
        console.log('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          hasOnboarded
            ? isLoggedIn
              ? "BottomNav"
              : "AuthChoice"
            : "Onboarding"
        }
        screenOptions={{
          header: () => <Banner />,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BottomNav" component={BottomNavigation} options={{ headerShown: true, tabBarVisible: true }} />
        <Stack.Screen name="Evaluation" component={Evaluation} options={{ headerShown: true, tabBarVisible: true }}
          listeners={({ navigation }) => ({
            beforeRemove: (e) => {
              e.preventDefault();
              navigation.navigate('Track');
            },
          })}/>
        <Stack.Screen name="Ready" component={Ready} options={{ headerShown: false, tabBarVisible: true }} />
        <Stack.Screen name="Finish" component={Finish} options={{ headerShown: false, tabBarVisible: true }} 
          listeners={({ navigation }) => ({
            beforeRemove: (e) => {
              e.preventDefault();
              navigation.navigate('Track');
            },
          })}/>
        <Stack.Screen name="CastTypeChoice" component={CastTypeChoice} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="PostCast" component={PostCast} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="PostArticle" component={PostArticle} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="LoadingScreen" component={LoadingScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="CastPublicationsScreen" component={CastPublicationsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ArticlePublicationsScreen" component={ArticlePublicationsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="VideoScreen" component={VideoScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="DiscoverVideoScreen" component={DiscoverVideoScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="VirtualLabVideoScreen" component={VirtualLabVideoScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="WorksListScreen" component={WorksListScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="Objective" component={Objective} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="CastListScreen" component={CastListScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="VirtualLab" component={VirtualLab} options={{ headerShown: false, tabBarVisible: false }}  
          listeners={({ navigation }) => ({
            beforeRemove: (e) => {
              e.preventDefault();
              navigation.navigate('Lab');
            },
          })}/>
        <Stack.Screen name="ArticleDetails" component={ArticleDetailsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="OpenAlexDetailsScreen" component={OpenAlexDetailsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="TopicDetailScreen" component={TopicDetailScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="SearchTopicResult" component={SearchTopicResult} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="PreferencesScreen" component={PreferencesScreen} options={{ headerShown: false, tabBarVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
