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
} as const;

/**
 * 공통 코드 그룹별 조회
 */
export async function getCommonCodesByGroup(codeGroup: string): Promise<CommonCode[]> {
  try {
    const response = await apiGet<{ success: boolean; data: { codes: CommonCode[] } }>(
      `/api/v1/common-codes?codeGroup=${encodeURIComponent(codeGroup)}`
    );
    if (response.success && (response as any).data) {
      return (response as any).data.codes || [];
    }
    return [];
  } catch (error) {
    console.error(`공통 코드 조회 실패 (${codeGroup}):`, error);
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
    console.error('기본 위험도 조회 실패:', error);
    return 'LOW'; // 기본값 (에러 시)
  }
}

/**
 * 온보딩 상태 코드 목록 조회
 */
export async function getOnboardingStatusCodes(): Promise<CommonCode[]> {
  return getCommonCodesByGroup(COMMON_CODE_GROUPS.ONBOARDING_STATUS);
}

