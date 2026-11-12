import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, contentWidth, labColors, shadow, spacing } from '@shared/config/theme';
import departmentsList from '@shared/data/departments';
import haptics from '@shared/utils/haptics';
import { useTabBarSpace } from '@navigation/FloatingTabBar';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import PressableScale from '@shared/components/PressableScale';
import SearchField from '@shared/components/SearchField';
import ResearchMap from '@features/lab/components/ResearchMap';
import departmentImages from '@features/lab/data/departmentImages';
import { buildLabNodes } from '@features/lab/utils/labMap';
import useLabOverview from '@features/lab/utils/useLabOverview';

const BUTTON_SIZE = 46;
const displayNames = Object.fromEntries(departmentsList.map((item) => [item.name, item.display]));

const RoundButton = ({ icon, label, onPress }) => (
  <PressableScale
    onPress={onPress}
    style={styles.roundButton}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Ionicons name={icon} size={22} color={colors.accent} />
  </PressableScale>
);

/** The labs as a map to explore. The size of a lab is the amount of research done in its field. */
const LabScreen = () => {
  const navigation = useNavigation();
  const tabBarSpace = useTabBarSpace();
  const mapRef = useRef(null);
  const openedRef = useRef(false);
  const { labs, error, loading, retry } = useLabOverview();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [isOverview, setIsOverview] = useState(true);

  const nodes = useMemo(
    () =>
      labs
        ? buildLabNodes(labs).map((node) => ({
            ...node,
            icon: departmentImages[node.key],
            display: displayNames[node.key] || node.short,
          }))
        : null,
    [labs]
  );

  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!nodes || !text) return null;
    return nodes
      .filter(
        (node) => node.short.toLowerCase().includes(text) || node.display.toLowerCase().includes(text)
      )
      .sort((a, b) => b.radius - a.radius);
  }, [nodes, query]);
  const highlight = useMemo(() => (matches ? new Set(matches.map((node) => node.key)) : null), [matches]);

  // Typing flies to the biggest match.
  useEffect(() => {
    if (!matches?.length) return undefined;
    const timer = setTimeout(() => mapRef.current?.flyTo(matches[0].key), 350);
    return () => clearTimeout(timer);
  }, [matches]);

  // Coming back from a lab, the camera returns to where it was before flying in.
  useFocusEffect(
    useCallback(() => {
      if (openedRef.current) {
        openedRef.current = false;
        mapRef.current?.restore();
      }
    }, [])
  );

  const handleOpen = useCallback(
    (node) => {
      haptics.tap();
      openedRef.current = true;
      navigation.navigate('VirtualLab', {
        labId: node.key,
        labDisplayName: node.display,
        works12m: node.works12m,
      });
    },
    [navigation]
  );

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
    mapRef.current?.fit();
  };

  if (error) {
    return (
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <ErrorState
          error={error}
          onRetry={retry}
          fallbackMessage="We couldn't load the virtual labs."
        />
      </View>
    );
  }

  if (loading || !nodes) {
    return <Loader backgroundColor={colors.background} style={{ paddingBottom: tabBarSpace }} />;
  }

  return (
    <View style={styles.container}>
      <ResearchMap
        ref={mapRef}
        nodes={nodes}
        highlight={highlight}
        frozen={searching}
        insetBottom={tabBarSpace}
        onOpen={handleOpen}
        onOverviewChange={setIsOverview}
      />

      <View style={styles.topBar} pointerEvents="box-none">
        {searching ? (
          <Animated.View entering={FadeIn.duration(160)} style={styles.searchRow}>
            <SearchField
              autoFocus
              placeholder="Search"
              value={query}
              onChangeText={setQuery}
              style={styles.searchField}
            />
            <RoundButton icon="close" label="Close search" onPress={closeSearch} />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(160)}>
            <RoundButton icon="search" label="Search labs" onPress={() => setSearching(true)} />
          </Animated.View>
        )}
      </View>

      {!isOverview && !searching ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={[styles.fit, { bottom: tabBarSpace + spacing.s }]}
        >
          <RoundButton icon="scan-outline" label="Show all labs" onPress={() => mapRef.current?.fit()} />
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: labColors.ground,
  },
  topBar: {
    ...contentWidth,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    alignItems: 'flex-end',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    width: '100%',
  },
  searchField: {
    flex: 1,
  },
  roundButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.light,
  },
  fit: {
    position: 'absolute',
    right: spacing.m,
  },
});

export default LabScreen;
