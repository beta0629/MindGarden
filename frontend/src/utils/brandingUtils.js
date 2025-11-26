/**
 * 브랜딩 관련 유틸리티 함수들
 * 테넌트별 로고, 상호명 등 브랜딩 정보를 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */

import { API_BASE_URL } from '../constants/api';

/**
 * 브랜딩 정보 캐시 (메모리 캐시)
 * 페이지 새로고침 시까지 유지
 */
let brandingCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 현재 테넌트의 브랜딩 정보 조회
 * 
 * @param {boolean} useCache - 캐시 사용 여부 (기본값: true)
 * @returns {Promise<Object>} 브랜딩 정보
 */
export const getBrandingInfo = async (useCache = true) => {
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
    const response = await fetch(`${API_BASE_URL}/api/core/branding`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`브랜딩 정보 조회 실패: ${response.status}`);
    }

    const brandingInfo = await response.json();
    
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
    cacheTimestamp = Date.now() - (CACHE_DURATION - 30000); // 30초 후 재시도
    
    return defaultBranding;
  }
};

/**
 * 기본 브랜딩 정보 생성 (Fallback)
 * 
 * @param {string} tenantName - 테넌트명 (선택사항)
 * @returns {Object} 기본 브랜딩 정보
 */
export const createDefaultBranding = (tenantName = null) => {
  return {
    logo: {
      url: '/images/core-solution-logo.png',
      width: 200,
      height: 60,
      format: 'png',
      alt: 'CoreSolution'
    },
    companyName: tenantName || 'CoreSolution',
    companyNameEn: 'CoreSolution',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    favicon: '/favicon.ico'
  };
};

/**
 * 브랜딩 정보에서 로고 타입 결정
 * 
 * @param {Object} brandingInfo - 브랜딩 정보
 * @returns {string} 로고 타입 ('image' | 'text')
 */
export const getLogoType = (brandingInfo) => {
  if (!brandingInfo) return 'text';
  
  // 로고 URL이 있고 기본 로고가 아닌 경우 image 타입
  if (brandingInfo.logo && 
      brandingInfo.logo.url && 
      !brandingInfo.logo.url.includes('core-solution-logo.png')) {
    return 'image';
  }
  
  return 'text';
};

/**
 * 브랜딩 정보에서 표시할 회사명 추출
 * 
 * @param {Object} brandingInfo - 브랜딩 정보
 * @returns {string} 표시할 회사명
 */
export const getDisplayName = (brandingInfo) => {
  if (!brandingInfo) return 'MindGarden';
  
  // 한글 회사명 우선, 없으면 영문, 그것도 없으면 기본값
  if (brandingInfo.companyName && brandingInfo.companyName.trim()) {
    return brandingInfo.companyName;
  }
  
  if (brandingInfo.companyNameEn && brandingInfo.companyNameEn.trim()) {
    return brandingInfo.companyNameEn;
  }
  
  return 'MindGarden';
};

/**
 * 브랜딩 정보에서 로고 이미지 URL 추출
 * 
 * @param {Object} brandingInfo - 브랜딩 정보
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
 * 
 * @param {Object} brandingInfo - 브랜딩 정보
 * @returns {string} 로고 alt 텍스트
 */
export const getLogoAlt = (brandingInfo) => {
  if (!brandingInfo) return 'MindGarden';
  
  // 로고 alt가 있으면 사용, 없으면 회사명 사용
  if (brandingInfo.logo && brandingInfo.logo.alt) {
    return brandingInfo.logo.alt;
  }
  
  return getDisplayName(brandingInfo);
};

/**
 * 브랜딩 정보 업데이트 (로고 제외)
 * 
 * @param {Object} updateData - 업데이트할 브랜딩 정보
 * @returns {Promise<Object>} 업데이트된 브랜딩 정보
 */
export const updateBrandingInfo = async (updateData) => {
  try {
    console.debug('브랜딩 정보 업데이트 요청:', updateData);
    
    const response = await fetch(`${API_BASE_URL}/api/core/branding`, {
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

    const updatedBranding = await response.json();
    
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
 * 
 * @param {File} logoFile - 로고 파일
 * @returns {Promise<Object>} 업데이트된 브랜딩 정보
 */
export const uploadLogo = async (logoFile) => {
  try {
    console.debug('로고 업로드 요청:', logoFile.name, logoFile.size);
    
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch(`${API_BASE_URL}/api/core/branding/logo`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`로고 업로드 실패: ${response.status}`);
    }

    const updatedBranding = await response.json();
    
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
 * 브랜딩 캐시 무효화
 */
export const clearBrandingCache = () => {
  brandingCache = null;
  cacheTimestamp = null;
  console.debug('브랜딩 캐시 무효화');
};

/**
 * 브랜딩 정보를 UnifiedHeader props로 변환
 * 
 * @param {Object} brandingInfo - 브랜딩 정보
 * @returns {Object} UnifiedHeader props
 */
export const brandingToHeaderProps = (brandingInfo) => {
  if (!brandingInfo) {
    return {
      logoType: 'text',
      title: 'MindGarden',
      logoAlt: 'MindGarden'
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
