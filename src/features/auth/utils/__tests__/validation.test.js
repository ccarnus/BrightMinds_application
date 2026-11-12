import { getPasswordProblem, isValidEmail } from '../validation';

describe('getPasswordProblem', () => {
  test('accepts a normal password and says nothing while the field is empty', () => {
    expect(getPasswordProblem('')).toBeNull();
    expect(getPasswordProblem('long-enough-1')).toBeNull();
  });

  test('refuses short, blank and over-long (in bytes) passwords', () => {
    expect(getPasswordProblem('abc123')).toMatch(/at least 8/);
    expect(getPasswordProblem('          ')).toMatch(/only spaces/);
    expect(getPasswordProblem('é'.repeat(37))).toMatch(/too long/);
    expect(getPasswordProblem('é'.repeat(36))).toBeNull();
  });
});

describe('isValidEmail', () => {
  test('needs a domain with a real extension', () => {
    expect(isValidEmail(' me@uni.edu ')).toBe(true);
    expect(isValidEmail('me@uni')).toBe(false);
    expect(isValidEmail('me@uni.c')).toBe(false);
    expect(isValidEmail('me uni@x.com')).toBe(false);
  });
});
