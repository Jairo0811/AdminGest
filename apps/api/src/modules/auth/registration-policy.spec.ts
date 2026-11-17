import { isPublicRegistrationEnabled } from './registration-policy';

describe('isPublicRegistrationEnabled', () => {
  it('is open in development and test, closed in production by default', () => {
    expect(isPublicRegistrationEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isPublicRegistrationEnabled({ NODE_ENV: 'test' })).toBe(true);
    expect(isPublicRegistrationEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('follows PUBLIC_REGISTRATION when it is set', () => {
    expect(
      isPublicRegistrationEnabled({ NODE_ENV: 'production', PUBLIC_REGISTRATION: 'true' }),
    ).toBe(true);
    expect(
      isPublicRegistrationEnabled({ NODE_ENV: 'development', PUBLIC_REGISTRATION: 'FALSE' }),
    ).toBe(false);
  });
});
