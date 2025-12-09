/**
 * 공통 코드 유틸리티
 * 하드코딩 금지 원칙에 따라 모든 코드 값은 여기서 동적으로 가져옴
 */

import { apiGet } from "./api";

export interface CommonCode {
  id?: number;
  codeGroup: string;
  codeValue: string;
  codeLabel: string;
  koreanName: string;
  codeDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
  colorCode?: string;
  icon?: string;
}

/**
 * 공통 코드 그룹 상수
 */
export const COMMON_CODE_GROUPS = {
  RISK_LEVEL: 'RISK_LEVEL',
  ONBOARDING_STATUS: 'ONBOARDING_STATUS',
  BUSINESS_TYPE: 'BUSINESS_TYPE',
  REGION: 'REGION',
} as const;

/**
 * 공통 코드 그룹별 조회
 */
export async function getCommonCodesByGroup(codeGroup: string): Promise<CommonCode[]> {
  try {
    // apiGet은 이미 ApiResponse의 data를 추출하므로, 
    // response는 CommonCodeListResponse 형태: { codes: [...], totalCount: ... }
    const response = await apiGet<{ codes: CommonCode[]; totalCount: number }>(
      `/api/v1/common-codes?codeGroup=${encodeURIComponent(codeGroup)}`
    );
    
    // response가 CommonCodeListResponse 형태인 경우
    if (response && typeof response === 'object' && 'codes' in response) {
      const codes = response.codes || [];
      // 개발 환경에서만 디버깅 로그 출력
      if (process.env.NODE_ENV === 'development' && codeGroup === 'REGION') {
        console.log('[DEBUG] Region codes loaded:', codes.length, codes);
      }
      return codes;
    }
    
    // 하위 호환성: response가 이미 배열인 경우
    if (Array.isArray(response)) {
      if (process.env.NODE_ENV === 'development' && codeGroup === 'REGION') {
        console.log('[DEBUG] Region codes (array format):', response.length, response);
      }
      return response;
    }
    
    if (process.env.NODE_ENV === 'development' && codeGroup === 'REGION') {
      console.warn('[DEBUG] Unexpected response format for REGION codes:', response);
    }
    return [];
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === 'development' && codeGroup === 'REGION') {
      console.error('[DEBUG] Failed to load region codes:', error);
    }
    // 연결 실패나 서버 오류는 조용히 처리 (기본값 사용)
    // 프로덕션 환경에서는 에러 로그 출력하지 않음 (콘솔 오염 방지)
    return [];
  }
}

/**
 * 위험도 코드 목록 조회
 */
export async function getRiskLevelCodes(): Promise<CommonCode[]> {
  return getCommonCodesByGroup(COMMON_CODE_GROUPS.RISK_LEVEL);
}

/**
 * 기본 위험도 코드 값 조회 (LOW 또는 첫 번째 활성 코드)
 */
export async function getDefaultRiskLevel(): Promise<string> {
  try {
    const codes = await getRiskLevelCodes();
    if (codes.length === 0) {
      return 'LOW'; // 기본값 (공통 코드가 없을 때만 사용)
    }
    
    // LOW 값 찾기
    const lowCode = codes.find(code => code.codeValue === 'LOW');
    if (lowCode) {
      return lowCode.codeValue;
    }
    
    // LOW가 없으면 첫 번째 코드 사용
    return codes[0].codeValue;
  } catch (error) {
    // 에러 시 기본값 반환 (조용히 처리)
    return 'LOW'; // 기본값 (에러 시)
  }
}

/**
 * 온보딩 상태 코드 목록 조회
 */
export async function getOnboardingStatusCodes(): Promise<CommonCode[]> {
  return getCommonCodesByGroup(COMMON_CODE_GROUPS.ONBOARDING_STATUS);
}

/**
 * 지역 코드 목록 조회
 */
export async function getRegionCodes(): Promise<CommonCode[]> {
  return getCommonCodesByGroup(COMMON_CODE_GROUPS.REGION);
}

