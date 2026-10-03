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

/**
 * 공통코드 미로드·미등록 시 noteType 라벨 폴백.
 * 값은 V20260429_001__client_schedule_notes.sql 의 korean_name 과 동일하게 유지한다.
 */
export const SCHEDULE_CLIENT_NOTE_TYPE_FALLBACK_LABELS = Object.freeze({
  PAYMENT_PROMISE: '입금·비용 약속',
  ATTENDANCE: '출석·노쇼',
  RISK: '위험·주의',
  OTHER: '기타'
});

/** 공통코드·폴백 어디에도 없는 noteType 표시 라벨 (원시 코드 노출 금지) */
export const SCHEDULE_CLIENT_NOTE_TYPE_UNKNOWN_LABEL = '기타';

/** 노트 응답 — 달린 일정 날짜(yyyy-MM-dd) 필드명 */
export const CLIENT_SCHEDULE_NOTE_SCHEDULE_DATE_FIELD = 'scheduleDate';

/** 배너·목록 UI 라벨 (하드코딩 문자열 상수화) */
export const CLIENT_SCHEDULE_NOTES_SECTION_TITLE = '내담자 특이사항';
export const CLIENT_SCHEDULE_NOTES_INTRO =
  '입금 확인용 메모와 별도로, 약속·후속 조치 등 지속 관리가 필요한 내용을 기록합니다. 미해소 건은 위에 누적되며, 해소 처리 후에도 아래에 보관됩니다.';
export const CLIENT_SCHEDULE_NOTES_BANNER_CLIENT_WIDE_PREFIX = '내담자 전체 미해소';
export const CLIENT_SCHEDULE_NOTES_BANNER_SCHEDULE_LINKED_PREFIX = '이 일정 직결 미해소';
export const CLIENT_SCHEDULE_NOTES_BANNER_COUNT_SUFFIX = '건';
export const CLIENT_SCHEDULE_NOTES_UNRESOLVED_GROUP_TITLE = '미해소';
export const CLIENT_SCHEDULE_NOTES_RESOLVED_GROUP_TITLE = '해소됨';
export const CLIENT_SCHEDULE_NOTES_EMPTY_UNRESOLVED = '미해소 특이사항이 없습니다.';
export const CLIENT_SCHEDULE_NOTES_LOADING = '불러오는 중…';
export const CLIENT_SCHEDULE_NOTES_NO_ANCHOR =
  '이 일정에는 내담자·스케줄 식별자가 연결되어 있지 않아 특이사항을 저장할 수 없습니다.';
export const CLIENT_SCHEDULE_NOTES_NO_CLIENT_WARNING =
  '내담자가 연결되지 않은 일정입니다. 작성된 특이사항은 이 일정(또는 배정) 정보에만 한정하여 보관됩니다.';
export const CLIENT_SCHEDULE_NOTES_META_PROMISE_PREFIX = '약속일';
export const CLIENT_SCHEDULE_NOTES_META_SCHEDULE_DATE_PREFIX = '일정';
export const CLIENT_SCHEDULE_NOTES_ACTION_RESOLVE = '해소';
export const CLIENT_SCHEDULE_NOTES_ACTION_REOPEN = '다시 열기';
export const CLIENT_SCHEDULE_NOTES_BADGE_OVERDUE = '약속일 경과';
export const CLIENT_SCHEDULE_NOTES_BADGE_RESOLVED = '해소됨';
export const CLIENT_SCHEDULE_NOTES_BANNER_EXPAND_HINT = '클릭하여 미해소 목록 펼치기/접기';
