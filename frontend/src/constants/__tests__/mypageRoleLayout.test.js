/**
 * MYPAGE_ROLE_LAYOUT — 역할별 섹션 순서 · aside 구성 · Q1/Q3 · ?tab= 매핑
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import {
  MYPAGE_FEATURE_READY,
  MYPAGE_HIDE_FIELDS,
  MYPAGE_ROLE_LAYOUT,
  MYPAGE_ROLE_LAYOUT_KEYS,
  resolveMypageRoleLayout,
  resolveMypageRoleLayoutKey,
  resolveMypageScrollTarget
} from '../mypageRoleLayout';
import { USER_ROLES } from '../roles';

describe('MYPAGE_ROLE_LAYOUT', () => {
  test('section order per role (snapshot)', () => {
    const summary = Object.fromEntries(
      Object.entries(MYPAGE_ROLE_LAYOUT).map(([key, config]) => [
        key,
        {
          layout: config.layout,
          surface: config.surface,
          sections: config.sections,
          linksTitle: config.linksTitle,
          links: config.links.map((link) => `${link.chip}·${link.title}`),
          hideFields: config.hideFields
        }
      ])
    );
    expect(summary).toMatchSnapshot();
  });

  test('operator: basic · security · social · privacy, no links, Q3 hides address/gender and 회원 탈퇴', () => {
    const operator = MYPAGE_ROLE_LAYOUT[MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR];
    expect(operator.sections).toEqual(['basic', 'security', 'social', 'privacy']);
    expect(operator.sections).not.toContain('account');
    expect(operator.links).toHaveLength(0);
    expect(operator.hideFields).toEqual([MYPAGE_HIDE_FIELDS.ADDRESS, MYPAGE_HIDE_FIELDS.GENDER]);
  });

  test('operatorDual and consultant share the counseling section order', () => {
    const expected = ['basic', 'counsel', 'notify', 'security', 'social', 'privacy', 'account'];
    expect(MYPAGE_ROLE_LAYOUT.operatorDual.sections).toEqual(expected);
    expect(MYPAGE_ROLE_LAYOUT.consultant.sections).toEqual(expected);
  });

  test('client: single stage on card surface', () => {
    const client = MYPAGE_ROLE_LAYOUT.client;
    expect(client.layout).toBe('single');
    expect(client.surface).toBe('card');
    expect(client.sections).toEqual(['basic', 'notify', 'security', 'social', 'privacy', 'account']);
  });

  test('Q1: every not-ready feature flag is false', () => {
    Object.values(MYPAGE_FEATURE_READY).forEach((flag) => expect(flag).toBe(false));
  });

  test('role → layout key', () => {
    expect(resolveMypageRoleLayoutKey({ role: USER_ROLES.CLIENT })).toBe('client');
    expect(resolveMypageRoleLayoutKey({ role: USER_ROLES.CONSULTANT })).toBe('consultant');
    expect(resolveMypageRoleLayoutKey({ role: USER_ROLES.ADMIN })).toBe('operator');
    expect(resolveMypageRoleLayoutKey({ role: USER_ROLES.ADMIN, counselingEnabled: true })).toBe('operatorDual');
    expect(resolveMypageRoleLayoutKey(null)).toBe('operator');
    expect(resolveMypageRoleLayout({ role: USER_ROLES.CLIENT }).key).toBe('client');
  });

  test('?tab= / #hash → section anchor, unknown → top', () => {
    const sections = MYPAGE_ROLE_LAYOUT.consultant.sections;
    expect(resolveMypageScrollTarget({ tab: 'profile', sections })).toBe('basic');
    expect(resolveMypageScrollTarget({ tab: 'settings', sections })).toBe('notify');
    expect(resolveMypageScrollTarget({ tab: 'security', sections })).toBe('security');
    expect(resolveMypageScrollTarget({ tab: 'social', sections })).toBe('social');
    expect(resolveMypageScrollTarget({ tab: 'privacy', sections })).toBe('privacy');
    expect(resolveMypageScrollTarget({ tab: 'unknown', sections })).toBe('');
    expect(resolveMypageScrollTarget({ hash: '#notify', sections })).toBe('notify');
    expect(
      resolveMypageScrollTarget({ tab: 'settings', sections: MYPAGE_ROLE_LAYOUT.operator.sections })
    ).toBe('');
  });
});
