/**
 * sessionManager — current-user soft-refresh 시 phone verified 게이트 필드 보존
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import { sessionManager } from '../sessionManager';

describe('sessionManager._preservePhoneGateFieldsFromPreviousUser', () => {
  test('newUser 가 phone/verified 를 생략하면 이전 값을 보존한다', () => {
    const previous = {
      id: 1,
      phone: '01012345678',
      phoneNumber: '01012345678',
      mobile: '01012345678',
      isPhoneVerified: true,
      phoneVerified: true,
      phoneVerifiedAt: '2026-09-18T00:00:00'
    };
    const next = {
      id: 1,
      email: 'a@b.test',
      name: '홍길동'
    };

    sessionManager._preservePhoneGateFieldsFromPreviousUser(previous, next);

    expect(next.phone).toBe('01012345678');
    expect(next.phoneNumber).toBe('01012345678');
    expect(next.mobile).toBe('01012345678');
    expect(next.isPhoneVerified).toBe(true);
    expect(next.phoneVerified).toBe(true);
    expect(next.phoneVerifiedAt).toBe('2026-09-18T00:00:00');
  });

  test('서버 true 는 로컬 false 보다 우선한다', () => {
    const previous = {
      phone: '01012345678',
      isPhoneVerified: false,
      phoneVerified: false
    };
    const next = {
      phone: '01012345678',
      isPhoneVerified: true
    };

    sessionManager._preservePhoneGateFieldsFromPreviousUser(previous, next);

    expect(next.isPhoneVerified).toBe(true);
    expect(next.phoneVerified).toBe(true);
  });

  test('서버가 명시적 false 여도 동일 번호·이전 verified true 이면 보존한다', () => {
    const previous = {
      phone: '01012345678',
      phoneNumber: '01012345678',
      isPhoneVerified: true,
      phoneVerified: true
    };
    const next = {
      phone: '01012345678',
      phoneNumber: '01012345678',
      isPhoneVerified: false,
      phoneVerified: false
    };

    sessionManager._preservePhoneGateFieldsFromPreviousUser(previous, next);

    expect(next.isPhoneVerified).toBe(true);
    expect(next.phoneVerified).toBe(true);
  });

  test('번호가 바뀌면 서버 false 를 따른다', () => {
    const previous = {
      phone: '01012345678',
      isPhoneVerified: true,
      phoneVerified: true
    };
    const next = {
      phone: '01099998888',
      isPhoneVerified: false
    };

    sessionManager._preservePhoneGateFieldsFromPreviousUser(previous, next);

    expect(next.isPhoneVerified).toBe(false);
  });
});
