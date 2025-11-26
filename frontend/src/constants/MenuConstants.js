/**
 * 업종별 메뉴 접근 제어 상수 (동적 관리)
 * 하드코딩 금지 - API 또는 설정에서 동적으로 조회
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */

import { apiGet } from '../utils/ajax';

/**
 * 메뉴 카테고리 정의
 */
export const MENU_CATEGORIES = {
  COMMON: 'common',           // 공통 메뉴
  CONSULTATION: 'consultation', // 상담소 특화
  ACADEMY: 'academy',         // 학원 특화
  ERP: 'erp',                // ERP 기능
  ADMIN: 'admin'             // 관리자 전용
};

/**
 * 메뉴 권한 레벨
 */
export const MENU_PERMISSION_LEVELS = {
  PUBLIC: 'public',           // 모든 사용자
  AUTHENTICATED: 'authenticated', // 인증된 사용자
  ROLE_BASED: 'role_based',   // 역할 기반
  ADMIN_ONLY: 'admin_only'    // 관리자만
};

/**
 * 기본 메뉴 설정 (임시, 향후 API에서 조회)
 */
const DEFAULT_MENU_CONFIG = {
  // 공통 메뉴
  dashboard: {
    category: MENU_CATEGORIES.COMMON,
    permission: MENU_PERMISSION_LEVELS.AUTHENTICATED,
    label: '대시보드',
    path: '/dashboard',
    icon: 'dashboard',
    order: 1
  },
  mypage: {
    category: MENU_CATEGORIES.COMMON,
    permission: MENU_PERMISSION_LEVELS.AUTHENTICATED,
    label: '마이페이지',
    path: '/mypage',
    icon: 'person',
    order: 99
  },
  notifications: {
    category: MENU_CATEGORIES.COMMON,
    permission: MENU_PERMISSION_LEVELS.AUTHENTICATED,
    label: '알림',
    path: '/notifications',
    icon: 'notifications',
    order: 98
  },
  help: {
    category: MENU_CATEGORIES.COMMON,
    permission: MENU_PERMISSION_LEVELS.PUBLIC,
    label: '도움말',
    path: '/help',
    icon: 'help',
    order: 97
  },
  
  // 상담소 특화 메뉴
  sessions: {
    category: MENU_CATEGORIES.CONSULTATION,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['CONSULTATION_COUNSELOR', 'CONSULTATION_DIRECTOR'],
    label: '세션 관리',
    path: '/sessions',
    icon: 'psychology',
    order: 10
  },
  consultations: {
    category: MENU_CATEGORIES.CONSULTATION,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['CONSULTATION_COUNSELOR', 'CONSULTATION_DIRECTOR'],
    label: '상담 관리',
    path: '/consultations',
    icon: 'chat',
    order: 11
  },
  clients: {
    category: MENU_CATEGORIES.CONSULTATION,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['CONSULTATION_COUNSELOR', 'CONSULTATION_DIRECTOR'],
    label: '내담자 관리',
    path: '/clients',
    icon: 'people',
    order: 12
  },
  consultants: {
    category: MENU_CATEGORIES.CONSULTATION,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['CONSULTATION_DIRECTOR'],
    label: '상담사 관리',
    path: '/consultants',
    icon: 'supervisor_account',
    order: 13
  },
  mappings: {
    category: MENU_CATEGORIES.CONSULTATION,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['CONSULTATION_DIRECTOR'],
    label: '매칭 관리',
    path: '/mappings',
    icon: 'link',
    order: 14
  },
  
  // 학원 특화 메뉴
  courses: {
    category: MENU_CATEGORIES.ACADEMY,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['ACADEMY_TEACHER', 'ACADEMY_DIRECTOR'],
    label: '강좌 관리',
    path: '/courses',
    icon: 'school',
    order: 20
  },
  classes: {
    category: MENU_CATEGORIES.ACADEMY,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['ACADEMY_TEACHER', 'ACADEMY_DIRECTOR'],
    label: '반 관리',
    path: '/classes',
    icon: 'class',
    order: 21
  },
  enrollments: {
    category: MENU_CATEGORIES.ACADEMY,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['ACADEMY_STAFF', 'ACADEMY_DIRECTOR'],
    label: '수강 관리',
    path: '/enrollments',
    icon: 'assignment',
    order: 22
  },
  attendance: {
    category: MENU_CATEGORIES.ACADEMY,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['ACADEMY_TEACHER', 'ACADEMY_DIRECTOR'],
    label: '출석 관리',
    path: '/attendance',
    icon: 'fact_check',
    order: 23
  },
  tuition: {
    category: MENU_CATEGORIES.ACADEMY,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['ACADEMY_STAFF', 'ACADEMY_DIRECTOR'],
    label: '수강료 관리',
    path: '/tuition',
    icon: 'payment',
    order: 24
  },
  
  // ERP 메뉴 (기능 활성화 시)
  'erp-dashboard': {
    category: MENU_CATEGORIES.ERP,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['ADMIN', 'DIRECTOR'],
    label: 'ERP 대시보드',
    path: '/erp',
    icon: 'business',
    order: 30,
    requiresFeature: 'ERP_ENABLED'
  },
  'purchase-management': {
    category: MENU_CATEGORIES.ERP,
    permission: MENU_PERMISSION_LEVELS.ROLE_BASED,
    allowedRoles: ['ADMIN', 'DIRECTOR'],
    label: '구매 관리',
    path: '/erp/purchase',
    icon: 'shopping_cart',
    order: 31,
    requiresFeature: 'ERP_ENABLED'
  },
  
  // 관리자 메뉴
  'admin-dashboard': {
    category: MENU_CATEGORIES.ADMIN,
    permission: MENU_PERMISSION_LEVELS.ADMIN_ONLY,
    label: '관리자 대시보드',
    path: '/admin',
    icon: 'admin_panel_settings',
    order: 40
  },
  'user-management': {
    category: MENU_CATEGORIES.ADMIN,
    permission: MENU_PERMISSION_LEVELS.ADMIN_ONLY,
    label: '사용자 관리',
    path: '/admin/users',
    icon: 'manage_accounts',
    order: 41
  },
  'system-status': {
    category: MENU_CATEGORIES.ADMIN,
    permission: MENU_PERMISSION_LEVELS.ADMIN_ONLY,
    label: '시스템 상태',
    path: '/admin/system',
    icon: 'monitor_heart',
    order: 42
  }
};

/**
 * 업종별 허용 메뉴 반환 (동적)
 * @param {string} businessType - 업종 타입
 * @param {string} userRole - 사용자 역할
 * @param {Object} features - 활성화된 기능 목록
 * @returns {Promise<string[]>} 허용된 메뉴 ID 배열
 */
export const getAllowedMenuItems = async (businessType, userRole, features = {}) => {
  // 캐시에서 조회
  const cachedMenus = getMenuCacheByBusinessType(businessType, userRole);
  if (cachedMenus) {
    return cachedMenus;
  }
  
  try {
    // API에서 업종별 메뉴 조회 (향후 구현)
    const allowedMenus = await fetchAllowedMenusByBusinessType(businessType, userRole, features);
    
    // 캐시에 저장
    cacheMenusByBusinessType(businessType, userRole, allowedMenus);
    
    return allowedMenus;
  } catch (error) {
    console.warn('메뉴 API 조회 실패, 기본 설정 사용:', error);
    
    // API 실패 시 기본 로직 사용
    return getAllowedMenusFromConfig(businessType, userRole, features);
  }
};

/**
 * 메뉴 접근 권한 검증 (동적)
 * @param {string} menuItem - 메뉴 ID
 * @param {string} businessType - 업종 타입
 * @param {string} userRole - 사용자 역할
 * @param {Object} features - 활성화된 기능 목록
 * @returns {Promise<boolean>} 접근 권한 여부
 */
export const hasMenuAccess = async (menuItem, businessType, userRole, features = {}) => {
  const allowedMenus = await getAllowedMenuItems(businessType, userRole, features);
  return allowedMenus.includes(menuItem);
};

/**
 * 메뉴 설정 조회 (동적)
 * @param {string} menuItem - 메뉴 ID
 * @returns {Promise<Object|null>} 메뉴 설정
 */
export const getMenuConfig = async (menuItem) => {
  // 캐시에서 조회
  const cachedConfig = getMenuConfigFromCache(menuItem);
  if (cachedConfig) {
    return cachedConfig;
  }
  
  try {
    // API에서 메뉴 설정 조회 (향후 구현)
    const config = await fetchMenuConfig(menuItem);
    
    // 캐시에 저장
    cacheMenuConfig(menuItem, config);
    
    return config;
  } catch (error) {
    console.warn(`메뉴 설정 API 조회 실패: ${menuItem}`, error);
    
    // API 실패 시 기본 설정 반환
    return DEFAULT_MENU_CONFIG[menuItem] || null;
  }
};

/**
 * 기본 설정에서 업종별 허용 메뉴 조회 (임시)
 * @param {string} businessType - 업종 타입
 * @param {string} userRole - 사용자 역할
 * @param {Object} features - 활성화된 기능 목록
 * @returns {string[]} 허용된 메뉴 ID 배열
 */
const getAllowedMenusFromConfig = (businessType, userRole, features) => {
  const allowedMenus = [];
  
  Object.entries(DEFAULT_MENU_CONFIG).forEach(([menuId, config]) => {
    // 카테고리별 필터링
    if (config.category === MENU_CATEGORIES.COMMON) {
      // 공통 메뉴는 모든 업종에서 허용
      if (checkMenuPermission(config, userRole)) {
        allowedMenus.push(menuId);
      }
    } else if (config.category === MENU_CATEGORIES.CONSULTATION) {
      // 상담소 특화 메뉴
      if (businessType === 'CONSULTATION' && checkMenuPermission(config, userRole)) {
        allowedMenus.push(menuId);
      }
    } else if (config.category === MENU_CATEGORIES.ACADEMY) {
      // 학원 특화 메뉴
      if (businessType === 'ACADEMY' && checkMenuPermission(config, userRole)) {
        allowedMenus.push(menuId);
      }
    } else if (config.category === MENU_CATEGORIES.ERP) {
      // ERP 메뉴 (기능 활성화 확인)
      if (features.erpEnabled && checkMenuPermission(config, userRole)) {
        allowedMenus.push(menuId);
      }
    } else if (config.category === MENU_CATEGORIES.ADMIN) {
      // 관리자 메뉴
      if (checkMenuPermission(config, userRole)) {
        allowedMenus.push(menuId);
      }
    }
  });
  
  return allowedMenus.sort((a, b) => {
    const orderA = DEFAULT_MENU_CONFIG[a]?.order || 999;
    const orderB = DEFAULT_MENU_CONFIG[b]?.order || 999;
    return orderA - orderB;
  });
};

/**
 * 메뉴 권한 확인
 * @param {Object} menuConfig - 메뉴 설정
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 권한 여부
 */
const checkMenuPermission = (menuConfig, userRole) => {
  switch (menuConfig.permission) {
    case MENU_PERMISSION_LEVELS.PUBLIC:
      return true;
    case MENU_PERMISSION_LEVELS.AUTHENTICATED:
      return !!userRole;
    case MENU_PERMISSION_LEVELS.ROLE_BASED:
      return menuConfig.allowedRoles?.includes(userRole) || false;
    case MENU_PERMISSION_LEVELS.ADMIN_ONLY:
      return isAdminRole(userRole);
    default:
      return false;
  }
};

/**
 * 관리자 역할 확인 (동적)
 * @param {string} userRole - 사용자 역할
 * @returns {boolean} 관리자 역할 여부
 */
const isAdminRole = (userRole) => {
  // 관리자 패턴 확인 (임시)
  const adminPatterns = ['ADMIN', 'DIRECTOR', 'MASTER'];
  return adminPatterns.some(pattern => 
    userRole?.toUpperCase().includes(pattern)
  );
};

// ============ 캐시 관리 함수들 ============

/**
 * 업종별 메뉴 캐시 조회
 */
const getMenuCacheByBusinessType = (businessType, userRole) => {
  const cacheKey = `menu_cache_${businessType}_${userRole}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < 1800000) { // 30분 캐시
        return data.menus;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }
  
  return null;
};

/**
 * 업종별 메뉴 캐시 저장
 */
const cacheMenusByBusinessType = (businessType, userRole, menus) => {
  const cacheKey = `menu_cache_${businessType}_${userRole}`;
  const data = { menus, timestamp: Date.now() };
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.warn('메뉴 캐시 저장 실패:', e);
  }
};

/**
 * 메뉴 설정 캐시 조회
 */
const getMenuConfigFromCache = (menuItem) => {
  const cacheKey = `menu_config_${menuItem}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < 3600000) { // 1시간 캐시
        return data.config;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }
  
  return null;
};

/**
 * 메뉴 설정 캐시 저장
 */
const cacheMenuConfig = (menuItem, config) => {
  const cacheKey = `menu_config_${menuItem}`;
  const data = { config, timestamp: Date.now() };
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.warn('메뉴 설정 캐시 저장 실패:', e);
  }
};

// ============ API 함수들 (향후 구현) ============

/**
 * API에서 업종별 허용 메뉴 조회
 */
const fetchAllowedMenusByBusinessType = async (businessType, userRole, features) => {
  const response = await apiGet('/api/admin/menus/allowed', {
    businessType,
    userRole,
    features: Object.keys(features).filter(key => features[key])
  });
  
  if (response?.success) {
    return response.data || [];
  }
  
  throw new Error('메뉴 조회 API 실패');
};

/**
 * API에서 메뉴 설정 조회
 */
const fetchMenuConfig = async (menuItem) => {
  const response = await apiGet(`/api/admin/menus/${menuItem}/config`);
  
  if (response?.success) {
    return response.data || null;
  }
  
  throw new Error('메뉴 설정 조회 API 실패');
};

/**
 * 메뉴 캐시 초기화
 */
export const clearMenuCache = () => {
  const keys = Object.keys(sessionStorage);
  const menuCacheKeys = keys.filter(key => 
    key.startsWith('menu_cache_') || key.startsWith('menu_config_')
  );
  
  menuCacheKeys.forEach(key => sessionStorage.removeItem(key));
  console.debug(`메뉴 캐시 초기화: ${menuCacheKeys.length}개 항목`);
};

export default {
  getAllowedMenuItems,
  hasMenuAccess,
  getMenuConfig,
  clearMenuCache,
  MENU_CATEGORIES,
  MENU_PERMISSION_LEVELS
};
