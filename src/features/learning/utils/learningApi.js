import { api, isRouteNotFound } from '@shared/api/client';

// The path catalog is static on the server: one fetch per app session.
let pathsCache = null;

/** Learning paths and their milestones (`GET /learning/paths`). */
export const fetchLearningPaths = async () => {
  if (pathsCache) return pathsCache;
  const { data } = await api.get('/learning/paths');
  pathsCache = Array.isArray(data?.paths) ? data.paths : [];
  return pathsCache;
};

export const clearLearningPathsCache = () => {
  pathsCache = null;
};

/** Path, stats, milestone journey and history; `null` when the server has no learning paths yet. */
export const fetchLearningProfile = async (userId) => {
  try {
    const { data } = await api.get(`/user/${userId}/learning`);
    return data;
  } catch (error) {
    if (isRouteNotFound(error)) return null;
    throw error;
  }
};

/**
 * Chooses or changes the path; nothing is lost (milestones read lifetime activity).
 * Resolves to `{ learning, newMilestones }`.
 */
export const updateLearningPath = async (userId, { path, focusField }) => {
  const { data } = await api.put(`/user/${userId}/learning`, {
    path,
    focusField: focusField || undefined,
  });
  return { learning: data?.learning || null, newMilestones: data?.newMilestones || [] };
};

/** Counts an opened research paper for the Researcher path. A background signal: never throws. */
export const recordPaperOpened = async (userId, { paperId, field }) => {
  try {
    const { data } = await api.post(`/user/${userId}/learning/papers`, {
      paperId,
      field: field || undefined,
    });
    return data;
  } catch (error) {
    if (!isRouteNotFound(error)) console.warn('Could not record the opened paper:', error?.message);
    return null;
  }
};
