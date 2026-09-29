/**
 * 회기 소진율 집계 입력 — adminMappingsListGetAll envelope.
 * 대시보드 목록 page size로 자르지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-28
 */

import { resolveSessionBurnMappingList } from '../resolveSessionBurnMappingList';
import { aggregateConsultantSessionBurnRates } from '../aggregateConsultantSessionBurnRates';
import {
  ADMIN_DASHBOARD_LIST_PAGE_SIZE,
  MAPPING_STATUS_ACTIVE
} from '../../../../constants/adminDashboardWidgetConstants';

function buildActiveMapping(consultantId, usedSessions) {
  return {
    status: MAPPING_STATUS_ACTIVE,
    consultantId,
    consultantName: `상담사${consultantId}`,
    usedSessions,
    totalSessions: usedSessions + 10,
    remainingSessions: 10
  };
}

describe('resolveSessionBurnMappingList', () => {
  it('응답이 없으면 빈 배열이다', () => {
    expect(resolveSessionBurnMappingList(null)).toEqual([]);
    expect(resolveSessionBurnMappingList(undefined)).toEqual([]);
    expect(resolveSessionBurnMappingList({ mappings: [] })).toEqual([]);
  });

  it('mappings envelope 전체를 반환하고 page size로 자르지 않는다', () => {
    const count = ADMIN_DASHBOARD_LIST_PAGE_SIZE + 1;
    const mappings = [];
    for (let id = 1; id <= count; id += 1) {
      mappings.push(buildActiveMapping(id, id));
    }

    const resolved = resolveSessionBurnMappingList({ mappings, count });

    expect(resolved).toHaveLength(count);
    expect(resolved.length).toBeGreaterThan(ADMIN_DASHBOARD_LIST_PAGE_SIZE);
    expect(resolved[resolved.length - 1].consultantId).toBe(count);
  });

  it('page size를 넘는 활성 배정이 있으면 마지막 상담사가 순위에 남는다', () => {
    const count = ADMIN_DASHBOARD_LIST_PAGE_SIZE + 1;
    const mappings = [];
    for (let id = 1; id <= count; id += 1) {
      mappings.push(buildActiveMapping(id, id));
    }

    const rows = aggregateConsultantSessionBurnRates(
      resolveSessionBurnMappingList({ mappings, count })
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].consultantId).toBe(count);
    expect(rows[0].usedSessions).toBe(count);
  });

  it('배정이 없으면 집계도 빈 배열이다', () => {
    expect(aggregateConsultantSessionBurnRates(resolveSessionBurnMappingList({ mappings: [] })))
      .toEqual([]);
  });
});
