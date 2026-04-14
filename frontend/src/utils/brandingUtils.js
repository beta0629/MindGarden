/**
 * 브랜딩 관련 유틸리티 함수들
/**
 * 테넌트별 로고, 상호명 등 브랜딩 정보를 관리
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

import { API_BASE_URL } from '../constants/api';

/**
 * 브랜딩 정보 캐시 (메모리 캐시)
/**
 * 페이지 새로고침 시까지 유지
 */
let brandingCache = null;
let cacheTimestamp = null;

// 개발 중 강제 기본 브랜딩 적용
const FORCE_DEFAULT_BRANDING = false;
const CACHE_DURATION = 30 * 60 * 1000; // 30분

/**
 * 현재 테넌트의 브랜딩 정보 조회
/**
 * 
/**
 * @param {boolean} useCache - 캐시 사용 여부 (기본값: true)
/**
 * @returns {Promise<Object>} 브랜딩 정보
 */
export const getBrandingInfo = async(useCache = true) => {
  // 개발 중 강제 기본 브랜딩 적용
  if (FORCE_DEFAULT_BRANDING) {
    console.warn('🎨 강제 기본 CoreSolution 브랜딩 적용');
    const defaultBranding = createDefaultBranding();
    brandingCache = defaultBranding;
    cacheTimestamp = Date.now();
    return defaultBranding;
  }

  // 캐시 확인
  if (useCache && brandingCache && cacheTimestamp) {
    const now = Date.now();
    if (now - cacheTimestamp < CACHE_DURATION) {
      console.debug('브랜딩 정보 캐시 사용');
      return brandingCache;
    }
  }

  try {
    console.debug('브랜딩 정보 API 호출');
    const response = await fetch(`${API_BASE_URL}/api/admin/branding`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // 404는 브랜딩 정보가 없는 경우로 간주
      if (response.status === 404) {
        console.warn('브랜딩 정보가 없음, 기본값 사용');
        const defaultBranding = createDefaultBranding();
        brandingCache = defaultBranding;
        cacheTimestamp = Date.now();
        return defaultBranding;
      }

      // 500 오류 (Tenant context 없음 또는 로그인 필요)도 기본값 사용
      if (response.status === 500) {
        console.warn('브랜딩 API 500 오류 - 기본 CoreSolution 브랜딩 사용');
        const defaultBranding = createDefaultBranding();
        brandingCache = defaultBranding;
        cacheTimestamp = Date.now();
        return defaultBranding;
      }

      throw new Error(`브랜딩 정보 조회 실패: ${response.status}`);
    }

    const apiResponse = await response.json();

    if (!apiResponse.success) {
      // 테넌트 컨텍스트 오류도 기본값 사용
      if (apiResponse.message && apiResponse.message.includes('Tenant ID is not set')) {
        console.warn('테넌트 컨텍스트 없음, 기본값 사용');
        const defaultBranding = createDefaultBranding();
        brandingCache = defaultBranding;
        cacheTimestamp = Date.now();
        return defaultBranding;
      }

      throw new Error(apiResponse.message || '브랜딩 정보 조회 실패');
    }
    
    const brandingInfo = apiResponse.data;
    
    // 캐시 업데이트
    brandingCache = brandingInfo;
    cacheTimestamp = Date.now();
    
    console.debug('브랜딩 정보 조회 성공:', brandingInfo);
    return brandingInfo;

  } catch (error) {
    console.error('브랜딩 정보 조회 오류:', error);
    
    // 오류 시 기본값 반환
    const defaultBranding = createDefaultBranding();
    
    // 기본값도 캐시에 저장 (단, 짧은 시간만)
    brandingCache = defaultBranding;
    cacheTimestamp = Date.now() - (CACHE_DURATION - 300000); // 5분 후 재시도
    
    return defaultBranding;
  }
};

/**
 * 브랜딩 정보 조회 (별칭 - 기존 코드 호환성)
/**
 * @param {boolean} useCache 
/**
 * @returns {Promise<Object>}
 */
export const fetchBrandingInfo = getBrandingInfo;

/**
 * 기본 브랜딩 정보 생성 (Fallback)
/**
 * 
/**
 * @param {string} tenantName - 테넌트명 (선택사항)
/**
 * @returns {Object} 기본 브랜딩 정보
 */
/**
 * 기본/플레이스홀더 로고 URL 여부 (GNB·getLogoType 등에서 공통 사용)
 * 경로 표기 불일치(core-solution vs coresolution)를 한곳에서 처리한다.
 *
 * @param {string} [url]
 * @returns {boolean}
 */
export const isDefaultBrandingLogoUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return true;
  }
  const lower = url.toLowerCase();
  return (
    lower.includes('core-solution-logo.png') ||
    lower.includes('coresolution-logo.png')
  );
};

/**
 * GNB 등에서 커스텀 업로드 로고만 이미지로 쓸 URL 반환. 기본 로고면 undefined(텍스트 폴백).
 *
 * @param {Object} brandingInfo
 * @returns {string|undefined}
 */
export const getGnbLogoUrl = (brandingInfo) => {
  if (!brandingInfo?.logo?.url) {
    return undefined;
  }
  const url = brandingInfo.logo.url;
  if (isDefaultBrandingLogoUrl(url)) {
    return undefined;
  }
  return url;
};

export const createDefaultBranding = (tenantName = null) => {
  return {
    logo: {
      url: '/images/coresolution-logo.png',
      width: 200,
      height: 60,
      format: 'png',
      alt: 'CoreSolution'
    },
    companyName: tenantName || 'CoreSolution',
    companyNameEn: 'CoreSolution',
    primaryColor: 'var(--mg-primary-500)',
    secondaryColor: 'var(--mg-secondary-500)',
    favicon: '/favicon.ico'
  };
};

/**
 * 브랜딩 정보에서 로고 타입 결정
/**
 * 
/**
 * @param {Object} brandingInfo - 브랜딩 정보
/**
 * @returns {string} 로고 타입 ('image' | 'text')
 */
export const getLogoType = (brandingInfo) => {
  if (!brandingInfo) return 'text';

  if (
    brandingInfo.logo &&
    brandingInfo.logo.url &&
    !isDefaultBrandingLogoUrl(brandingInfo.logo.url)
  ) {
    return 'image';
  }

  return 'text';
};

/**
 * 브랜딩 정보에서 표시할 회사명 추출
/**
 * 
/**
 * @param {Object} brandingInfo - 브랜딩 정보
/**
 * @returns {string} 표시할 회사명
 */
export const getDisplayName = (brandingInfo) => {
  if (!brandingInfo) return 'CoreSolution';
  
  // 한글 회사명 우선, 없으면 영문, 그것도 없으면 기본값
  if (brandingInfo.companyName && brandingInfo.companyName.trim()) {
    return brandingInfo.companyName;
  }
  
  if (brandingInfo.companyNameEn && brandingInfo.companyNameEn.trim()) {
    return brandingInfo.companyNameEn;
  }
  
  return 'CoreSolution';
};

/**
 * 브랜딩 정보에서 로고 이미지 URL 추출
/**
 * 
/**
 * @param {Object} brandingInfo - 브랜딩 정보
/**
 * @returns {string} 로고 이미지 URL
 */
export const getLogoImageUrl = (brandingInfo) => {
  if (!brandingInfo || !brandingInfo.logo || !brandingInfo.logo.url) {
    return '/images/core-solution-logo.png';
  }
  
  return brandingInfo.logo.url;
};

/**
 * 브랜딩 정보에서 로고 alt 텍스트 추출
/**
 * 
/**
 * @param {Object} brandingInfo - 브랜딩 정보
/**
 * @returns {string} 로고 alt 텍스트
 */
export const getLogoAlt = (brandingInfo) => {
  if (!brandingInfo) return 'CoreSolution';
  
  // 로고 alt가 있으면 사용, 없으면 회사명 사용
  if (brandingInfo.logo && brandingInfo.logo.alt) {
    return brandingInfo.logo.alt;
  }
  
  return getDisplayName(brandingInfo);
};

/**
 * 브랜딩 정보 업데이트 (로고 제외)
/**
 * 
/**
 * @param {Object} updateData - 업데이트할 브랜딩 정보
/**
 * @returns {Promise<Object>} 업데이트된 브랜딩 정보
 */
export const updateBrandingInfo = async(updateData) => {
  try {
    console.debug('브랜딩 정보 업데이트 요청:', updateData);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/branding`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`브랜딩 정보 업데이트 실패: ${response.status}`);
    }

    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || '브랜딩 정보 업데이트 실패');
    }
    
    const updatedBranding = apiResponse.data;
    
    // 캐시 무효화
    clearBrandingCache();
    
    console.debug('브랜딩 정보 업데이트 성공:', updatedBranding);
    return updatedBranding;

  } catch (error) {
    console.error('브랜딩 정보 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 로고 업로드
/**
 * 
/**
 * @param {File} logoFile - 로고 파일
/**
 * @returns {Promise<Object>} 업데이트된 브랜딩 정보
 */
export const uploadLogo = async(logoFile) => {
  try {
    console.debug('로고 업로드 요청:', logoFile.name, logoFile.size);
    
    const formData = new FormData();
    formData.append('file', logoFile); // 'file'로 변경 (컨트롤러와 일치)

    const response = await fetch(`${API_BASE_URL}/api/admin/branding/logo`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`로고 업로드 실패: ${response.status}`);
    }

    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || '로고 업로드 실패');
    }
    
    const updatedBranding = apiResponse.data;
    
    // 캐시 무효화
    clearBrandingCache();
    
    console.debug('로고 업로드 성공:', updatedBranding);
    return updatedBranding;

  } catch (error) {
    console.error('로고 업로드 오류:', error);
    throw error;
  }
};

/**
 * 파비콘 업로드
/**
 * 
/**
 * @param {File} faviconFile - 파비콘 파일
/**
 * @returns {Promise<Object>} 업데이트된 브랜딩 정보
 */
export const uploadFavicon = async(faviconFile) => {
  try {
    console.debug('파비콘 업로드 요청:', faviconFile.name, faviconFile.size);
    
    const formData = new FormData();
    formData.append('file', faviconFile);

    const response = await fetch(`${API_BASE_URL}/api/admin/branding/favicon`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`파비콘 업로드 실패: ${response.status}`);
    }

    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || '파비콘 업로드 실패');
    }
    
    const updatedBranding = apiResponse.data;
    
    // 캐시 무효화
    clearBrandingCache();
    
    console.debug('파비콘 업로드 성공:', updatedBranding);
    return updatedBranding;

  } catch (error) {
    console.error('파비콘 업로드 오류:', error);
    throw error;
  }
};

/**
 * 로고 삭제
/**
 * 
/**
 * @returns {Promise<Object>} 업데이트된 브랜딩 정보
 */
export const deleteLogo = async() => {
  try {
    console.debug('로고 삭제 요청');
    
    const response = await fetch(`${API_BASE_URL}/api/admin/branding/logo`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`로고 삭제 실패: ${response.status}`);
    }

    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || '로고 삭제 실패');
    }
    
    const updatedBranding = apiResponse.data;
    
    // 캐시 무효화
    clearBrandingCache();
    
    console.debug('로고 삭제 성공:', updatedBranding);
    return updatedBranding;

  } catch (error) {
    console.error('로고 삭제 오류:', error);
    throw error;
  }
};

/**
 * 파비콘 삭제
/**
 * 
/**
 * @returns {Promise<Object>} 업데이트된 브랜딩 정보
 */
export const deleteFavicon = async() => {
  try {
    console.debug('파비콘 삭제 요청');
    
    const response = await fetch(`${API_BASE_URL}/api/admin/branding/favicon`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`파비콘 삭제 실패: ${response.status}`);
    }

    const apiResponse = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || '파비콘 삭제 실패');
    }
    
    const updatedBranding = apiResponse.data;
    
    // 캐시 무효화
    clearBrandingCache();
    
    console.debug('파비콘 삭제 성공:', updatedBranding);
    return updatedBranding;

  } catch (error) {
    console.error('파비콘 삭제 오류:', error);
    throw error;
  }
};

/**
 * 브랜딩 캐시 무효화
 */
export const clearBrandingCache = () => {
  brandingCache = null;
  cacheTimestamp = null;
  // console.log('브랜딩 캐시 무효화'); // 로그 출력 줄임
};

// 페이지 로드 시 강제 캐시 초기화 제거 (무한 루프 방지)
// clearBrandingCache();

/**
 * 브랜딩 정보를 UnifiedHeader props로 변환
/**
 * 
/**
 * @param {Object} brandingInfo - 브랜딩 정보
/**
 * @returns {Object} UnifiedHeader props
 */
export const brandingToHeaderProps = (brandingInfo) => {
  if (!brandingInfo) {
    return {
      logoType: 'text',
      title: 'CoreSolution',
      logoAlt: 'CoreSolution'
    };
  }

  const logoType = getLogoType(brandingInfo);
  const displayName = getDisplayName(brandingInfo);
  
  return {
    logoType: logoType,
    logoImage: logoType === 'image' ? getLogoImageUrl(brandingInfo) : '',
    title: displayName,
    logoAlt: getLogoAlt(brandingInfo)
  };
};
