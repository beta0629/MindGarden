/**
 * userManagementInitialPeek — deep link id → Side Peek 대상 조회.
 *
 * @author MindGarden
 * @since 2026-09-04
 */

import {
  findEntityByIdForInitialPeek,
  resolveInitialPeekAction
} from '../../../utils/userManagementInitialPeek';

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

describe('resolveInitialPeekAction', () => {
  const clients = [
    { id: 10, name: '내담자A' },
    { id: 20, name: '내담자B' }
  ];

  test('hydrated empty → wait (latch 안 함)', () => {
    expect(
      resolveInitialPeekAction({
        alreadyOpened: false,
        id: '10',
        listHydrated: true,
        entities: []
      })
    ).toEqual({ action: 'wait' });
  });

  test('hydrated empty then non-empty matching id → open (재시도 시나리오)', () => {
    const first = resolveInitialPeekAction({
      alreadyOpened: false,
      id: '10',
      listHydrated: true,
      entities: []
    });
    expect(first).toEqual({ action: 'wait' });

    const second = resolveInitialPeekAction({
      alreadyOpened: false,
      id: '10',
      listHydrated: true,
      entities: clients
    });
    expect(second).toEqual({ action: 'open', entity: clients[0] });
  });

  test('hydrated non-empty missing id → give_up', () => {
    expect(
      resolveInitialPeekAction({
        alreadyOpened: false,
        id: '999',
        listHydrated: true,
        entities: clients
      })
    ).toEqual({ action: 'give_up' });
  });

  test('alreadyOpened → skip', () => {
    expect(
      resolveInitialPeekAction({
        alreadyOpened: true,
        id: '10',
        listHydrated: true,
        entities: clients
      })
    ).toEqual({ action: 'skip' });
  });

  test('!listHydrated → wait', () => {
    expect(
      resolveInitialPeekAction({
        alreadyOpened: false,
        id: '10',
        listHydrated: false,
        entities: clients
      })
    ).toEqual({ action: 'wait' });
  });

  test('id null/빈값 → skip', () => {
    expect(
      resolveInitialPeekAction({
        alreadyOpened: false,
        id: null,
        listHydrated: true,
        entities: clients
      })
    ).toEqual({ action: 'skip' });
    expect(
      resolveInitialPeekAction({
        alreadyOpened: false,
        id: '',
        listHydrated: true,
        entities: clients
      })
    ).toEqual({ action: 'skip' });
  });

  test('open 시 entity 반환', () => {
    const result = resolveInitialPeekAction({
      alreadyOpened: false,
      id: 20,
      listHydrated: true,
      entities: clients
    });
    expect(result.action).toBe('open');
    expect(result.entity).toEqual(clients[1]);
  });

  test('hydrated + non-array entities → wait (latch 금지)', () => {
    expect(
      resolveInitialPeekAction({
        alreadyOpened: false,
        id: '10',
        listHydrated: true,
        entities: null
      })
    ).toEqual({ action: 'wait' });
  });
});
