import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Keyboard, BackHandler, Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CastScreen from '@features/cast/screens/CastScreen';
import TrackScreen from '@features/track/screens/TrackScreen';
import LabScreen from '@features/lab/screens/LabScreen';
import LibraryScreen from '@features/library/screens/LibraryScreen';
import { colors } from '@shared/config/theme';
import Icon from '@shared/components/Icon';

const Tab = createBottomTabNavigator();

const TAB_BAR_HEIGHT = 56;
const INDICATOR_WIDTH = 32;
const INDICATOR_HEIGHT = 3;

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
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        subscription.remove();
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

  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : 0;
  const totalBarHeight = TAB_BAR_HEIGHT + bottomPadding;

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Cast"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.primary,
            height: totalBarHeight,
            paddingBottom: bottomPadding,
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          },
          tabBarActiveTintColor: colors.darkblue,
          tabBarInactiveTintColor: colors.secondary,
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
                  size={26}
                  style={{ tintColor: focused ? colors.darkblue : colors.secondary }}
                />
              ),
            }}
            listeners={{
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

      {/* Animated indicator line at top of tab bar */}
      {!isKeyboardVisible && (
        <Animated.View
          style={[
            styles.indicator,
            {
              bottom: totalBarHeight - INDICATOR_HEIGHT,
              left: (width / tabs.length - INDICATOR_WIDTH) / 2,
              width: INDICATOR_WIDTH,
              transform: [{ translateX: offsetAnimation }],
            },
          ]}
        />
      )}
    </View>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  indicator: {
    position: 'absolute',
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: colors.darkblue,
  },
});
