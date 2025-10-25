/**
 * 레이아웃 시스템 상수
 * 모든 레이아웃 관련 CSS 클래스를 중앙 관리
 */

/**
 * 대시보드 레이아웃
 */
export const DASHBOARD_LAYOUT = {CONTAINER: 'mg-v2-dashboard-layout',
  HEADER: 'mg-v2-dashboard-header',
  SIDEBAR: 'mg-v2-dashboard-sidebar',
  MAIN: 'mg-v2-dashboard-main',
  CONTENT: 'mg-v2-dashboard-content',
  FOOTER: 'mg-v2-dashboard-footer'};

/**
 * 카드 레이아웃
 */
export const CARD_LAYOUT = {CONTAINER: 'mg-v2-card',
  HEADER: 'mg-v2-card-header',
  CONTENT: 'mg-v2-card-content',
  FOOTER: 'mg-v2-card-footer',
  GRID: 'mg-v2-card-grid',
  LIST: 'mg-v2-card-list'};

/**
 * 섹션 레이아웃
 */
export const SECTION_LAYOUT = {CONTAINER: 'mg-v2-section',
  HEADER: 'mg-v2-section-header',
  CONTENT: 'mg-v2-section-content',
  FOOTER: 'mg-v2-section-footer',
  TITLE: 'mg-v2-section-title',
  SUBTITLE: 'mg-v2-section-subtitle'};

/**
 * 탭 레이아웃
 */
export const TAB_LAYOUT = {CONTAINER: 'mg-v2-tabs',
  NAV: 'mg-v2-tabs-nav',
  ITEM: 'mg-v2-tab',
  CONTENT: 'mg-v2-tab-content',
  PANEL: 'mg-v2-tab-panel'};

/**
 * 폼 레이아웃
 */
export const FORM_LAYOUT = {CONTAINER: 'mg-v2-form',
  GROUP: 'mg-v2-form-group',
  LABEL: 'mg-v2-form-label',
  INPUT: 'mg-v2-form-input',
  TEXTAREA: 'mg-v2-form-textarea',
  SELECT: 'mg-v2-form-select',
  CHECKBOX: 'mg-v2-form-checkbox',
  RADIO: 'mg-v2-form-radio',
  ERROR: 'mg-v2-form-error',
  HELP: 'mg-v2-form-help'};

/**
 * 테이블 레이아웃
 */
export const TABLE_LAYOUT = {CONTAINER: 'mg-v2-table',
  HEADER: 'mg-v2-table-header',
  BODY: 'mg-v2-table-body',
  FOOTER: 'mg-v2-table-footer',
  ROW: 'mg-v2-table-row',
  CELL: 'mg-v2-table-cell',
  HEADER_CELL: 'mg-v2-table-header-cell'};

/**
 * 모달 레이아웃
 */
export const MODAL_LAYOUT = {CONTAINER: 'mg-v2-modal',
  OVERLAY: 'mg-v2-modal-overlay',
  DIALOG: 'mg-v2-modal-dialog',
  HEADER: 'mg-v2-modal-header',
  CONTENT: 'mg-v2-modal-content',
  FOOTER: 'mg-v2-modal-footer',
  CLOSE: 'mg-v2-modal-close'};

/**
 * 네비게이션 레이아웃
 */
export const NAV_LAYOUT = {CONTAINER: 'mg-v2-nav',
  BRAND: 'mg-v2-nav-brand',
  MENU: 'mg-v2-nav-menu',
  ITEM: 'mg-v2-nav-item',
  LINK: 'mg-v2-nav-link',
  DROPDOWN: 'mg-v2-nav-dropdown',
  TOGGLE: 'mg-v2-nav-toggle'};

/**
 * 버튼 레이아웃
 */
export const BUTTON_LAYOUT = {CONTAINER: 'mg-v2-button',
  GROUP: 'mg-v2-button-group',
  TOOLBAR: 'mg-v2-button-toolbar'};

/**
 * 아이콘 레이아웃
 */
export const ICON_LAYOUT = {CONTAINER: 'mg-v2-icon',
  WRAPPER: 'mg-v2-icon-wrapper',
  BADGE: 'mg-v2-icon-badge'};

/**
 * 그리드 레이아웃
 */
export const GRID_LAYOUT = {CONTAINER: 'mg-v2-grid',
  ITEM: 'mg-v2-grid-item',
  ROW: 'mg-v2-grid-row',
  COL: 'mg-v2-grid-col'};

/**
 * 플렉스 레이아웃
 */
export const FLEX_LAYOUT = {CONTAINER: 'mg-v2-flex',
  ITEM: 'mg-v2-flex-item',
  CENTER: 'mg-v2-flex-center',
  BETWEEN: 'mg-v2-flex-between',
  AROUND: 'mg-v2-flex-around',
  EVENLY: 'mg-v2-flex-evenly',
  START: 'mg-v2-flex-start',
  END: 'mg-v2-flex-end',
  COLUMN: 'mg-v2-flex-column',
  ROW: 'mg-v2-flex-row',
  WRAP: 'mg-v2-flex-wrap',
  NOWRAP: 'mg-v2-flex-nowrap'};

/**
 * 스페이싱 레이아웃
 */
export const SPACING_LAYOUT = {MARGIN: {XS: 'mg-v2-m-xs',
    SM: 'mg-v2-m-sm',
    MD: 'mg-v2-m-md',
    LG: 'mg-v2-m-lg',
    XL: 'mg-v2-m-xl'},
  PADDING: {XS: 'mg-v2-p-xs',
    SM: 'mg-v2-p-sm',
    MD: 'mg-v2-p-md',
    LG: 'mg-v2-p-lg',
    XL: 'mg-v2-p-xl'},
  GAP: {XS: 'mg-v2-gap-xs',
    SM: 'mg-v2-gap-sm',
    MD: 'mg-v2-gap-md',
    LG: 'mg-v2-gap-lg',
    XL: 'mg-v2-gap-xl'}};

/**
 * 텍스트 레이아웃
 */
export const TEXT_LAYOUT = {TITLE: {H1: 'mg-v2-h1',
    H2: 'mg-v2-h2',
    H3: 'mg-v2-h3',
    H4: 'mg-v2-h4',
    H5: 'mg-v2-h5',
    H6: 'mg-v2-h6'},
  BODY: {SMALL: 'mg-v2-text-sm',
    MEDIUM: 'mg-v2-text-md',
    LARGE: 'mg-v2-text-lg'},
  ALIGN: {LEFT: 'mg-v2-text-left',
    CENTER: 'mg-v2-text-center',
    RIGHT: 'mg-v2-text-right',
    JUSTIFY: 'mg-v2-text-justify'},
  WEIGHT: {NORMAL: 'mg-v2-font-normal',
    MEDIUM: 'mg-v2-font-medium',
    SEMIBOLD: 'mg-v2-font-semibold',
    BOLD: 'mg-v2-font-bold'}};

/**
 * 상태 레이아웃
 */
export const STATE_LAYOUT = {LOADING: 'mg-v2-loading',
  ERROR: 'mg-v2-error',
  SUCCESS: 'mg-v2-success',
  WARNING: 'mg-v2-warning',
  INFO: 'mg-v2-info',
  DISABLED: 'mg-v2-disabled',
  ACTIVE: 'mg-v2-active',
  HOVER: 'mg-v2-hover',
  FOCUS: 'mg-v2-focus'};

/**
 * 반응형 레이아웃
 */
export const RESPONSIVE_LAYOUT = {MOBILE_ONLY: 'mg-v2-mobile-only',
  TABLET_ONLY: 'mg-v2-tablet-only',
  DESKTOP_ONLY: 'mg-v2-desktop-only',
  MOBILE_UP: 'mg-v2-mobile-up',
  TABLET_UP: 'mg-v2-tablet-up',
  DESKTOP_UP: 'mg-v2-desktop-up'};

/**
 * 통합 레이아웃 시스템
 */
export const LAYOUT_SYSTEM = {DASHBOARD: DASHBOARD_LAYOUT,
  CARD: CARD_LAYOUT,
  SECTION: SECTION_LAYOUT,
  TAB: TAB_LAYOUT,
  FORM: FORM_LAYOUT,
  TABLE: TABLE_LAYOUT,
  MODAL: MODAL_LAYOUT,
  NAV: NAV_LAYOUT,
  BUTTON: BUTTON_LAYOUT,
  ICON: ICON_LAYOUT,
  GRID: GRID_LAYOUT,
  FLEX: FLEX_LAYOUT,
  SPACING: SPACING_LAYOUT,
  TEXT: TEXT_LAYOUT,
  STATE: STATE_LAYOUT,
  RESPONSIVE: RESPONSIVE_LAYOUT};

/**
 * 레이아웃 헬퍼 함수
 */
export const getLayoutClass = (category, element, variant = '') => {const layout = LAYOUT_SYSTEM[category];
  if (!layout) {console.warn(`Layout category not found: ${category}`);
    return '';}
  
  const baseClass = layout[element];
  if (!baseClass) {console.warn(`Layout element not found: ${category}.${element}`);
    return '';}
  
  return variant ? `${baseClass} ${baseClass}--${variant}` : baseClass;};

export const createLayoutClass = (component, variant = '', state = '') => {const parts = ['mg-v2', component];
  if (variant) parts.push(variant);
  if (state) parts.push(state);
  return parts.join('-');};

export default LAYOUT_SYSTEM;
