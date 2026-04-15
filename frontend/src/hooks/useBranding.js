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

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const loadBrandingInfo = useCallback(async(forceReload = false) => {
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
        hasLogo: Boolean(branding?.logo?.dataUri || branding?.logo?.url)
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
  const updateAndRefresh = useCallback(async(updateFn) => {
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

  const sessionKeyRef = useRef(null);
  const isSessionEffectInitRef = useRef(true);

  // 테넌트/사용자 식별자 변경 시에만 로드/새로고침 (마운트 시 autoLoad와 중복 refresh 방지, 세션 알림으로 전환 감지)
  useEffect(() => {
    const runIdentityCheck = () => {
      const user = sessionManager.getUser();
      const tenantId = user?.tenantId || user?.tenant?.tenantId;
      const userId = user?.id;
      const key = tenantId != null ? `${String(tenantId)}:${String(userId ?? '')}` : null;
      const prevKey = sessionKeyRef.current;

      if (isSessionEffectInitRef.current) {
        isSessionEffectInitRef.current = false;
        sessionKeyRef.current = key;
        return;
      }

      if (key === prevKey) {
        return;
      }

      sessionKeyRef.current = key;

      if (key == null) {
        return;
      }

      if (prevKey == null) {
        loadBrandingInfo(false);
        return;
      }

      refreshBranding();
    };

    runIdentityCheck();

    const listener = () => {
      runIdentityCheck();
    };
    sessionManager.addListener(listener);

    return () => {
      sessionManager.removeListener(listener);
    };
  }, [refreshBranding, loadBrandingInfo]);

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
