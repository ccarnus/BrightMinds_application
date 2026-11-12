import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDecay,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { labColors } from '@shared/config/theme';
import {
  COS_P,
  ZOOM_MAX,
  ZOOM_MIN,
  camLimits,
  clamp,
  getBounds,
  getStartPoint,
  hitLab,
  makeView,
  rubber,
  unproject,
} from '@features/lab/utils/labMap';
import MapGround from '@features/lab/components/MapGround';
import { IslandPad, LabBody, LabLabel } from '@features/lab/components/LabNode';

// Zoom of the first view (the camera glides in from the overview), when flying to a lab and when opening one.
const START_ZOOM = 1.65;
const FLY_ZOOM = 2.6;
const OPEN_ZOOM = 3.4;
const SETTLE = { damping: 24, stiffness: 190, mass: 1 };
const HAZE_HEIGHT = 0.18;

/**
 * The explorable map: drag in any direction (it glides on release and gives at the edges), pinch or
 * double tap to zoom, tap a lab to fly into it. `nodes` come from `buildLabNodes`, with an `icon`
 * and a `display` name added. `frozen` keeps the map from rescaling when its container resizes. The
 * imperative handle offers `flyTo(key)`, `fit()` and `restore()`.
 */
const ResearchMap = forwardRef(
  (
    { nodes, highlight, frozen = false, insetTop = 0, insetBottom = 0, onOpen, onOverviewChange, style },
    ref
  ) => {
    const [size, setSize] = useState(null);
    const camX = useSharedValue(0);
    const camY = useSharedValue(0);
    const zoom = useSharedValue(1);
    const pressed = useSharedValue(-1);
    const opening = useSharedValue(false);
    const saved = useSharedValue({ x: 0, y: 0, z: 1 });
    const grab = useSharedValue({ cx: 0, cy: 0, gx: 0, gy: 0 });
    const pinchGrab = useSharedValue({ z: 1, gx: 0, gy: 0 });
    const introduced = useRef(false);

    const bounds = useMemo(() => getBounds(nodes), [nodes]);
    const startPoint = useMemo(() => getStartPoint(nodes, bounds), [nodes, bounds]);
    const hitNodes = useMemo(
      () => nodes.map(({ x, y, radius }) => ({ x, y, radius })),
      [nodes]
    );
    const view = useMemo(
      () => (size ? makeView({ ...size, insetTop, insetBottom }, bounds) : null),
      [size, insetTop, insetBottom, bounds]
    );

    const animateTo = useCallback(
      (x, y, z, duration = 520, easing = Easing.inOut(Easing.cubic)) => {
        const config = { duration, easing };
        camX.value = withTiming(x, config);
        camY.value = withTiming(y, config);
        zoom.value = withTiming(z, config);
      },
      [camX, camY, zoom]
    );

    // First view: the whole world, then a glide in over the places with casts.
    useEffect(() => {
      if (!view || introduced.current) return;
      introduced.current = true;
      const limits = camLimits(view, START_ZOOM);
      camX.value = bounds.centerX;
      camY.value = bounds.centerY;
      zoom.value = ZOOM_MIN;
      const config = { duration: 1100, easing: Easing.out(Easing.cubic) };
      camX.value = withDelay(450, withTiming(clamp(startPoint.x, limits.minX, limits.maxX), config));
      camY.value = withDelay(450, withTiming(clamp(startPoint.y, limits.minY, limits.maxY), config));
      zoom.value = withDelay(450, withTiming(START_ZOOM, config));
    }, [view, bounds, startPoint, camX, camY, zoom]);

    useAnimatedReaction(
      () => zoom.value < 1.3,
      (isOverview, wasOverview) => {
        if (isOverview !== wasOverview && onOverviewChange) runOnJS(onOverviewChange)(isOverview);
      }
    );

    const finishOpen = useCallback((index) => onOpen?.(nodes[index]), [nodes, onOpen]);
    const cancelOpen = useCallback(() => {
      opening.value = false;
    }, [opening]);

    // Flies into the lab, then lets the screen open it.
    const openNode = useCallback(
      (index) => {
        const node = nodes[index];
        if (!node || !view || opening.value) return;
        opening.value = true;
        saved.value = { x: camX.value, y: camY.value, z: zoom.value };
        const z = Math.max(zoom.value, OPEN_ZOOM);
        const limits = camLimits(view, z);
        const config = { duration: 380, easing: Easing.in(Easing.cubic) };
        camX.value = withTiming(clamp(node.x, limits.minX, limits.maxX), config);
        camY.value = withTiming(clamp(node.y, limits.minY, limits.maxY), config);
        zoom.value = withTiming(z, config, (finished) => {
          if (finished) runOnJS(finishOpen)(index);
          else runOnJS(cancelOpen)();
        });
      },
      [nodes, view, opening, saved, camX, camY, zoom, finishOpen, cancelOpen]
    );

    useImperativeHandle(
      ref,
      () => ({
        flyTo: (key) => {
          const node = nodes.find((item) => item.key === key);
          if (!node || !view) return;
          const z = Math.max(zoom.value, FLY_ZOOM);
          const limits = camLimits(view, z);
          animateTo(
            clamp(node.x, limits.minX, limits.maxX),
            clamp(node.y, limits.minY, limits.maxY),
            z
          );
        },
        fit: () => animateTo(bounds.centerX, bounds.centerY, ZOOM_MIN),
        restore: () => {
          opening.value = false;
          const { x, y, z } = saved.value;
          animateTo(x, y, z, 460, Easing.out(Easing.cubic));
        },
      }),
      [nodes, view, bounds, opening, saved, zoom, animateTo]
    );

    const gesture = useMemo(() => {
      if (!view) return null;

      const pan = Gesture.Pan()
        .maxPointers(1)
        .minDistance(3)
        .onBegin((e) => {
          cancelAnimation(camX);
          cancelAnimation(camY);
          cancelAnimation(zoom);
          const g = unproject(view, camX.value, camY.value, zoom.value, e.x, e.y);
          grab.value = { cx: camX.value, cy: camY.value, gx: g.x, gy: g.y };
        })
        .onStart(() => {
          pressed.value = -1;
        })
        .onUpdate((e) => {
          // The point under the finger when it touched down stays under the finger.
          const g = grab.value;
          const now = unproject(view, g.cx, g.cy, zoom.value, e.x, e.y);
          const limits = camLimits(view, zoom.value);
          camX.value = rubber(g.cx + (g.gx - now.x), limits.minX, limits.maxX);
          camY.value = rubber(g.cy + (g.gy - now.y), limits.minY, limits.maxY);
        })
        .onEnd((e) => {
          const limits = camLimits(view, zoom.value);
          const scale = view.base * zoom.value;
          const outX = camX.value < limits.minX || camX.value > limits.maxX;
          const outY = camY.value < limits.minY || camY.value > limits.maxY;
          camX.value = outX
            ? withSpring(clamp(camX.value, limits.minX, limits.maxX), SETTLE)
            : withDecay({
                velocity: -e.velocityX / scale,
                clamp: [limits.minX, limits.maxX],
                deceleration: 0.995,
              });
          camY.value = outY
            ? withSpring(clamp(camY.value, limits.minY, limits.maxY), SETTLE)
            : withDecay({
                velocity: -e.velocityY / (scale * COS_P),
                clamp: [limits.minY, limits.maxY],
                deceleration: 0.995,
              });
        });

      const pinch = Gesture.Pinch()
        .onStart((e) => {
          cancelAnimation(camX);
          cancelAnimation(camY);
          cancelAnimation(zoom);
          pressed.value = -1;
          const g = unproject(view, camX.value, camY.value, zoom.value, e.focalX, e.focalY);
          pinchGrab.value = { z: zoom.value, gx: g.x, gy: g.y };
        })
        .onUpdate((e) => {
          // The point between the fingers stays between the fingers while zooming.
          const p = pinchGrab.value;
          const z = clamp(p.z * e.scale, ZOOM_MIN * 0.85, ZOOM_MAX * 1.15);
          const offset = unproject(view, 0, 0, z, e.focalX, e.focalY);
          const limits = camLimits(view, z);
          zoom.value = z;
          camX.value = rubber(p.gx - offset.x, limits.minX, limits.maxX);
          camY.value = rubber(p.gy - offset.y, limits.minY, limits.maxY);
        })
        .onEnd(() => {
          const z = clamp(zoom.value, ZOOM_MIN, ZOOM_MAX);
          const limits = camLimits(view, z);
          zoom.value = withSpring(z, SETTLE);
          camX.value = withSpring(clamp(camX.value, limits.minX, limits.maxX), SETTLE);
          camY.value = withSpring(clamp(camY.value, limits.minY, limits.maxY), SETTLE);
        });

      const tap = Gesture.Tap()
        .maxDistance(10)
        .onBegin((e) => {
          if (opening.value) return;
          pressed.value = hitLab(view, camX.value, camY.value, zoom.value, hitNodes, e.x, e.y);
        })
        .onFinalize(() => {
          pressed.value = -1;
        })
        .onEnd((e, success) => {
          if (!success || opening.value) return;
          const index = hitLab(view, camX.value, camY.value, zoom.value, hitNodes, e.x, e.y);
          if (index >= 0) runOnJS(openNode)(index);
        });

      // Double tap on the ground zooms in under the finger; again, back to the overview.
      const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDelay(260)
        .onEnd((e, success) => {
          if (!success || opening.value) return;
          const config = { duration: 380, easing: Easing.inOut(Easing.cubic) };
          if (zoom.value > ZOOM_MAX * 0.55) {
            camX.value = withTiming(view.bounds.centerX, config);
            camY.value = withTiming(view.bounds.centerY, config);
            zoom.value = withTiming(ZOOM_MIN, config);
            return;
          }
          const z = Math.min(ZOOM_MAX, zoom.value * 2.3);
          const target = unproject(view, camX.value, camY.value, zoom.value, e.x, e.y);
          const offset = unproject(view, 0, 0, z, e.x, e.y);
          const limits = camLimits(view, z);
          camX.value = withTiming(clamp(target.x - offset.x, limits.minX, limits.maxX), config);
          camY.value = withTiming(clamp(target.y - offset.y, limits.minY, limits.maxY), config);
          zoom.value = withTiming(z, config);
        });

      return Gesture.Simultaneous(pan, pinch, tap, doubleTap);
    }, [view, hitNodes, camX, camY, zoom, pressed, opening, grab, pinchGrab, openNode]);

    const onLayout = useCallback(
      ({ nativeEvent }) => {
        // While the keyboard is up (search) the map keeps its size instead of rescaling under the user.
        if (frozen) return;
        const { width, height } = nativeEvent.layout;
        setSize((current) =>
          current && current.width === width && current.height === height
            ? current
            : { width, height }
        );
      },
      [frozen]
    );

    return (
      <View style={[styles.root, style]} onLayout={onLayout}>
        {view && gesture ? (
          <GestureDetector gesture={gesture}>
            <View style={StyleSheet.absoluteFill} collapsable={false}>
              <MapGround view={view} camX={camX} camY={camY} zoom={zoom} />
              {nodes.map((node, index) => (
                <IslandPad
                  key={`island-${node.key}`}
                  node={node}
                  index={index}
                  view={view}
                  camX={camX}
                  camY={camY}
                  zoom={zoom}
                />
              ))}
              {nodes.map((node, index) => (
                <LabBody
                  key={node.key}
                  node={node}
                  index={index}
                  view={view}
                  camX={camX}
                  camY={camY}
                  zoom={zoom}
                  pressed={pressed}
                  dimmed={!!highlight && !highlight.has(node.key)}
                  onOpen={openNode}
                />
              ))}
              {nodes.map((node, index) => (
                <LabLabel
                  key={`label-${node.key}`}
                  node={node}
                  index={index}
                  view={view}
                  camX={camX}
                  camY={camY}
                  zoom={zoom}
                  dimmed={!!highlight && !highlight.has(node.key)}
                  emphasized={!!highlight && highlight.has(node.key)}
                />
              ))}
              <LinearGradient
                pointerEvents="none"
                colors={[labColors.haze, labColors.hazeClear]}
                style={[styles.haze, { height: view.height * HAZE_HEIGHT }]}
              />
            </View>
          </GestureDetector>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: labColors.ground,
  },
  haze: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

export default ResearchMap;
