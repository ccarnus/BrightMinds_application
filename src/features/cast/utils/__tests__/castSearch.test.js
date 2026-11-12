import { searchContent } from '@features/cast/utils/castSearch';
import { api, openAlex } from '@shared/api/client';

jest.mock('@shared/api/client', () => ({
  api: { get: jest.fn() },
  openAlex: { get: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('searchContent', () => {
  test('videos are filtered locally from the { count, casts } answer, then cached', async () => {
    api.get.mockResolvedValue({
      data: {
        count: 3,
        casts: [
          { _id: '1', title: 'Black holes explained' },
          { _id: '2', title: 'Zinc and bacteria' },
          { _id: '3', title: 'BLACK ice' },
        ],
      },
    });
    const cache = { current: null };

    const first = await searchContent('Video', 'black', cache);
    expect(first).toEqual([
      { category: 'Video', id: '1', label: 'Black holes explained' },
      { category: 'Video', id: '3', label: 'BLACK ice' },
    ]);
    expect(await searchContent('Video', 'zinc', cache)).toHaveLength(1);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  test('videos still accept a bare array and survive an unexpected answer', async () => {
    api.get.mockResolvedValueOnce({ data: [{ _id: '1', title: 'Quantum' }] });
    expect(await searchContent('Video', 'quan', { current: null })).toHaveLength(1);

    api.get.mockResolvedValueOnce({ data: { unexpected: true } });
    expect(await searchContent('Video', 'quan', { current: null })).toEqual([]);
  });

  test('topics come from OpenAlex', async () => {
    openAlex.get.mockResolvedValue({
      data: { results: [{ id: 'https://openalex.org/T1', display_name: 'Astrophysics' }] },
    });
    expect(await searchContent('Topic', 'astro', { current: null })).toEqual([
      { category: 'Topic', id: 'https://openalex.org/T1', label: 'Astrophysics' },
    ]);
    expect(openAlex.get).toHaveBeenCalledWith('/topics', expect.objectContaining({ params: expect.anything() }));
  });

  test('papers keep the short work id and drop commas from the filter', async () => {
    openAlex.get.mockResolvedValue({
      data: { results: [{ id: 'https://openalex.org/W42', title: 'A paper' }] },
    });
    const results = await searchContent('Paper', 'a, b', { current: null });
    expect(results).toEqual([{ category: 'Paper', id: 'W42', label: 'A paper' }]);
    expect(openAlex.get.mock.calls[0][1].params.filter).toBe(
      'title.search:a  b,has_abstract:true,language:en'
    );
  });
});
