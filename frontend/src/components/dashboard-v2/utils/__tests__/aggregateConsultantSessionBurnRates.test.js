/**
 * §D 회기 소진율 가중 집계 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-07-29
 */

import { aggregateConsultantSessionBurnRates } from '../aggregateConsultantSessionBurnRates';
import {
  SESSION_BURN_TOP_LIMIT,
  MAPPING_STATUS_ACTIVE
} from '../../../../constants/adminDashboardWidgetConstants';

describe('aggregateConsultantSessionBurnRates', () => {
  it('빈/비배열 입력은 빈 배열을 반환한다', () => {
    expect(aggregateConsultantSessionBurnRates([])).toEqual([]);
    expect(aggregateConsultantSessionBurnRates(null)).toEqual([]);
    expect(aggregateConsultantSessionBurnRates(undefined)).toEqual([]);
  });

  it('ACTIVE·consultantId·totalSessions>0 만 집계한다', () => {
    const rows = aggregateConsultantSessionBurnRates([
      { status: MAPPING_STATUS_ACTIVE, consultantId: 1, consultantName: 'A', usedSessions: 5, totalSessions: 10, remainingSessions: 5 },
      { status: 'INACTIVE', consultantId: 1, consultantName: 'A', usedSessions: 9, totalSessions: 10, remainingSessions: 1 },
      { status: MAPPING_STATUS_ACTIVE, consultantId: null, consultantName: 'X', usedSessions: 1, totalSessions: 2, remainingSessions: 1 },
      { status: MAPPING_STATUS_ACTIVE, consultantId: 2, consultantName: 'B', usedSessions: 0, totalSessions: 0, remainingSessions: 0 }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].consultantId).toBe(1);
    expect(rows[0].burnRate).toBe(50);
    expect(rows[0].remainingSessions).toBe(5);
  });

  it('가중 집계: Σused/Σtotal (단순 평균과 다를 수 있음)', () => {
    // 단순 평균: (90% + 1%) / 2 = 45.5 → 46
    // 가중: (9+1)/(10+100) = 10/110 ≈ 9%
    const rows = aggregateConsultantSessionBurnRates([
      { status: MAPPING_STATUS_ACTIVE, consultantId: 1, consultantName: 'A', usedSessions: 9, totalSessions: 10, remainingSessions: 1 },
      { status: MAPPING_STATUS_ACTIVE, consultantId: 1, consultantName: 'A', usedSessions: 1, totalSessions: 100, remainingSessions: 99 }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].usedSessions).toBe(10);
    expect(rows[0].totalSessions).toBe(110);
    expect(rows[0].burnRate).toBe(9);
    expect(rows[0].remainingSessions).toBe(100);
  });

  it('사용 회기(합산) DESC → 잔여 ASC 정렬 후 topLimit 적용', () => {
    const mappings = [];
    for (let i = 1; i <= 12; i += 1) {
      mappings.push({
        status: MAPPING_STATUS_ACTIVE,
        consultantId: i,
        consultantName: `C${i}`,
        usedSessions: i,
        totalSessions: 12,
        remainingSessions: 12 - i
      });
    }
    const rows = aggregateConsultantSessionBurnRates(mappings);
    expect(rows).toHaveLength(SESSION_BURN_TOP_LIMIT);
    expect(rows[0].consultantId).toBe(12);
    expect(rows[0].usedSessions).toBe(12);
    expect(rows[rows.length - 1].consultantId).toBe(3);
    expect(rows[rows.length - 1].usedSessions).toBe(3);
  });

  it('%가 높아도 사용 회기가 적으면 하위 순위', () => {
    // 피드백 예: 57%·잔여17 vs 31%·잔여90 → 절대 사용 회기 기준이면 후자가 상위
    const rows = aggregateConsultantSessionBurnRates([
      {
        status: MAPPING_STATUS_ACTIVE,
        consultantId: 1,
        consultantName: 'HighPct',
        usedSessions: 17,
        totalSessions: 30,
        remainingSessions: 17
      },
      {
        status: MAPPING_STATUS_ACTIVE,
        consultantId: 2,
        consultantName: 'HighUsed',
        usedSessions: 40,
        totalSessions: 130,
        remainingSessions: 90
      }
    ]);
    expect(rows[0].consultantId).toBe(2);
    expect(rows[0].usedSessions).toBe(40);
    expect(rows[0].burnRate).toBe(31);
    expect(rows[1].consultantId).toBe(1);
    expect(rows[1].usedSessions).toBe(17);
    expect(rows[1].burnRate).toBe(57);
  });

  it('사용 회기 동점이면 잔여 적은 쪽이 우선', () => {
    const rows = aggregateConsultantSessionBurnRates([
      {
        status: MAPPING_STATUS_ACTIVE,
        consultantId: 10,
        consultantName: 'MoreRemain',
        usedSessions: 20,
        totalSessions: 50,
        remainingSessions: 30
      },
      {
        status: MAPPING_STATUS_ACTIVE,
        consultantId: 11,
        consultantName: 'LessRemain',
        usedSessions: 20,
        totalSessions: 40,
        remainingSessions: 20
      }
    ]);
    expect(rows[0].consultantId).toBe(11);
    expect(rows[1].consultantId).toBe(10);
  });

  it('used > total 이면 표시율은 100으로 clamp', () => {
    const rows = aggregateConsultantSessionBurnRates([
      {
        status: MAPPING_STATUS_ACTIVE,
        consultantId: 7,
        consultantName: 'Over',
        usedSessions: 15,
        totalSessions: 10,
        remainingSessions: 0
      }
    ]);
    expect(rows[0].burnRate).toBe(100);
  });

  it('consultantName 없으면 nameByConsultantId 폴백을 사용한다', () => {
    const nameByConsultantId = new Map([['3', '통합데이터이름']]);
    const rows = aggregateConsultantSessionBurnRates(
      [
        {
          status: MAPPING_STATUS_ACTIVE,
          consultantId: 3,
          usedSessions: 2,
          totalSessions: 8,
          remainingSessions: 6
        }
      ],
      { nameByConsultantId }
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].consultantName).toBe('통합데이터이름');
    expect(rows[0].burnRate).toBe(25);
  });
});
