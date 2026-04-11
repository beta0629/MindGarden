/**
 * 위젯 CSS 클래스 상수
/**
 * 모든 CSS 클래스명을 중앙에서 관리
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-28
 */

// ===== 기본 위젯 클래스 =====
export const WIDGET_CLASSES = {
  // 기본 위젯
  WIDGET: 'mg-widget',
  WIDGET_CARD: 'mg-widget--card',
  WIDGET_ELEVATED: 'mg-widget--elevated',
  
  // 위젯 헤더
  WIDGET_HEADER: 'mg-widget__header',
  WIDGET_TITLE: 'mg-widget__title',
  WIDGET_SUBTITLE: 'mg-widget__subtitle',
  WIDGET_ACTIONS: 'mg-widget__actions',
  
  // 위젯 본문
  WIDGET_BODY: 'mg-widget__body',
  WIDGET_CONTENT: 'mg-widget__content',
  WIDGET_FOOTER: 'mg-widget__footer',
  
  // 위젯 상태
  WIDGET_LOADING: 'mg-widget--loading',
  WIDGET_ERROR: 'mg-widget--error',
  WIDGET_SUCCESS: 'mg-widget--success',
  WIDGET_WARNING: 'mg-widget--warning'
};

// ===== 통계 위젯 클래스 =====
export const STATS_WIDGET_CLASSES = {
  // 통계 그리드
  STATS_GRID: 'mg-stats-grid',
  STATS_GRID_COMPACT: 'mg-stats-grid--compact',
  
  // 통계 카드
  STATS_CARD: 'mg-stats-card',
  STATS_CARD_ELEVATED: 'mg-stats-card--elevated',
  STATS_CARD_COMPACT: 'mg-stats-card--compact',
  
  // 통계 요소
  STAT_ICON: 'mg-stat-icon',
  STAT_VALUE: 'mg-stat-value',
  STAT_LABEL: 'mg-stat-label',
  STAT_CHANGE: 'mg-stat-change',
  STAT_CHANGE_POSITIVE: 'mg-stat-change--positive',
  STAT_CHANGE_NEGATIVE: 'mg-stat-change--negative',
  
  // 통계 상태
  STATS_SUCCESS: 'mg-stats--success',
  STATS_WARNING: 'mg-stats--warning',
  STATS_ERROR: 'mg-stats--error',
  STATS_INFO: 'mg-stats--info'
};

// ===== 시스템 오버뷰 위젯 클래스 =====
export const SYSTEM_WIDGET_CLASSES = {
  // 시스템 오버뷰
  SYSTEM_OVERVIEW: 'mg-widget--system-overview',
  SYSTEM_GRID: 'mg-system-overview-grid',
  
  // 시스템 메트릭
  SYSTEM_METRIC: 'mg-system-metric',
  METRIC_ICON: 'mg-metric-icon',
  METRIC_CONTENT: 'mg-metric-content',
  METRIC_LABEL: 'mg-metric-label',
  METRIC_VALUE: 'mg-metric-value',
  
  // 시스템 상태
  METRIC_HEALTHY: 'mg-metric--healthy',
  METRIC_WARNING: 'mg-metric--warning',
  METRIC_ERROR: 'mg-metric--error'
};

// ===== 빠른 작업 위젯 클래스 =====
export const QUICK_ACTIONS_CLASSES = {
  // 빠른 작업
  QUICK_ACTIONS: 'mg-widget--quick-actions',
  ACTIONS_GRID: 'mg-quick-actions-grid',
  
  // 액션 버튼
  ACTION_BTN: 'mg-quick-action-btn',
  ACTION_ICON: 'mg-quick-action-icon',
  ACTION_LABEL: 'mg-quick-action-label',
  
  // 액션 상태
  ACTION_PRIMARY: 'mg-quick-action--primary',
  ACTION_SECONDARY: 'mg-quick-action--secondary',
  ACTION_DISABLED: 'mg-quick-action--disabled'
};

// ===== 공통 유틸리티 클래스 =====
export const UTILITY_CLASSES = {
  // 로딩
  LOADING_CONTAINER: 'mg-loading-container',
  LOADING_SPINNER: 'mg-loading-spinner',
  LOADING_TEXT: 'mg-loading-text',
  
  // 에러
  ERROR_CONTAINER: 'mg-error-container',
  ERROR_MESSAGE: 'mg-error-message',
  ERROR_ICON: 'mg-error-icon',
  
  // 빈 상태
  EMPTY_STATE: 'mg-empty-state',
  EMPTY_ICON: 'mg-empty-icon',
  EMPTY_MESSAGE: 'mg-empty-message',
  
  // 애니메이션
  FADE_IN: 'mg-fade-in',
  SLIDE_UP: 'mg-slide-up',
  BOUNCE_IN: 'mg-bounce-in'
};

// ===== 반응형 클래스 =====
export const RESPONSIVE_CLASSES = {
  // 모바일
  MOBILE_ONLY: 'mg-mobile-only',
  MOBILE_HIDDEN: 'mg-mobile-hidden',
  
  // 태블릿
  TABLET_ONLY: 'mg-tablet-only',
  TABLET_HIDDEN: 'mg-tablet-hidden',
  
  // 데스크톱
  DESKTOP_ONLY: 'mg-desktop-only',
  DESKTOP_HIDDEN: 'mg-desktop-hidden'
};

// ===== 클래스 조합 헬퍼 함수 =====
export const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// ===== 조건부 클래스 헬퍼 함수 =====
export const conditionalClass = (condition, trueClass, falseClass = '') => {
  return condition ? trueClass : falseClass;
};

// ===== 상태별 클래스 헬퍼 함수 =====
export const getStatusClass = (status, baseClass) => {
  const statusMap = {
    success: `${baseClass}--success`,
    warning: `${baseClass}--warning`,
    error: `${baseClass}--error`,
    info: `${baseClass}--info`,
    loading: `${baseClass}--loading`
  };
  return statusMap[status] || baseClass;
};

// ===== 크기별 클래스 헬퍼 함수 =====
export const getSizeClass = (size, baseClass) => {
  const sizeMap = {
    sm: `${baseClass}--sm`,
    md: `${baseClass}--md`,
    lg: `${baseClass}--lg`,
    xl: `${baseClass}--xl`
  };
  return sizeMap[size] || baseClass;
};
