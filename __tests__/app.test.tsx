// Unit tests for auth utility functions

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('rejects email without @', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects email with spaces', () => {
    expect(isValidEmail('te st@example.com')).toBe(false);
  });
});
