import { api, getUniversityLogo, getErrorMessage, clearUniversityLogoCache } from '@shared/api/client';
import { API_BASE_URL } from '@shared/config/APIConfig';

describe('api client', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    clearUniversityLogoCache();
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
    expect(get).toHaveBeenCalledWith('/university/by/name/Univ%20A');
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

  it('builds user-friendly error messages', () => {
    expect(getErrorMessage({ response: { data: { message: 'Invalid password' } } })).toBe('Invalid password');
    expect(getErrorMessage({ code: 'ECONNABORTED' })).toMatch(/timed out/);
    expect(getErrorMessage({ message: 'Network Error' })).toMatch(/internet/);
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
  });
});
