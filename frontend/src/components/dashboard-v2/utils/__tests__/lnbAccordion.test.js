/**
 * lnbAccordion 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import {
  getInitialExpandedKey,
  getLnbItemKey,
  isGroupPathActive,
  isLnbPathMatch
} from '../lnbAccordion';

describe('lnbAccordion', () => {
  const settingsGroup = {
    to: '/tenant/profile',
    label: '시스템·설정',
    menuCode: 'ADM_SETTINGS',
    children: [
      { to: '/admin/sms-templates', label: 'SMS 템플릿 관리' },
      { to: '/admin/common-codes', label: '공통코드' }
    ]
  };

  const legacyAdminGroup = {
    to: '/admin',
    label: '시스템 관리',
    menuCode: 'SYSTEM_ADMIN',
    children: [
      { to: '/admin/organization', label: '조직 관리' }
    ]
  };

  it('getLnbItemKey 는 menuCode 우선, 없으면 label::to', () => {
    expect(getLnbItemKey(settingsGroup)).toBe('ADM_SETTINGS');
    expect(getLnbItemKey({ label: '운영·재무', to: '/erp/dashboard' }))
      .toBe('운영·재무::/erp/dashboard');
  });

  it('isLnbPathMatch 는 exact 와 nested 를 허용한다', () => {
    expect(isLnbPathMatch('/admin/billing', '/admin/billing')).toBe(true);
    expect(isLnbPathMatch('/admin/billing', '/admin/billing/subscriptions')).toBe(true);
    expect(isLnbPathMatch('/admin/billing', '/admin/bill')).toBe(false);
  });

  it('isGroupPathActive 는 그룹 to 의 prefix 매칭을 하지 않는다', () => {
    expect(isGroupPathActive(legacyAdminGroup, '/admin/sms-templates')).toBe(false);
    expect(isGroupPathActive(settingsGroup, '/admin/sms-templates')).toBe(true);
    expect(isGroupPathActive(settingsGroup, '/tenant/profile')).toBe(true);
  });

  it('getInitialExpandedKey 는 자식 매칭 그룹만 반환한다', () => {
    const items = [
      { to: '/admin/dashboard', label: '대시보드', menuCode: 'ADM_DASHBOARD' },
      legacyAdminGroup,
      settingsGroup
    ];
    expect(getInitialExpandedKey(items, '/admin/sms-templates')).toBe('ADM_SETTINGS');
    expect(getInitialExpandedKey(items, '/admin/dashboard')).toBeNull();
  });
});
