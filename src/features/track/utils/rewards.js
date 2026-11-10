import { rewardColors } from '@shared/config/theme';

/*
 * Quiz reward rules, mirrored from the backend (`services/rewards.js`) for live previews and as a
 * fallback when the server can't grade the quiz. The server stays the source of truth: keep in sync.
 */
export const XP = {
  correct: 10,
  attempt: 2,
  comboStep: 5,
  maxComboBonus: 20,
  perfect: 20,
  perfectMinQuestions: 2,
  streakStep: 5,
  maxStreakBonus: 35,
};

export const LEVEL_TITLES = [
  'Curious Mind',
  'Apprentice',
  'Thinker',
  'Scholar',
  'Expert',
  'Sage',
  'Visionary',
  'Luminary',
  'Genius',
  'Bright Mind',
];

/** Total XP needed to reach `level` (1 → 0, 2 → 100, 3 → 300, 4 → 600...). */
export const levelThreshold = (level) => 50 * level * (level - 1);

export const levelForXp = (xp) => {
  let level = 1;
  while (level < 1000 && levelThreshold(level + 1) <= xp) level += 1;
  return level;
};

export const levelInfo = (xp = 0) => {
  const level = levelForXp(xp);
  const floor = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return {
    xp,
    level,
    levelTitle: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1],
    levelXp: xp - floor,
    levelSpan: next - floor,
    nextLevelXp: next,
    progress: (xp - floor) / (next - floor),
  };
};

/** XP for one answer given the current run of consecutive correct answers (including this one). */
export const xpForAnswer = (correct, combo) =>
  correct ? XP.correct + Math.min((combo - 1) * XP.comboStep, XP.maxComboBonus) : XP.attempt;

/** Streak length after today's first quiz (0 if a quiz was already taken today). */
export const nextStreakDay = (streak) => {
  if (!streak || streak.completedToday) return 0;
  return (streak.current || 0) + 1;
};

/** Best possible XP for a quiz of `count` questions, used to motivate before starting. */
export const maxQuizXp = (count, rewards) => {
  let total = 0;
  for (let combo = 1; combo <= count; combo += 1) total += xpForAnswer(true, combo);
  if (count >= XP.perfectMinQuestions) total += XP.perfect;
  const streakDay = nextStreakDay(rewards?.streak);
  if (count > 0 && streakDay > 0) total += Math.min(streakDay * XP.streakStep, XP.maxStreakBonus);
  return total;
};

/** Local grading used when the server can't (older backend): same shape as the API response. */
export const scoreLocally = (answers) => {
  let combo = 0;
  let bestCombo = 0;
  let comboBonus = 0;
  const results = answers.map((answer) => {
    combo = answer.correct ? combo + 1 : 0;
    bestCombo = Math.max(bestCombo, combo);
    if (answer.correct) comboBonus += Math.min((combo - 1) * XP.comboStep, XP.maxComboBonus);
    return { ...answer, xp: xpForAnswer(answer.correct, combo) };
  });
  const correct = results.filter((answer) => answer.correct).length;
  const total = results.length;
  const perfect = total > 0 && correct === total;
  const breakdown = [
    { key: 'answers', label: 'Correct answers', xp: correct * XP.correct },
    { key: 'effort', label: 'Effort', xp: (total - correct) * XP.attempt },
    { key: 'combo', label: 'Combo bonus', xp: comboBonus },
    {
      key: 'perfect',
      label: 'Perfect quiz',
      xp: perfect && total >= XP.perfectMinQuestions ? XP.perfect : 0,
    },
  ].filter((item) => item.xp > 0);
  return {
    results,
    summary: { total, correct, bestCombo, perfect },
    xpEarned: breakdown.reduce((sum, item) => sum + item.xp, 0),
    breakdown,
    previous: null,
    leveledUp: false,
    newBadges: [],
    newMilestones: [],
    rewards: null,
  };
};

/** Minutes east of UTC, so the server counts the streak on the user's local day. */
export const utcOffsetMinutes = () => -new Date().getTimezoneOffset();

// Visual identity of each badge (the backend owns titles, descriptions and unlock rules).
export const BADGE_STYLES = {
  first_quiz: { icon: 'shoe-print', tier: 'bronze' },
  perfect_quiz: { icon: 'diamond-stone', tier: 'gold' },
  combo_5: { icon: 'fire', tier: 'silver' },
  streak_3: { icon: 'calendar-check', tier: 'bronze' },
  streak_7: { icon: 'lightning-bolt', tier: 'gold' },
  correct_10: { icon: 'brain', tier: 'bronze' },
  correct_50: { icon: 'book-open-page-variant', tier: 'gold' },
  quizzes_10: { icon: 'medal', tier: 'silver' },
  level_5: { icon: 'star-shooting', tier: 'silver' },
  objective_reached: { icon: 'flag-checkered', tier: 'gold' },
};

export const badgeStyle = (key) => {
  const style = BADGE_STYLES[key] || { icon: 'trophy-award', tier: 'bronze' };
  return { ...style, colors: rewardColors[style.tier] };
};

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export const praiseFor = (correct, combo) => {
  if (!correct) return pickOne(['Not quite!', 'So close!', 'Keep going!', 'Almost there!']);
  if (combo >= 5) return pickOne(['Unstoppable!', 'On fire!', 'Legendary!']);
  if (combo >= 3) return pickOne(['Brilliant!', 'Genius!', "You're on a roll!"]);
  return pickOne(['Correct!', 'Nailed it!', 'Spot on!', 'Well done!']);
};

/** Headline of the results screen for a success ratio (0–1). */
export const resultTier = (ratio) => {
  if (ratio >= 1) {
    return { key: 'perfect', title: 'Perfect score!', icon: 'trophy', colors: rewardColors.gold };
  }
  if (ratio >= 0.7) {
    return { key: 'great', title: 'Great job!', icon: 'medal', colors: rewardColors.silver };
  }
  if (ratio >= 0.5) {
    return { key: 'good', title: 'Good effort!', icon: 'star-four-points', colors: rewardColors.bronze };
  }
  return { key: 'learning', title: 'Keep learning!', icon: 'book-open-variant', colors: rewardColors.level };
};
