/**
 * 업종별 라우트 접근 제어 가드 (동적 관리)
/**
 * 하드코딩 금지 - API 또는 설정에서 동적으로 조회
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import { hasMenuAccess } from '../../constants/MenuConstants';
import { apiGet } from '../../utils/ajax';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
/**
 * 업종별 라우트 접근 제어 가드
/**
 * @param {Object} props
/**
 * @param {React.ReactNode} props.children - 보호할 컴포넌트
/**
 * @param {string} props.requiredBusinessType - 필요한 업종 (선택적)
/**
 * @param {string} props.requiredMenu - 필요한 메뉴 권한 (선택적)
/**
 * @param {string[]} props.allowedBusinessTypes - 허용된 업종 목록 (선택적)
/**
 * @param {string} props.fallbackPath - 접근 거부 시 리다이렉트 경로
/**
 * @param {boolean} props.showLoading - 로딩 화면 표시 여부
 */
const BusinessTypeGuard = ({ 
  children, 
  requiredBusinessType = null,
  requiredMenu = null,
  allowedBusinessTypes = null,
  fallbackPath = '/dashboard',
  showLoading = true
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessResult, setAccessResult] = useState(null);
  
  const user = sessionManager.getUser();

  useEffect(() => {
    checkAccess();
  }, [location.pathname, user]);

  const checkAccess = async () => {
    try {
      setIsLoading(true);
      
      // 인증 확인
      if (!user) {
        console.warn('BusinessTypeGuard: 인증되지 않은 사용자');
        setAccessResult({
          allowed: false,
          reason: 'AUTHENTICATION_REQUIRED',
          redirectTo: '/login'
        });
        setHasAccess(false);
        return;
      }

      // 업종 정보 조회
      const userBusinessType = await getUserBusinessType(user);
      const userRole = user.role;
      
      console.debug('BusinessTypeGuard 접근 검증:', {
        path: location.pathname,
        userBusinessType,
        userRole,
        requiredBusinessType,
        requiredMenu,
        allowedBusinessTypes
      });

      // 접근 권한 검증
      const result = await validateAccess({
        userBusinessType,
        userRole,
        requiredBusinessType,
        requiredMenu,
        allowedBusinessTypes,
        path: location.pathname
      });

      setAccessResult(result);
      setHasAccess(result.allowed);

    } catch (error) {
      console.error('BusinessTypeGuard 접근 검증 오류:', error);
      setAccessResult({
        allowed: false,
        reason: 'VALIDATION_ERROR',
        redirectTo: fallbackPath
      });
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중
  if (isLoading && showLoading) {
    return <div className="mg-loading">로딩중...</div>;
  }

  // 접근 거부
  if (!hasAccess && accessResult) {
    const redirectTo = accessResult.redirectTo || fallbackPath;
    
    console.warn('BusinessTypeGuard 접근 거부:', {
      path: location.pathname,
      reason: accessResult.reason,
      redirectTo
    });

    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          reason: accessResult.reason,
          message: getAccessDeniedMessage(accessResult.reason)
        }} 
        replace 
      />
    );
  }

  // 접근 허용
  return children;
};

/**
 * 사용자 업종 정보 조회 (동적)
/**
 * @param {Object} user - 사용자 정보
/**
 * @returns {Promise<string>} 업종 타입
 */
const getUserBusinessType = async (user) => {
  // 캐시에서 조회
  const cached = getCachedBusinessType(user.id);
  if (cached) {
    return cached;
  }

  try {
    // API에서 조회
    const response = await apiGet(`/api/users/${user.id}/business-type`);
    if (response?.success) {
      const businessType = response.data?.businessType;
      cacheBusinessType(user.id, businessType);
      return businessType;
    }
  } catch (error) {
    console.warn('사용자 업종 API 조회 실패:', error);
  }

  // 폴백: 사용자 객체에서 조회
  return user.tenant?.businessType || 
         user.tenant?.categoryCode || 
         user.businessType || 
         'UNKNOWN';
};

/**
 * 접근 권한 검증 (동적)
/**
 * @param {Object} params - 검증 파라미터
/**
 * @returns {Promise<Object>} 검증 결과
 */
const validateAccess = async ({
  userBusinessType,
  userRole,
  requiredBusinessType,
  requiredMenu,
  allowedBusinessTypes,
  path
}) => {
  // 1. 업종 검증
  if (requiredBusinessType) {
    if (userBusinessType !== requiredBusinessType) {
      return {
        allowed: false,
        reason: 'BUSINESS_TYPE_MISMATCH',
        details: {
          required: requiredBusinessType,
          actual: userBusinessType
        }
      };
    }
  }

  // 2. 허용된 업종 목록 검증
  if (allowedBusinessTypes && Array.isArray(allowedBusinessTypes)) {
    if (!allowedBusinessTypes.includes(userBusinessType)) {
      return {
        allowed: false,
        reason: 'BUSINESS_TYPE_NOT_ALLOWED',
        details: {
          allowed: allowedBusinessTypes,
          actual: userBusinessType
        }
      };
    }
  }

  // 3. 메뉴 권한 검증
  if (requiredMenu) {
    try {
      const hasMenu = await hasMenuAccess(requiredMenu, userBusinessType, userRole);
      if (!hasMenu) {
        return {
          allowed: false,
          reason: 'MENU_ACCESS_DENIED',
          details: {
            menu: requiredMenu,
            businessType: userBusinessType,
            role: userRole
          }
        };
      }
    } catch (error) {
      console.warn('메뉴 권한 검증 실패:', error);
      return {
        allowed: false,
        reason: 'MENU_VALIDATION_ERROR',
        details: { error: error.message }
      };
    }
  }

  // 4. 경로별 추가 검증 (향후 확장)
  const pathValidation = await validatePathAccess(path, userBusinessType, userRole);
  if (!pathValidation.allowed) {
    return pathValidation;
  }

  return {
    allowed: true,
    reason: 'ACCESS_GRANTED'
  };
};

/**
 * 경로별 접근 권한 검증 (향후 확장)
/**
 * @param {string} path - 접근 경로
/**
 * @param {string} businessType - 업종
/**
 * @param {string} userRole - 사용자 역할
/**
 * @returns {Promise<Object>} 검증 결과
 */
const validatePathAccess = async (path, businessType, userRole) => {
  // 경로 패턴 기반 검증 (임시)
  const pathPatterns = {
    '/consultant': ['CONSULTATION'],
    '/client': ['CONSULTATION'],
    '/sessions': ['CONSULTATION'],
    '/mappings': ['CONSULTATION'],
    '/courses': ['ACADEMY'],
    '/classes': ['ACADEMY'],
    '/enrollments': ['ACADEMY'],
    '/attendance': ['ACADEMY'],
    '/tuition': ['ACADEMY']
  };

  for (const [pattern, allowedTypes] of Object.entries(pathPatterns)) {
    if (path.startsWith(pattern)) {
      if (!allowedTypes.includes(businessType)) {
        return {
          allowed: false,
          reason: 'PATH_BUSINESS_TYPE_MISMATCH',
          details: {
            path,
            allowedTypes,
            actualType: businessType
          }
        };
      }
    }
  }

  return { allowed: true };
};

/**
 * 접근 거부 메시지 생성
/**
 * @param {string} reason - 거부 사유
/**
 * @returns {string} 사용자 친화적 메시지
 */
const getAccessDeniedMessage = (reason) => {
  const messages = {
    'AUTHENTICATION_REQUIRED': '로그인이 필요합니다.',
    'BUSINESS_TYPE_MISMATCH': '이 기능은 해당 업종에서 사용할 수 없습니다.',
    'BUSINESS_TYPE_NOT_ALLOWED': '접근 권한이 없습니다.',
    'MENU_ACCESS_DENIED': '메뉴 접근 권한이 없습니다.',
    'PATH_BUSINESS_TYPE_MISMATCH': '이 페이지는 해당 업종에서 사용할 수 없습니다.',
    'VALIDATION_ERROR': '접근 권한 확인 중 오류가 발생했습니다.',
    'MENU_VALIDATION_ERROR': '메뉴 권한 확인 중 오류가 발생했습니다.'
  };

  return messages[reason] || '접근이 제한되었습니다.';
};

// ============ 캐시 관리 ============

/**
 * 업종 정보 캐시 조회
 */
const getCachedBusinessType = (userId) => {
  const cacheKey = `user_business_type_${userId}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < 1800000) { // 30분 캐시
        return data.businessType;
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
 * 업종 정보 캐시 저장
 */
const cacheBusinessType = (userId, businessType) => {
  const cacheKey = `user_business_type_${userId}`;
  const data = { businessType, timestamp: Date.now() };
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.warn('업종 정보 캐시 저장 실패:', e);
  }
};

/**
 * 상담소 전용 라우트 가드
 */
export const ConsultationGuard = ({ children, fallbackPath = '/dashboard' }) => (
  <BusinessTypeGuard 
    requiredBusinessType="CONSULTATION"
    fallbackPath={fallbackPath}
  >
    {children}
  </BusinessTypeGuard>
);

/**
 * 학원 전용 라우트 가드
 */
export const AcademyGuard = ({ children, fallbackPath = '/dashboard' }) => (
  <BusinessTypeGuard 
    requiredBusinessType="ACADEMY"
    fallbackPath={fallbackPath}
  >
    {children}
  </BusinessTypeGuard>
);

/**
 * 메뉴별 접근 가드
 */
export const MenuGuard = ({ children, menu, fallbackPath = '/dashboard' }) => (
  <BusinessTypeGuard 
    requiredMenu={menu}
    fallbackPath={fallbackPath}
  >
    {children}
  </BusinessTypeGuard>
);

/**
 * 다중 업종 허용 가드
 */
export const MultiBusinessTypeGuard = ({ children, allowedTypes, fallbackPath = '/dashboard' }) => (
  <BusinessTypeGuard 
    allowedBusinessTypes={allowedTypes}
    fallbackPath={fallbackPath}
  >
    {children}
  </BusinessTypeGuard>
);

/**
 * 캐시 초기화
 */
export const clearBusinessTypeGuardCache = () => {
  const keys = Object.keys(sessionStorage);
  const cacheKeys = keys.filter(key => key.startsWith('user_business_type_'));
  
  cacheKeys.forEach(key => sessionStorage.removeItem(key));
  console.debug(`BusinessTypeGuard 캐시 초기화: ${cacheKeys.length}개 항목`);
};

export default BusinessTypeGuard;
