/**
 * Seq 28b — 사용자 관리 3탭 viewMode localStorage 영속화 pageId SSOT
 */
import { USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../../common/ViewModeToggle';
import {
  buildViewModeStorageKey,
  useViewModePreference
} from '../../../hooks/useViewModePreference';
import { act, renderHook } from '@testing-library/react';

const USER_MANAGEMENT_ALLOWED_VIEW_MODES = ['largeCard', 'smallCard', 'list'];
const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };

const PAGE_IDS = {
  client: 'admin.user-management.client',
  consultant: 'admin.user-management.consultant',
  staff: 'admin.user-management.staff'
};

describe('사용자 관리 viewMode 영속화 (28b)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('탭별 pageId가 서로 다른 storageKey를 생성한다', () => {
    const clientKey = buildViewModeStorageKey(SCOPE, PAGE_IDS.client);
    const consultantKey = buildViewModeStorageKey(SCOPE, PAGE_IDS.consultant);
    const staffKey = buildViewModeStorageKey(SCOPE, PAGE_IDS.staff);

    expect(clientKey).toContain(PAGE_IDS.client);
    expect(consultantKey).toContain(PAGE_IDS.consultant);
    expect(staffKey).toContain(PAGE_IDS.staff);
    expect(new Set([clientKey, consultantKey, staffKey]).size).toBe(3);
  });

  it.each([
    ['client', PAGE_IDS.client],
    ['consultant', PAGE_IDS.consultant],
    ['staff', PAGE_IDS.staff]
  ])('%s 탭은 저장된 viewMode를 복원한다', (_label, pageId) => {
    const storageKey = buildViewModeStorageKey(SCOPE, pageId);
    localStorage.setItem(storageKey, 'list');

    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey,
        defaultMode: USER_MANAGEMENT_DEFAULT_VIEW_MODE,
        allowedModes: USER_MANAGEMENT_ALLOWED_VIEW_MODES
      })
    );

    expect(result.current.viewMode).toBe('list');

    act(() => {
      result.current.setViewMode('largeCard');
    });

    expect(localStorage.getItem(storageKey)).toBe('largeCard');
  });
});
