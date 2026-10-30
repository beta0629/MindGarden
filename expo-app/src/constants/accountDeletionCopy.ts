/**
 * 회원 탈퇴(계정 삭제) 화면 카피 — App Store 5.1.1(v)
 *
 * @author MindGarden
 * @since 2026-10-28
 */

export const ACCOUNT_DELETION_COPY = {
  TITLE: '회원 탈퇴 · 계정 삭제',
  SETTINGS_SECTION: '계정',
  SETTINGS_ROW: '회원 탈퇴',
  SETTINGS_ROW_SUB: '계정 삭제 (30일 유예 후 영구 익명화)',
  INTRO:
    '회원 탈퇴(계정 삭제)를 신청하면 30일 유예 기간 후 계정이 영구적으로 익명화됩니다. 유예 기간 중에는 신청을 취소할 수 있습니다. 단순 일시 비활성화가 아닙니다.',
  GRACE_NOTE: '유예 30일 경과 시 개인정보가 익명 처리되며 동일 이메일로 즉시 재가입이 제한될 수 있습니다.',
  REASON_LABEL: '탈퇴 사유',
  REASON_PLACEHOLDER: '사유를 입력해 주세요 (선택)',
  PASSWORD_LABEL: '비밀번호 재확인',
  PASSWORD_HINT: '이메일·비밀번호로 가입한 경우 비밀번호를 입력하세요.',
  CONFIRM_PHRASE_LABEL: '확인 문구',
  CONFIRM_PHRASE_HINT:
    'Sign in with Apple 등 소셜 로그인만 사용하는 경우, 아래에 DELETE 를 정확히 입력하세요.',
  CONFIRM_PHRASE_PLACEHOLDER: 'DELETE',
  AGREE_LABEL: '위 내용을 이해했으며 회원 탈퇴(계정 삭제)에 동의합니다.',
  SUBMIT: '회원 탈퇴 신청',
  CONFIRM_MODAL_TITLE: '정말 계정을 삭제할까요?',
  CONFIRM_MODAL_BODY:
    '신청 즉시 탈퇴 대기 상태가 되며 30일 후 영구 익명화됩니다. 계속하시겠습니까?',
  CONFIRM_MODAL_CONFIRM: '탈퇴 신청',
  CONFIRM_MODAL_CANCEL: '취소',
  PENDING_TITLE: '탈퇴 신청이 진행 중입니다',
  PENDING_CANCEL: '탈퇴 신청 취소',
  PENDING_CANCEL_CONFIRM_TITLE: '탈퇴 신청을 취소할까요?',
  PENDING_CANCEL_CONFIRM_BODY: '계정이 다시 정상 이용 가능한 상태로 돌아갑니다.',
  SUCCESS_THEN_LOGOUT: '회원 탈퇴가 신청되었습니다. 로그인 화면으로 이동합니다.',
  ERROR_GENERIC: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  VALIDATION_IDENTITY: '비밀번호 또는 확인 문구(DELETE)를 입력해 주세요.',
  VALIDATION_AGREE: '동의 항목에 체크해 주세요.',
} as const;
