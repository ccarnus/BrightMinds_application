import { api } from '@shared/api/client';
import { fetchRewards, newQuizId, submitQuiz } from '@features/track/utils/quizApi';

jest.mock('@shared/utils/connectivity', () => ({
  isDeviceOffline: jest.fn(() => false),
  reportOnline: jest.fn(),
}));

const httpError = (status, message) => Object.assign(new Error(message), { response: { status, data: { message } } });
const missingRoute = () => httpError(404, 'Route not found: POST /user/u1/quiz');

const answers = [
  { contentId: 'c1', response: 'A', correct: true, xp: 10 },
  { contentId: 'c2', response: 'B', correct: false, xp: 2 },
];

afterEach(() => {
  jest.restoreAllMocks();
});

describe('submitQuiz', () => {
  test('sends only the answers, the local UTC offset and the quiz id', async () => {
    const post = jest.spyOn(api, 'post').mockResolvedValue({ data: { xpEarned: 12, summary: { total: 2 } } });

    const result = await submitQuiz('u1', answers, 'quiz-12345');

    expect(post).toHaveBeenCalledWith('/user/u1/quiz', {
      answers: [
        { contentId: 'c1', response: 'A' },
        { contentId: 'c2', response: 'B' },
      ],
      utcOffsetMinutes: -new Date().getTimezoneOffset(),
      quizId: 'quiz-12345',
    });
    expect(result).toEqual({ xpEarned: 12, summary: { total: 2 }, persisted: true });
  });

  test('generates a quiz id when none is given', async () => {
    const post = jest.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await submitQuiz('u1', answers);
    expect(post.mock.calls[0][1].quizId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  test('falls back to marking correct answers on a backend without rewards', async () => {
    const post = jest
      .spyOn(api, 'post')
      .mockImplementation((url) =>
        url.endsWith('/quiz') ? Promise.reject(missingRoute()) : Promise.resolve({ data: {} })
      );

    const result = await submitQuiz('u1', answers);

    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenLastCalledWith('/user/mark/content/as/answered/u1', { contentId: 'c1' });
    expect(result).toMatchObject({ persisted: false, xpEarned: 12, summary: { total: 2, correct: 1 } });
  });

  test('other errors are reported to the caller', async () => {
    jest.spyOn(api, 'post').mockRejectedValue(httpError(404, 'User not found.'));
    await expect(submitQuiz('u1', answers)).rejects.toThrow('User not found.');

    jest.spyOn(api, 'post').mockRejectedValue(new Error('Network Error'));
    await expect(submitQuiz('u1', answers)).rejects.toThrow('Network Error');
  });
});

describe('fetchRewards', () => {
  test('returns the rewards for the local day', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: { xp: 40, level: 1 } });
    await expect(fetchRewards('u1')).resolves.toEqual({ xp: 40, level: 1 });
    expect(get).toHaveBeenCalledWith('/user/u1/rewards', {
      params: { utcOffsetMinutes: -new Date().getTimezoneOffset() },
    });
  });

  test('is null on a backend without rewards and throws on other errors', async () => {
    jest.spyOn(api, 'get').mockRejectedValue(missingRoute());
    await expect(fetchRewards('u1')).resolves.toBeNull();

    jest.spyOn(api, 'get').mockRejectedValue(httpError(500, 'Internal server error.'));
    await expect(fetchRewards('u1')).rejects.toThrow('Internal server error.');
  });
});

test('quiz ids are unique and accepted by the server', () => {
  const ids = new Set(Array.from({ length: 50 }, newQuizId));
  expect(ids.size).toBe(50);
  ids.forEach((id) => expect(id).toMatch(/^[A-Za-z0-9_-]{8,64}$/));
});
