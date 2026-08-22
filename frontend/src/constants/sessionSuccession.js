/**
 * 회기 승계 UI·API 상수 (SESSION_SUCCESSION_PLAN / SCREEN_SPEC).
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

export const SESSION_SUCCESSION_UI = {
  ACTION_LABEL: '회기 승계',
  MODAL_TITLE: '회기 승계',
  STEP_BENEFICIARY: '수혜자 선택',
  STEP_CONSULTANT_SESSIONS: '상담사 및 회기',
  STEP_CONFIRM: '최종 확인',
  MODE_EXISTING: '기존 내담자',
  MODE_NEW: '신규 등록',
  FULL_AMOUNT_LABEL: '전량 적용',
  EXECUTE_LABEL: '승계 실행',
  CANCEL_LABEL: '취소',
  NEXT_LABEL: '다음',
  PREV_LABEL: '이전',
  RETRY_LABEL: '다시 시도',
  CLOSE_LABEL: '닫기',
  USED_REMAINING_TOTAL_LABEL: '사용 / 남은 / 총',
  TRANSFERABLE_LABEL: '승계 가능',
  OCCUPYING_EXCLUDE_PREFIX: '스케줄 등록',
  OCCUPYING_EXCLUDE_SUFFIX: '건 제외',
  TARGET_CONSULTANT_LABEL: '타깃 상담사',
  SESSION_COUNT_LABEL: '승계 회기 수',
  SOURCE_PROJECTION_LABEL: '소스',
  TARGET_PROJECTION_LABEL: '타깃',
  TARGET_NEW_SESSIONS_SUFFIX: '회',
  BENEFICIARY_CONFIRM_LABEL: '수혜자',
  CONSULTANT_CONFIRM_LABEL: '담당 상담사',
  SESSION_COUNT_CONFIRM_LABEL: '승계 회기 수',
  NEW_CLIENT_NAME_LABEL: '이름',
  NEW_CLIENT_PHONE_LABEL: '휴대폰',
  NEW_CLIENT_EMAIL_LABEL: '이메일',
  /** ClientModal create 과 동일: 이메일·휴대폰 중 하나 필수 안내 */
  NEW_CLIENT_CONTACT_HELP: '이메일 또는 휴대폰 번호 중 하나는 입력해 주세요.',
  NEW_INVALID_EMAIL: '올바른 이메일 형식을 입력해주세요.',
  NEW_INVALID_PHONE:
    '휴대폰 번호만 입력해 주세요. 010·011·016~019이며 하이픈은 입력해도 됩니다.',
  OCCUPYING_BANNER_PREFIX: '스케줄에 이미 등록된',
  OCCUPYING_BANNER_SUFFIX: '건은 승계되지 않고 이전 당사자에게 남습니다.',
  OCCUPYING_BANNER_STATIC:
    '스케줄에 이미 등록된 회기는 승계되지 않고 기존 당사자에게 남습니다.',
  PAYMENT_NOTICE: '결제·입금·영수증 정보는 원 매핑에 남습니다.',
  ZERO_TRANSFERABLE: '스케줄에 묶인 회기만 남아 승계할 수 없습니다.',
  SAME_CLIENT_ERROR: '수혜자는 이전 당사자와 달라야 합니다.',
  BENEFICIARY_REQUIRED: '수혜자를 선택하거나 신규 등록해 주세요.',
  NEW_NAME_REQUIRED: '수혜자 이름을 입력해 주세요.',
  NEW_CONTACT_REQUIRED: '이메일 또는 휴대폰 중 하나를 입력해 주세요.',
  CONSULTANT_REQUIRED: '타깃 상담사를 선택해 주세요.',
  SUCCESS: '회기 승계가 완료되었습니다.',
  PREVIEW_FAILED: '승계 미리보기를 불러오지 못했습니다.',
  EXECUTE_FAILED: '회기 승계에 실패했습니다.',
  CONSULTANT_HELPER: '상담사를 변경하여 승계할 수 있습니다.',
  REASON_PLACEHOLDER: '사유 (선택)',
  CONSULTANT_PLACEHOLDER: '상담사 선택',
  CLIENT_LIST_EMPTY: '선택 가능한 기존 내담자가 없습니다.',
  CLIENT_LIST_PLACEHOLDER: '내담자 선택'
};

export const SESSION_SUCCESSION_STEPS = {
  BENEFICIARY: 1,
  COUNT: 2,
  CONFIRM: 3,
  DONE: 4
};

export const SESSION_SUCCESSION_BENEFICIARY_MODE = {
  EXISTING: 'EXISTING',
  NEW: 'NEW'
};
