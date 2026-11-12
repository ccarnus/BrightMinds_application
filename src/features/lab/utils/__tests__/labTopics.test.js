import { formatCount, rankTopics } from '../labTopics';

const topic = (name, works, castCount = 0) => ({
  _id: name,
  name,
  castCount,
  metrics: { openalex: { worksLast12Months: works } },
});

describe('formatCount', () => {
  test.each([
    [0, '0'],
    [950, '950'],
    [1200, '1K'],
    [298405, '298K'],
    [2161737, '2.2M'],
    [3000000, '3M'],
    [15880442, '16M'],
    [undefined, '0'],
  ])('%p -> %s', (value, expected) => {
    expect(formatCount(value)).toBe(expected);
  });
});

describe('rankTopics', () => {
  test('puts the busiest topic first and scales levels between 0 and 1', () => {
    const ranked = rankTopics([topic('quiet', 100), topic('busy', 100000), topic('mid', 3000)]);
    expect(ranked.map((item) => item.topic.name)).toEqual(['busy', 'mid', 'quiet']);
    expect(ranked[0].level).toBe(1);
    expect(ranked[2].level).toBe(0);
    expect(ranked[1].level).toBeGreaterThan(0.3);
    expect(ranked[1].level).toBeLessThan(0.8);
  });

  test('topics without research data sit at 0, ties go to the one with more casts', () => {
    const ranked = rankTopics([topic('a', 0, 1), topic('b', 0, 4), topic('c', 5000)]);
    expect(ranked.map((item) => item.topic.name)).toEqual(['c', 'b', 'a']);
    expect(ranked[1].level).toBe(0);
    expect(ranked[0].level).toBe(0.6);
  });

  test('a topic without data does not squeeze the sizes of the others', () => {
    const ranked = rankTopics([topic('none', 0), topic('big', 53625), topic('small', 12001)]);
    expect(ranked.map((item) => item.level)).toEqual([1, 0, 0]);
  });

  test('equal or single topics get a middle size instead of dividing by zero', () => {
    expect(rankTopics([topic('only', 400)])[0].level).toBe(0.6);
    expect(rankTopics([topic('x', 7), topic('y', 7)]).map((item) => item.level)).toEqual([0.6, 0.6]);
    expect(rankTopics([topic('empty', 0)])[0].level).toBe(0);
    expect(rankTopics([])).toEqual([]);
  });
});
