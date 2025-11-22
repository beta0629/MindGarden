/**
 * 위젯 레지스트리
 * 위젯 타입별 컴포넌트 매핑
 * 공통 위젯과 특화 위젯을 분리하여 관리
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-22
 */

// 공통 위젯 (모든 업종에서 사용 가능)
import StatisticsWidget from './StatisticsWidget';
import ChartWidget from './ChartWidget';
import TableWidget from './TableWidget';
import CalendarWidget from './CalendarWidget';
import FormWidget from './FormWidget';
import CustomWidget from './CustomWidget';

// 범용 위젯 (MindGarden 컴포넌트 기반, 모든 업종에서 사용 가능)
import SummaryStatisticsWidget from './SummaryStatisticsWidget';
import ActivityListWidget from './ActivityListWidget';
import WelcomeWidget from './WelcomeWidget';
import QuickActionsWidget from './QuickActionsWidget';
import NavigationMenuWidget from './NavigationMenuWidget';
import MessageWidget from './MessageWidget';
import NotificationWidget from './NotificationWidget';
import ScheduleWidget from './ScheduleWidget';
import RatingWidget from './RatingWidget';
import PaymentWidget from './PaymentWidget';
import HealingCardWidget from './HealingCardWidget';
import PurchaseRequestWidget from './PurchaseRequestWidget';
import PersonalizedMessageWidget from './PersonalizedMessageWidget';

// 공통 컴포넌트 기반 위젯
import HeaderWidget from './common/HeaderWidget';
import ErpCardWidget from './common/ErpCardWidget';

// ERP 공통 위젯 (ERP 기능이 활성화된 테넌트에서 사용)
import ErpStatsGridWidget from './erp/ErpStatsGridWidget';
import ErpManagementGridWidget from './erp/ErpManagementGridWidget';

// 상담소 특화 위젯 (상담소 업종에서만 사용)
import ConsultationSummaryWidget from './consultation/ConsultationSummaryWidget';
import ConsultationScheduleWidget from './consultation/ConsultationScheduleWidget';
import ConsultationStatsWidget from './consultation/ConsultationStatsWidget';
import ConsultationRecordWidget from './consultation/ConsultationRecordWidget';
import ConsultantClientWidget from './consultation/ConsultantClientWidget';
import MappingManagementWidget from './consultation/MappingManagementWidget';
import SessionManagementWidget from './consultation/SessionManagementWidget';
import ScheduleRegistrationWidget from './consultation/ScheduleRegistrationWidget';
import PendingDepositWidget from './consultation/PendingDepositWidget';

// 관리자용 위젯 (관리자 역할에서만 사용)
import SystemStatusWidget from './admin/SystemStatusWidget';
import SystemToolsWidget from './admin/SystemToolsWidget';
import PermissionWidget from './admin/PermissionWidget';
import StatisticsGridWidget from './admin/StatisticsGridWidget';
import ManagementGridWidget from './admin/ManagementGridWidget';

// 학원 특화 위젯 (학원 업종에서만 사용)
// import AcademyScheduleWidget from './academy/AcademyScheduleWidget';
// import AcademyAttendanceWidget from './academy/AcademyAttendanceWidget';

/**
 * 공통 위젯 타입별 컴포넌트 매핑 (모든 업종에서 사용 가능)
 */
const COMMON_WIDGETS = {
  'statistics': StatisticsWidget,
  'chart': ChartWidget,
  'table': TableWidget,
  'calendar': CalendarWidget,
  'form': FormWidget,
  'custom': CustomWidget,
  'summary-statistics': SummaryStatisticsWidget,
  'activity-list': ActivityListWidget,
  'welcome': WelcomeWidget,
  'quick-actions': QuickActionsWidget,
  'navigation-menu': NavigationMenuWidget,
  'message': MessageWidget,
  'notification': NotificationWidget,
  'schedule': ScheduleWidget,
  'rating': RatingWidget,
  'payment': PaymentWidget,
  'healing-card': HealingCardWidget,
  'purchase-request': PurchaseRequestWidget,
  'personalized-message': PersonalizedMessageWidget,
  // 공통 컴포넌트 기반 위젯
  'header': HeaderWidget,
  'erp-card': ErpCardWidget,
  // ERP 공통 위젯 (ERP 기능이 활성화된 테넌트에서 사용)
  'erp-stats-grid': ErpStatsGridWidget,
  'erp-management-grid': ErpManagementGridWidget,
  // 관리자용 위젯 (공통으로 등록하되 visibility로 제어)
  'system-status': SystemStatusWidget,
  'system-tools': SystemToolsWidget,
  'permission': PermissionWidget,
  'statistics-grid': StatisticsGridWidget,
  'management-grid': ManagementGridWidget
};

/**
 * 상담소 특화 위젯 타입별 컴포넌트 매핑
 */
const CONSULTATION_WIDGETS = {
  'consultation-summary': ConsultationSummaryWidget,
  'consultation-schedule': ConsultationScheduleWidget,
  'consultation-stats': ConsultationStatsWidget,
  'consultation-record': ConsultationRecordWidget,
  'consultant-client': ConsultantClientWidget,
  'mapping-management': MappingManagementWidget,
  'session-management': SessionManagementWidget,
  'schedule-registration': ScheduleRegistrationWidget,
  'pending-deposit': PendingDepositWidget
};

/**
 * 학원 특화 위젯 타입별 컴포넌트 매핑
 */
const ACADEMY_WIDGETS = {
  // 'academy-schedule': AcademyScheduleWidget,
  // 'academy-attendance': AcademyAttendanceWidget
};

/**
 * ERP 특화 위젯 타입별 컴포넌트 매핑 (ERP 기능이 활성화된 테넌트에서 사용)
 */
const ERP_WIDGETS = {
  'erp-stats-grid': ErpStatsGridWidget,
  'erp-management-grid': ErpManagementGridWidget
};

/**
 * 전체 위젯 컴포넌트 매핑 (공통 + 특화)
 */
const WIDGET_COMPONENTS = {
  ...COMMON_WIDGETS,
  ...CONSULTATION_WIDGETS,
  ...ACADEMY_WIDGETS,
  ...ERP_WIDGETS
};

/**
 * 위젯 컴포넌트 가져오기
 * @param {string} widgetType - 위젯 타입
 * @param {string} businessType - 업종 타입 (선택적, 특화 위젯 필터링용)
 * @returns {React.Component|null} 위젯 컴포넌트 또는 null
 */
export const getWidgetComponent = (widgetType, businessType = null) => {
  if (!widgetType) {
    return null;
  }
  
  const normalizedType = widgetType.toLowerCase();
  
  // 공통 위젯은 항상 반환
  if (COMMON_WIDGETS[normalizedType]) {
    return COMMON_WIDGETS[normalizedType];
  }
  
  // 특화 위젯은 업종에 따라 필터링
  if (businessType) {
    const normalizedBusinessType = businessType.toLowerCase();
    
    if (normalizedBusinessType === 'consultation' && CONSULTATION_WIDGETS[normalizedType]) {
      return CONSULTATION_WIDGETS[normalizedType];
    }
    
    if (normalizedBusinessType === 'academy' && ACADEMY_WIDGETS[normalizedType]) {
      return ACADEMY_WIDGETS[normalizedType];
    }
  }
  
  // ERP 위젯은 항상 사용 가능 (ERP 기능 활성화 여부는 위젯 내부에서 체크)
  if (ERP_WIDGETS[normalizedType]) {
    return ERP_WIDGETS[normalizedType];
  }
  
  // 업종 정보가 없으면 전체에서 검색 (하위 호환성)
  return WIDGET_COMPONENTS[normalizedType] || null;
};

/**
 * 위젯 타입이 지원되는지 확인
 * @param {string} widgetType - 위젯 타입
 * @returns {boolean} 지원 여부
 */
export const isWidgetTypeSupported = (widgetType) => {
  if (!widgetType) {
    return false;
  }
  
  const normalizedType = widgetType.toLowerCase();
  return normalizedType in WIDGET_COMPONENTS;
};

/**
 * 지원되는 위젯 타입 목록 반환
 * @param {string} businessType - 업종 타입 (선택적)
 * @returns {string[]} 위젯 타입 배열
 */
export const getSupportedWidgetTypes = (businessType = null) => {
  if (!businessType) {
    return Object.keys(WIDGET_COMPONENTS);
  }
  
  const normalizedBusinessType = businessType.toLowerCase();
  const types = [...Object.keys(COMMON_WIDGETS)];
  
  if (normalizedBusinessType === 'consultation') {
    types.push(...Object.keys(CONSULTATION_WIDGETS));
  }
  
  if (normalizedBusinessType === 'academy') {
    types.push(...Object.keys(ACADEMY_WIDGETS));
  }
  
  // ERP 위젯은 항상 포함 (ERP 기능 활성화 여부는 위젯 내부에서 체크)
  types.push(...Object.keys(ERP_WIDGETS));
  
  return types;
};

/**
 * 공통 위젯 타입 목록 반환 (모든 업종에서 사용 가능)
 * @returns {string[]} 공통 위젯 타입 배열
 */
export const getCommonWidgetTypes = () => {
  return Object.keys(COMMON_WIDGETS);
};

/**
 * 상담소 특화 위젯 타입 목록 반환
 * @returns {string[]} 상담소 특화 위젯 타입 배열
 */
export const getConsultationWidgetTypes = () => {
  return Object.keys(CONSULTATION_WIDGETS);
};

/**
 * 학원 특화 위젯 타입 목록 반환
 * @returns {string[]} 학원 특화 위젯 타입 배열
 */
export const getAcademyWidgetTypes = () => {
  return Object.keys(ACADEMY_WIDGETS);
};

/**
 * ERP 특화 위젯 타입 목록 반환
 * @returns {string[]} ERP 특화 위젯 타입 배열
 */
export const getErpWidgetTypes = () => {
  return Object.keys(ERP_WIDGETS);
};

/**
 * 위젯 레지스트리에 커스텀 위젯 등록
 * @param {string} widgetType - 위젯 타입
 * @param {React.Component} component - 위젯 컴포넌트
 */
export const registerWidget = (widgetType, component) => {
  if (!widgetType || !component) {
    console.warn('위젯 등록 실패: widgetType과 component는 필수입니다.');
    return;
  }
  
  const normalizedType = widgetType.toLowerCase();
  WIDGET_COMPONENTS[normalizedType] = component;
  console.log(`✅ 위젯 등록 완료: ${normalizedType}`);
};

export default {
  getWidgetComponent,
  isWidgetTypeSupported,
  getSupportedWidgetTypes,
  registerWidget
};

