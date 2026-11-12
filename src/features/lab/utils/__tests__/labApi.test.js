import { fetchLabOverview, fromPopularDepartments } from '../labApi';
import { api } from '@shared/api/client';

jest.mock('@shared/api/client', () => ({
  api: { get: jest.fn() },
  isRouteNotFound: (error) => error?.response?.status === 404,
}));

beforeEach(() => api.get.mockReset());

describe('fetchLabOverview', () => {
  test('returns the labs of the overview', async () => {
    const labs = [{ name: 'Medicine', level: 90, works12m: 2161737, casts: 22, topics: 19 }];
    api.get.mockResolvedValueOnce({ data: { updatedAt: null, labs } });
    await expect(fetchLabOverview()).resolves.toEqual(labs);
    expect(api.get).toHaveBeenCalledWith('/virtual/lab/overview');
  });

  test('on a server without the overview, sizes the labs by their casts', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });
    api.get.mockResolvedValueOnce({
      data: [
        { _id: 'Medicine', count: 22 },
        { _id: 'Chemistry', count: 1 },
      ],
    });
    const labs = await fetchLabOverview();
    expect(api.get).toHaveBeenLastCalledWith('/cast/popular/department');
    expect(labs.find((lab) => lab.name === 'Medicine')).toMatchObject({ casts: 22, level: 100 });
    expect(labs.find((lab) => lab.name === 'Chemistry').level).toBeCloseTo(33);
  });

  test('other failures reach the screen, so it can show them', async () => {
    const failure = { response: { status: 500 } };
    api.get.mockRejectedValueOnce(failure);
    await expect(fetchLabOverview()).rejects.toBe(failure);
    expect(api.get).toHaveBeenCalledTimes(1);
  });
});

describe('fromPopularDepartments', () => {
  test('copes with no data, one department and junk rows', () => {
    expect(fromPopularDepartments(undefined)).toEqual([]);
    expect(fromPopularDepartments([{ _id: 'Medicine', count: 3 }])[0].level).toBe(70);
    expect(fromPopularDepartments([{ count: 3 }, null])).toEqual([]);
  });
});
