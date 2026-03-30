/**
 * 브랜딩 정보 관리 Hook
/**
 * 테넌트별 브랜딩 정보를 로드하고 관리하는 커스텀 Hook
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

import { useState, useEffect, useCallback } from 'react';
import { getBrandingInfo, brandingToHeaderProps, clearBrandingCache } from '../utils/brandingUtils';
import { sessionManager } from '../utils/sessionManager';

/**
 * 브랜딩 정보 Hook
/**
 * 
/**
 * @param {Object} options - 옵션
/**
 * @param {boolean} options.autoLoad - 자동 로드 여부 (기본값: true)
/**
 * @param {boolean} options.useCache - 캐시 사용 여부 (기본값: true)
/**
 * @returns {Object} 브랜딩 상태 및 함수들
 */
export const useBranding = (options = {}) => {
  const { autoLoad = true, useCache = true } = options;
  
  const [brandingInfo, setBrandingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headerProps, setHeaderProps] = useState({
    logoType: 'text',
    title: 'Core Solution',
    logoAlt: 'Core Solution'
  });

/**
   * 브랜딩 정보 로드
   */
  const loadBrandingInfo = useCallback(async (forceReload = false) => {
    // 로그인하지 않은 경우 기본값 사용
    const user = sessionManager.getUser();
    if (!user) {
      console.debug('사용자 정보 없음, 기본 브랜딩 사용');
      const defaultProps = brandingToHeaderProps(null);
      setHeaderProps(defaultProps);
      setBrandingInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('브랜딩 정보 로드 시작');

      // 로그인 상태 및 테넌트 정보 확인
      const currentUser = sessionManager.getUser();
      const hasValidSession = currentUser && currentUser.tenant && currentUser.tenant.tenantId;

      if (!hasValidSession) {
        // console.log('세션 정보 없음, 브랜딩 기본값 사용'); // 로그 출력 줄임
        const defaultProps = brandingToHeaderProps(null);
        setHeaderProps(defaultProps);
        setBrandingInfo(null);
        return;
      }

      const branding = await getBrandingInfo(useCache && !forceReload);
      setBrandingInfo(branding);
      
      // UnifiedHeader props 생성
      const props = brandingToHeaderProps(branding);
      setHeaderProps(props);
      
      console.debug('브랜딩 정보 로드 완료:', {
        logoType: props.logoType,
        title: props.title,
        hasLogo: Boolean(branding?.logo?.url)
      });

    } catch (err) {
      console.error('브랜딩 정보 로드 실패:', err);
      setError(err);
      
      // 오류 시 기본값 사용
      const defaultProps = brandingToHeaderProps(null);
      setHeaderProps(defaultProps);
      setBrandingInfo(null);
      
    } finally {
      setIsLoading(false);
    }
  }, [useCache]);

/**
   * 브랜딩 정보 새로고침
   */
  const refreshBranding = useCallback(() => {
    clearBrandingCache();
    return loadBrandingInfo(true);
  }, [loadBrandingInfo]);

/**
   * 브랜딩 정보 업데이트 후 새로고침
   */
  const updateAndRefresh = useCallback(async (updateFn) => {
    try {
      setIsLoading(true);
      await updateFn();
      await refreshBranding();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBranding]);

  // 자동 로드
  useEffect(() => {
    if (autoLoad) {
      loadBrandingInfo();
    }
  }, [autoLoad, loadBrandingInfo]);

  // 사용자 변경 감지 (테넌트 전환 등)
  useEffect(() => {
    const user = sessionManager.getUser();
    const tenantId = user?.tenantId;
    
    if (tenantId) {
      // console.log('테넌트 변경 감지, 브랜딩 정보 새로고침:', tenantId); // 로그 출력 줄임
      refreshBranding();
    }
  }, [refreshBranding]); // tenantId 의존성 제거하여 무한 루프 방지

  return {
    // 상태
    brandingInfo,
    isLoading,
    error,
    headerProps,
    
    // 함수
    loadBrandingInfo,
    refreshBranding,
    updateAndRefresh,
    
    // 편의 속성
    logoType: headerProps.logoType,
    logoImage: headerProps.logoImage,
    title: headerProps.title,
    logoAlt: headerProps.logoAlt,
    
    // 상태 확인
    hasCustomLogo: headerProps.logoType === 'image' && 
                   headerProps.logoImage && 
                   !headerProps.logoImage.includes('core-solution-logo.png'),
    hasCustomName: headerProps.title !== 'Core Solution' &&
                   headerProps.title !== 'coreSolution'
  };
};
