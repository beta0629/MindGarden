/**
 * 온보딩 서비스 유틸리티
 * 비즈니스 로직 분리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */

import { apiGet, apiPost } from './ajax';
import { ONBOARDING_API, BUSINESS_CATEGORY_API, COMMON_CODE_API } from '../constants/api';
import { DEFAULT_RISK_LEVEL, STORAGE_KEYS, DEFAULT_USER_EMAIL, CODE_GROUPS } from '../constants/onboarding';

/**
 * 현재 사용자 이메일 가져오기
 */
export const getCurrentUserEmail = () => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) {
      return DEFAULT_USER_EMAIL;
    }
    const user = JSON.parse(userStr);
    return user.email || user.username || DEFAULT_USER_EMAIL;
  } catch (e) {
    console.warn('사용자 정보 파싱 실패:', e);
    return DEFAULT_USER_EMAIL;
  }
};

/**
 * 체크리스트 JSON 파싱
 */
export const parseChecklistJson = (checklistJson, contactPhone) => {
  try {
    const parsed = JSON.parse(checklistJson || '{}');
    return {
      ...parsed,
      contactPhone: contactPhone || parsed.contactPhone
    };
  } catch (e) {
    console.warn('체크리스트 JSON 파싱 실패:', e);
    return { contactPhone: contactPhone || '' };
  }
};

/**
 * 온보딩 요청 생성
 */
export const createOnboardingRequest = async (formData) => {
  const requestedBy = getCurrentUserEmail();
  const checklistJson = parseChecklistJson(formData.checklistJson, formData.contactPhone);

  const request = {
    tenantId: null, // 신규 생성
    tenantName: formData.tenantName,
    requestedBy: requestedBy,
    riskLevel: formData.riskLevel || DEFAULT_RISK_LEVEL,
    businessType: formData.businessType,
    checklistJson: JSON.stringify(checklistJson)
  };

  return await apiPost(ONBOARDING_API.CREATE_REQUEST, request);
};

/**
 * 온보딩 요청 목록 조회
 */
export const getOnboardingRequests = async (status = null) => {
  const params = status ? { status } : {};
  const response = await apiGet(ONBOARDING_API.GET_REQUEST, params);
  
  // Page 객체인 경우 content 추출, 배열인 경우 그대로 반환
  if (response && response.content) {
    return response.content;
  } else if (Array.isArray(response)) {
    return response;
  } else if (response && response.data) {
    // { success: true, data: [...] } 형식인 경우
    return response.data;
  }
  return [];
};

/**
 * 온보딩 요청 상세 조회
 */
export const getOnboardingRequestDetail = async (id) => {
  const response = await apiGet(`${ONBOARDING_API.GET_REQUEST_BY_ID}/${id}`);
  
  // { success: true, data: {...} } 형식인 경우
  if (response && response.data) {
    return response.data;
  }
  return response;
};

/**
 * 루트 업종 카테고리 조회
 */
export const getRootBusinessCategories = async () => {
  try {
    const response = await apiGet(BUSINESS_CATEGORY_API.ROOT);
    
    // { success: true, data: [...] } 형식인 경우
    if (response && response.data) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    return [];
  } catch (error) {
    console.error('루트 업종 카테고리 조회 실패:', error);
    return [];
  }
};

/**
 * 업종 카테고리 아이템 조회
 */
export const getBusinessCategoryItems = async (categoryId = null) => {
  try {
    const params = categoryId ? { categoryId } : {};
    const response = await apiGet(BUSINESS_CATEGORY_API.ITEMS, params);
    
    // { success: true, data: [...] } 형식인 경우
    if (response && response.data) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    return [];
  } catch (error) {
    console.error('업종 카테고리 아이템 조회 실패:', error);
    return [];
  }
};

/**
 * 공통 코드 조회 (코드 그룹별)
 */
export const getCommonCodesByGroup = async (codeGroup) => {
  try {
    // 표준 API 사용
    const response = await apiGet(`${COMMON_CODE_API.BY_GROUP}?codeGroup=${codeGroup}`);
    
    // { success: true, data: { codes: [...] } } 형식
    if (response && response.success && response.data && response.data.codes) {
      return response.data.codes;
    }
    
    // { success: true, data: [...] } 형식
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // 배열 형식 (하위 호환성)
    if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  } catch (error) {
    console.error(`공통 코드 조회 실패 (${codeGroup}):`, error);
    return [];
  }
};

/**
 * 위험도 코드 목록 조회
 */
export const getRiskLevelCodes = async () => {
  return await getCommonCodesByGroup(CODE_GROUPS.RISK_LEVEL);
};

/**
 * 온보딩 상태 코드 목록 조회
 */
export const getOnboardingStatusCodes = async () => {
  return await getCommonCodesByGroup(CODE_GROUPS.ONBOARDING_STATUS);
};

/**
 * 공통 코드를 맵으로 변환 (codeValue -> { code, nameKo, nameEn, ... })
 */
export const convertCodesToMap = (codes) => {
  const map = {};
  if (Array.isArray(codes)) {
    codes.forEach(code => {
      if (code.codeValue) {
        map[code.codeValue] = {
          code: code.codeValue,
          nameKo: code.nameKo || code.name,
          nameEn: code.nameEn || code.codeValue,
          description: code.description,
          displayOrder: code.displayOrder || 0,
          isActive: code.isActive !== false
        };
      }
    });
  }
  return map;
};

/**
 * 공통 코드를 옵션 배열로 변환 (드롭다운용)
 */
export const convertCodesToOptions = (codes) => {
  if (!Array.isArray(codes)) {
    return [];
  }
  
  return codes
    .filter(code => code.isActive !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map(code => ({
      value: code.codeValue || code.code,
      label: code.nameKo || code.name || code.codeValue || code.code,
      nameKo: code.nameKo || code.name,
      nameEn: code.nameEn || code.codeValue || code.code
    }));
};

/**
 * 날짜 포맷팅
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.warn('날짜 포맷팅 실패:', e);
    return dateString;
  }
};

