/**
 * 위젯 가시성 검증 유틸리티
/**
 * 업종별 위젯 접근 제어 및 가시성 검증 로직
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

import { 
  getCommonWidgetTypes, 
  getConsultationWidgetTypes, 
  getAcademyWidgetTypes,
  getErpWidgetTypes
} from '../components/dashboard/widgets/WidgetRegistry';

import { apiGet } from './ajax';
import { sessionManager } from './sessionManager';

/**
 * 업종별 허용 위젯 타입 반환 (동적)
/**
 * @param {string} businessType - 업종 타입 (CONSULTATION, ACADEMY 등)
/**
 * @returns {string[]} 허용된 위젯 타입 배열
 */
export const getAllowedWidgetTypes = (businessType) => {
  if (!businessType) {
    console.warn('업종 정보가 없습니다. 공통 위젯만 허용합니다.');
    return getCommonWidgetTypes();
  }
  
  // 캐시에서 업종별 허용 위젯 조회
  const cachedWidgets = getBusinessTypeWidgetsFromCache(businessType);
  if (cachedWidgets) {
    return cachedWidgets;
  }
  
  // API에서 업종별 허용 위젯 조회 (향후 구현)
  // const allowedWidgets = await fetchAllowedWidgetsByBusinessType(businessType);
  
  // 임시: 레지스트리에서 조회
  return getAllowedWidgetsFromRegistry(businessType);
};

/**
 * 캐시에서 업종별 위젯 조회
/**
 * @param {string} businessType - 업종 타입
/**
 * @returns {string[]|null} 캐시된 위젯 목록 또는 null
 */
const getBusinessTypeWidgetsFromCache = (businessType) => {
  const cacheKey = `business_type_widgets_${businessType.toUpperCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const data = JSON.parse(cached);
      // 캐시 만료 확인 (1시간)
      if (Date.now() - data.timestamp < 3600000) {
        console.debug(`캐시에서 업종별 위젯 조회: ${businessType}`);
        return data.widgets;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    } catch (e) {
      console.warn(`업종별 위젯 캐시 파싱 실패: ${businessType}`, e);
      sessionStorage.removeItem(cacheKey);
    }
  }
  
  return null;
};

/**
 * 레지스트리에서 업종별 허용 위젯 조회 (임시)
/**
 * @param {string} businessType - 업종 타입
/**
 * @returns {string[]} 허용된 위젯 타입 배열
 */
const getAllowedWidgetsFromRegistry = (businessType) => {
  const commonTypes = getCommonWidgetTypes();
  const erpTypes = getErpWidgetTypes();
  
  const normalizedType = businessType.toUpperCase();
  
  // 업종별 특화 위젯 추가
  let businessSpecificTypes = [];
  if (normalizedType === 'CONSULTATION') {
    businessSpecificTypes = getConsultationWidgetTypes();
  } else if (normalizedType === 'ACADEMY') {
    businessSpecificTypes = getAcademyWidgetTypes();
  }
  
  const allowedWidgets = [...commonTypes, ...erpTypes, ...businessSpecificTypes];
  
  // 캐시에 저장
  cacheBusinessTypeWidgets(businessType, allowedWidgets);
  
  return allowedWidgets;
};

/**
 * 업종별 위젯 캐시 저장
/**
 * @param {string} businessType - 업종 타입
/**
 * @param {string[]} widgets - 위젯 목록
 */
const cacheBusinessTypeWidgets = (businessType, widgets) => {
  const cacheKey = `business_type_widgets_${businessType.toUpperCase()}`;
  const data = {
    widgets,
    timestamp: Date.now()
  };
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    console.debug(`업종별 위젯 캐시 저장: ${businessType}, ${widgets.length}개`);
  } catch (e) {
    console.warn(`업종별 위젯 캐시 저장 실패: ${businessType}`, e);
  }
};

/**
 * 위젯 가시성 검증
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @param {string} businessType - 업종 타입
/**
 * @param {string} userRole - 사용자 역할 (선택적)
/**
 * @returns {boolean} 가시성 여부
 */
export const isWidgetVisible = (widgetType, businessType, userRole = null) => {
  if (!widgetType) {
    console.warn('위젯 타입이 필요합니다.');
    return false;
  }
  
  // ⭐ 관리자 특권: 업종 정보 없어도 모든 위젯 접근 가능 (최우선)
  if (userRole === 'ADMIN') {
    console.debug(`✅ ADMIN 특권으로 위젯 접근 허용: ${widgetType}, 역할: ${userRole}, 업종: ${businessType || 'N/A'}`);
    return true;
  }
  
  // 일반 사용자는 업종 정보 필수
  if (!businessType) {
    console.warn(`❌ 업종 정보 필요 (일반 사용자). 위젯: ${widgetType} | 업종: ${businessType || 'undefined'} | 역할: ${userRole}`);
    return false;
  }
  
  const normalizedType = widgetType.toLowerCase();
  const allowedTypes = getAllowedWidgetTypes(businessType);
  const isAllowed = allowedTypes.includes(normalizedType);
  
  if (!isAllowed) {
    console.debug(`위젯 접근 거부: ${widgetType}, 업종: ${businessType}, 역할: ${userRole}`);
    return false;
  }
  
  // 관리자 위젯은 추가 역할 검증 (2단계에서 공통코드로 개선 예정)
  if (isAdminWidget(normalizedType)) {
    const hasAdminRole = (userRole === 'ADMIN'); // 1단계 임시
    if (!hasAdminRole) {
      console.debug(`관리자 위젯 접근 거부: ${widgetType}, 역할: ${userRole}`);
      return false;
    }
  }
  
  console.debug(`위젯 접근 허용: ${widgetType}, 업종: ${businessType}, 역할: ${userRole}`);
  return true;
};

/**
 * 관리자 위젯 여부 확인 (동적)
/**
 * @param {string} widgetType - 위젯 타입 (정규화된)
/**
 * @returns {boolean} 관리자 위젯 여부
 */
const isAdminWidget = (widgetType) => {
  // 위젯 메타데이터에서 관리자 권한 필요 여부 확인
  // TODO: 향후 위젯 메타데이터 시스템 구축 시 동적으로 조회
  return checkWidgetRequiresAdmin(widgetType);
};

/**
 * 위젯 관리자 권한 필요 여부 확인 (동적)
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @returns {boolean} 관리자 권한 필요 여부
 */
const checkWidgetRequiresAdmin = (widgetType) => {
  // 위젯 설정에서 권한 정보 조회
  const widgetConfig = getWidgetConfig(widgetType);
  return widgetConfig?.requiresAdmin || false;
};

/**
 * 위젯 설정 조회 (동적)
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @returns {Object|null} 위젯 설정
 */
const getWidgetConfig = (widgetType) => {
  // 위젯 메타데이터 캐시에서 조회
  const cachedConfig = sessionStorage.getItem(`widget_config_${widgetType}`);
  if (cachedConfig) {
    try {
      return JSON.parse(cachedConfig);
    } catch (e) {
      console.warn(`위젯 설정 파싱 실패: ${widgetType}`, e);
    }
  }
  
  // 기본 설정 반환 (임시)
  return getDefaultWidgetConfig(widgetType);
};

/**
 * 기본 위젯 설정 (임시, 향후 API에서 조회)
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @returns {Object} 기본 위젯 설정
 */
const getDefaultWidgetConfig = (widgetType) => {
  // 임시: 패턴 기반 관리자 권한 확인
  const adminPatterns = ['admin', 'system', 'permission', 'management'];
  const requiresAdmin = adminPatterns.some(pattern => 
    widgetType.toLowerCase().includes(pattern)
  );
  
  return {
    type: widgetType,
    requiresAdmin,
    category: determineWidgetCategory(widgetType),
    permissions: []
  };
};

/**
 * 위젯 카테고리 결정 (동적)
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @returns {string} 위젯 카테고리
 */
const determineWidgetCategory = (widgetType) => {
  const commonTypes = getCommonWidgetTypes();
  const consultationTypes = getConsultationWidgetTypes();
  const academyTypes = getAcademyWidgetTypes();
  const erpTypes = getErpWidgetTypes();
  
  const normalizedType = widgetType.toLowerCase();
  
  if (commonTypes.includes(normalizedType)) return 'common';
  if (consultationTypes.includes(normalizedType)) return 'consultation';
  if (academyTypes.includes(normalizedType)) return 'academy';
  if (erpTypes.includes(normalizedType)) return 'erp';
  
  return 'unknown';
};

/**
 * 관리자 역할 검증 (동적)
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {boolean} 관리자 역할 여부
 */
const isAdminRole = (userRole) => {
  if (!userRole) {
    return false;
  }
  
  // 임시: 동기 버전 (캐시 우선, API는 백그라운드에서 업데이트)
  const cacheKey = `admin_permission_${userRole}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { hasPermission } = JSON.parse(cached);
      console.debug(`관리자 권한 캐시 사용: ${userRole} → ${hasPermission}`);
      return hasPermission;
    } catch (e) {
      console.warn(`캐시 파싱 실패: ${userRole}`, e);
    }
  }
  
  // 비동기로 공통코드에서 조회하고 캐시 업데이트 (백그라운드)
  checkRoleHasAdminPermission(userRole).then(hasPermission => {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      hasPermission,
      timestamp: Date.now(),
      fromCommonCode: true
    }));
    console.debug(`공통코드 기반 관리자 권한 캐시 업데이트: ${userRole} → ${hasPermission}`);
  }).catch(error => {
    console.warn(`공통코드 관리자 권한 조회 실패: ${userRole}`, error);
  });
  
  // 캐시가 없으면 현재 세션 기반으로 임시 판단
  const currentUser = sessionManager?.getUser?.();
  if (currentUser && currentUser.role === userRole) {
    const isOnAdminPage = window.location.pathname.includes('/admin');
    const hasAdminInName = userRole.toUpperCase().includes('ADMIN');
    const result = isOnAdminPage || hasAdminInName;
    
    // 임시 결과를 캐시에 저장 (1분 단기 캐시)
    sessionStorage.setItem(cacheKey, JSON.stringify({
      hasPermission: result,
      timestamp: Date.now(),
      temporary: true
    }));
    
    console.debug(`세션 기반 임시 관리자 권한: ${userRole} → ${result}`);
    return result;
  }
  
  return false;
};

/**
 * 역할 관리자 권한 확인 (동적)
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {boolean} 관리자 권한 여부
 */
const checkRoleHasAdminPermission = async(userRole) => {
  try {
    // 1. 캐시에서 관리자 권한 확인
    const cacheKey = `admin_permission_${userRole}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { hasPermission, timestamp } = JSON.parse(cached);
      // 30분 캐시
      if (Date.now() - timestamp < 30 * 60 * 1000) {
        console.debug(`관리자 권한 캐시 사용: ${userRole} → ${hasPermission}`);
        return hasPermission;
      }
    }
    
    // 2. 공통코드에서 해당 역할의 권한 레벨 조회
    const roleInfo = await fetchRoleInfoFromCommonCode(userRole);
    
    // 3. 권한 레벨이 관리자 레벨인지 확인 (공통코드 기반)
    const hasPermission = await checkAdminLevelFromCommonCode(roleInfo);
    
    // 4. 결과 캐시에 저장
    sessionStorage.setItem(cacheKey, JSON.stringify({
      hasPermission,
      timestamp: Date.now()
    }));
    
    console.debug(`관리자 권한 확인 (공통코드): ${userRole} → ${hasPermission}`);
    return hasPermission;
    
  } catch (error) {
    console.warn(`관리자 권한 확인 실패: ${userRole}`, error);
    
    // 최후 폴백: 현재 사용자 세션 정보에서 확인
    const currentUser = sessionManager?.getUser?.();
    if (currentUser && currentUser.role === userRole) {
      // 관리자 대시보드에 접근했다면 관리자 권한이 있다고 간주
      const isOnAdminPage = window.location.pathname.includes('/admin');
      console.debug(`세션 기반 관리자 권한 확인: ${userRole} → ${isOnAdminPage}`);
      return isOnAdminPage;
    }
    
    return false;
  }
};

/**
 * 공통코드에서 역할 정보 조회
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {Promise<Object>} 역할 정보
 */
const fetchRoleInfoFromCommonCode = async(userRole) => {
  // USER_ROLES 공통코드 그룹에서 해당 역할 조회
  const response = await apiGet(`/api/v1/common-codes?codeGroup=USER_ROLES&codeValue=${userRole}`);
  
  if (response && Array.isArray(response) && response.length > 0) {
    const roleData = response[0];
    return {
      codeValue: roleData.code_value,
      codeLabel: roleData.code_label,
      extraData: roleData.extra_data ? JSON.parse(roleData.extra_data) : {}
    };
  }
  
  throw new Error(`역할 정보를 찾을 수 없습니다: ${userRole}`);
};

/**
 * 공통코드에서 관리자 레벨 확인
/**
 * @param {Object} roleInfo - 역할 정보
/**
 * @returns {Promise<boolean>} 관리자 권한 여부
 */
const checkAdminLevelFromCommonCode = async(roleInfo) => {
  // extra_data에서 admin_level 확인
  if (roleInfo.extraData && typeof roleInfo.extraData.admin_level === 'number') {
    return roleInfo.extraData.admin_level > 0;
  }
  
  // admin_level이 없으면 PERMISSION_LEVELS 공통코드에서 확인
  const permissionResponse = await apiGet(`/api/v1/common-codes?codeGroup=PERMISSION_LEVELS&codeValue=${roleInfo.codeValue}`);
  
  if (permissionResponse && Array.isArray(permissionResponse) && permissionResponse.length > 0) {
    const permissionData = permissionResponse[0];
    const permissionInfo = permissionData.extra_data ? JSON.parse(permissionData.extra_data) : {};
    return permissionInfo.widget_admin === true || permissionInfo.admin_access === true;
  }
  
  return false;
};

/**
 * 위젯 설정 필터링 (배열)
/**
 * @param {Array} widgets - 위젯 설정 배열
/**
 * @param {string} businessType - 업종 타입
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {Array} 필터링된 위젯 배열
 */
export const filterWidgetsByBusinessType = (widgets, businessType, userRole) => {
  if (!Array.isArray(widgets)) {
    console.warn('위젯 배열이 아닙니다:', widgets);
    return [];
  }
  
  if (!businessType) {
    console.warn('업종 정보가 없어 위젯을 필터링할 수 없습니다.');
    return [];
  }
  
  const filteredWidgets = widgets.filter(widget => {
    if (!widget || !widget.type) {
      console.warn('잘못된 위젯 설정:', widget);
      return false;
    }
    
    return isWidgetVisible(widget.type, businessType, userRole);
  });
  
  console.debug(`위젯 필터링 완료: ${widgets.length} → ${filteredWidgets.length}개`);
  return filteredWidgets;
};

/**
 * 대시보드 설정 필터링 (객체)
/**
 * @param {Object} dashboardConfig - 대시보드 설정 객체
/**
 * @param {string} businessType - 업종 타입
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {Object} 필터링된 대시보드 설정
 */
export const filterDashboardByBusinessType = (dashboardConfig, businessType, userRole) => {
  if (!dashboardConfig || typeof dashboardConfig !== 'object') {
    console.warn('잘못된 대시보드 설정:', dashboardConfig);
    return null;
  }
  
  if (!businessType) {
    console.warn('업종 정보가 없어 대시보드를 필터링할 수 없습니다.');
    return null;
  }
  
  // 위젯 배열 필터링
  const filteredWidgets = dashboardConfig.widgets 
    ? filterWidgetsByBusinessType(dashboardConfig.widgets, businessType, userRole)
    : [];
  
  return {
    ...dashboardConfig,
    widgets: filteredWidgets
  };
};

/**
 * 업종별 위젯 통계 반환
/**
 * @param {string} businessType - 업종 타입
/**
 * @returns {Object} 위젯 통계 정보
 */
export const getWidgetStatsByBusinessType = (businessType) => {
  const commonTypes = getCommonWidgetTypes();
  const consultationTypes = getConsultationWidgetTypes();
  const academyTypes = getAcademyWidgetTypes();
  const erpTypes = getErpWidgetTypes();
  
  const stats = {
    businessType,
    common: commonTypes.length,
    consultation: consultationTypes.length,
    academy: academyTypes.length,
    erp: erpTypes.length,
    total: 0,
    allowed: []
  };
  
  switch (businessType?.toUpperCase()) {
    case 'CONSULTATION':
      stats.allowed = [...commonTypes, ...consultationTypes, ...erpTypes];
      break;
    case 'ACADEMY':
      stats.allowed = [...commonTypes, ...academyTypes, ...erpTypes];
      break;
    default:
      stats.allowed = commonTypes;
  }
  
  stats.total = stats.allowed.length;
  
  return stats;
};

/**
 * 위젯 접근 권한 검증 (상세)
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @param {string} businessType - 업종 타입
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {Object} 상세 검증 결과
 */
export const validateWidgetAccess = (widgetType, businessType, userRole) => {
  const result = {
    allowed: false,
    reason: '',
    category: '',
    requiresAdmin: false
  };
  
  if (!widgetType) {
    result.reason = '위젯 타입이 필요합니다.';
    return result;
  }
  
  const normalizedType = widgetType.toLowerCase();
  const commonTypes = getCommonWidgetTypes();
  const consultationTypes = getConsultationWidgetTypes();
  const academyTypes = getAcademyWidgetTypes();
  const erpTypes = getErpWidgetTypes();
  
  // 카테고리 분류
  if (commonTypes.includes(normalizedType)) {
    // 공통 위젯은 업종 정보 없이도 허용
    result.category = 'common';
    result.allowed = true;
    result.reason = '공통 위젯입니다.';
  } else if (erpTypes.includes(normalizedType)) {
    // ERP 위젯도 업종 정보 없이 허용 (Feature Flag로 제어)
    result.category = 'erp';
    result.allowed = true;
    result.reason = 'ERP 위젯입니다.';
  } else if (consultationTypes.includes(normalizedType)) {
    // 상담소 특화 위젯은 업종 검증 필요
    result.category = 'consultation';
    if (!businessType) {
      result.reason = '업종 정보가 필요합니다. (상담소 전용)';
      return result;
    }
    if (businessType.toUpperCase() === 'CONSULTATION') {
      result.allowed = true;
      result.reason = '상담소 특화 위젯입니다.';
    } else {
      result.reason = '상담소 전용 위젯입니다.';
    }
  } else if (academyTypes.includes(normalizedType)) {
    // 학원 특화 위젯은 업종 검증 필요
    result.category = 'academy';
    if (!businessType) {
      result.reason = '업종 정보가 필요합니다. (학원 전용)';
      return result;
    }
    if (businessType.toUpperCase() === 'ACADEMY') {
      result.allowed = true;
      result.reason = '학원 특화 위젯입니다.';
    } else {
      result.reason = '학원 전용 위젯입니다.';
    }
  } else {
    result.reason = '지원하지 않는 위젯 타입입니다.';
    return result;
  }
  
  // 관리자 권한 확인
  if (result.allowed && isAdminWidget(normalizedType)) {
    result.requiresAdmin = true;
    if (!isAdminRole(userRole)) {
      result.allowed = false;
      result.reason = '관리자 권한이 필요합니다.';
    }
  }
  
  return result;
};

/**
 * API에서 업종별 허용 위젯 조회 (향후 구현)
/**
 * @param {string} businessType - 업종 타입
/**
 * @returns {Promise<string[]>} 허용된 위젯 타입 배열
 */
export const fetchAllowedWidgetsByBusinessType = async(businessType) => {
  try {
    const response = await apiGet(`/api/admin/business-types/${businessType}/widgets`);
    if (response && response.success) {
      const widgets = response.data || [];
      cacheBusinessTypeWidgets(businessType, widgets);
      return widgets;
    }
  } catch (error) {
    console.warn(`업종별 위젯 API 조회 실패: ${businessType}`, error);
  }
  
  // API 실패 시 레지스트리에서 조회
  return getAllowedWidgetsFromRegistry(businessType);
};

/**
 * API에서 역할 권한 조회 (향후 구현)
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {Promise<string[]>} 권한 목록
 */
export const fetchRolePermissions = async(userRole) => {
  try {
    const response = await apiGet(`/api/admin/roles/${userRole}/permissions`);
    if (response && response.success) {
      const permissions = response.data || [];
      cacheRolePermissions(userRole, permissions);
      return permissions;
    }
  } catch (error) {
    console.warn(`역할 권한 API 조회 실패: ${userRole}`, error);
  }
  
  return [];
};

/**
 * API에서 위젯 메타데이터 조회 (향후 구현)
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @returns {Promise<Object>} 위젯 메타데이터
 */
export const fetchWidgetMetadata = async(widgetType) => {
  try {
    const response = await apiGet(`/api/admin/widgets/${widgetType}/metadata`);
    if (response && response.success) {
      const metadata = response.data || {};
      cacheWidgetMetadata(widgetType, metadata);
      return metadata;
    }
  } catch (error) {
    console.warn(`위젯 메타데이터 API 조회 실패: ${widgetType}`, error);
  }
  
  return getDefaultWidgetConfig(widgetType);
};

/**
 * 역할 권한 캐시 저장
/**
 * @param {string} userRole - 사용자 역할
/**
 * @param {string[]} permissions - 권한 목록
 */
const cacheRolePermissions = (userRole, permissions) => {
  const cacheKey = `role_permissions_${userRole}`;
  const data = {
    permissions,
    timestamp: Date.now()
  };
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    console.debug(`역할 권한 캐시 저장: ${userRole}, ${permissions.length}개`);
  } catch (e) {
    console.warn(`역할 권한 캐시 저장 실패: ${userRole}`, e);
  }
};

/**
 * 위젯 메타데이터 캐시 저장
/**
 * @param {string} widgetType - 위젯 타입
/**
 * @param {Object} metadata - 위젯 메타데이터
 */
const cacheWidgetMetadata = (widgetType, metadata) => {
  const cacheKey = `widget_config_${widgetType}`;
  const data = {
    ...metadata,
    timestamp: Date.now()
  };
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    console.debug(`위젯 메타데이터 캐시 저장: ${widgetType}`);
  } catch (e) {
    console.warn(`위젯 메타데이터 캐시 저장 실패: ${widgetType}`, e);
  }
};

/**
 * 모든 캐시 초기화
 */
export const clearWidgetVisibilityCache = () => {
  const keys = Object.keys(sessionStorage);
  const cacheKeys = keys.filter(key => 
    key.startsWith('business_type_widgets_') ||
    key.startsWith('role_permissions_') ||
    key.startsWith('widget_config_')
  );
  
  cacheKeys.forEach(key => sessionStorage.removeItem(key));
  console.debug(`위젯 가시성 캐시 초기화: ${cacheKeys.length}개 항목`);
};

/**
 * 캐시 통계 조회
 */
export const getWidgetVisibilityCacheStats = () => {
  const keys = Object.keys(sessionStorage);
  const businessTypeKeys = keys.filter(key => key.startsWith('business_type_widgets_'));
  const roleKeys = keys.filter(key => key.startsWith('role_permissions_'));
  const widgetKeys = keys.filter(key => key.startsWith('widget_config_'));
  
  return {
    businessTypes: businessTypeKeys.length,
    roles: roleKeys.length,
    widgets: widgetKeys.length,
    total: businessTypeKeys.length + roleKeys.length + widgetKeys.length
  };
};

export default {
  getAllowedWidgetTypes,
  isWidgetVisible,
  filterWidgetsByBusinessType,
  filterDashboardByBusinessType,
  getWidgetStatsByBusinessType,
  validateWidgetAccess,
  fetchAllowedWidgetsByBusinessType,
  fetchRolePermissions,
  fetchWidgetMetadata,
  clearWidgetVisibilityCache,
  getWidgetVisibilityCacheStats
};
