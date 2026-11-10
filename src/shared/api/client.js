import axios from 'axios';
import { API_BASE_URL, OPENALEX_BASE_URL } from '@shared/config/APIConfig';
import { isDeviceOffline, reportOnline } from '@shared/utils/connectivity';

export const REQUEST_TIMEOUT_MS = 15000;
// Optional data (logos, enrichment) gives up sooner so it never holds a screen back.
export const OPTIONAL_REQUEST_TIMEOUT_MS = 8000;
export const RETRY_DELAY_MS = 800;
const RETRYABLE_STATUSES = [502, 503, 504];
const TIMEOUT_CODES = ['ECONNABORTED', 'ETIMEDOUT'];
const NETWORK_MESSAGES = ['Network Error', 'Network request failed'];

export const ErrorType = Object.freeze({
  OFFLINE: 'offline',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  SERVER: 'server',
  NOT_FOUND: 'notFound',
  CLIENT: 'client',
  CANCELED: 'canceled',
  UNKNOWN: 'unknown',
});

const CONNECTIVITY_TYPES = [ErrorType.OFFLINE, ErrorType.NETWORK, ErrorType.TIMEOUT];

export const getErrorType = (error) => {
  if (!error) return ErrorType.UNKNOWN;
  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') return ErrorType.CANCELED;
  if (TIMEOUT_CODES.includes(error.code)) return ErrorType.TIMEOUT;

  const status = error.response?.status;
  if (status) {
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status === 408) return ErrorType.TIMEOUT;
    if (status >= 500) return ErrorType.SERVER;
    return ErrorType.CLIENT;
  }
  if (error.response) return ErrorType.UNKNOWN;

  // Without an HTTP response, a known offline device is the most likely cause of any failure.
  if (isDeviceOffline()) return ErrorType.OFFLINE;
  if (error.code === 'ERR_NETWORK' || NETWORK_MESSAGES.includes(error.message)) {
    return ErrorType.NETWORK;
  }
  return ErrorType.UNKNOWN;
};

/** True when the failure comes from the connection (offline, unreachable server, timeout). */
export const isConnectivityError = (error) => CONNECTIVITY_TYPES.includes(getErrorType(error));

/**
 * True when the BrightMinds API doesn't know the endpoint ("Route not found: ..."), i.e. the server
 * runs an older version: callers fall back to the previous behavior.
 */
export const isRouteNotFound = (error) =>
  error?.response?.status === 404 &&
  String(error.response.data?.message || '').startsWith('Route not found');

/** Builds an error that renders as "not found", e.g. when the API answers 200 with no data. */
export const notFoundError = (message = 'Not found') =>
  Object.assign(new Error(message), { response: { status: 404 } });

const ERROR_MESSAGES = {
  [ErrorType.OFFLINE]: "You're offline. Check your internet connection and try again.",
  [ErrorType.NETWORK]: "We couldn't reach the server. Check your internet connection and try again.",
  [ErrorType.TIMEOUT]: 'The request timed out. Please check your connection and try again.',
  [ErrorType.SERVER]: 'The service is temporarily unavailable. Please try again in a moment.',
};

const getServerMessage = (error) => {
  const data = error?.response?.data;
  const message = data?.message ?? data?.error;
  return typeof message === 'string' && message.trim() ? message : null;
};

/**
 * User-facing message for any failure. Connectivity and server (5xx) failures get a generic
 * explanation; validation errors (4xx) show the message sent by the API, else `fallback`.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  ERROR_MESSAGES[getErrorType(error)] || getServerMessage(error) || fallback;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Only idempotent GETs are retried, once, for failures that are usually transient.
// Timeouts are not retried: the user already waited the full timeout.
const shouldRetry = (error) => {
  const { config } = error;
  if (!config || (config.method || 'get').toLowerCase() !== 'get') return false;
  if ((config.retryAttempt || 0) >= (config.retries ?? 1)) return false;
  const status = error.response?.status;
  if (status) return RETRYABLE_STATUSES.includes(status);
  const type = getErrorType(error);
  return type === ErrorType.OFFLINE || type === ErrorType.NETWORK;
};

const withResilience = (instance) => {
  instance.interceptors.response.use(
    (response) => {
      reportOnline();
      return response;
    },
    async (error) => {
      if (error?.response) reportOnline();
      if (!shouldRetry(error)) throw error;
      error.config.retryAttempt = (error.config.retryAttempt || 0) + 1;
      await wait(RETRY_DELAY_MS);
      return instance.request(error.config);
    }
  );
  return instance;
};

// BrightMinds backend. Use relative paths: api.get(`/user/${userId}`)
// Pass `{ retries: 0 }` to disable the automatic retry of a GET.
export const api = withResilience(
  axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
  })
);

// Public OpenAlex API (research papers / topics).
export const openAlex = withResilience(
  axios.create({
    baseURL: OPENALEX_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
  })
);

// Logos rarely change, so they are cached for the lifetime of the app session.
const universityLogoCache = new Map();

export const getUniversityLogo = (universityName) => {
  if (!universityName) return Promise.resolve(null);
  if (!universityLogoCache.has(universityName)) {
    const request = api
      .get(`/university/by/name/${encodeURIComponent(universityName)}`, {
        timeout: OPTIONAL_REQUEST_TIMEOUT_MS,
        retries: 0,
      })
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
