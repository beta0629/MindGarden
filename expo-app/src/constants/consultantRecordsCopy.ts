/**
 * 상담사 상담일지 화면 문구
 *
 * @author MindGarden
 * @since 2026-05-22
 */
export const CONSULTANT_RECORDS_COPY = {
  PAGE_TITLE: '상담일지',
  PENDING_SECTION_LABEL: '미작성',
  COMPLETED_SECTION_LABEL: '작성 완료',
  EMPTY_LIST_TITLE: '표시할 상담일지가 없습니다',
  EMPTY_LIST_DESCRIPTION: '미작성·작성 완료 일지가 없습니다.',
  EMPTY_PENDING_TITLE: '미작성 일지가 없습니다',
  EMPTY_PENDING_DESCRIPTION: '모든 상담일지를 작성하셨습니다.',
  DETAIL_PAGE_TITLE: '일지 상세',
  COMPLETED_RECORD_READ_ONLY_BANNER:
    '작성 완료된 일지는 확인만 가능합니다. 수정은 PC(웹)에서만 할 수 있습니다.',
  BACK_BUTTON_LABEL: '뒤로가기',
  /** 회기수 누락 시 저장 차단 (기본값 1 금지) */
  SESSION_NUMBER_REQUIRED:
    '회기수(sessionNumber) 정보가 없어 저장할 수 없습니다. 스케줄을 다시 불러온 뒤 시도해주세요.',
  /** 수정 시 consultationId(Schedule.id) 누락 */
  CONSULTATION_ID_REQUIRED:
    '연결된 일정 정보가 없어 수정할 수 없습니다. 목록에서 다시 열어주세요.',
} as const;
