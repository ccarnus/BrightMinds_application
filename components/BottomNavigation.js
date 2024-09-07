import React, { useState, useEffect } from 'react';
import {StyleSheet, Animated, Keyboard, BackHandler } from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import CastScreen from './CastScreen';
import TrackScreen from './TrackScreen';
import DiscoverScreen from './DiscoverScreen';
import LabScreen from './LabScreen';
import {colors, sizes} from './theme';
import Icon from '../assets/Bottom_icons/Icon';

const tabs = [
  {
    name: 'Cast',
    screen: CastScreen,
  },
  {
    name: 'Track',
    screen: TrackScreen,
  },
  {
    name: 'Discover',
    screen: DiscoverScreen,
  },
  {
    name: 'Lab',
    screen: LabScreen,
  },
];

const Tab = createBottomTabNavigator();

const useKeyboardVisibility = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return visible;
};

const BottomNavigation = () => {
  const offsetAnimation = React.useRef(new Animated.Value(0)).current;
  const isKeyboardVisible = useKeyboardVisibility();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent going back from any bottom tab screen
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );
  
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
            marginBottom:5,
          },
          tabBarActiveTintColor: colors.darkblue,
          tabBarInactiveTintColor: colors.secondary,
          elevation: 5,
        }}>
        {tabs.map(({name, screen}, index) => {
          return (
            <Tab.Screen
              key={name}
              name={name}
              component={screen}
              options={{ 
                tabBarHideOnKeyboard: true,
                tabBarIcon: ({focused}) => {
                  return (
                    <Icon
                      icon={name}
                      size={28}
                      style={{
                        tintColor: focused ? colors.darkblue : colors.secondary,
                      }}
                    />
                  );
                },
              }}
              listeners={{
                focus: () => {
                  Animated.spring(offsetAnimation, {
                    toValue: index * (sizes.width / tabs.length),
                    useNativeDriver: true,
                  }).start();
                },
              }}
            />
          );
        })}
      </Tab.Navigator>
      {!isKeyboardVisible && ( // Only render the indicator if the keyboard is not visible
        <Animated.View
          style={[
            styles.indicator,
            {
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

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    width: 32,
    height: 3,
    left: sizes.width / tabs.length / 2 - 15,
    bottom: 47,
    backgroundColor: colors.darkblue,
    zIndex: 100,
  },
});

export default BottomNavigation;