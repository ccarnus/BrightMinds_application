import { api, openAlex } from '@shared/api/client';

export const SEARCH_CATEGORIES = ['Paper', 'Topic', 'Video'];

export const SEARCH_META = {
  Paper: {
    icon: 'document-text-outline',
    hint: 'Search millions of research papers by title.',
  },
  Topic: {
    icon: 'flask-outline',
    hint: 'Find a research topic and see what is happening in it.',
  },
  Video: {
    icon: 'play-circle-outline',
    hint: 'Look up a cast by its title.',
  },
};

const lastPathSegment = (id = '') => id.split('/').pop();

/**
 * Searches one category. `castCache` is a ref-like `{ current }` keeping the cast titles after
 * the first request (the list is small and filtered locally).
 * @returns {Promise<{ category: string, id: string, label: string }[]>}
 */
export const searchContent = async (category, query, castCache) => {
  if (category === 'Video') {
    if (!castCache.current) {
      const { data } = await api.get('/cast/all/simplified');
      // The API answers { count, casts }; a bare array is accepted too.
      const casts = Array.isArray(data) ? data : data?.casts;
      castCache.current = Array.isArray(casts) ? casts : [];
    }
    const needle = query.toLowerCase();
    return castCache.current
      .filter((item) => (item.title || '').toLowerCase().includes(needle))
      .map((item) => ({ category, id: item._id, label: item.title }));
  }

  if (category === 'Topic') {
    const { data } = await openAlex.get('/topics', {
      params: { search: query, select: 'id,display_name', per_page: 50 },
    });
    return (data?.results || []).map((item) => ({
      category,
      id: item.id,
      label: item.display_name,
    }));
  }

  // Commas separate OpenAlex filters, so they cannot appear inside the search value.
  const { data } = await openAlex.get('/works', {
    params: {
      filter: `title.search:${query.replace(/,/g, ' ')},has_abstract:true,language:en`,
      per_page: 50,
    },
  });
  return (data?.results || []).map((item) => ({
    category,
    id: lastPathSegment(item.id),
    label: item.title,
  }));
};
