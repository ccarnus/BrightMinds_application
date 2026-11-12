// Geometry of the lab map: a flat world seen from a tilted camera with perspective. Every function
// that runs while the user moves the map is a worklet (it runs on the UI thread, at screen rate).
import LABS from '@features/lab/data/labMeta';

// Camera tilt (radians from looking straight down) and zoom limits. zoom 1 shows the whole world.
export const PITCH = 0.72;
export const SIN_P = Math.sin(PITCH);
export const COS_P = Math.cos(PITCH);
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4.5;

// Size of a lab on the map, in map units, from the research level (0-100) the API gives.
export const R_MIN = 0.2;
export const R_MAX = 0.46;
// An island is a little wider than the lab standing on it.
export const ISLAND_MARGIN = 0.3;
const OVERLAP_GAP = 0.12;
const WORLD_MARGIN = 0.9;
// Beyond the content, the camera may drift this far (map units).
const PAN_SLACK = 0.3;

export const radiusForLevel = (level) => {
  const t = typeof level === 'number' ? Math.min(Math.max(level, 0), 100) / 100 : 0.5;
  return R_MIN + (R_MAX - R_MIN) * t;
};

/** Pushes overlapping labs apart (keeping each one near its home) so no two discs touch. */
const relax = (nodes) => {
  const placed = nodes.map((node) => ({ ...node }));
  for (let pass = 0; pass < 120; pass += 1) {
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const gap = a.radius + b.radius + OVERLAP_GAP - dist;
        if (gap > 0) {
          const ux = dx / dist;
          const uy = dy / dist;
          a.x -= (ux * gap) / 2;
          a.y -= (uy * gap) / 2;
          b.x += (ux * gap) / 2;
          b.y += (uy * gap) / 2;
        }
      }
    }
    for (const node of placed) {
      node.x += (node.homeX - node.x) * 0.04;
      node.y += (node.homeY - node.y) * 0.04;
    }
  }
  return placed;
};

/**
 * The labs to draw, from the API overview ([{ name, level, works12m, casts, topics }]).
 * A lab with no research value yet gets the middle size.
 */
export const buildLabNodes = (overviewLabs = []) => {
  const byName = new Map(overviewLabs.map((lab) => [lab.name, lab]));
  const nodes = LABS.map((meta) => {
    const data = byName.get(meta.name) || {};
    const radius = radiusForLevel(data.level);
    return {
      key: meta.name,
      short: meta.short,
      region: meta.region,
      x: meta.x,
      y: meta.y,
      homeX: meta.x,
      homeY: meta.y,
      radius,
      island: radius + ISLAND_MARGIN,
      level: data.level ?? null,
      works12m: data.works12m ?? null,
      casts: data.casts || 0,
      topics: data.topics || 0,
    };
  });
  // Nearer labs (larger y) are drawn last, so they cover the ones behind them.
  return relax(nodes).sort((a, b) => a.y - b.y);
};

/** The box around the islands, with a margin, and its center. */
export const getBounds = (nodes) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.island);
    maxX = Math.max(maxX, node.x + node.island);
    minY = Math.min(minY, node.y - node.island);
    maxY = Math.max(maxY, node.y + node.island);
  }
  minX -= WORLD_MARGIN;
  maxX += WORLD_MARGIN;
  minY -= WORLD_MARGIN;
  maxY += WORLD_MARGIN;
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

/**
 * Where the camera starts: over the labs that have casts (the places with something to watch),
 * or the middle of the world when none has.
 */
export const getStartPoint = (nodes, bounds) => {
  const withCasts = nodes.filter((node) => node.casts > 0);
  if (!withCasts.length) return { x: bounds.centerX, y: bounds.centerY };
  const total = withCasts.reduce((sum, node) => sum + node.casts, 0);
  return {
    x: withCasts.reduce((sum, node) => sum + node.x * node.casts, 0) / total,
    y: withCasts.reduce((sum, node) => sum + node.y * node.casts, 0) / total,
  };
};

/**
 * Everything the projection needs about the screen: the focus point (middle of the visible area,
 * above the tab bar), the pixels per map unit at zoom 1 (so the whole world fits) and the camera
 * distance that sets how strong the perspective is.
 */
export const makeView = ({ width, height, insetTop = 0, insetBottom = 0 }, bounds) => {
  const availableHeight = Math.max(height - insetTop - insetBottom, 1);
  const depth = 1.6 * Math.max(width, height);
  // The near edge of the world is drawn larger than the center: leave room for it.
  const v = availableHeight / 2;
  const nearDepth = (v * depth) / (depth * COS_P + v * SIN_P);
  const nearScale = depth / (depth - nearDepth * SIN_P);
  return {
    width,
    height,
    availableHeight,
    cx: width / 2,
    cy: insetTop + availableHeight / 2,
    depth,
    base: Math.min(
      (width * 0.94) / (bounds.width * nearScale),
      (availableHeight * 0.94) / (bounds.height * COS_P)
    ),
    bounds,
  };
};

export const clamp = (value, low, high) => {
  'worklet';
  return Math.min(Math.max(value, low), high);
};

/** Past the limits the map follows the finger at a fraction of the distance, then springs back. */
export const rubber = (value, low, high) => {
  'worklet';
  if (value < low) return low - (low - value) * 0.3;
  if (value > high) return high + (value - high) * 0.3;
  return value;
};

/** Map point -> screen point. `f` is the perspective scale at that point (nearer is larger). */
export const project = (view, camX, camY, zoom, wx, wy) => {
  'worklet';
  const scale = view.base * zoom;
  const dx = (wx - camX) * scale;
  const dy = (wy - camY) * scale;
  const denominator = view.depth - dy * SIN_P;
  const behind = denominator < view.depth * 0.15;
  const f = view.depth / (behind ? view.depth * 0.15 : denominator);
  return { x: view.cx + dx * f, y: view.cy + dy * COS_P * f, f, scale, behind };
};

/** Screen point -> map point: the exact inverse of `project` (used to grab and zoom the map). */
export const unproject = (view, camX, camY, zoom, sx, sy) => {
  'worklet';
  const scale = view.base * zoom;
  const v = sy - view.cy;
  const dy = (v * view.depth) / (view.depth * COS_P + v * SIN_P);
  const f = view.depth / (view.depth - dy * SIN_P);
  return { x: camX + (sx - view.cx) / f / scale, y: camY + dy / scale };
};

/**
 * How far the camera may move. At zoom 1 the whole world is in view, so it can hardly move; from
 * about 1.6x it can reach every lab, whichever way the user drags.
 */
export const camLimits = (view, zoom) => {
  'worklet';
  const scale = view.base * zoom;
  const b = view.bounds;
  const fitX = Math.max(0, b.width / 2 - view.width / 2 / scale) + PAN_SLACK;
  const fitY = Math.max(0, b.height / 2 - view.availableHeight / 2 / (scale * COS_P)) + PAN_SLACK;
  const t = Math.min(Math.max((zoom - 1) / 0.6, 0), 1);
  const rangeX = fitX + (Math.max(fitX, b.width / 2 - WORLD_MARGIN) - fitX) * t;
  const rangeY = fitY + (Math.max(fitY, b.height / 2 - WORLD_MARGIN) - fitY) * t;
  return {
    minX: b.centerX - rangeX,
    maxX: b.centerX + rangeX,
    minY: b.centerY - rangeY,
    maxY: b.centerY + rangeY,
  };
};

/** The lab under a screen point (index in `nodes`), or -1. Small labs still get a finger-sized target. */
export const hitLab = (view, camX, camY, zoom, nodes, x, y) => {
  'worklet';
  let best = -1;
  let bestDistance = 1;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const p = project(view, camX, camY, zoom, node.x, node.y);
    if (!p.behind) {
      const radius = node.radius * p.scale * p.f;
      // The disc stands above its ground point, with its icon on top.
      const nx = (x - p.x) / Math.max(radius * 1.05, 24);
      const ny = (y - (p.y - radius * 0.3)) / Math.max(radius * 1.25, 24);
      const distance = nx * nx + ny * ny;
      if (distance <= bestDistance) {
        best = i;
        bestDistance = distance;
      }
    }
  }
  return best;
};

/** SVG path of the ground grid (map units), clipped to what the screen can see. */
export const gridPath = (view, camX, camY, zoom) => {
  'worklet';
  const margin = 60;
  const topLeft = unproject(view, camX, camY, zoom, -margin, -margin);
  const topRight = unproject(view, camX, camY, zoom, view.width + margin, -margin);
  const bottomLeft = unproject(view, camX, camY, zoom, -margin, view.height + margin);
  const bottomRight = unproject(view, camX, camY, zoom, view.width + margin, view.height + margin);
  const x0 = Math.min(topLeft.x, bottomLeft.x);
  const x1 = Math.max(topRight.x, bottomRight.x);
  const y0 = Math.min(topLeft.y, topRight.y);
  const y1 = Math.max(bottomLeft.y, bottomRight.y);

  let step = 1;
  while ((x1 - x0) / step > 22 || (y1 - y0) / step > 22) step *= 2;

  let path = '';
  for (let gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step) {
    const a = project(view, camX, camY, zoom, gx, y0);
    const b = project(view, camX, camY, zoom, gx, y1);
    path += `M${Math.round(a.x)} ${Math.round(a.y)}L${Math.round(b.x)} ${Math.round(b.y)}`;
  }
  for (let gy = Math.ceil(y0 / step) * step; gy <= y1; gy += step) {
    const a = project(view, camX, camY, zoom, x0, gy);
    const b = project(view, camX, camY, zoom, x1, gy);
    path += `M${Math.round(a.x)} ${Math.round(a.y)}L${Math.round(b.x)} ${Math.round(b.y)}`;
  }
  return path || 'M0 0';
};
