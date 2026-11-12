import {
  countPending,
  firstName,
  formatCastDuration,
  getWatchedIds,
  greetingFor,
  isNewCast,
  splitFeed,
  toCastCard,
} from '@features/cast/utils/home';

describe('greetingFor / firstName', () => {
  test('follows the time of day', () => {
    expect(greetingFor(0)).toBe('Good morning');
    expect(greetingFor(11)).toBe('Good morning');
    expect(greetingFor(12)).toBe('Good afternoon');
    expect(greetingFor(17)).toBe('Good afternoon');
    expect(greetingFor(18)).toBe('Good evening');
    expect(greetingFor(23)).toBe('Good evening');
  });

  test('keeps the first word of a name', () => {
    expect(firstName('Ada Lovelace')).toBe('Ada');
    expect(firstName('  grace  ')).toBe('grace');
    expect(firstName('')).toBe('');
    expect(firstName(undefined)).toBe('');
  });
});

describe('casts', () => {
  const now = new Date('2026-11-11T12:00:00Z').getTime();

  test('new means added within the last 7 days', () => {
    expect(isNewCast('2026-11-10T12:00:00Z', now)).toBe(true);
    expect(isNewCast('2026-11-04T12:00:00Z', now)).toBe(true);
    expect(isNewCast('2026-11-03T11:59:00Z', now)).toBe(false);
    expect(isNewCast('2026-11-12T12:00:00Z', now)).toBe(false);
    expect(isNewCast(undefined, now)).toBe(false);
    expect(isNewCast('not a date', now)).toBe(false);
  });

  test('durations are minutes with seconds as the fraction', () => {
    expect(formatCastDuration(3.5)).toBe('03:30');
    expect(formatCastDuration(0)).toBe('00:00');
    expect(formatCastDuration(12.99)).toBe('12:59');
    expect(formatCastDuration(undefined)).toBe('00:00');
    expect(formatCastDuration(-2)).toBe('00:00');
  });

  test('cards keep what the rails show', () => {
    expect(
      toCastCard({
        _id: 'c1',
        castimageurl: 'http://img',
        title: 'Black holes',
        duration: 2,
        university: 'MIT',
        dateadded: new Date().toISOString(),
        description: 'ignored',
      })
    ).toEqual({
      id: 'c1',
      image: 'http://img',
      title: 'Black holes',
      duration: 2,
      university: 'MIT',
      isNew: true,
    });
  });
});

describe('evaluation list', () => {
  const list = [
    { contentid: 'a', watched: true, answered: true },
    { contentid: 'b', watched: true, answered: false },
    { contentid: 'c', watched: false, answered: false },
    { contentid: 'd', watched: true },
  ];

  test('watched ids and pending questions', () => {
    expect([...getWatchedIds(list)].sort()).toEqual(['a', 'b', 'd']);
    expect(countPending(list)).toBe(2);
    expect(getWatchedIds(undefined).size).toBe(0);
    expect(countPending(null)).toBe(0);
  });
});

describe('splitFeed', () => {
  const card = (id) => ({ id });

  test('the first suggestion is featured and leaves both rails', () => {
    const { featured, suggested, trending } = splitFeed(
      [card('a'), card('b')],
      [card('c'), card('a'), card('d')]
    );
    expect(featured).toEqual(card('a'));
    expect(suggested).toEqual([card('b')]);
    expect(trending).toEqual([card('c'), card('d')]);
  });

  test('falls back to the first trending cast, or to nothing', () => {
    expect(splitFeed([], [card('x'), card('y')])).toEqual({
      featured: card('x'),
      suggested: [],
      trending: [card('y')],
    });
    expect(splitFeed([], [])).toEqual({ featured: null, suggested: [], trending: [] });
  });
});
