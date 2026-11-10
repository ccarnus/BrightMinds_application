import { api } from '@shared/api/client';
import {
  clearLearningPathsCache,
  fetchLearningPaths,
  fetchLearningProfile,
  recordPaperOpened,
  updateLearningPath,
} from '@features/learning/utils/learningApi';
import {
  feedTitle,
  fieldDisplay,
  goalLabel,
  pathStyle,
  weakestGoal,
} from '@features/learning/utils/pathStyles';

jest.mock('@shared/utils/connectivity', () => ({
  isDeviceOffline: jest.fn(() => false),
  reportOnline: jest.fn(),
}));

const httpError = (status, message) =>
  Object.assign(new Error(message), { response: { status, data: { message } } });
const missingRoute = () => httpError(404, 'Route not found: GET /user/u1/learning');

afterEach(() => {
  jest.restoreAllMocks();
  clearLearningPathsCache();
});

describe('learningApi', () => {
  test('the path catalog is fetched once per session', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: { paths: [{ key: 'explorer' }] } });
    await expect(fetchLearningPaths()).resolves.toEqual([{ key: 'explorer' }]);
    await fetchLearningPaths();
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/learning/paths');
  });

  test('the profile is null on a server without learning paths; other errors are thrown', async () => {
    jest.spyOn(api, 'get').mockResolvedValueOnce({ data: { path: 'explorer' } });
    await expect(fetchLearningProfile('u1')).resolves.toEqual({ path: 'explorer' });

    jest.spyOn(api, 'get').mockRejectedValueOnce(missingRoute());
    await expect(fetchLearningProfile('u1')).resolves.toBeNull();

    jest.spyOn(api, 'get').mockRejectedValueOnce(httpError(500, 'Internal server error.'));
    await expect(fetchLearningProfile('u1')).rejects.toThrow('Internal server error.');
  });

  test('updating the path sends the key and the focus field only when set', async () => {
    const put = jest
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { learning: { path: 'explorer' }, newMilestones: [{ level: 1 }] } });
    await expect(updateLearningPath('u1', { path: 'explorer', focusField: null })).resolves.toEqual({
      learning: { path: 'explorer' },
      newMilestones: [{ level: 1 }],
    });
    expect(put).toHaveBeenCalledWith('/user/u1/learning', { path: 'explorer', focusField: undefined });

    await updateLearningPath('u1', { path: 'deep_learner', focusField: 'Chemistry' });
    expect(put).toHaveBeenLastCalledWith('/user/u1/learning', {
      path: 'deep_learner',
      focusField: 'Chemistry',
    });
  });

  test('recording a paper never throws', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const post = jest.spyOn(api, 'post').mockResolvedValue({ data: { recorded: true } });
    await expect(recordPaperOpened('u1', { paperId: 'W1', field: 'Chemistry' })).resolves.toEqual({
      recorded: true,
    });
    expect(post).toHaveBeenCalledWith('/user/u1/learning/papers', { paperId: 'W1', field: 'Chemistry' });

    post.mockRejectedValue(new Error('Network Error'));
    await expect(recordPaperOpened('u1', { paperId: 'W1' })).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});

describe('pathStyles', () => {
  test('every path has a style; unknown paths get a neutral one', () => {
    ['follower', 'explorer', 'deep_learner', 'researcher'].forEach((key) =>
      expect(pathStyle(key).colors).toHaveLength(2)
    );
    expect(pathStyle('career').icon).toBe('map-marker-path');
  });

  test('labels name the focus field with its display name', () => {
    expect(fieldDisplay('ComputerScience')).toBe('Computer Science');
    expect(fieldDisplay('Unknown')).toBe('Unknown');
    expect(goalLabel('contents', 'ComputerScience')).toBe('Casts & articles in Computer Science');
    expect(goalLabel('correctAnswers')).toBe('Correct answers');
  });

  test('the weakest unfinished goal is the next thing to work on', () => {
    const goals = [
      { metric: 'contents', current: 9, target: 10 },
      { metric: 'correctAnswers', current: 2, target: 8 },
      { metric: 'fields', current: 5, target: 4 },
    ];
    expect(weakestGoal(goals).metric).toBe('correctAnswers');
    expect(weakestGoal([{ metric: 'contents', current: 3, target: 3 }])).toBeNull();
  });

  test('the For You title follows the path', () => {
    expect(feedTitle(null)).toBe('For You');
    expect(feedTitle({ path: 'explorer' })).toBe('New fields to explore');
    expect(feedTitle({ path: 'deep_learner', focusField: 'Chemistry' })).toBe('More in Chemistry');
    expect(feedTitle({ path: 'deep_learner' })).toBe('For You');
  });
});
