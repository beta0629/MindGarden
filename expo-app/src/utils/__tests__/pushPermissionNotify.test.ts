import {
  PUSH_REGISTER_FAILURE_NOT_A_DEVICE,
  PUSH_REGISTER_FAILURE_PERMISSION_DENIED,
  shouldNotifyUserForPushRegisterFailure,
} from '@/constants/pushPermissionNotify';

describe('shouldNotifyUserForPushRegisterFailure', () => {
  it('returns true only for actionable permission denied', () => {
    expect(shouldNotifyUserForPushRegisterFailure(PUSH_REGISTER_FAILURE_PERMISSION_DENIED)).toBe(
      true,
    );
  });

  it('returns false for simulator / non-device', () => {
    expect(shouldNotifyUserForPushRegisterFailure(PUSH_REGISTER_FAILURE_NOT_A_DEVICE)).toBe(false);
  });

  it('returns false for transient token / auth / API failures and unknown', () => {
    expect(shouldNotifyUserForPushRegisterFailure('push_token_unavailable')).toBe(false);
    expect(shouldNotifyUserForPushRegisterFailure('auth_or_tenant_missing')).toBe(false);
    expect(shouldNotifyUserForPushRegisterFailure('network')).toBe(false);
    expect(shouldNotifyUserForPushRegisterFailure('register_api_error')).toBe(false);
    expect(shouldNotifyUserForPushRegisterFailure('')).toBe(false);
    expect(shouldNotifyUserForPushRegisterFailure('unknown')).toBe(false);
  });
});
