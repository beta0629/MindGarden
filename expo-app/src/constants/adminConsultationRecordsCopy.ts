/**
 * 어드민 모바일 — 상담일지 라이트 브라우즈 카피
 *
 * @author MindGarden
 * @since 2026-05-16
 */

export const ADMIN_CONSULTATION_RECORDS_COPY = {
  PAGE_TITLE: '상담일지',
  PAGE_SUBTITLE: '상담사를 선택한 뒤 작성된 상담 기록을 조회합니다.',
  ACCESS_DENIED_TITLE: '이용 권한이 없습니다',
  ACCESS_DENIED_STAFF: '다른 상담사의 상담일지 조회는 관리자(ADMIN)만 이용할 수 있습니다.',
  ACCESS_DENIED_GENERIC: '관리자 계정으로 다시 로그인해 주세요.',
  STEP_CONSULTANT: '상담사 선택',
  STEP_RECORDS: '상담 기록',
  SEARCH_CONSULTANT_PLACEHOLDER: '이름·이메일 검색',
  SEARCH_RECORDS_PLACEHOLDER: '내담자·제목 검색',
  CONSULTANT_EMPTY: '표시할 상담사가 없습니다.',
  CONSULTANT_ERROR: '상담사 목록을 불러오지 못했습니다.',
  RECORDS_EMPTY: '표시할 상담 기록이 없습니다.',
  RECORDS_ERROR: '상담 기록을 불러오지 못했습니다.',
  RETRY: '다시 시도',
  BACK_TO_CONSULTANTS: '상담사 다시 선택',
  DETAIL_TITLE: '상담 기록 상세',
  DETAIL_LOADING: '불러오는 중…',
  DETAIL_NOT_FOUND: '상담 기록을 찾을 수 없습니다.',
  LABEL_TITLE: '제목',
  LABEL_CLIENT: '내담자',
  LABEL_DATE: '상담일',
  LABEL_STATUS: '상태',
  STATUS_COMPLETED: '완료',
  STATUS_PENDING: '미완료',
  READ_ONLY_HINT: '모바일에서는 조회만 가능합니다. 수정은 웹 어드민을 이용해 주세요.',
} as const;
