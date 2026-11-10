import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import CastScreen from '@features/cast/screens/CastScreen';
import TrackScreen from '@features/track/screens/TrackScreen';
import LabScreen from '@features/lab/screens/LabScreen';
import LibraryScreen from '@features/library/screens/LibraryScreen';
import FloatingTabBar from '@navigation/FloatingTabBar';
import { colors } from '@shared/config/theme';
import { getUser, canAccessLibrary } from '@shared/utils/UserStorage';

const Tab = createBottomTabNavigator();

const renderTabBar = (props) => <FloatingTabBar {...props} />;

const BottomNavigation = () => {
  const [userRole, setUserRole] = useState('');

  // Re-read the role on focus so the Library tab appears/disappears after login or profile changes.
  useFocusEffect(
    useCallback(() => {
      getUser().then(({ userRole: role }) => setUserRole(role || ''));
    }, [])
  );

  const tabs = [
    { name: 'Cast', label: 'Cast feed', screen: CastScreen },
    { name: 'Track', label: 'Learning progress', screen: TrackScreen },
    { name: 'Lab', label: 'Virtual labs', screen: LabScreen },
    ...(canAccessLibrary(userRole)
      ? [{ name: 'Library', label: 'Your library', screen: LibraryScreen }]
      : []),
  ];

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Cast"
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          sceneStyle: styles.scene,
        }}
      >
        {tabs.map(({ name, label, screen }) => (
          <Tab.Screen
            key={name}
            name={name}
            component={screen}
            options={{ tabBarAccessibilityLabel: label }}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scene: {
    backgroundColor: colors.background,
  },
});
