/**
 * userManagementInitialPeek — deep link id → Side Peek 대상 조회.
 *
 * @author MindGarden
 * @since 2026-09-04
 */

import { findEntityByIdForInitialPeek } from '../../../utils/userManagementInitialPeek';

describe('findEntityByIdForInitialPeek', () => {
  const clients = [
    { id: 10, name: '내담자A' },
    { id: 20, name: '내담자B' }
  ];

  test('숫자 id 일치 → 엔티티 반환 (peek open 대상)', () => {
    expect(findEntityByIdForInitialPeek(clients, 10)).toEqual(clients[0]);
  });

  test('문자열 id ↔ 숫자 id 불일치 방지 (String 비교)', () => {
    expect(findEntityByIdForInitialPeek(clients, '20')).toEqual(clients[1]);
  });

  test('없는 id → null (silent fallthrough, 목록만)', () => {
    expect(findEntityByIdForInitialPeek(clients, 999)).toBeNull();
    expect(findEntityByIdForInitialPeek(clients, 'missing')).toBeNull();
  });

  test('id missing/빈값 → null', () => {
    expect(findEntityByIdForInitialPeek(clients, null)).toBeNull();
    expect(findEntityByIdForInitialPeek(clients, undefined)).toBeNull();
    expect(findEntityByIdForInitialPeek(clients, '')).toBeNull();
  });

  test('빈·비배열 목록 → null (crash 없음)', () => {
    expect(findEntityByIdForInitialPeek([], 10)).toBeNull();
    expect(findEntityByIdForInitialPeek(null, 10)).toBeNull();
    expect(findEntityByIdForInitialPeek(undefined, 10)).toBeNull();
  });
});
