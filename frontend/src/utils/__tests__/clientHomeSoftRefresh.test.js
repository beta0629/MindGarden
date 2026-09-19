/**
 * clientHomeSoftRefresh — 홈 매핑 soft-refresh 요청/소비
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import {
  CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT,
  CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY,
  consumeClientHomeMappingsSoftRefreshFlag,
  requestClientHomeMappingsSoftRefresh
} from '../clientHomeSoftRefresh';

describe('clientHomeSoftRefresh', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('request sets sessionStorage flag and dispatches custom event', () => {
    const handler = jest.fn();
    window.addEventListener(CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT, handler);
    requestClientHomeMappingsSoftRefresh();
    expect(sessionStorage.getItem(CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY)).toBe('1');
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT, handler);
  });

  test('consume clears flag and returns true once', () => {
    sessionStorage.setItem(CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY, '1');
    expect(consumeClientHomeMappingsSoftRefreshFlag()).toBe(true);
    expect(sessionStorage.getItem(CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY)).toBeNull();
    expect(consumeClientHomeMappingsSoftRefreshFlag()).toBe(false);
  });
});
