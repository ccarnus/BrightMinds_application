import { pathColors } from '@shared/config/theme';
import departments from '@shared/data/departments';

// Visual identity of each path (the backend owns titles, goals and milestones). Keys never change.
export const PATH_STYLES = {
  follower: { icon: 'rss', colors: pathColors.follower },
  explorer: { icon: 'compass-outline', colors: pathColors.explorer },
  deep_learner: { icon: 'target', colors: pathColors.deep_learner },
  researcher: { icon: 'flask-outline', colors: pathColors.researcher },
};

export const pathStyle = (key) => PATH_STYLES[key] || { icon: 'map-marker-path', colors: pathColors.none };

export const METRIC_STYLES = {
  casts: { icon: 'play-box-multiple-outline', label: 'Casts' },
  correctAnswers: { icon: 'check-decagram-outline', label: 'Correct answers' },
  fields: { icon: 'earth', label: 'Fields explored' },
  papers: { icon: 'file-document-outline', label: 'Research papers' },
};

const FIELD_NAMES = new Map(departments.map((department) => [department.name, department.display]));

/** "ComputerScience" → "Computer Science". */
export const fieldDisplay = (name) => FIELD_NAMES.get(name) || name || '';

/** Goal label; Deep Learner goals name the focus field. */
export const goalLabel = (metric, focusField) => {
  const label = METRIC_STYLES[metric]?.label || metric;
  return focusField && metric !== 'fields' ? `${label} in ${fieldDisplay(focusField)}` : label;
};

// Where to go to move a goal forward.
export const GOAL_ACTIONS = {
  casts: { label: 'Explore casts', icon: 'play-circle-outline', tab: 'Cast' },
  fields: { label: 'Explore new fields', icon: 'compass-outline', tab: 'Cast' },
  correctAnswers: { label: 'Test yourself', icon: 'help-circle-outline', screen: 'Ready' },
  papers: { label: 'Browse research papers', icon: 'flask-outline', tab: 'Lab' },
};

export const goalRatio = (goal) => (goal?.target ? Math.min(goal.current / goal.target, 1) : 0);

/** The unfinished goal furthest from its target (the next thing to work on). */
export const weakestGoal = (goals = []) =>
  goals.reduce((weakest, goal) => {
    if (!goal.target || goal.current >= goal.target) return weakest;
    return !weakest || goalRatio(goal) < goalRatio(weakest) ? goal : weakest;
  }, null);

/** Title of the Cast tab "For You" section, which the backend shapes by path. */
export const feedTitle = (learning) => {
  switch (learning?.path) {
    case 'follower':
      return 'Latest in your fields';
    case 'explorer':
      return 'New fields to explore';
    case 'deep_learner':
      return learning.focusField ? `More in ${fieldDisplay(learning.focusField)}` : 'For You';
    default:
      return 'For You';
  }
};

export const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
};
