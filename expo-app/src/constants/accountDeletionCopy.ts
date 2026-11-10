/**
 * 회원 탈퇴(계정 삭제) 화면 카피 — App Store 5.1.1(v)
 * 웹 WithdrawalRequestModal / mypage.json 과 동일 확인 단계(비밀번호·사유·동의).
 *
 * @author MindGarden
 * @since 2026-10-28
 */

export const WITHDRAWAL_REASON_CODES = [
  'LOW_USAGE',
  'NO_MATCH',
  'ERROR',
  'PRIVACY',
  'OTHER',
] as const;

export type WithdrawalReasonCode = (typeof WITHDRAWAL_REASON_CODES)[number];

export const ACCOUNT_DELETION_COPY = {
  TITLE: '회원 탈퇴 · 계정 삭제',
  SETTINGS_SECTION: '계정',
  SETTINGS_ROW: '회원 탈퇴',
  SETTINGS_ROW_SUB: '계정 삭제 (30일 유예 후 영구 익명화)',
  INTRO:
    '회원 탈퇴(계정 삭제)를 신청하면 30일 유예 기간 후 계정이 영구적으로 익명화됩니다. 유예 기간 중에는 신청을 취소할 수 있습니다. 단순 일시 비활성화가 아닙니다.',
  GRACE_NOTE:
    '유예 30일 경과 시 개인정보가 익명 처리되며 동일 이메일로 즉시 재가입이 제한될 수 있습니다.',
  PASSWORD_LABEL: '비밀번호 확인',
  PASSWORD_PLACEHOLDER: '비밀번호를 입력해주세요',
  REASON_LABEL: '탈퇴 사유',
  REASON: {
    LOW_USAGE: '서비스 이용 빈도가 낮음',
    NO_MATCH: '원하는 상담사/서비스가 없음',
    ERROR: '서비스 오류·장애가 잦음',
    PRIVACY: '보안·개인정보가 우려됨',
    OTHER: '기타',
  } as const satisfies Record<WithdrawalReasonCode, string>,
  OTHER_REASON_PLACEHOLDER: '기타 사유를 자유롭게 입력해주세요',
  COMMUNITY_LABEL: '커뮤니티 본문 처리 옵션',
  COMMUNITY_CHECKBOX: '내가 작성한 커뮤니티 게시글·댓글의 본문도 함께 삭제합니다.',
  COMMUNITY_HINT:
    '선택하지 않으면 작성자만 익명(알 수 없음)으로 표시되고 본문은 유지됩니다.',
  AGREE_LABEL: '위 내용을 모두 이해했으며, 회원 탈퇴를 신청합니다.',
  SUBMIT: '탈퇴 신청',
  CONFIRM_MODAL_TITLE: '정말 계정을 삭제할까요?',
  CONFIRM_MODAL_BODY:
    '신청 즉시 탈퇴 대기 상태가 되며 30일 후 영구 익명화됩니다. 계속하시겠습니까?',
  CONFIRM_MODAL_CONFIRM: '탈퇴 신청',
  CONFIRM_MODAL_CANCEL: '취소',
  PENDING_TITLE: '탈퇴 신청이 진행 중입니다',
  PENDING_CANCEL: '탈퇴 신청 취소',
  PENDING_CANCEL_CONFIRM_TITLE: '탈퇴 신청을 취소할까요?',
  PENDING_CANCEL_CONFIRM_BODY: '계정이 다시 정상 이용 가능한 상태로 돌아갑니다.',
  ERROR_GENERIC: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  VALIDATION_PASSWORD: '비밀번호를 입력해주세요.',
  VALIDATION_REASON: '탈퇴 사유를 선택해주세요.',
  VALIDATION_OTHER_REASON: '기타 사유를 입력해주세요.',
  VALIDATION_AGREE: '탈퇴 안내 사항에 동의해주세요.',
  SNS_PASSWORD_GAP_HINT:
    '소셜 로그인만 사용 중이고 비밀번호가 없다면, 현재 서버는 비밀번호 재확인만 지원합니다. 비밀번호 설정 후 다시 시도하거나 고객센터에 문의해 주세요.',
} as const;
