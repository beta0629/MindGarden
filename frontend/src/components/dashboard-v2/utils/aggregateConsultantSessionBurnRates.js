/**
 * §D 회기 소진율 — ACTIVE 매핑 상담사별 가중 집계.
 *
 * 집계(가중): burnRate = round(ΣusedSessions / ΣtotalSessions * 100) — 표시용.
 * 랭킹: usedSessions(합산 사용 회기) 내림차순 → remainingSessions 오름차순 → consultantId.
 * Edge: totalSessions <= 0 매핑은 스킵. 동일 상담사에 유효 매핑이 없으면 랭킹 제외.
 * Edge: used > total 이면 표시율은 100으로 clamp (합산 분모는 유지).
 *
 * @author CoreSolution
 * @since 2026-07-29
 */

import { toSafeNumber, toDisplayString } from '../../../utils/safeDisplay';
import {
  SESSION_BURN_TOP_LIMIT,
  MAPPING_STATUS_ACTIVE
} from '../../../constants/adminDashboardWidgetConstants';

/**
 * 상담사 표시명 해석 — mapping.consultantName 우선, 없으면 nameByConsultantId 폴백.
 *
 * @param {object} mapping
 * @param {string} consultantKey
 * @param {Map<string, string>|Record<string, string>|null|undefined} nameByConsultantId
 * @returns {string}
 */
function resolveConsultantName(mapping, consultantKey, nameByConsultantId) {
  const fromMapping = toDisplayString(mapping?.consultantName, '');
  if (fromMapping && fromMapping !== '—' && fromMapping !== '-') {
    return fromMapping;
  }
  let fromLookup = '';
  if (nameByConsultantId instanceof Map) {
    fromLookup = toDisplayString(nameByConsultantId.get(consultantKey), '');
  } else if (nameByConsultantId != null && typeof nameByConsultantId === 'object') {
    fromLookup = toDisplayString(nameByConsultantId[consultantKey], '');
  }
  if (fromLookup && fromLookup !== '—' && fromLookup !== '-') {
    return fromLookup;
  }
  return '—';
}

/**
 * ACTIVE 매핑 목록에서 상담사별 회기 소진율 랭킹을 만든다.
 *
 * @param {Array<object>|null|undefined} mappings — mappings LIST 페이로드 배열
 * @param {{
 *   topLimit?: number,
 *   statusActive?: string,
 *   nameByConsultantId?: Map<string, string>|Record<string, string>
 * }} [options]
 * @returns {Array<{
 *   consultantId: number|string,
 *   consultantName: string,
 *   usedSessions: number,
 *   totalSessions: number,
 *   remainingSessions: number,
 *   burnRate: number
 * }>}
 */
export function aggregateConsultantSessionBurnRates(mappings, options = {}) {
  const topLimit = toSafeNumber(options.topLimit, SESSION_BURN_TOP_LIMIT);
  const statusActive = options.statusActive || MAPPING_STATUS_ACTIVE;
  const nameByConsultantId = options.nameByConsultantId;

  if (!Array.isArray(mappings) || mappings.length === 0) {
    return [];
  }

  /** @type {Map<string, {
   *   consultantId: number|string,
   *   consultantName: string,
   *   usedSessions: number,
   *   totalSessions: number,
   *   remainingSessions: number
   * }>} */
  const byConsultant = new Map();

  mappings.forEach((mapping) => {
    if (mapping == null || mapping.status !== statusActive) {
      return;
    }
    if (mapping.consultantId == null) {
      return;
    }

    const totalSessions = toSafeNumber(mapping.totalSessions, 0);
    if (totalSessions <= 0) {
      return;
    }

    const usedSessions = toSafeNumber(mapping.usedSessions, 0);
    const remainingSessions = toSafeNumber(mapping.remainingSessions, 0);
    const key = String(mapping.consultantId);
    const name = resolveConsultantName(mapping, key, nameByConsultantId);

    if (byConsultant.has(key)) {
      const row = byConsultant.get(key);
      row.usedSessions += usedSessions;
      row.totalSessions += totalSessions;
      row.remainingSessions += remainingSessions;
      if ((row.consultantName === '—' || row.consultantName === '-') && name !== '—') {
        row.consultantName = name;
      }
    } else {
      byConsultant.set(key, {
        consultantId: mapping.consultantId,
        consultantName: name,
        usedSessions,
        totalSessions,
        remainingSessions
      });
    }
  });

  return Array.from(byConsultant.values())
    .map((row) => {
      const rawRate =
        row.totalSessions > 0
          ? Math.round((row.usedSessions / row.totalSessions) * 100)
          : 0;
      const burnRate = Math.min(100, Math.max(0, rawRate));
      return {
        ...row,
        burnRate
      };
    })
    .sort(
      (a, b) =>
        b.usedSessions - a.usedSessions ||
        a.remainingSessions - b.remainingSessions ||
        String(a.consultantId).localeCompare(String(b.consultantId))
    )
    .slice(0, Math.max(0, topLimit));
}
