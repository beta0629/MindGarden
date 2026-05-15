/**
 * 상담사 내담자 목록(Expo) 사용자 노출 문구 SSOT
 *
 * @author MindGarden
 * @since 2026-05-15
 */
export const CONSULTANT_CLIENTS_LIST_COPY = {
  EMPTY_TITLE: '등록된 내담자가 없습니다',
  EMPTY_NO_SEARCH: '아직 배정된 내담자가 없습니다.',
  EMPTY_SEARCH_SUFFIX: '에 해당하는 내담자를 찾을 수 없습니다.',
  LOAD_ERROR: '내담자 목록을 불러오지 못했습니다.',
  RETRY: '다시 시도',
  NO_USER_TITLE: '계정 정보를 확인할 수 없습니다',
  NO_USER_DESCRIPTION: '로그인 정보가 없어 목록을 불러올 수 없습니다. 다시 로그인해 주세요.',
  INVALID_RESPONSE: '내담자 목록 응답 형식이 올바르지 않습니다.',
  API_REJECTED_FALLBACK: '내담자 목록을 가져올 수 없습니다.',
  DETAIL_INVALID_RESPONSE: '내담자 상세 응답 형식이 올바르지 않습니다.',
  DETAIL_API_REJECTED_FALLBACK: '내담자 상세를 가져올 수 없습니다.',
} as const;
