/**
 * sessionTransferHistory formatter / API mapping tests
 */

import {
  formatSessionTransferHeadline,
  formatSessionTransferMappingIds,
  mapSessionTransferHistoryItem,
  mapSessionTransferHistoryResponse,
  resolveSessionTransferVerb
} from '../sessionTransferHistory';
import {
  SESSION_TRANSFER_DIRECTION,
  SESSION_TRANSFER_HISTORY_UI
} from '../../constants/sessionTransferHistory';

describe('sessionTransferHistory formatter', () => {
  it('OUTGOING → 승계, INCOMING → 이관', () => {
    expect(resolveSessionTransferVerb(SESSION_TRANSFER_DIRECTION.OUTGOING)).toBe('승계');
    expect(resolveSessionTransferVerb(SESSION_TRANSFER_DIRECTION.INCOMING)).toBe('이관');
  });

  it('임선희 → 김예린: 6회 승계 헤드라인을 만든다', () => {
    expect(formatSessionTransferHeadline({
      fromClientName: '임선희',
      toClientName: '김예린',
      sessionCount: 6,
      direction: SESSION_TRANSFER_DIRECTION.OUTGOING
    })).toBe('임선희 → 김예린: 6회 승계');
  });

  it('김예린 → 임선희: 5회 이관 헤드라인을 만든다', () => {
    expect(formatSessionTransferHeadline({
      fromClientName: '김예린',
      toClientName: '임선희',
      sessionCount: 5,
      direction: SESSION_TRANSFER_DIRECTION.INCOMING
    })).toBe('김예린 → 임선희: 5회 이관');
  });

  it('빈 이름은 알 수 없음으로 대체한다', () => {
    expect(formatSessionTransferHeadline({
      fromClientName: null,
      toClientName: '김예린',
      sessionCount: 1,
      verb: '승계'
    })).toBe(`${SESSION_TRANSFER_HISTORY_UI.UNKNOWN_NAME} → 김예린: 1회 승계`);
  });

  it('매핑 ID 라벨을 포맷한다', () => {
    expect(formatSessionTransferMappingIds(5001, 5002)).toBe('매핑 #5001 → #5002');
    expect(formatSessionTransferMappingIds(null, null)).toBeNull();
  });
});

describe('sessionTransferHistory API mapping', () => {
  it('{ items } 응답을 화면용 항목으로 정규화한다', () => {
    const mapped = mapSessionTransferHistoryResponse({
      items: [
        {
          id: 1,
          occurredAt: '2026-03-01T10:00:00',
          sessionCount: 6,
          fromClientName: '임선희',
          toClientName: '김예린',
          fromMappingId: 5001,
          toMappingId: 5002,
          direction: 'OUTGOING',
          verb: '승계',
          reason: '가족'
        },
        {
          id: 2,
          sessionCount: 5,
          fromClientName: '김예린',
          toClientName: '임선희',
          fromMappingId: 5002,
          toMappingId: 5001,
          direction: 'INCOMING'
        }
      ]
    });

    expect(mapped).toHaveLength(2);
    expect(mapped[0].headline).toBe('임선희 → 김예린: 6회 승계');
    expect(mapped[0].mappingIdsLabel).toBe('매핑 #5001 → #5002');
    expect(mapped[0].reason).toBe('가족');
    expect(mapped[1].headline).toBe('김예린 → 임선희: 5회 이관');
    expect(mapped[1].verb).toBe('이관');
  });

  it('배열 payload 도 허용한다', () => {
    const mapped = mapSessionTransferHistoryResponse([
      { sessionCount: 2, fromClientName: 'A', toClientName: 'B', direction: 'OUTGOING' }
    ]);
    expect(mapped[0].headline).toBe('A → B: 2회 승계');
  });

  it('null 항목은 건너뛴다', () => {
    expect(mapSessionTransferHistoryItem(null)).toBeNull();
    expect(mapSessionTransferHistoryResponse({ items: [null, undefined] })).toEqual([]);
  });
});
