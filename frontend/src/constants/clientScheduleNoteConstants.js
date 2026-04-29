/**
 * 통합 스케줄 — 내담자 특이사항 API·공통코드 그룹 (입금 확인 adminNote와 분리).
 *
 * @author CoreSolution
 * @since 2026-04-29
 */

/** GET/POST 기준 경로. PUT·DELETE는 `${path}/{id}` */
export const CLIENT_SCHEDULE_NOTE_API = '/api/v1/admin/schedule-notes';

/** P5: noteType 라벨 — 공통코드 그룹명 (DB 마이그레이션과 동일) */
export const SCHEDULE_CLIENT_NOTE_TYPE_GROUP = 'SCHEDULE_CLIENT_NOTE_TYPE';

/** 공통코드 미로드 시 요청용 기본 코드값(마이그레이션 OTHER와 일치) */
export const DEFAULT_NOTE_TYPE_CODE = 'OTHER';
