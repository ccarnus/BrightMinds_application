import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Animated, Keyboard, BackHandler } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Screens
import CastScreen from './CastScreen';
import TrackScreen from './TrackScreen';
import LabScreen from './LabScreen';
import LibraryScreen from './LibraryScreen';
// Theme & Icons
import { colors, sizes } from './theme';
import Icon from '../assets/Bottom_icons/Icon';

const Tab = createBottomTabNavigator();

// This hook checks if the keyboard is visible, so we can hide the indicator
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

  /**
   * useFocusEffect re-runs every time this navigator/screen becomes focused.
   * We fetch userRole from AsyncStorage here so it updates when the user logs out
   * and logs back in with a different role.
   */
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

      // Prevent hardware Back button from exiting the app on Android
      const onBackPress = () => true;

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );

  // Base tabs (always visible)
  const baseTabs = [
    { name: 'Cast', screen: CastScreen },
    { name: 'Track', screen: TrackScreen },
    { name: 'Lab', screen: LabScreen },
  ];

  // Conditionally add the Library tab
  const tabs = [...baseTabs];
  if (
    userRole === 'Professor' ||
    userRole === 'Researcher' ||
    userRole === 'PhD Student'
  ) {
    tabs.push({ name: 'Library', screen: LibraryScreen });
  }

  return (
    <>
      <Tab.Navigator
        initialRouteName="Cast"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.primary,
            height: 55,
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
                  style={{
                    tintColor: focused ? colors.darkblue : colors.secondary,
                  }}
                />
              ),
            }}
            listeners={{
              focus: () => {
                // Move the animated indicator to the current tab index
                Animated.spring(offsetAnimation, {
                  toValue: index * (sizes.width / tabs.length),
                  useNativeDriver: true,
                }).start();
              },
            }}
          />
        ))}
      </Tab.Navigator>

      {/* Animated Indicator (hidden if keyboard is visible) */}
      {!isKeyboardVisible && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: 32,
              transform: [
                {
                  translateX: offsetAnimation,
                },
              ],
            },
          ]}
        />
      )}
    </>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    height: 3,
    // Adjust this left calculation so the indicator aligns with your tabs
    left: sizes.width / 4 / 2 - 15,
    bottom: 47,
    backgroundColor: colors.darkblue,
    zIndex: 100,
  },
});
