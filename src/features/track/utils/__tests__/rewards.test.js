import {
  levelForXp,
  levelInfo,
  levelThreshold,
  maxQuizXp,
  nextStreakDay,
  resultTier,
  scoreLocally,
  xpForAnswer,
} from '@features/track/utils/rewards';

// These rules mirror the backend (services/rewards.js): a failure here means the two drifted.
describe('levels', () => {
  test('thresholds grow by 100 XP more per level', () => {
    expect([1, 2, 3, 4, 5].map(levelThreshold)).toEqual([0, 100, 300, 600, 1000]);
  });

  test('levelForXp and levelInfo place XP within the current level', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelInfo(150)).toMatchObject({
      level: 2,
      levelTitle: 'Apprentice',
      levelXp: 50,
      levelSpan: 200,
      nextLevelXp: 300,
      progress: 0.25,
    });
  });

  test('the last title is kept beyond level 10', () => {
    expect(levelInfo(levelThreshold(12)).levelTitle).toBe('Bright Mind');
  });
});

describe('XP', () => {
  test('correct answers earn a growing combo bonus, capped at +20', () => {
    expect([1, 2, 3, 5, 6, 9].map((combo) => xpForAnswer(true, combo))).toEqual([10, 15, 20, 30, 30, 30]);
    expect(xpForAnswer(false, 0)).toBe(2);
  });

  test('maxQuizXp includes the combo, perfect and next streak day bonuses', () => {
    expect(maxQuizXp(0, null)).toBe(0);
    expect(maxQuizXp(1, null)).toBe(10);
    // 10 + 15 + 20 + perfect 20
    expect(maxQuizXp(3, null)).toBe(65);
    expect(maxQuizXp(3, { streak: { current: 2, completedToday: false } })).toBe(80);
    expect(maxQuizXp(3, { streak: { current: 2, completedToday: true } })).toBe(65);
    expect(maxQuizXp(3, { streak: { current: 30, completedToday: false } })).toBe(100);
  });

  test('nextStreakDay', () => {
    expect(nextStreakDay(null)).toBe(0);
    expect(nextStreakDay({ current: 0, completedToday: false })).toBe(1);
    expect(nextStreakDay({ current: 4, completedToday: true })).toBe(0);
  });
});

describe('scoreLocally', () => {
  const answer = (correct) => ({ contentId: 'id', response: 'A', correct });

  test('grades like the server (without the streak bonus)', () => {
    const result = scoreLocally([answer(true), answer(true), answer(false)]);
    expect(result.results.map((item) => item.xp)).toEqual([10, 15, 2]);
    expect(result.summary).toEqual({ total: 3, correct: 2, bestCombo: 2, perfect: false });
    expect(result.breakdown.map((item) => item.key)).toEqual(['answers', 'effort', 'combo']);
    expect(result.xpEarned).toBe(27);
    expect(result).toMatchObject({ previous: null, leveledUp: false, newBadges: [], rewards: null });
  });

  test('a perfect quiz of 2+ questions earns the perfect bonus', () => {
    expect(scoreLocally([answer(true), answer(true)]).xpEarned).toBe(10 + 15 + 20);
    expect(scoreLocally([answer(true)]).xpEarned).toBe(10);
    expect(scoreLocally([]).summary).toEqual({ total: 0, correct: 0, bestCombo: 0, perfect: false });
  });
});

test('resultTier picks the headline from the success ratio', () => {
  expect([1, 0.8, 0.5, 0.2].map((ratio) => resultTier(ratio).key)).toEqual([
    'perfect',
    'great',
    'good',
    'learning',
  ]);
});
