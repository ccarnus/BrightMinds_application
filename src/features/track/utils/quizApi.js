import { api, isRouteNotFound } from '@shared/api/client';
import { scoreLocally, utcOffsetMinutes } from '@features/track/utils/rewards';


/** XP, level, streak and badges; `null` when the server doesn't support rewards yet. */
export const fetchRewards = async (userId) => {
  try {
    const { data } = await api.get(`/user/${userId}/rewards`, {
      params: { utcOffsetMinutes: utcOffsetMinutes() },
    });
    return data;
  } catch (error) {
    if (isRouteNotFound(error)) return null;
    throw error;
  }
};

/** A fresh id per quiz attempt: the server ignores a resubmission of the last graded id. */
export const newQuizId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;

/**
 * Sends the answers (in order: the order drives the combo) for server-side grading and rewards.
 * Retrying with the same `quizId` is safe (the server answers `duplicate: true` and awards nothing).
 * On an older backend it marks the correct answers as answered and grades locally (`persisted: false`).
 * @param {{ contentId: string, response: string, correct: boolean }[]} answers
 */
export const submitQuiz = async (userId, answers, quizId = newQuizId()) => {
  try {
    const { data } = await api.post(`/user/${userId}/quiz`, {
      answers: answers.map(({ contentId, response }) => ({ contentId, response })),
      utcOffsetMinutes: utcOffsetMinutes(),
      quizId,
    });
    return { ...data, persisted: true };
  } catch (error) {
    if (!isRouteNotFound(error)) throw error;
    await Promise.all(
      answers
        .filter((answer) => answer.correct)
        .map((answer) =>
          api.post(`/user/mark/content/as/answered/${userId}`, { contentId: answer.contentId })
        )
    );
    return { ...scoreLocally(answers), persisted: false };
  }
};
