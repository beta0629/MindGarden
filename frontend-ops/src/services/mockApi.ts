type MockRequest = {
  path: string;
  options?: RequestInit;
};

export function getMockResponse<T>({ path }: MockRequest): T {
  if (path.startsWith("/dashboard/metrics")) {
    return {
      pendingOnboarding: 3,
      activePlans: 2,
      activeAddons: 4,
      activeFeatureFlags: 5,
      totalAuditEvents: 1245
    } as T;
  }

  if (path.startsWith("/onboarding/requests/pending")) {
    return [
      {
        id: "11111111-1111-1111-1111-111111111111",
        tenantId: "tenant-sunrise",
        tenantName: "선라이즈 아카데미",
        requestedBy: "owner@sunrise.ac.kr",
        status: "PENDING",
        riskLevel: "MEDIUM",
        checklistJson: "[]",
        decidedBy: null,
        decisionAt: null,
        decisionNote: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ] as T;
  }

  if (path.startsWith("/onboarding/requests/")) {
    const now = new Date().toISOString();
    return {
      id: "",
      tenantId: "",
      tenantName: "모의 입점사",
      requestedBy: "ops-admin@mindgarden.com",
      status: "PENDING",
      riskLevel: "LOW",
      checklistJson: "[]",
      decidedBy: null,
      decisionAt: null,
      decisionNote: null,
      createdAt: now,
      updatedAt: now
    } as T;
  }

  if (path.startsWith("/feature-flags")) {
    return [
      {
        id: "f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1",
        flagKey: "ops.dashboard.metrics.v2",
        description: "운영 대시보드 신규 지표 노출",
        state: "ON",
        targetScope: "HQ_ADMIN",
        expiresAt: null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ] as T;
  }

  if (path.startsWith("/plans/addons")) {
    return [
      {
        id: "22222222-2222-2222-2222-222222222222",
        addonCode: "MG_AI_ASSIST",
        displayName: "AI Assistant Bundle",
        displayNameKo: "AI 어시스턴트 번들",
        category: "AI",
        categoryKo: "AI",
        feeType: "USAGE",
        unitPrice: 150000,
        unit: "10K 토큰",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        addonCode: "MG_SMS_PACK",
        displayName: "SMS Notification Pack",
        displayNameKo: "SMS 알림 패키지",
        category: "COMMUNICATION",
        categoryKo: "커뮤니케이션",
        feeType: "FLAT",
        unitPrice: 50000,
        unit: "월",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ] as T;
  }

  if (path.startsWith("/plans/") && path.endsWith("/addons")) {
    return [] as T;
  }

  if (path.startsWith("/plans")) {
    return [
      {
        id: "00000000-0000-0000-0000-000000000000",
        planCode: "MG_ACADEMY_BASE",
        displayName: "Standard Academy Plan",
        displayNameKo: "학원 표준 요금제",
        baseFee: 99000,
        currency: "KRW",
        description: "학원 운영 핵심 모듈을 포함한 기본 요금제",
        descriptionKo: "상담, 수강, 결제, 정산까지 포함된 표준 요금제",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        planCode: "MG_ACADEMY_PREMIUM",
        displayName: "Premium Academy Plan",
        displayNameKo: "학원 프리미엄 요금제",
        baseFee: 199000,
        currency: "KRW",
        description: "AI 분석 및 HQ 통합 보고 기능이 포함된 고급 요금제",
        descriptionKo: "AI 리포트와 통합 정산 자동화를 포함한 고급 요금제",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ] as T;
  }

  if (path.startsWith("/audit")) {
    return [] as T;
  }

  throw new Error(`Mock 데이터가 정의되지 않은 API 경로입니다: ${path}`);
}

