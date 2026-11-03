import axios from 'axios';
import { API_BASE_URL, OPENALEX_BASE_URL } from '@shared/config/APIConfig';

const REQUEST_TIMEOUT_MS = 15000;

// BrightMinds backend. Use relative paths: api.get(`/user/${userId}`)
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

// Public OpenAlex API (research papers / topics).
export const openAlex = axios.create({
  baseURL: OPENALEX_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection.';
  if (error?.message === 'Network Error') return 'No internet connection. Please try again.';
  return fallback;
};

// Logos rarely change, so they are cached for the lifetime of the app session.
const universityLogoCache = new Map();

export const getUniversityLogo = (universityName) => {
  if (!universityName) return Promise.resolve(null);
  if (!universityLogoCache.has(universityName)) {
    const request = api
      .get(`/university/by/name/${encodeURIComponent(universityName)}`)
      .then(({ data }) => data?.iconurl || null)
      .catch(() => {
        universityLogoCache.delete(universityName);
        return null;
      });
    universityLogoCache.set(universityName, request);
  }
  return universityLogoCache.get(universityName);
};

export const clearUniversityLogoCache = () => universityLogoCache.clear();
