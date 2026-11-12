// Pure helpers of the home screen (kept apart so they are easy to test).

/** Time-of-day greeting for a local hour (0-23). */
export const greetingFor = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/** First word of a display name ("Ada Lovelace" -> "Ada"), or '' when there is none. */
export const firstName = (username) =>
  typeof username === 'string' ? username.trim().split(/\s+/)[0] : '';

const NEW_CAST_DAYS = 7;

/** Whether a cast was added within the last week. */
export const isNewCast = (dateadded, now = Date.now()) => {
  const added = dateadded ? new Date(dateadded).getTime() : NaN;
  return Number.isFinite(added) && now - added >= 0 && now - added <= NEW_CAST_DAYS * 86400000;
};

/** "03:30" from a duration in minutes (fractions are seconds). */
export const formatCastDuration = (duration = 0) => {
  const total = Math.max(0, Math.round((Number(duration) || 0) * 60));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** The card shown in the home rails, from a cast of the API. */
export const toCastCard = (cast) => ({
  id: cast._id,
  image: cast.castimageurl,
  title: cast.title,
  duration: cast.duration,
  university: cast.university,
  isNew: isNewCast(cast.dateadded),
});

/** Ids of the casts the user already watched. */
export const getWatchedIds = (evaluationList) =>
  new Set(
    (Array.isArray(evaluationList) ? evaluationList : [])
      .filter((item) => item.watched)
      .map((item) => item.contentid)
  );

/** Questions ready for a quiz: watched casts not answered yet. */
export const countPending = (evaluationList) =>
  (Array.isArray(evaluationList) ? evaluationList : []).filter(
    (item) => item.watched && !item.answered
  ).length;

/**
 * Picks the hero cast (the first suggestion, else the first trending one) and removes it from
 * both rails, so a cast never shows twice on the screen.
 */
export const splitFeed = (suggested, trending) => {
  const featured = suggested[0] || trending[0] || null;
  const without = (list) => (featured ? list.filter((card) => card.id !== featured.id) : list);
  return {
    featured,
    suggested: without(suggested),
    trending: without(trending),
  };
};
