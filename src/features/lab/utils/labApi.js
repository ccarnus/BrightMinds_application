import { api, isRouteNotFound } from '@shared/api/client';

/**
 * Older servers only know how many casts each department has: use it to give the labs some size.
 * Departments with casts range from a third to the full size, the others get the middle size.
 */
export const fromPopularDepartments = (rows) => {
  const departments = (Array.isArray(rows) ? rows : []).filter((row) => row?._id);
  const logs = departments.map((row) => Math.log10((Number(row.count) || 0) + 1));
  const lowest = Math.min(...logs);
  const highest = Math.max(...logs);
  return departments.map((row, index) => ({
    name: row._id,
    works12m: null,
    level: highest === lowest ? 70 : 33 + ((logs[index] - lowest) / (highest - lowest)) * 67,
    casts: Number(row.count) || 0,
    topics: 0,
  }));
};

/**
 * Every lab with its research level (what sizes it), casts and topics.
 * @returns {Promise<Array<{ name: string, level: number | null, works12m: number | null, casts: number, topics: number }>>}
 */
export const fetchLabOverview = async () => {
  try {
    const { data } = await api.get('/virtual/lab/overview');
    return Array.isArray(data?.labs) ? data.labs : [];
  } catch (error) {
    if (!isRouteNotFound(error)) throw error;
    const { data } = await api.get('/cast/popular/department');
    return fromPopularDepartments(data);
  }
};
