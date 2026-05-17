import {
  POST_AUTH_HOME_ADMIN,
  POST_AUTH_HOME_CLIENT,
  POST_AUTH_HOME_CONSULTANT,
  resolvePostAuthHomeHref,
} from '../resolvePostAuthHomeHref';

describe('resolvePostAuthHomeHref', () => {
  it('routes admin and staff to admin home', () => {
    expect(resolvePostAuthHomeHref('admin')).toBe(POST_AUTH_HOME_ADMIN);
    expect(resolvePostAuthHomeHref('staff')).toBe(POST_AUTH_HOME_ADMIN);
  });

  it('routes consultant to consultant home', () => {
    expect(resolvePostAuthHomeHref('consultant')).toBe(POST_AUTH_HOME_CONSULTANT);
  });

  it('routes client and unknown roles to client home', () => {
    expect(resolvePostAuthHomeHref('client')).toBe(POST_AUTH_HOME_CLIENT);
    expect(resolvePostAuthHomeHref(null)).toBe(POST_AUTH_HOME_CLIENT);
    expect(resolvePostAuthHomeHref(undefined)).toBe(POST_AUTH_HOME_CLIENT);
  });
});
