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
  /** 작성 화면 — 서버·웹 공통 필수값 */
  CREATE_REQUIRED_TITLE: '필수 항목',
  CREATE_REQUIRED_MISSING_PREFIX: '다음 항목을 입력해주세요: ',
  CREATE_SAVE_FAILED: '저장에 실패했습니다. 다시 시도해주세요.',
  CREATE_FIELD_LABELS: {
    sessionDurationMinutes: '세션 시간(분)',
    clientCondition: '상담 요약',
    mainIssues: '주요 이슈',
    interventionMethods: '개입 방법',
    clientResponse: '내담자 반응',
    riskAssessment: '위험도 평가',
    progressEvaluation: '진행 평가',
  },
  CREATE_FIELD_PLACEHOLDERS: {
    sessionDurationMinutes: '예: 50',
    mainIssues: '이번 회기에 다룬 주요 이슈를 입력하세요...',
    interventionMethods: '적용한 개입 방법을 입력하세요...',
    clientResponse: '내담자의 반응을 입력하세요...',
    progressEvaluation: '진행 평가를 입력하세요...',
  },
  /** 웹 ConsultationLogModal DEFAULT_RISK_LEVEL_OPTIONS 와 같은 값·라벨 */
  CREATE_RISK_OPTIONS: [
    { value: 'LOW', label: '낮음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HIGH', label: '높음' },
    { value: 'URGENT', label: '긴급' },
    { value: 'CRITICAL', label: '위험' },
  ],
} as const;
