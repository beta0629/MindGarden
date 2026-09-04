/**
 * UserManagementPage — deep link 쿼리 type/id 파싱 회귀 가드.
 *
 * @author MindGarden
 * @since 2026-09-04
 */

import {
  getUserManagementIdFromParams,
  getUserManagementTypeFromParams
} from '../../../utils/userManagementInitialPeek';

describe('getUserManagementIdFromParams', () => {
  test('?id= 있으면 문자열 반환', () => {
    const params = new URLSearchParams('type=client&id=42');
    expect(getUserManagementIdFromParams(params)).toBe('42');
  });

  test('id 없음 → null (type-only)', () => {
    expect(getUserManagementIdFromParams(new URLSearchParams('type=client'))).toBeNull();
  });

  test('빈 id → null', () => {
    expect(getUserManagementIdFromParams(new URLSearchParams('type=consultant&id='))).toBeNull();
  });
});

describe('getUserManagementTypeFromParams (type-only 회귀)', () => {
  test('type=client|consultant|staff|pending-deletion', () => {
    expect(getUserManagementTypeFromParams(new URLSearchParams('type=client'))).toBe('client');
    expect(getUserManagementTypeFromParams(new URLSearchParams('type=consultant'))).toBe('consultant');
    expect(getUserManagementTypeFromParams(new URLSearchParams('type=staff'))).toBe('staff');
    expect(getUserManagementTypeFromParams(new URLSearchParams('type=pending-deletion'))).toBe('pending-deletion');
  });

  test('type 없으면 기본 client', () => {
    expect(getUserManagementTypeFromParams(new URLSearchParams(''))).toBe('client');
  });
});
