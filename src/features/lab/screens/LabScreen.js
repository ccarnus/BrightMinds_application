import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, sizes, spacing, contentWidth } from '@shared/config/theme';
import departmentsList from '@shared/data/departments';
import { api } from '@shared/api/client';
import { useTabBarSpace } from '@navigation/FloatingTabBar';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import SearchField from '@shared/components/SearchField';
import departmentImages from '@features/lab/data/departmentImages';

const { width, height } = Dimensions.get('window');

const CANVAS_WIDTH = width * 2.4;
const CANVAS_HEIGHT = height * 2.2;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.6;

const BUBBLE_COLORS = [
  colors.lightTeal,
  colors.darkGreen,
  colors.lightblue,
  colors.lightOrange,
  colors.darkTeal,
  colors.lightGreen,
  colors.darkOrange,
];

// Proportional to the screen on phones, capped so bubbles stay reasonable on tablets.
const BUBBLE_SIZES = {
  large:  { circleSize: Math.min(width * 0.32, 140), iconSize: 52 },
  medium: { circleSize: Math.min(width * 0.26, 115), iconSize: 42 },
  small:  { circleSize: Math.min(width * 0.21, 95), iconSize: 34 },
};

const getColorForIndex = (i) => BUBBLE_COLORS[i % BUBBLE_COLORS.length];

const assignBubbleData = (labs) => {
  if (labs.length === 0) return [];

  const sorted = [...labs].sort((a, b) => b.count - a.count);
  const topCut = Math.ceil(sorted.length / 3);
  const midCut = Math.ceil((sorted.length * 2) / 3);
  const topThreshold = sorted[topCut - 1]?.count ?? 0;
  const midThreshold = sorted[midCut - 1]?.count ?? 0;

  return labs.map((lab, i) => {
    let sizeKey;
    if (lab.count >= topThreshold) sizeKey = 'large';
    else if (lab.count >= midThreshold) sizeKey = 'medium';
    else sizeKey = 'small';

    return { ...lab, sizeKey, ...BUBBLE_SIZES[sizeKey], color: getColorForIndex(i) };
  });
};

// Spiral placement: puts biggest bubbles near center, avoids overlaps
const generatePositions = (labs) => {
  if (labs.length === 0) return [];

  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const placed = [];
  const padding = 12;

  // Sort by size descending so big ones go center
  const indexed = labs.map((lab, i) => ({ ...lab, originalIndex: i }));
  const bySizeDesc = [...indexed].sort((a, b) => b.circleSize - a.circleSize);

  for (const lab of bySizeDesc) {
    const r = lab.circleSize / 2 + padding;
    let bestX = cx;
    let bestY = cy;
    let found = false;

    // Spiral outward from center
    for (let ring = 0; ring < 40 && !found; ring++) {
      const radius = ring * (lab.circleSize * 0.45);
      const steps = Math.max(1, Math.floor(ring * 6));
      for (let s = 0; s < steps && !found; s++) {
        const angle = (s / steps) * Math.PI * 2 + ring * 0.5;
        const tx = cx + Math.cos(angle) * radius;
        const ty = cy + Math.sin(angle) * radius;

        let overlaps = false;
        for (const p of placed) {
          const dist = Math.sqrt((tx - p.x) ** 2 + (ty - p.y) ** 2);
          if (dist < r + p.r) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) {
          bestX = tx;
          bestY = ty;
          found = true;
        }
      }
    }

    placed.push({ x: bestX, y: bestY, r, originalIndex: lab.originalIndex });
  }

  // Return in original order
  const result = new Array(labs.length);
  for (const p of placed) {
    result[p.originalIndex] = { x: p.x, y: p.y };
  }
  return result;
};

// ── Individual Bubble ──
const LabBubble = React.memo(({ lab, position, dimmed, onPress }) => {
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(lab.delay, withTiming(1, { duration: 500 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * (dimmed ? 0.2 : 1),
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.88);
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 8, stiffness: 150 });
  }, []);

  const totalHeight = lab.circleSize + 22;

  return (
    <Animated.View
      style={[
        styles.bubbleOuter,
        {
          left: position.x - lab.circleSize / 2,
          top: position.y - lab.circleSize / 2,
          width: lab.circleSize,
          height: totalHeight,
        },
        animStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(lab)}
        style={styles.bubbleTouchable}
        accessibilityRole="button"
        accessibilityLabel={`Open ${lab.display} lab`}
      >
        {/* Shadow layer (iOS only — Android elevation handled on clipped view) */}
        <View
          style={[
            styles.bubbleShadow,
            {
              width: lab.circleSize,
              height: lab.circleSize,
              borderRadius: lab.circleSize / 2,
              borderColor: lab.color,
            },
          ]}
        >
          {/* Clipped circle — overflow hidden ensures perfect circle on Android */}
          <View
            style={[
              styles.bubbleCircle,
              {
                width: lab.circleSize,
                height: lab.circleSize,
                borderRadius: lab.circleSize / 2,
                backgroundColor: lab.color + '22',
              },
            ]}
          >
            {departmentImages[lab.name] && (
              <Image
                source={departmentImages[lab.name]}
                style={{ width: lab.iconSize, height: lab.iconSize }}
                resizeMode="contain"
              />
            )}
          </View>
        </View>

        <Text style={styles.bubbleLabel} numberOfLines={2}>
          {lab.display}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Main Screen ──
const LabScreen = () => {
  const navigation = useNavigation();
  const [labs, setLabs] = useState([]);
  const [processedLabs, setProcessedLabs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [canvasSize, setCanvasSize] = useState(null);
  const hasCenteredRef = useRef(false);
  const tabBarSpace = useTabBarSpace();

  // Gesture shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1);

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchDepartments = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const { data } = await api.get('/cast/popular/department');
      if (!isMounted.current) return;
      const departments = (Array.isArray(data) ? data : [])
        .filter(dept => dept?._id)
        .map(dept => ({
          name: dept._id,
          display: departmentsList.find(d => d.name === dept._id)?.display || dept._id,
          count: dept.count,
        }));
      setLabs(departments);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      if (isMounted.current) setLoadError(error);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (labs.length > 0) {
      const processed = assignBubbleData(labs).map((lab, i) => ({
        ...lab,
        delay: i * 40,
      }));
      setProcessedLabs(processed);
      setPositions(generatePositions(processed));
    }
  }, [labs]);

  // Center the cluster once in the visible part of the canvas (measured, above the floating tab
  // bar), so it is centered on every screen size. Later resizes (keyboard) keep the user's view.
  useEffect(() => {
    if (hasCenteredRef.current || !canvasSize || positions.length === 0) return;
    hasCenteredRef.current = true;
    const visibleHeight = Math.max(canvasSize.height - tabBarSpace, canvasSize.height / 2);
    translateX.value = -(CANVAS_WIDTH / 2 - canvasSize.width / 2);
    translateY.value = -(CANVAS_HEIGHT / 2 - visibleHeight / 2);
    savedTranslateX.value = translateX.value;
    savedTranslateY.value = translateY.value;
  }, [positions, canvasSize, tabBarSpace]);

  // Search: determine which labs are dimmed
  const matchingNames = useMemo(() => {
    if (!searchQuery.trim()) return null; // null = show all
    const q = searchQuery.toLowerCase();
    return new Set(
      processedLabs
        .filter(lab => lab.display.toLowerCase().includes(q))
        .map(lab => lab.name)
    );
  }, [processedLabs, searchQuery]);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .minDistance(5);

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleBubblePress = useCallback((lab) => {
    navigation.navigate('VirtualLab', {
      labId: lab.name,
      labDisplayName: lab.display,
    });
  }, [navigation]);

  if (isLoading) {
    return <Loader backgroundColor={colors.background} style={{ paddingBottom: tabBarSpace }} />;
  }

  if (loadError) {
    return (
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <ErrorState
          error={loadError}
          onRetry={fetchDepartments}
          fallbackMessage="We couldn't load the virtual labs."
        />
      </View>
    );
  }

  if (labs.length === 0) {
    return (
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <StateMessage
          icon="flask-outline"
          title="No labs yet"
          message="Virtual labs will appear here as soon as casts are published."
          actionLabel="Refresh"
          onAction={fetchDepartments}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed search bar */}
      <View style={styles.searchContainer}>
        <SearchField placeholder="Search labs" onChangeText={setSearchQuery} value={searchQuery} />
      </View>

      {/* Pannable / zoomable canvas */}
      <View
        style={styles.canvasClip}
        onLayout={({ nativeEvent }) =>
          setCanvasSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
        }
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.canvas, canvasStyle]}>
            {processedLabs.map((lab, index) => {
              if (!positions[index]) return null;
              const dimmed = matchingNames !== null && !matchingNames.has(lab.name);
              return (
                <LabBubble
                  key={lab.name}
                  lab={lab}
                  position={positions[index]}
                  dimmed={dimmed}
                  onPress={handleBubblePress}
                />
              );
            })}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
    zIndex: 10,
  },
  canvasClip: {
    flex: 1,
    overflow: 'hidden',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  // Bubble styles
  bubbleOuter: {
    position: 'absolute',
    alignItems: 'center',
  },
  bubbleTouchable: {
    alignItems: 'center',
  },
  bubbleShadow: {
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        // No elevation here — avoids hexagon bug
      },
    }),
  },
  bubbleCircle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // On Android, use a subtle elevation on the inner clipped view
    ...Platform.select({
      ios: {},
      android: {
        elevation: 3,
      },
    }),
  },
  bubbleLabel: {
    fontFamily: fonts.regular,
    fontSize: sizes.small,
    textAlign: 'center',
    color: colors.text,
    marginTop: 3,
    width: '120%',
  },
});

export default LabScreen;
