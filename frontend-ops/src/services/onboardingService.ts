import { clientApiFetch } from "@/services/clientApi";
import { OnboardingRequest } from "@/types/onboarding";

/**
 * 대기 중인 온보딩 요청 목록 조회
 * 백엔드: GET /api/v1/onboarding/requests/pending
 * 응답: ResponseEntity<List<OnboardingRequest>> -> JSON 배열
 */
export async function fetchPendingOnboarding(): Promise<OnboardingRequest[]> {
  try {
    const response = await clientApiFetch<OnboardingRequest[]>("/onboarding/requests/pending");
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("[fetchPendingOnboarding] 온보딩 요청 조회 실패:", error);
    return [];
  }
}

/**
 * 온보딩 요청 목록 조회 (상태별 필터링 가능)
 * 백엔드: GET /api/v1/onboarding/requests?status={status}&page=0&size=50
 * 메인 백엔드(8080): ApiResponse<Page<OnboardingRequest>> 래퍼 사용 (페이징)
 */
export async function fetchAllOnboarding(status?: string): Promise<OnboardingRequest[]> {
  try {
    // 메인 백엔드는 페이징을 사용하므로 size를 크게 설정하여 모든 데이터 조회
    const params = new URLSearchParams();
    if (status) {
      // 상태 값이 대문자로 전달되도록 보장 (APPROVED, ON_HOLD 등)
      params.append('status', status.toUpperCase());
    }
    params.append('page', '0');
    params.append('size', '50');
    const path = `/onboarding/requests?${params.toString()}`;
    
    console.log("[fetchAllOnboarding] API 호출:", { 
      path, 
      status, 
      statusUpper: status?.toUpperCase(),
      fullUrl: `http://localhost:8080/api/v1${path}`
    });
    
    const response = await clientApiFetch<{
      success: boolean;
      data?: {
        content?: OnboardingRequest[];
        totalElements?: number;
        totalPages?: number;
        number?: number;
        size?: number;
        [key: string]: any;
      };
      message?: string;
    }>(path);
    
    console.log("[fetchAllOnboarding] API 응답 상세:", {
      hasSuccess: response && typeof response === 'object' && 'success' in response,
      success: response && typeof response === 'object' && 'success' in response ? (response as any).success : null,
      hasData: response && typeof response === 'object' && 'data' in response,
      hasContent: response && typeof response === 'object' && 'data' in response && response.data && 'content' in response.data,
      contentLength: response && typeof response === 'object' && 'data' in response && response.data && 'content' in response.data 
        ? (response.data.content as any[])?.length : 0,
      totalElements: response && typeof response === 'object' && 'data' in response && response.data && 'totalElements' in response.data
        ? (response.data as any).totalElements : null,
      type: typeof response,
      responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
      responsePreview: JSON.stringify(response).substring(0, 500)
    });
    
    // ApiResponse 래퍼가 있는 경우 (메인 백엔드 - 8080)
    if (response && typeof response === 'object' && 'success' in response) {
      const apiResponse = response as { 
        success: boolean; 
        data?: { 
          content?: OnboardingRequest[];
          totalElements?: number;
          [key: string]: any;
        }; 
        message?: string;
      };
      
      if (apiResponse.success && apiResponse.data) {
        // Page 객체에서 content 배열 추출
        if (apiResponse.data.content && Array.isArray(apiResponse.data.content)) {
          console.log(`[fetchAllOnboarding] ${apiResponse.data.content.length}개 항목 반환 (status: ${status || '전체'}, totalElements: ${apiResponse.data.totalElements || 'N/A'})`);
          return apiResponse.data.content;
        }
        // content가 없으면 빈 배열 반환
        console.warn("[fetchAllOnboarding] content 배열이 없음:", apiResponse.data);
        return [];
      }
      
      if (!apiResponse.success) {
        console.error("[fetchAllOnboarding] API 응답 실패:", apiResponse.message);
      }
      
      return [];
    }
    
    console.warn("[fetchAllOnboarding] 예상치 못한 응답 구조:", response);
    return [];
  } catch (error) {
    console.error("[fetchAllOnboarding] 온보딩 요청 조회 실패:", {
      error: error instanceof Error ? error.message : String(error),
      status: (error as any)?.status,
      url: (error as any)?.url,
      path: (error as any)?.path,
      stack: error instanceof Error ? error.stack : undefined
    });
    if (error instanceof Error && ((error as any).status === 404 || error.message.includes("404") || error.message.includes("엔드포인트를 찾을 수 없습니다"))) {
      return [];
    }
    throw error;
  }
}

/**
 * 온보딩 요청 상세 조회
 * 백엔드: GET /api/v1/onboarding/requests/{id}
 * 메인 백엔드(8080): ApiResponse<OnboardingRequest> 래퍼 사용
 */
export async function fetchOnboardingDetail(
  id: string
): Promise<OnboardingRequest> {
  try {
    const path = `/onboarding/requests/${id}`;
    
    console.log("[fetchOnboardingDetail] API 호출:", { path, id });
    
    const response = await clientApiFetch<OnboardingRequest | {
      success: boolean;
      data?: OnboardingRequest;
      message?: string;
    }>(path);
    
    console.log("[fetchOnboardingDetail] API 응답:", {
      hasSuccess: response && typeof response === 'object' && 'success' in response,
      hasId: response && typeof response === 'object' && 'id' in response,
      type: typeof response,
      responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
      responsePreview: JSON.stringify(response).substring(0, 300)
    });
    
    // ApiResponse 래퍼가 있는 경우 (메인 백엔드 - 8080)
    if (response && typeof response === 'object' && 'success' in response) {
      const apiResponse = response as { success: boolean; data?: OnboardingRequest; message?: string };
      if (apiResponse.success && apiResponse.data) {
        if (apiResponse.data.id) {
          console.log(`[fetchOnboardingDetail] 온보딩 요청 조회 성공: id=${apiResponse.data.id}`);
          return apiResponse.data;
        }
        throw new Error("온보딩 요청 데이터에 ID가 없습니다.");
      }
      
      if (!apiResponse.success) {
        console.error("[fetchOnboardingDetail] API 응답 실패:", apiResponse.message);
        throw new Error(apiResponse.message || "온보딩 요청을 찾을 수 없습니다.");
      }
      
      throw new Error("온보딩 요청을 찾을 수 없습니다.");
    }
    
    // 직접 OnboardingRequest 객체인 경우 (레거시 또는 다른 백엔드)
    if (response && typeof response === 'object' && 'id' in response) {
      console.log(`[fetchOnboardingDetail] 직접 객체 반환: id=${(response as any).id}`);
      return response as OnboardingRequest;
    }
    
    throw new Error("온보딩 요청을 찾을 수 없습니다.");
  } catch (error) {
    console.error(`[fetchOnboardingDetail] 온보딩 상세 조회 실패 (id: ${id}):`, {
      error: error instanceof Error ? error.message : String(error),
      status: (error as any)?.status,
      url: (error as any)?.url,
      path: (error as any)?.path,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error && ((error as any).status === 404 || error.message.includes("404") || error.message.includes("엔드포인트를 찾을 수 없습니다") || error.message.includes("찾을 수 없습니다"))) {
      const notFoundError = new Error(`온보딩 요청을 찾을 수 없습니다 (ID: ${id})`);
      (notFoundError as any).status = 404;
      throw notFoundError;
    }
    
    throw error;
  }
}

