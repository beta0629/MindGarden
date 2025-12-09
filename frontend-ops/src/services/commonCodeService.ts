/**
 * 공통코드 응답 타입
 */
export interface CommonCode {
  id?: number;
  codeGroup: string;
  codeValue: string;
  codeLabel?: string;
  koreanName: string;
  codeDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
  colorCode?: string;
  icon?: string;
}

/**
 * 공통코드 목록 응답 타입
 */
export interface CommonCodeListResponse {
  codes: CommonCode[];
  totalCount: number;
}

/**
 * 공통코드 그룹별 조회
 * @param codeGroup 코드 그룹명 (예: 'ONBOARDING_STATUS')
 * @returns 공통코드 목록
 */
export async function getCommonCodesByGroup(codeGroup: string): Promise<CommonCode[]> {
  try {
    // CoreSolution의 공통코드 API 호출 (포트 8080)
    // 환경 변수에서 가져오거나 기본값 사용
    const coreApiBaseUrl = 
      (typeof window !== "undefined" && (window as any).__CORE_API_BASE_URL__) ||
      process.env.NEXT_PUBLIC_CORE_API_BASE_URL || 
      "http://localhost:8080/api/v1";
    const url = `${coreApiBaseUrl}/common-codes?codeGroup=${encodeURIComponent(codeGroup)}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      credentials: "omit" // 공통코드는 인증 불필요
    });

    if (!response.ok) {
      console.warn(`[commonCodeService] 공통코드 조회 실패: ${codeGroup}`, response.status);
      return [];
    }

    const jsonData = await response.json();
    
    // ApiResponse 래퍼 처리: { success: true, data: { codes: [...] } } 형태
    if (jsonData?.success && jsonData?.data) {
      const data = jsonData.data;
      // CommonCodeListResponse 형태면 codes 추출
      if (data?.codes && Array.isArray(data.codes)) {
        return data.codes;
      }
      // data가 직접 배열인 경우
      if (Array.isArray(data)) {
        return data;
      }
    }
    
    // ApiResponse 래퍼가 없는 경우 직접 처리
    if (jsonData?.codes && Array.isArray(jsonData.codes)) {
      return jsonData.codes;
    }
    
    // 배열 형태면 그대로 반환
    if (Array.isArray(jsonData)) {
      return jsonData;
    }
    
    return [];
  } catch (error) {
    console.error(`[commonCodeService] 공통코드 조회 오류: ${codeGroup}`, error);
    return [];
  }
}

/**
 * 온보딩 상태 코드 조회 (캐싱)
 */
let onboardingStatusCache: CommonCode[] | null = null;

export async function getOnboardingStatusCodes(): Promise<CommonCode[]> {
  if (onboardingStatusCache) {
    return onboardingStatusCache;
  }
  
  const codes = await getCommonCodesByGroup("ONBOARDING_STATUS");
  onboardingStatusCache = codes;
  
  // 5분 후 캐시 무효화
  setTimeout(() => {
    onboardingStatusCache = null;
  }, 5 * 60 * 1000);
  
  return codes;
}

/**
 * 공통코드로부터 한글 이름 조회
 * @param codeGroup 코드 그룹
 * @param codeValue 코드 값
 * @returns 한글 이름 (없으면 codeValue 반환)
 */
export async function getKoreanName(codeGroup: string, codeValue: string): Promise<string> {
  const codes = await getCommonCodesByGroup(codeGroup);
  const code = codes.find(c => c.codeValue === codeValue);
  return code?.koreanName || codeValue;
}

