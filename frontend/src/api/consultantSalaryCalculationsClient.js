/**
 * 상담사 본인 급여 정산 목록 조회 (단일 캐시 — AppShell·더보기 중복 호출 방지)
 *
 * @author MindGarden
 * @since 2026-05-15
 */

import StandardizedApi from '../utils/standardizedApi';
import { CONSULTATION_API } from '../constants/api';

let cachedPayload = null;
let inflightPromise = null;

/**
 * @param {*} body API 응답 본문(data 또는 배열)
 * @returns {Array<Object>}
 */
export function normalizeSalaryCalculationsList(body) {
  if (body == null) return [];
  if (Array.isArray(body)) return body;
  if (typeof body === 'object') {
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray(body.items)) return body.items;
    if (Array.isArray(body.content)) return body.content;
  }
  return [];
}

/**
 * 캐시 무효화 후 다음 조회에서 API를 다시 호출한다.
 */
export function invalidateConsultantSalaryCalculationsCache() {
  cachedPayload = null;
  inflightPromise = null;
}

/**
 * @returns {Promise<{ items: Array<Object>, source: 'api'|'error', error: Error|null }>}
 */
export async function loadConsultantSalaryCalculations() {
  if (cachedPayload) {
    return cachedPayload;
  }
  if (!inflightPromise) {
    inflightPromise = (async() => {
      try {
        const raw = await StandardizedApi.get(
          CONSULTATION_API.GET_MY_SALARY_CALCULATIONS, {}
        );
        const items = normalizeSalaryCalculationsList(raw);
        const payload = { items, source: 'api', error: null };
        cachedPayload = payload;
        return payload;
      } catch (error) {
        const payload = { items: [], source: 'error', error };
        cachedPayload = payload;
        return payload;
      } finally {
        inflightPromise = null;
      }
    })();
  }
  return inflightPromise;
}
