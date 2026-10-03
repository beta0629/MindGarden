/**
 * 급여 본정산 빠진 회기(pre-confirm-warning) 조회 — 목록 행별 다시 계산·추가 정산 노출 판정용.
 * 읽기 전용 GET 만 호출한다 (확정·재계산 API 호출 없음).
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import StandardizedApi from './standardizedApi';
import { SALARY_API_ENDPOINTS } from '../constants/salaryConstants';
import {
  isSalaryAdjustmentCalculation,
  parsePreConfirmWarningPayload
} from './salaryCalculationDisplay';

/**
 * 본정산 행을 (상담사, 기간) 단위로 묶어 pre-confirm-warning 을 1회씩 조회한다.
 *
 * @param {Array<object>} list 급여 계산 행 목록
 * @returns {Promise<Record<string, ReturnType<typeof parsePreConfirmWarningPayload>>>}
 *   본정산 calculation id → 정규화 결과
 */
export async function fetchSalaryLateSessionByPrimaryId(list) {
  const primaries = (Array.isArray(list) ? list : []).filter(
    (calc) => calc != null && !isSalaryAdjustmentCalculation(calc)
  );
  const uniqueByKey = new Map();
  primaries.forEach((calc) => {
    const consultantId = calc.consultantId;
    const periodStart = calc.calculationPeriodStart;
    const periodEnd = calc.calculationPeriodEnd;
    if (consultantId == null || !periodStart || !periodEnd) {
      return;
    }
    const key = `${consultantId}|${periodStart}|${periodEnd}`;
    if (!uniqueByKey.has(key)) {
      uniqueByKey.set(key, {
        consultantId,
        periodStart,
        periodEnd,
        fallbackPrimaryId: calc.id
      });
    }
  });
  if (uniqueByKey.size === 0) {
    return {};
  }
  const entries = await Promise.all(
    [...uniqueByKey.values()].map(async(query) => {
      try {
        const response = await StandardizedApi.get(
          SALARY_API_ENDPOINTS.PRE_CONFIRM_WARNING,
          {
            consultantId: query.consultantId,
            periodStart: query.periodStart,
            periodEnd: query.periodEnd
          }
        );
        const parsed = parsePreConfirmWarningPayload(response);
        if (!parsed) {
          return null;
        }
        const primaryId = parsed.primaryCalculationId != null
          ? parsed.primaryCalculationId
          : query.fallbackPrimaryId;
        return [primaryId, parsed];
      } catch (error) {
        console.error('빠진 회기 경고 조회 실패:', error);
        return null;
      }
    })
  );
  const nextMap = {};
  entries.forEach((entry) => {
    if (entry) {
      nextMap[entry[0]] = entry[1];
    }
  });
  return nextMap;
}
