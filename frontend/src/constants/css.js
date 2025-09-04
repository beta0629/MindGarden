/**
 * CSS 클래스명 상수
 * 컴포넌트별 고유 클래스명으로 CSS 충돌 방지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// DEPRECATED: TabletHeader와 TabletHamburgerMenu는 더 이상 사용되지 않습니다.
// SimpleHeader와 SimpleLayout을 사용하세요.

// AdminDashboard 컴포넌트 CSS 클래스명
export const ADMIN_DASHBOARD_CSS = {
  CONTAINER: 'admin-dashboard-content',
  ALERT: 'admin-dashboard-alert',
  STATS_CONTAINER: 'admin-dashboard-stats-container',
  SUMMARY_PANELS: 'admin-dashboard-summary-panels',
  SUMMARY_PANEL: 'admin-dashboard-summary-panel',
  PANEL_HEADER: 'admin-dashboard-panel-header',
  PANEL_TITLE: 'admin-dashboard-panel-title',
  PANEL_ICON: 'admin-dashboard-panel-icon',
  ACTION_BUTTONS: 'admin-dashboard-action-buttons',
  ACTION_BUTTON: 'admin-dashboard-action-button',
  SUMMARY_ITEM: 'admin-dashboard-summary-item',
  SUMMARY_VALUE: 'admin-dashboard-summary-value',
  TOAST: 'admin-dashboard-toast',
  TOAST_HEADER: 'admin-dashboard-toast-header',
  TOAST_BODY: 'admin-dashboard-toast-body'
};

// CommonDashboard 컴포넌트 CSS 클래스명
export const COMMON_DASHBOARD_CSS = {
  CONTAINER: 'common-dashboard-content',
  WELCOME_SECTION: 'common-dashboard-welcome-section',
  WELCOME_CARD: 'common-dashboard-welcome-card',
  WELCOME_TITLE: 'common-dashboard-welcome-title',
  WELCOME_SUBTITLE: 'common-dashboard-welcome-subtitle',
  WELCOME_TIME: 'common-dashboard-welcome-time',
  SUMMARY_PANELS: 'common-dashboard-summary-panels',
  SUMMARY_PANEL: 'common-dashboard-summary-panel',
  QUICK_ACTIONS: 'common-dashboard-quick-actions',
  RECENT_ACTIVITIES: 'common-dashboard-recent-activities'
};

// SessionManagement 컴포넌트 CSS 클래스명
export const SESSION_MANAGEMENT_CSS = {
  CONTAINER: 'session-mgmt-container',
  HEADER: 'session-mgmt-header',
  TITLE: 'session-mgmt-title',
  CONTENT: 'session-mgmt-content',
  FORM: 'session-mgmt-form',
  FORM_GROUP: 'session-mgmt-form-group',
  LABEL: 'session-mgmt-label',
  INPUT: 'session-mgmt-input',
  SELECT: 'session-mgmt-select',
  BUTTON: 'session-mgmt-button',
  TABLE: 'session-mgmt-table',
  TABLE_HEADER: 'session-mgmt-table-header',
  TABLE_ROW: 'session-mgmt-table-row',
  TABLE_CELL: 'session-mgmt-table-cell'
};

// ConsultantComprehensiveManagement 컴포넌트 CSS 클래스명
export const CONSULTANT_COMPREHENSIVE_CSS = {
  CONTAINER: 'consultant-comp-container',
  HEADER: 'consultant-comp-header',
  TITLE: 'consultant-comp-title',
  TABS: 'consultant-comp-tabs',
  TAB: 'consultant-comp-tab',
  TAB_ACTIVE: 'consultant-comp-tab-active',
  CONTENT: 'consultant-comp-content',
  FORM: 'consultant-comp-form',
  FORM_GROUP: 'consultant-comp-form-group',
  LABEL: 'consultant-comp-label',
  INPUT: 'consultant-comp-input',
  SELECT: 'consultant-comp-select',
  BUTTON: 'consultant-comp-button',
  TABLE: 'consultant-comp-table',
  TABLE_HEADER: 'consultant-comp-table-header',
  TABLE_ROW: 'consultant-comp-table-row',
  TABLE_CELL: 'consultant-comp-table-cell'
};

// ClientComprehensiveManagement 컴포넌트 CSS 클래스명
export const CLIENT_COMPREHENSIVE_CSS = {
  CONTAINER: 'client-comp-container',
  HEADER: 'client-comp-header',
  TITLE: 'client-comp-title',
  TABS: 'client-comp-tabs',
  TAB: 'client-comp-tab',
  TAB_ACTIVE: 'client-comp-tab-active',
  CONTENT: 'client-comp-content',
  FORM: 'client-comp-form',
  FORM_GROUP: 'client-comp-form-group',
  LABEL: 'client-comp-label',
  INPUT: 'client-comp-input',
  SELECT: 'client-comp-select',
  BUTTON: 'client-comp-button',
  TABLE: 'client-comp-table',
  TABLE_HEADER: 'client-comp-table-header',
  TABLE_ROW: 'client-comp-table-row',
  TABLE_CELL: 'client-comp-table-cell'
};

// TodayStatistics 컴포넌트 CSS 클래스명
export const TODAY_STATISTICS_CSS = {
  CONTAINER: 'today-stats-container',
  HEADER: 'today-stats-header',
  TITLE: 'today-stats-title',
  REFRESH_BUTTON: 'today-stats-refresh-button',
  STATS_GRID: 'today-stats-grid',
  STAT_CARD: 'today-stats-card',
  STAT_HEADER: 'today-stats-header',
  STAT_VALUE: 'today-stats-value',
  STAT_LABEL: 'today-stats-label',
  STAT_ICON: 'today-stats-icon'
};

// 전체 CSS 클래스명 객체
export const CSS_CLASSES = {
  ADMIN_DASHBOARD: ADMIN_DASHBOARD_CSS,
  COMMON_DASHBOARD: COMMON_DASHBOARD_CSS,
  SESSION_MANAGEMENT: SESSION_MANAGEMENT_CSS,
  CONSULTANT_COMPREHENSIVE: CONSULTANT_COMPREHENSIVE_CSS,
  CLIENT_COMPREHENSIVE: CLIENT_COMPREHENSIVE_CSS,
  TODAY_STATISTICS: TODAY_STATISTICS_CSS
};

export default CSS_CLASSES;
