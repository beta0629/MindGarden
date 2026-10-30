import { lnbSublistId } from '../lnbAccordion';

describe('lnbSublistId — aria-controls 유효 IDREF', () => {
  it('라벨::경로 키에도 공백 없는 단일 토큰', () => {
    const id = lnbSublistId('mg-v2-mobile-lnb', '일정 관리::/consultant/schedule');
    expect(id).not.toMatch(/\s/);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('메뉴코드 키는 그대로 유지, 서로 다른 키는 다른 id', () => {
    expect(lnbSublistId('p', 'ADM_USERS')).toBe('p-sublist-ADM_USERS');
    expect(lnbSublistId('p', '상담 기록::/a')).not.toBe(lnbSublistId('p', '일정 관리::/a'));
  });
});
