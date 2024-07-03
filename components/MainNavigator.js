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
import LeaderBoard from './LeaderBoardScreen';
import Objective from './Profile/Objective';
import Finish from './Track/finish';
import VirtualLab from './VirtualLab/VirtualLab';
import ArticleDetailsScreen from './Cast/ArticleDetailsScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import PreferencesScreen from './PreferencesScreen';
import CategoryScreen from './VirtualLab/CategoryScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userId = await AsyncStorage.getItem('userId');     
      setIsLoggedIn(!!userId);
    };
    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    // Optionally, return a splash screen or loading component here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? "BottomNav" : "LoginScreen"}
        screenOptions={{
          header: () => <Banner />,
        }}
      >
        <Stack.Screen name="BottomNav" component={BottomNavigation} options={{ headerShown: true, tabBarVisible: true }} />
        <Stack.Screen name="Evaluation" component={Evaluation} options={{ headerShown: true, tabBarVisible: true }} />
        <Stack.Screen name="Ready" component={Ready} options={{ headerShown: false, tabBarVisible: true }} />
        <Stack.Screen name="Finish" component={Finish} options={{ headerShown: false, tabBarVisible: true }} />
        <Stack.Screen name="CastTypeChoice" component={CastTypeChoice} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="PostCast" component={PostCast} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="PostArticle" component={PostArticle} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="SuggestedForYou" component={SuggestedForYou} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="Trending" component={Trending} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="SearchResult" component={SearchResult} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="CategoryScreen" component={CategoryScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="LeaderBoard" component={LeaderBoard} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="Objective" component={Objective} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="VirtualLab" component={VirtualLab} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="ArticleDetails" component={ArticleDetailsScreen} options={{ headerShown: false, tabBarVisible: false }} />
        <Stack.Screen name="PreferencesScreen" component={PreferencesScreen} options={{ headerShown: false, tabBarVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
