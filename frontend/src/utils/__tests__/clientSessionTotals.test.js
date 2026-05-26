import { calculateClientSessionTotalsFromMappings } from '../clientSessionTotals';

describe('calculateClientSessionTotalsFromMappings — 회기 SSOT 합계 (P1-C)', () => {
  it('빈 배열·null·undefined 입력은 0 합계를 반환한다', () => {
    expect(calculateClientSessionTotalsFromMappings([])).toEqual({
      totalSessions: 0,
      usedSessions: 0,
      remainingSessions: 0
    });
    expect(calculateClientSessionTotalsFromMappings(null)).toEqual({
      totalSessions: 0,
      usedSessions: 0,
      remainingSessions: 0
    });
    expect(calculateClientSessionTotalsFromMappings(undefined)).toEqual({
      totalSessions: 0,
      usedSessions: 0,
      remainingSessions: 0
    });
  });

  it('단일 mapping 은 mapping SSOT 필드를 그대로 반환한다 (Schedule.status 우회 없음)', () => {
    const mappings = [
      { id: 1, totalSessions: 10, usedSessions: 4, remainingSessions: 6 }
    ];
    expect(calculateClientSessionTotalsFromMappings(mappings)).toEqual({
      totalSessions: 10,
      usedSessions: 4,
      remainingSessions: 6
    });
  });

  it('여러 mapping 합산 — used/remaining 은 schedules 상태 카운트가 아닌 mapping SSOT 직접 합산', () => {
    const mappings = [
      { id: 1, totalSessions: 10, usedSessions: 7, remainingSessions: 3 },
      { id: 2, totalSessions: 5, usedSessions: 2, remainingSessions: 3 },
      { id: 3, totalSessions: 8, usedSessions: 8, remainingSessions: 0 }
    ];
    expect(calculateClientSessionTotalsFromMappings(mappings)).toEqual({
      totalSessions: 23,
      usedSessions: 17,
      remainingSessions: 6
    });
  });

  it('mapping 필드 누락(undefined/null) 시 0 으로 안전 처리한다', () => {
    const mappings = [
      { id: 1, totalSessions: 10 },
      { id: 2, totalSessions: null, usedSessions: 3, remainingSessions: 2 },
      { id: 3, usedSessions: 5 }
    ];
    expect(calculateClientSessionTotalsFromMappings(mappings)).toEqual({
      totalSessions: 10,
      usedSessions: 8,
      remainingSessions: 2
    });
  });

  it('숫자 변환 실패(문자열/NaN) 필드는 0 으로 합산된다', () => {
    const mappings = [
      { id: 1, totalSessions: '10', usedSessions: '3', remainingSessions: '7' },
      { id: 2, totalSessions: 'abc', usedSessions: NaN, remainingSessions: undefined }
    ];
    expect(calculateClientSessionTotalsFromMappings(mappings)).toEqual({
      totalSessions: 10,
      usedSessions: 3,
      remainingSessions: 7
    });
  });

  it('회귀 가드: schedules 의 status 한글 비교 우회 결과(usedSessions=0)와 다르게 mapping SSOT 결과는 정확해야 한다', () => {
    // 시나리오: 백엔드는 Schedule.status=COMPLETED 인데 프론트가 '완료' 와 비교하면 항상 0.
    // 본 유틸은 mapping.usedSessions SSOT 만 합산하므로 schedules 입력 자체가 없어도 정확해야 한다.
    const mappings = [
      { id: 1, totalSessions: 10, usedSessions: 5, remainingSessions: 5 }
    ];
    const totals = calculateClientSessionTotalsFromMappings(mappings);
    expect(totals.usedSessions).toBe(5); // 우회 코드라면 0
    expect(totals.remainingSessions).toBe(5);
  });

  it('mapping 이 null 인 항목은 무시한다', () => {
    const mappings = [
      null,
      { id: 1, totalSessions: 4, usedSessions: 1, remainingSessions: 3 },
      undefined
    ];
    expect(calculateClientSessionTotalsFromMappings(mappings)).toEqual({
      totalSessions: 4,
      usedSessions: 1,
      remainingSessions: 3
    });
  });
});
