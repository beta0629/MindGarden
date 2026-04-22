/**
 * 상담일지 로컬 초안 자동저장(Phase 1) — 수치·정책만.
 * PII는 localStorage 평문 보관이므로 TTL을 짧게 유지하고, Phase 2 서버 DRAFT로 이전 검토.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

/** 로컬 스냅샷 JSON 스키마 버전 */
export const CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION = 1;

/** 입력 멈춤 후 로컬 flush 간격(ms) — 기획 권고 3~10초 */
export const CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS = 5000;

/**
 * 초안 로컬 보존 TTL(ms). 공유 PC·단말 유출 리스크 완화용 짧은 보존.
 * 운영 정책 변경 시 본 상수만 조정.
 */
export const CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

/** (선택) 더티 상태에서 주기적 백업 flush — 기획 권고 최대 주기 하한 */
export const CONSULTATION_LOG_LOCAL_AUTOSAVE_MAX_INTERVAL_MS = 60 * 1000;

/** 상담일지 서버 초안(세션·X-Tenant-Id) API 경로 — 쿼리: consultationId, consultantId */
export const CONSULTATION_LOG_SERVER_DRAFT_API_PATH = '/api/v1/schedules/consultation-records/draft';
