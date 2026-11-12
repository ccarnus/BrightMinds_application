export const MIN_PASSWORD_LENGTH = 8;
// bcrypt, used by the server, only reads the first 72 bytes.
export const MAX_PASSWORD_BYTES = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email) => EMAIL_PATTERN.test((email || '').trim());

const utf8Length = (text) => {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
};

/** Why a new password would be refused (same rules as the server), or null when it is fine. */
export const getPasswordProblem = (password) => {
  if (!password) return null;
  if (!password.trim()) return 'Your password cannot be only spaces.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (utf8Length(password) > MAX_PASSWORD_BYTES) return 'This password is too long.';
  return null;
};
