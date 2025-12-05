 * 모달 관련 상수
 * CSS 클래스, JavaScript 변수, 메시지 등을 중앙에서 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */

export const MODAL_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  FULLSCREEN: 'fullscreen'
};

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

export const MODAL_BUTTON_TEXT = {
  CLOSE: '닫기',
  CANCEL: '취소',
  CONFIRM: '확인',
  SAVE: '저장',
  DELETE: '삭제',
  YES: '예',
  NO: '아니오'
};

export const MODAL_MESSAGES = {
  CONFIRM_DELETE: '정말로 삭제하시겠습니까?',
  CONFIRM_SAVE: '변경사항을 저장하시겠습니까?',
  CONFIRM_CANCEL: '변경사항이 저장되지 않습니다. 계속하시겠습니까?',
  SUCCESS_SAVE: '저장되었습니다.',
  SUCCESS_DELETE: '삭제되었습니다.',
  ERROR_SAVE: '저장 중 오류가 발생했습니다.',
  ERROR_DELETE: '삭제 중 오류가 발생했습니다.'
};

export const MODAL_DEFAULTS = {
  SIZE: MODAL_SIZES.MEDIUM,
  SHOW_CLOSE_BUTTON: true,
  CLOSE_ON_OVERLAY_CLICK: true,
  CLOSE_ON_ESCAPE: true
};

export const MODAL_ANIMATIONS = {
  FADE_IN: 'fade-in',
  SLIDE_DOWN: 'slide-down',
  ZOOM_IN: 'zoom-in',
  NONE: 'none'
};

export const MODAL_EVENTS = {
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  OPEN: 'modal-open',
  CLOSE: 'modal-close',
  CONFIRM: 'modal-confirm',
  CANCEL: 'modal-cancel'
};
