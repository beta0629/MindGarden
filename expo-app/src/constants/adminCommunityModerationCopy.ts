/**
 * 어드민 모바일 — 커뮤니티 검수 화면 카피
 *
 * @author MindGarden
 * @since 2026-05-16
 */

export const ADMIN_COMMUNITY_MODERATION_COPY = {
  PAGE_TITLE: '커뮤니티 검수',
  PAGE_SUBTITLE: '검수 대기 게시를 확인하고 승인·반려합니다.',
  ACCESS_DENIED_TITLE: '이용 권한이 없습니다',
  ACCESS_DENIED_STAFF: '커뮤니티 검수는 관리자(ADMIN)만 이용할 수 있습니다.',
  ACCESS_DENIED_GENERIC: '관리자 계정으로 다시 로그인해 주세요.',
  EMPTY_TITLE: '표시할 검수 항목이 없습니다',
  EMPTY_DESC: '검수 대기 게시가 없거나 이미 처리되었습니다. 아래로 당겨 새로고침해 보세요.',
  LIST_ERROR: '검수 목록을 불러오지 못했습니다.',
  RETRY: '다시 시도',
  DETAIL_TITLE: '검수 상세',
  DETAIL_LOADING: '불러오는 중…',
  DETAIL_NOT_FOUND: '해당 게시를 찾을 수 없습니다. 목록으로 돌아가 주세요.',
  LABEL_KIND: '유형',
  LABEL_STATUS: '상태',
  LABEL_AUTHOR: '작성자',
  LABEL_CREATED: '등록',
  LABEL_BODY: '본문 미리보기',
  KIND_CLIENT_REVIEW: '내담자 후기',
  KIND_CONSULTANT_COLUMN: '상담사 칼럼',
  STATUS_PENDING: '검수 대기',
  STATUS_APPROVED: '승인',
  STATUS_REJECTED: '반려',
  ACTION_APPROVE: '승인',
  ACTION_REJECT: '반려',
  MODAL_APPROVE_TITLE: '게시글 승인',
  MODAL_APPROVE_BODY: '선택한 항목을 승인(게시) 처리합니다. 계속하시겠습니까?',
  MODAL_REJECT_TITLE: '게시글 반려',
  MODAL_REJECT_BODY: '선택한 항목을 반려합니다. 필요 시 사유를 입력한 뒤 확인을 누르세요.',
  MODAL_REJECT_NOTE_LABEL: '반려 사유(선택)',
  MODAL_REJECT_NOTE_PLACEHOLDER: '반려 사유를 입력해 주세요',
  MODAL_CANCEL: '취소',
  MODAL_CONFIRM: '확인',
  PATCH_SUCCESS: '검수 처리되었습니다.',
  PATCH_ERROR: '검수 처리에 실패했습니다.',
  SESSION_NOT_READY_TITLE: '세션을 준비할 수 없습니다',
  SESSION_NOT_READY_DESC:
    '테넌트·로그인 정보가 아직 반영되지 않았습니다. 다시 시도하거나, 로그인 화면에서 테넌트를 선택한 뒤 다시 접속해 주세요.',
} as const;
