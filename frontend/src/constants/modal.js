/**
 * 모달 관련 상수
 * CSS 클래스, JavaScript 변수, 메시지 등을 중앙에서 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */

// 모달 크기 옵션
export const MODAL_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  FULLSCREEN: 'fullscreen'
};

// 모달 CSS 클래스
export const MODAL_CSS_CLASSES = {
  OVERLAY: 'modal-overlay',
  CONTAINER: 'modal-container',
  HEADER: 'modal-header',
  TITLE: 'modal-title',
  CLOSE_BUTTON: 'modal-close-button',
  BODY: 'modal-body',
  FOOTER: 'modal-footer',
  ACTIONS: 'modal-actions',
  BUTTON: 'modal-button',
  BUTTON_PRIMARY: 'modal-button-primary',
  BUTTON_SECONDARY: 'modal-button-secondary',
  BUTTON_DANGER: 'modal-button-danger',
  SMALL: 'modal-small',
  MEDIUM: 'modal-medium',
  LARGE: 'modal-large',
  FULLSCREEN: 'modal-fullscreen'
};

// 모달 버튼 텍스트
export const MODAL_BUTTON_TEXT = {
  CLOSE: '닫기',
  CANCEL: '취소',
  CONFIRM: '확인',
  SAVE: '저장',
  DELETE: '삭제',
  YES: '예',
  NO: '아니오'
};

// 모달 메시지
export const MODAL_MESSAGES = {
  CONFIRM_DELETE: '정말로 삭제하시겠습니까?',
  CONFIRM_SAVE: '변경사항을 저장하시겠습니까?',
  CONFIRM_CANCEL: '변경사항이 저장되지 않습니다. 계속하시겠습니까?',
  SUCCESS_SAVE: '저장되었습니다.',
  SUCCESS_DELETE: '삭제되었습니다.',
  ERROR_SAVE: '저장 중 오류가 발생했습니다.',
  ERROR_DELETE: '삭제 중 오류가 발생했습니다.'
};

// 모달 기본 설정
export const MODAL_DEFAULTS = {
  SIZE: MODAL_SIZES.MEDIUM,
  SHOW_CLOSE_BUTTON: true,
  CLOSE_ON_OVERLAY_CLICK: true,
  CLOSE_ON_ESCAPE: true
};

// 모달 애니메이션
export const MODAL_ANIMATIONS = {
  FADE_IN: 'fade-in',
  SLIDE_DOWN: 'slide-down',
  ZOOM_IN: 'zoom-in',
  NONE: 'none'
};

// 모달 이벤트 타입
export const MODAL_EVENTS = {
  OPEN: 'modal-open',
  CLOSE: 'modal-close',
  CONFIRM: 'modal-confirm',
  CANCEL: 'modal-cancel'
};
