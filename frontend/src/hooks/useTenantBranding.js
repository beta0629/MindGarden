/**
 * 테넌트별 브랜딩 CSS 변수 동적 적용 Hook
/**
 * Trinity-CoreSolution-테넌트 구조에 최적화된 브랜딩 시스템
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-28
 */

import { useEffect, useCallback, useRef } from 'react';
import { useBranding } from './useBranding';
import { sessionManager } from '../utils/sessionManager';

/**
 * 테넌트별 브랜딩 CSS 변수 동적 적용 Hook
/**
 * 
/**
 * @param {Object} options - 옵션
/**
 * @param {boolean} options.autoApply - 자동 적용 여부 (기본값: true)
/**
 * @param {HTMLElement} options.target - 대상 요소 (기본값: document.documentElement)
/**
 * @returns {Object} 브랜딩 상태 및 함수들
 */
export const useTenantBranding = (options = {}) => {
  const { autoApply = true, target = null } = options;
  
  // 브랜딩 정보 Hook
  const { brandingInfo, isLoading, error, refreshBranding } = useBranding();
  
  const brandingInfoRef = useRef(brandingInfo);
  useEffect(() => {
    brandingInfoRef.current = brandingInfo;
  }, [brandingInfo]);

/**
   * 테넌트별 CSS 변수 적용
   */
  const applyTenantBranding = useCallback((branding = null) => {
    const element = target || (typeof document !== 'undefined' ? document.documentElement : null);
    if (!element) return;
    
    const user = sessionManager.getUser();
    const tenantId = user?.tenantId || user?.tenant?.tenantId;
    
    console.debug('🎨 테넌트 브랜딩 CSS 변수 적용 시작:', { tenantId, branding });
    
    // 기본 CoreSolution 브랜딩 (Fallback)
    const defaultBranding = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-primary-500) -> var(--mg-custom-3b82f6)
      primaryColor: 'var(--mg-primary-500)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
      secondaryColor: '#6b7280', 
      logoUrl: '/images/core-solution-logo.png',
      companyName: 'CoreSolution'
    };
    
    const activeBranding = branding || brandingInfoRef.current || defaultBranding;
    
    // 테넌트 ID 속성 설정 (CSS 선택자용)
    if (tenantId) {
      element.setAttribute('data-tenant-id', tenantId);
    }
    
    // 1. 테넌트별 기본 CSS 변수 적용
    const tenantVariables = {
      // 테넌트 기본 정보
      '--tenant-id': tenantId || 'default',
      '--tenant-name': activeBranding.companyName || 'CoreSolution',
      
      // 테넌트별 색상 (브랜딩 정보가 있으면 적용)
      '--tenant-primary': activeBranding.primaryColor || 'var(--mg-primary-500)',
      '--tenant-secondary': activeBranding.secondaryColor || 'var(--mg-secondary-500)',
      
      // 테넌트별 로고
      '--tenant-logo-url': activeBranding.logo?.url || activeBranding.logoUrl || '/images/core-solution-logo.png',
      '--tenant-logo-width': activeBranding.logo?.width ? `${activeBranding.logo.width}px` : '200px',
      '--tenant-logo-height': activeBranding.logo?.height ? `${activeBranding.logo.height}px` : '60px',
      
      // 테넌트별 파비콘
      '--tenant-favicon': activeBranding.favicon || '/favicon.ico'
    };
    
    // CSS 변수 적용
    Object.entries(tenantVariables).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
    
    // 2. 테넌트별 확장 색상 시스템 적용
    if (activeBranding.primaryColor) {
      // Primary 색상 기반 파생 색상 생성
      const primaryColor = activeBranding.primaryColor;
      
      // 밝기 조절된 색상들 (간단한 구현)
      element.style.setProperty('--tenant-primary-light', `${primaryColor}20`); // 20% 투명도
      element.style.setProperty('--tenant-primary-dark', primaryColor);
      element.style.setProperty('--tenant-primary-hover', primaryColor);
      
      // 버튼 색상 오버라이드
      element.style.setProperty('--mg-button-primary-bg', primaryColor);
      element.style.setProperty('--mg-button-primary-hover', primaryColor);
    }
    
    // 3. 파비콘 동적 변경
    if (activeBranding.favicon) {
      updateFavicon(activeBranding.favicon);
    }
    
    // 4. 페이지 타이틀 업데이트 (선택적)
    if (activeBranding.companyName && activeBranding.companyName !== 'CoreSolution') {
      updatePageTitle(activeBranding.companyName);
    }
    
    console.debug('✅ 테넌트 브랜딩 CSS 변수 적용 완료:', tenantVariables);
    
  }, [target]);
  
/**
   * 파비콘 동적 변경
   */
  const updateFavicon = useCallback((faviconUrl) => {
    if (typeof document === 'undefined') return;
    
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, []);
  
/**
   * 페이지 타이틀 업데이트
   */
  const updatePageTitle = useCallback((companyName) => {
    if (typeof document === 'undefined') return;
    
    const currentTitle = document.title;
    const baseTitles = ['Core Solution', 'coreSolution'];
    
    // 기존 타이틀에서 기본 브랜드명을 테넌트명으로 교체
    let newTitle = currentTitle;
    baseTitles.forEach(baseTitle => {
      if (currentTitle.includes(baseTitle)) {
        newTitle = currentTitle.replace(baseTitle, companyName);
      }
    });
    
    // 타이틀이 변경되지 않았다면 테넌트명 추가
    if (newTitle === currentTitle && !currentTitle.includes(companyName)) {
      newTitle = `${companyName} - ${currentTitle}`;
    }
    
    document.title = newTitle;
  }, []);
  
/**
   * 브랜딩 초기화 (기본값으로 복원)
   */
  const resetBranding = useCallback(() => {
    const element = target || (typeof document !== 'undefined' ? document.documentElement : null);
    if (!element) return;
    
    // 테넌트 속성 제거
    element.removeAttribute('data-tenant-id');
    
    // 테넌트 CSS 변수 제거
    const tenantVariables = [
      '--tenant-id', '--tenant-name', '--tenant-primary', '--tenant-secondary',
      '--tenant-logo-url', '--tenant-logo-width', '--tenant-logo-height', '--tenant-favicon',
      '--tenant-primary-light', '--tenant-primary-dark', '--tenant-primary-hover'
    ];
    
    tenantVariables.forEach(property => {
      element.style.removeProperty(property);
    });
    
    console.debug('🔄 테넌트 브랜딩 초기화 완료');
  }, [target]);
  
  // 자동 적용 (브랜딩 로드 완료 시에만; applyTenantBranding은 ref로 최신 brandingInfo 사용)
  useEffect(() => {
    if (autoApply && brandingInfo && !isLoading) {
      applyTenantBranding(brandingInfo);
    }
  }, [autoApply, brandingInfo, isLoading, applyTenantBranding]);

  // 테넌트/사용자 전환 시 브랜딩 재조회는 내부 useBranding()의 세션 리스너에서 처리됨(중복 refresh 방지).
  // 로드 완료 후 CSS 적용은 위 effect가 담당.

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (autoApply) {
        resetBranding();
      }
    };
  }, [autoApply, resetBranding]);
  
  return {
    // 상태
    brandingInfo,
    isLoading,
    error,
    
    // 함수
    applyTenantBranding,
    resetBranding,
    refreshBranding,
    updateFavicon,
    updatePageTitle,
    
    // 편의 속성
    tenantId: sessionManager.getUser()?.tenantId,
    companyName: brandingInfo?.companyName || 'CoreSolution',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: var(--mg-primary-500) -> var(--mg-custom-3b82f6)
    primaryColor: brandingInfo?.primaryColor || 'var(--mg-primary-500)',
    logoUrl: brandingInfo?.logo?.url || '/images/core-solution-logo.png',
    
    // 상태 확인
    hasCustomBranding: Boolean(brandingInfo && (
      brandingInfo.primaryColor || 
      brandingInfo.logo?.url || 
      (brandingInfo.companyName && brandingInfo.companyName !== 'CoreSolution')
    ))
  };
};

export default useTenantBranding;
