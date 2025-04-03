import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Animated, Keyboard, BackHandler, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CastScreen from './CastScreen';
import TrackScreen from './TrackScreen';
import LabScreen from './LabScreen';
import LibraryScreen from './LibraryScreen';
import { colors } from './theme';
import Icon from '../assets/Bottom_icons/Icon';

const Tab = createBottomTabNavigator();

const useKeyboardVisibility = () => {
  const [visible, setVisible] = useState(false);
  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  return visible;
};

const BottomNavigation = () => {
  const [userRole, setUserRole] = useState('');
  const offsetAnimation = useRef(new Animated.Value(0)).current;
  const isKeyboardVisible = useKeyboardVisibility();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const indicatorWidth = 32;

  useFocusEffect(
    useCallback(() => {
      const fetchUserRole = async () => {
        try {
          const role = await AsyncStorage.getItem('userRole');
          setUserRole(role || '');
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      };

      fetchUserRole();

      const onBackPress = () => true;
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );

  const baseTabs = [
    { name: 'Cast', screen: CastScreen },
    { name: 'Track', screen: TrackScreen },
    { name: 'Lab', screen: LabScreen },
  ];

  const tabs = [...baseTabs];
  if (userRole === 'Professor' || userRole === 'Researcher' || userRole === 'PhD Student') {
    tabs.push({ name: 'Library', screen: LibraryScreen });
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Cast"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.primary,
            height: 55,
            paddingBottom: 5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            marginBottom: 5,
          },
          tabBarActiveTintColor: colors.darkblue,
          tabBarInactiveTintColor: colors.secondary,
          elevation: 5,
        }}
      >
        {tabs.map(({ name, screen }, index) => (
          <Tab.Screen
            key={name}
            name={name}
            component={screen}
            options={{
              tabBarHideOnKeyboard: true,
              tabBarIcon: ({ focused }) => (
                <Icon
                  icon={name}
                  size={28}
                  style={{ tintColor: focused ? colors.darkblue : colors.secondary }}
                />
              ),
            }}
            listeners={{
              // Animate the indicator when a tab is focused
              focus: () => {
                Animated.spring(offsetAnimation, {
                  toValue: index * (width / tabs.length),
                  useNativeDriver: true,
                }).start();
              },
            }}
          />
        ))}
      </Tab.Navigator>

      {/* Animated Indicator (hidden when keyboard is visible) */}
      {!isKeyboardVisible && (
        <Animated.View
          style={[
            styles.indicator,
            {
              left: (width / tabs.length) / 2 - indicatorWidth / 2,
              width: indicatorWidth,
              bottom: insets.bottom + 2, // Adjust indicator to be closer to the icon
              transform: [{ translateX: offsetAnimation }],
            },
          ]}
        />
      )}
    </SafeAreaView>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    height: 3,
    backgroundColor: colors.darkblue,
  },
});
