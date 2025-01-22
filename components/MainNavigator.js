import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from './BottomNavigation';
import PostCast from './PostContent/PostCast';
import PostArticle from './PostContent/PostArticle';
import CastTypeChoice from './PostContent/CastTypeChoice';
import Ready from './Track/ready';
import Evaluation from './Track/evaluation';
import Banner from './Banner';
import ProfileScreen from './ProfileScreen';
import SuggestedForYou from './Cast/SuggestedForYouScreen';
import Trending from './Cast/TrendingScreen';
import SearchResult from './Cast/SearchResultScreen';
import SimpleHeader from './Profile/SimpleHeader';
import Objective from './Profile/Objective';
import Finish from './Track/finish';
import VirtualLab from './VirtualLab/VirtualLab';
import ArticleDetailsScreen from './Cast/ArticleDetailsScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import PreferencesScreen from './PreferencesScreen';
import VirtualLabVideoScreen from './VirtualLab/VirtualLabVideoScreen';
import CastPublicationsScreen from './Track/CastPublicationsScreen';
import ArticlePublicationsScreen from './Track/ArticlePublicationsScreen';
import EditProfileScreen from './Profile/EditProfileScreen';
import ForgotPasswordScreen from './Profile/ForgotPasswordScreen';
import DiscoverScreen from './Cast/DiscoverScreen';
import LoadingScreen from './Onboarding/LoadingScreen';
import OnboardingScreen from './Onboarding/OnboardingScreen';
import AuthChoiceScreen from './Onboarding/AuthChoiceScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        //const onboarded = await AsyncStorage.getItem('hasOnboarded');
        const onboarded = false;
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
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AuthChoice"
          component={AuthChoiceScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignupScreen"
          component={SignupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BottomNav"
          component={BottomNavigation}
          options={{ headerShown: true, tabBarVisible: true }}
        />
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
        <Stack.Screen name="CastPublicationsScreen" component={CastPublicationsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ArticlePublicationsScreen" component={ArticlePublicationsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="SuggestedForYou" component={SuggestedForYou} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="Trending" component={Trending} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="SearchResult" component={SearchResult} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="VirtualLabVideoScreen" component={VirtualLabVideoScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="Objective" component={Objective} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="VirtualLab" component={VirtualLab} options={{ headerShown: false, tabBarVisible: false }}  
          listeners={({ navigation }) => ({
            beforeRemove: (e) => {
              e.preventDefault();
              navigation.navigate('Lab');
            },
          })}/>
        <Stack.Screen name="ArticleDetails" component={ArticleDetailsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="PreferencesScreen" component={PreferencesScreen} options={{ headerShown: false, tabBarVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
