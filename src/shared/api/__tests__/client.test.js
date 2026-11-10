import axios, { AxiosError } from 'axios';
import { isDeviceOffline, reportOnline } from '@shared/utils/connectivity';
import {
  api,
  openAlex,
  getUniversityLogo,
  getErrorMessage,
  getErrorType,
  isConnectivityError,
  notFoundError,
  ErrorType,
  clearUniversityLogoCache,
  RETRY_DELAY_MS,
  OPTIONAL_REQUEST_TIMEOUT_MS,
} from '@shared/api/client';
import { API_BASE_URL } from '@shared/config/APIConfig';

jest.mock('@shared/utils/connectivity', () => ({
  isDeviceOffline: jest.fn(() => false),
  reportOnline: jest.fn(),
}));

const ok = (config, data = 'ok') => Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
const networkFailure = (config) => Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config));
const httpFailure = (status) => (config) =>
  Promise.reject(
    new AxiosError(`Status ${status}`, 'ERR_BAD_RESPONSE', config, null, {
      status,
      data: { message: 'Internal server error.' },
      headers: {},
      config,
    })
  );

describe('api client', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    clearUniversityLogoCache();
    isDeviceOffline.mockReturnValue(false);
    reportOnline.mockClear();
  });

  it('targets the BrightMinds API with a timeout', () => {
    expect(api.defaults.baseURL).toBe(API_BASE_URL);
    expect(api.defaults.timeout).toBeGreaterThan(0);
  });

  it('caches university logos and de-duplicates concurrent requests', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: { iconurl: 'https://logo.png' } });
    const [a, b] = await Promise.all([getUniversityLogo('Univ A'), getUniversityLogo('Univ A')]);
    await getUniversityLogo('Univ A');
    expect(a).toBe('https://logo.png');
    expect(b).toBe('https://logo.png');
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/university/by/name/Univ%20A', {
      timeout: OPTIONAL_REQUEST_TIMEOUT_MS,
      retries: 0,
    });
  });

  it('does not cache failures', async () => {
    const get = jest
      .spyOn(api, 'get')
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ data: { iconurl: 'x' } });
    expect(await getUniversityLogo('Univ B')).toBeNull();
    expect(await getUniversityLogo('Univ B')).toBe('x');
    expect(get).toHaveBeenCalledTimes(2);
    expect(await getUniversityLogo('')).toBeNull();
  });
});

describe('getErrorType', () => {
  afterEach(() => isDeviceOffline.mockReturnValue(false));

  it('classifies HTTP responses', () => {
    expect(getErrorType({ response: { status: 404 } })).toBe(ErrorType.NOT_FOUND);
    expect(getErrorType(notFoundError())).toBe(ErrorType.NOT_FOUND);
    expect(getErrorType({ response: { status: 408 } })).toBe(ErrorType.TIMEOUT);
    expect(getErrorType({ response: { status: 503 } })).toBe(ErrorType.SERVER);
    expect(getErrorType({ response: { status: 400 } })).toBe(ErrorType.CLIENT);
    expect(getErrorType({ response: { status: 401 } })).toBe(ErrorType.CLIENT);
  });

  it('classifies connection failures', () => {
    expect(getErrorType({ code: 'ECONNABORTED' })).toBe(ErrorType.TIMEOUT);
    expect(getErrorType({ code: 'ETIMEDOUT' })).toBe(ErrorType.TIMEOUT);
    expect(getErrorType({ message: 'Network Error' })).toBe(ErrorType.NETWORK);
    expect(getErrorType({ code: 'ERR_NETWORK' })).toBe(ErrorType.NETWORK);
    expect(getErrorType(new TypeError('Network request failed'))).toBe(ErrorType.NETWORK);
  });

  it('reports failures without a response as offline when the device is offline', () => {
    isDeviceOffline.mockReturnValue(true);
    expect(getErrorType({ message: 'Network Error' })).toBe(ErrorType.OFFLINE);
    expect(getErrorType(new Error('Playback failed'))).toBe(ErrorType.OFFLINE);
    // An HTTP answer proves the server was reached.
    expect(getErrorType({ response: { status: 500 } })).toBe(ErrorType.SERVER);
  });

  it('classifies cancellations and unknown errors', () => {
    expect(getErrorType(new axios.CanceledError())).toBe(ErrorType.CANCELED);
    expect(getErrorType(new Error('boom'))).toBe(ErrorType.UNKNOWN);
    expect(getErrorType(null)).toBe(ErrorType.UNKNOWN);
  });

  it('flags connectivity errors', () => {
    expect(isConnectivityError({ message: 'Network Error' })).toBe(true);
    expect(isConnectivityError({ code: 'ECONNABORTED' })).toBe(true);
    expect(isConnectivityError({ response: { status: 500 } })).toBe(false);
    expect(isConnectivityError(new Error('boom'))).toBe(false);
  });
});

describe('getErrorMessage', () => {
  afterEach(() => isDeviceOffline.mockReturnValue(false));

  it('shows the API message for validation errors', () => {
    expect(getErrorMessage({ response: { data: { message: 'Invalid password' } } })).toBe('Invalid password');
    expect(getErrorMessage({ response: { status: 409, data: { error: 'Resource already exists.' } } })).toBe(
      'Resource already exists.'
    );
  });

  it('hides raw server errors behind a friendly message', () => {
    const message = getErrorMessage({ response: { status: 500, data: { message: 'Internal server error.' } } });
    expect(message).toMatch(/temporarily unavailable/);
  });

  it('explains connection failures', () => {
    expect(getErrorMessage({ code: 'ECONNABORTED' })).toMatch(/timed out/);
    expect(getErrorMessage({ message: 'Network Error' })).toMatch(/internet/);
    isDeviceOffline.mockReturnValue(true);
    expect(getErrorMessage({ message: 'Network Error' })).toMatch(/offline/);
  });

  it('falls back when there is nothing useful to show', () => {
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ response: { status: 400, data: { message: { field: 'x' } } } }, 'fallback')).toBe(
      'fallback'
    );
    expect(getErrorMessage(notFoundError(), 'fallback')).toBe('fallback');
  });
});

describe('automatic retry', () => {
  afterEach(() => {
    jest.useRealTimers();
    isDeviceOffline.mockReturnValue(false);
    reportOnline.mockClear();
  });

  it('retries a GET once after a network failure', async () => {
    jest.useFakeTimers();
    const adapter = jest.fn().mockImplementationOnce(networkFailure).mockImplementationOnce((config) => ok(config));
    const request = api.get('/casts', { adapter });
    await jest.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    await expect(request).resolves.toMatchObject({ data: 'ok' });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(reportOnline).toHaveBeenCalled();
  });

  it('retries gateway errors but gives up after one retry', async () => {
    jest.useFakeTimers();
    const adapter = jest.fn(httpFailure(503));
    const request = openAlex.get('/works', { adapter });
    const assertion = expect(request).rejects.toMatchObject({ response: { status: 503 } });
    await jest.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    await assertion;
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('does not retry timeouts, server errors, writes or opted-out requests', async () => {
    const timeout = jest.fn((config) => Promise.reject(new AxiosError('timeout', 'ECONNABORTED', config)));
    await expect(api.get('/slow', { adapter: timeout })).rejects.toMatchObject({ code: 'ECONNABORTED' });
    expect(timeout).toHaveBeenCalledTimes(1);

    const serverError = jest.fn(httpFailure(500));
    await expect(api.get('/broken', { adapter: serverError })).rejects.toBeDefined();
    expect(serverError).toHaveBeenCalledTimes(1);

    const write = jest.fn(networkFailure);
    await expect(api.post('/user/login', {}, { adapter: write })).rejects.toBeDefined();
    expect(write).toHaveBeenCalledTimes(1);

    const optedOut = jest.fn(networkFailure);
    await expect(api.get('/logo', { adapter: optedOut, retries: 0 })).rejects.toBeDefined();
    expect(optedOut).toHaveBeenCalledTimes(1);
  });
});
