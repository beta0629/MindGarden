import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import { OnboardingRequest } from "@/types/onboarding";

/**
 * 대기 중인 온보딩 요청 목록 조회
 * 백엔드: GET /api/v1/ops/onboarding/requests/pending
 * 응답: ResponseEntity<List<OnboardingRequest>> -> JSON 배열
 */
export async function fetchPendingOnboarding(): Promise<OnboardingRequest[]> {
  try {
    const response = await clientApiFetch<OnboardingRequest[]>(OPS_API_PATHS.ONBOARDING.PENDING);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("[fetchPendingOnboarding] 온보딩 요청 조회 실패:", error);
    return [];
  }
}

/**
 * 온보딩 요청 목록 조회 (상태별 필터링 가능)
 * 백엔드: GET /api/v1/ops/onboarding/requests?status={status}
 * Ops 백엔드(8081): 직접 List<OnboardingRequest> 반환 (페이징 없음)
 */
export async function fetchAllOnboarding(status?: string): Promise<OnboardingRequest[]> {
  try {
    // Ops 백엔드는 페이징을 사용하지 않으므로 status 파라미터만 전달
    const params = new URLSearchParams();
    if (status) {
      // 상태 값이 대문자로 전달되도록 보장 (APPROVED, ON_HOLD 등)
      params.append('status', status.toUpperCase());
    }
    const path = params.toString() 
      ? `${OPS_API_PATHS.ONBOARDING.ALL}?${params.toString()}`
      : OPS_API_PATHS.ONBOARDING.ALL;
    
    console.log("[fetchAllOnboarding] API 호출:", { 
      path, 
      status, 
      statusUpper: status?.toUpperCase()
    });
    
    // Ops 백엔드는 직접 List<OnboardingRequest>를 반환 (페이징 없음)
    const response = await clientApiFetch<OnboardingRequest[]>(path);
    
    console.log("[fetchAllOnboarding] API 응답:", {
      type: typeof response,
      isArray: Array.isArray(response),
      length: Array.isArray(response) ? response.length : 0,
      responsePreview: Array.isArray(response) ? JSON.stringify(response).substring(0, 200) : String(response)
    });
    
    // 응답이 배열인지 확인
    if (Array.isArray(response)) {
      console.log(`[fetchAllOnboarding] ${response.length}개 항목 반환 (status: ${status || '전체'})`);
      return response;
    }
    
    // 배열이 아니면 빈 배열 반환
    console.warn("[fetchAllOnboarding] 응답이 배열이 아님:", response);
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
 * 백엔드: GET /api/v1/ops/onboarding/requests/{id}
 * Ops 백엔드(8081): ApiResponse<OnboardingRequest> 래퍼 사용
 */
export async function fetchOnboardingDetail(
  id: string
): Promise<OnboardingRequest> {
  try {
    const path = OPS_API_PATHS.ONBOARDING.DETAIL(id);
    
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
    
    // ApiResponse 래퍼가 있는 경우 (Ops 백엔드 - 8081)
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
