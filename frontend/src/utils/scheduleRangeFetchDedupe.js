/**
 * 캘린더 일정 범위 조회 — 같은 조건 요청은 진행 중인 것을 재사용한다.
 * 관리자(/schedules/admin)·상담사(/schedules/consultant/{id}) 공통.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

const KEY_SEPARATOR = '|';

/**
 * 범위 조회 키 — 역할 + 대상 + 가시 범위(+ 필터·갱신 트리거).
 * @param {{ role?: string, targetId?: string|number|null, startDate?: string, endDate?: string,
 *   extra?: Array<string|number|null|undefined> }} parts
 * @returns {string}
 */
export const buildScheduleRangeFetchKey = ({ role, targetId, startDate, endDate, extra = [] }) => [
  role,
  targetId,
  startDate,
  endDate,
  ...extra
].map((part) => (part === null || part === undefined ? '' : String(part))).join(KEY_SEPARATOR);

/**
 * 키별 진행 중 요청 재사용기. 끝난 요청은 보관하지 않는다(새로고침·저장 후 재조회는 새 요청).
 * @returns {{ run: (key: string, request: () => Promise<any>) => Promise<any>, isInFlight: (key: string) => boolean }}
 */
export const createInFlightRequestDeduper = () => {
  const inFlight = new Map();
  return {
    run(key, request) {
      const existing = inFlight.get(key);
      if (existing) {
        return existing;
      }
      const pending = Promise.resolve(request()).finally(() => {
        if (inFlight.get(key) === pending) {
          inFlight.delete(key);
        }
      });
      inFlight.set(key, pending);
      return pending;
    },
    isInFlight(key) {
      return inFlight.has(key);
    }
  };
};
