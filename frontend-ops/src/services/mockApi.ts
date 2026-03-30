type MockRequest = {
  path: string;
  options?: RequestInit;
};

/**
 * Mock API 응답 생성 (개발/테스트용)
 * 실제 백엔드 API 응답 구조와 동일하게 반환
 * 하드코딩 최소화: 빈 배열/객체 반환으로 실제 API 호출 유도
 */
export function getMockResponse<T>({ path }: MockRequest): T {
  // 대시보드 메트릭: 실제 백엔드 응답 구조와 동일
  if (path.startsWith("/dashboard/metrics")) {
    return {
      pendingOnboarding: 0,
      activeOnboarding: 0,
      onHoldOnboarding: 0,
      activePlans: 0,
      activeAddons: 0,
      activeFeatureFlags: 0,
      totalAuditEvents: 0
    } as T;
  }

  // 온보딩 요청 목록: 빈 배열 반환 (실제 API 호출 유도)
  if (path.includes("/onboarding/requests")) {
    // 상세 조회인 경우 (ID 포함)
    if (path.match(/\/onboarding\/requests\/[^/?]+$/)) {
      throw new Error("Mock API: 온보딩 상세 조회는 실제 API를 사용하세요.");
    }
    // 목록 조회인 경우: 빈 배열 반환
    return [] as T;
  }

  // Feature Flags: 빈 배열 반환 (실제 API 호출 유도)
  if (path.startsWith("/feature-flags")) {
    return [] as T;
  }

  // 요금제 애드온: 빈 배열 반환 (실제 API 호출 유도)
  if (path.startsWith("/plans/addons")) {
    return [] as T;
  }

  // 요금제별 애드온: 빈 배열 반환
  if (path.startsWith("/plans/") && path.endsWith("/addons")) {
    return [] as T;
  }

  // 요금제 목록: 빈 배열 반환 (실제 API 호출 유도)
  if (path.startsWith("/plans")) {
    return [] as T;
  }

  // 감사 로그: 빈 배열 반환
  if (path.startsWith("/audit")) {
    return [] as T;
  }

  throw new Error(`Mock 데이터가 정의되지 않은 API 경로입니다: ${path}`);
}

