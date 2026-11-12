import LABS from '@features/lab/data/labMeta';
import {
  buildLabNodes,
  camLimits,
  getBounds,
  getStartPoint,
  gridPath,
  hitLab,
  makeView,
  project,
  radiusForLevel,
  R_MAX,
  R_MIN,
  unproject,
} from '../labMap';

const overviewOf = (levels) =>
  LABS.map((lab, index) => ({
    name: lab.name,
    level: levels(index, lab),
    works12m: 1000,
    casts: 0,
    topics: 0,
  }));

const makeTestView = (overrides = {}) => {
  const nodes = buildLabNodes(overviewOf(() => 50));
  const bounds = getBounds(nodes);
  return {
    nodes,
    bounds,
    view: makeView({ width: 390, height: 640, insetBottom: 90, ...overrides }, bounds),
  };
};

describe('lab layout', () => {
  test('every department has a place, once', () => {
    expect(new Set(LABS.map((lab) => lab.name)).size).toBe(26);
    expect(new Set(LABS.map((lab) => `${lab.x},${lab.y}`)).size).toBe(26);
  });

  test('size follows research: busier labs are bigger, within the limits', () => {
    expect(radiusForLevel(0)).toBe(R_MIN);
    expect(radiusForLevel(100)).toBe(R_MAX);
    expect(radiusForLevel(25)).toBeLessThan(radiusForLevel(75));
    expect(radiusForLevel(null)).toBeCloseTo((R_MIN + R_MAX) / 2);
    expect(radiusForLevel(250)).toBe(R_MAX);
  });

  test.each([
    ['all the same size', () => 50],
    ['the biggest at its closest', () => 100],
    ['spread out', (index) => (index * 37) % 101],
  ])('no two labs touch (%s)', (_label, levels) => {
    const nodes = buildLabNodes(overviewOf(levels));
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        expect(distance).toBeGreaterThanOrEqual(nodes[i].radius + nodes[j].radius);
      }
    }
  });

  test('a lab keeps roughly its place when sizes change', () => {
    const nodes = buildLabNodes(overviewOf((index) => (index * 37) % 101));
    nodes.forEach((node) => {
      expect(Math.hypot(node.x - node.homeX, node.y - node.homeY)).toBeLessThan(0.6);
    });
  });

  test('nearer labs are drawn last', () => {
    const { nodes } = makeTestView();
    const ys = nodes.map((node) => node.y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
  });

  test('labs missing from the API still appear, and casts count as content', () => {
    const nodes = buildLabNodes([{ name: 'Medicine', level: 90, casts: 22, topics: 19 }]);
    expect(nodes).toHaveLength(26);
    const medicine = nodes.find((node) => node.key === 'Medicine');
    expect(medicine).toMatchObject({ casts: 22, topics: 19 });
    expect(nodes.find((node) => node.key === 'Chemistry').casts).toBe(0);
  });

  test('the camera starts over the labs that have casts', () => {
    const nodes = buildLabNodes([
      { name: 'Medicine', level: 90, casts: 30 },
      { name: 'Chemistry', level: 20, casts: 1 },
    ]);
    const bounds = getBounds(nodes);
    const start = getStartPoint(nodes, bounds);
    const medicine = nodes.find((node) => node.key === 'Medicine');
    expect(Math.abs(start.x - medicine.x)).toBeLessThan(0.3);
    expect(getStartPoint(buildLabNodes([]), bounds)).toEqual({
      x: bounds.centerX,
      y: bounds.centerY,
    });
  });
});

describe('camera', () => {
  test('unproject is the inverse of project', () => {
    const { view } = makeTestView();
    [
      [1, 2.2, 3.1, 0.5, 1.0],
      [1.7, 4, 5, 3, 6],
      [4.5, 1, 7, 0, 8],
    ].forEach(([zoom, camX, camY, wx, wy]) => {
      const p = project(view, camX, camY, zoom, wx, wy);
      if (p.behind) return;
      const back = unproject(view, camX, camY, zoom, p.x, p.y);
      expect(back.x).toBeCloseTo(wx, 6);
      expect(back.y).toBeCloseTo(wy, 6);
    });
  });

  test('the focus point stays at the center of the visible area', () => {
    const { view } = makeTestView();
    const p = project(view, 2.5, 4, 2, 2.5, 4);
    expect(p.x).toBeCloseTo(view.cx);
    expect(p.y).toBeCloseTo(view.cy);
    expect(p.f).toBeCloseTo(1);
  });

  test('farther points are smaller and higher on the screen', () => {
    const { view } = makeTestView();
    const far = project(view, 2.5, 4, 2, 2.5, 2);
    const near = project(view, 2.5, 4, 2, 2.5, 6);
    expect(far.f).toBeLessThan(1);
    expect(near.f).toBeGreaterThan(1);
    expect(far.y).toBeLessThan(view.cy);
    expect(near.y).toBeGreaterThan(view.cy);
  });

  test('the whole world is on screen at zoom 1', () => {
    const { view, bounds } = makeTestView();
    const corners = [
      project(view, bounds.centerX, bounds.centerY, 1, bounds.minX, bounds.minY),
      project(view, bounds.centerX, bounds.centerY, 1, bounds.maxX, bounds.maxY),
    ];
    corners.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(view.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(view.height - 90);
    });
  });

  test('the camera can hardly move at zoom 1, and reaches every lab once zoomed in', () => {
    const { view, bounds, nodes } = makeTestView();
    const far = camLimits(view, 1);
    const close = camLimits(view, 1.7);
    expect(far.maxX - far.minX).toBeLessThan(1.5);
    expect(far.maxY - far.minY).toBeLessThan(1.5);
    expect((close.minX + close.maxX) / 2).toBeCloseTo(bounds.centerX);
    expect((close.minY + close.maxY) / 2).toBeCloseTo(bounds.centerY);
    nodes.forEach((node) => {
      expect(node.x).toBeGreaterThanOrEqual(close.minX);
      expect(node.x).toBeLessThanOrEqual(close.maxX);
      expect(node.y).toBeGreaterThanOrEqual(close.minY);
      expect(node.y).toBeLessThanOrEqual(close.maxY);
    });
  });

  test('taps find the lab under the finger, and nothing in empty space', () => {
    const { view, nodes } = makeTestView();
    const target = nodes[10];
    const camX = target.x;
    const camY = target.y;
    const p = project(view, camX, camY, 2, target.x, target.y);
    expect(hitLab(view, camX, camY, 2, nodes, p.x, p.y - 4)).toBe(10);
    expect(hitLab(view, camX, camY, 2, nodes, view.width - 2, 2)).toBe(-1);
  });

  test('the grid always has lines to draw', () => {
    const { view, bounds } = makeTestView();
    [1, 2.5, 4.5].forEach((zoom) => {
      const path = gridPath(view, bounds.centerX, bounds.centerY, zoom);
      expect(path.startsWith('M')).toBe(true);
      expect((path.match(/M/g) || []).length).toBeGreaterThan(4);
      expect((path.match(/M/g) || []).length).toBeLessThan(100);
    });
  });
});
