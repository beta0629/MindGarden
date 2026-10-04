/**
 * 상담일지 전체화면 라우트(/consultant/consultation-record/:id) 안내 문구.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
export const CONSULTATION_RECORD_SCREEN_STRINGS = {
  SUBTITLE_READY: '내담자 정보와 세션 내용을 기록합니다.',
  SUBTITLE_LOADING: '상담 일정을 불러오는 중입니다.',
  LOAD_FAILED: '상담 일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  NOT_FOUND: '상담 일정을 찾을 수 없습니다.',
  FORBIDDEN: '이 상담 일정의 일지를 작성할 권한이 없습니다.',
  RETRY: '다시 시도',
  BACK: '돌아가기'
};

/** 일정 로드 상태 */
export const CONSULTATION_RECORD_SCREEN_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  NOT_FOUND: 'not_found',
  FORBIDDEN: 'forbidden',
  ERROR: 'error'
};
