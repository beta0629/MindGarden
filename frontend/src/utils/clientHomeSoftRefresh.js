/**
 * 내담자 홈 매핑·잔여 회기 soft-refresh (full page reload 금지).
 * 결제 verify SUCCESS / fulfill-retry SUCCESS 후 ClientDashboard 가 silent refetch.
 *
 * @author MindGarden
 * @since 2026-09-19
 */

export const CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT = 'client-home-mappings-soft-refresh';

export const CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY = 'mg.clientHome.mappingsSoftRefresh';

/**
 * 결제·재이행 성공 후 홈 잔여 soft-refresh 요청 (event + sessionStorage flag).
 *
 * @returns {void}
 */
export function requestClientHomeMappingsSoftRefresh() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY, '1');
    }
  } catch {
    // private mode 등 — event 만으로도 동작
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT));
  }
}

/**
 * 홈 마운트 시 sessionStorage flag 소비 (navigate 후 리스너 미장착 대비).
 *
 * @returns {boolean} flag 가 있으면 true
 */
export function consumeClientHomeMappingsSoftRefreshFlag() {
  try {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }
    const value = sessionStorage.getItem(CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY);
    if (value) {
      sessionStorage.removeItem(CLIENT_HOME_SOFT_REFRESH_STORAGE_KEY);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
