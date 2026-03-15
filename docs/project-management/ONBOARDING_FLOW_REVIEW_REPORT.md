# 온보딩 플로우 검토 최종 보고서

**작성일**: 2026-03-15  
**회의 의제**: 온보딩 플로우 문제점·리스크 검토  
**맥락**: ERP backfill 수정으로 AccountingEntry 자동생성 완료. 테넌트 생성 시 `ensureErpAccountMappingForTenant`가 온보딩 4단계에서 호출됨. 이후 상담료 입금 시 분개 자동 생성.

---

## 요약

온보딩 전반에 걸쳐 **4단계(ERP 계정 매핑 시딩) 실패 시에도 SUCCESS로 잘못 기록되는 설계 결함**이 핵심 문제이며, 이로 인해 입금 시 분개 미생성, init-tenant-erp API가 항상 성공 응답을 반환하는 부수 문제가 발생합니다. **즉시 수정이 권장**됩니다.

---

## 1. 현재 문제점·리스크 목록

### 심각 (Critical)

| # | 문제 | 설명 |
|---|------|------|
| 1 | **4단계 실패 시 erpAccounts가 SUCCESS로 기록됨** | `AccountingServiceImpl.ensureErpAccountMappingForTenant`가 예외를 catch 후 rethrow 하지 않아, OnboardingServiceImpl이 실패를 인지하지 못함. 실패 시에도 `statusMap.put("erpAccounts", SUCCESS)` 실행됨. |
| 2 | **입금 시 분개 미생성 시 사용자/운영 피드백 부족** | `createJournalEntryFromTransaction`이 null 반환해도 FinancialTransactionServiceImpl은 로그만 남기고 정상 응답. 사용자는 "입금은 됐는데 재무제표에 안 나온다"만 보게 됨. |

### 중간 (Medium)

| # | 문제 | 설명 |
|---|------|------|
| 3 | **init-tenant-erp API가 시딩 실패 시에도 200 + 성공 메시지 반환** | `ensureErpAccountMappingForTenant`가 예외를 던지지 않아, 실패해도 API는 항상 `success: true` 반환. |
| 4 | **1~3단계(공통코드·역할·권한)도 동일 패턴 가능성** | 내부 래퍼가 예외를 삼키면 해당 단계도 실패인데 SUCCESS로 기록될 수 있음. |
| 5 | **InitializationStatusDisplay에 erpAccounts 미표시** | Ops 포털에서 ERP 시딩 상태를 확인할 수 없음. |
| 6 | **erpAccounts 재시도 미지원** | `retryInitializationTask`에 erpAccounts 분기 없음. 관리자가 재시도 불가. |

### 낮음 (Low)

| # | 문제 | 설명 |
|---|------|------|
| 7 | **스케줄러 init+backfill 실패 시 WARN 로그만** | ErpAutomationScheduler에서 예외 catch 후 log.warn만, 재시도/알림 없음. |
| 8 | **프로시저 vs Java fallback 경로 차이** | 프로시저: CopyDefaultTenantCodes 호출. Fallback: ensureTenantExists는 tenants만, tenant_common_codes 미처리 가능성. |
| 9 | **테넌트 관리자용 "데이터 동기화 필요" 배너 없음** | ERP 계정 매핑 미생성 시 사전 경고 없음. 문제 발생 후 수동 init 안내 수준. |

---

## 2. 우선순위 매트릭스

| 우선순위 | 항목 | 영향 | 즉시 조치 |
|----------|------|------|-----------|
| **P0 (심각)** | erpAccounts 실패 시 SUCCESS 기록 | 데이터 불일치, 모니터링 불가 | 예 |
| **P0 (심각)** | 입금 시 분개 미생성 피드백 부족 | 사용자 경험 저하, 운영 트러블슈팅 어려움 | 예 |
| **P1 (중간)** | init-tenant-erp 실패 시 200 반환 | 수동 복구 시 잘못된 성공 인식 | 예 |
| **P1 (중간)** | Ops erpAccounts 미표시·재시도 미지원 | 관리자 대응 어려움 | 예 |
| **P2 (낮음)** | 스케줄러·테넌트 배너 등 | 장기 모니터링·UX 개선 | 추후 |

---

## 3. 권장 조치

### 즉시 수정 (P0·P1)

| 조치 | 담당 | 상세 |
|------|------|------|
| **1. ensureErpAccountMappingForTenant 예외 전파 또는 반환값 도입** | core-coder | 실패 시 예외 rethrow 또는 `boolean`/결과 DTO 반환. 호출자가 실패 인지 가능하도록. |
| **2. OnboardingServiceImpl 4단계 실패 처리 보정** | core-coder | 반환값/예외로 FAILED 판단 시 `statusMap.put("erpAccounts", FAILED, errorMsg)` 저장. |
| **3. init-tenant-erp API 실패 시 4xx/5xx 반환** | core-coder | `ensureErpAccountMappingForTenant` 결과에 따라 실패 시 HTTP 오류 응답. |
| **4. InitializationStatusDisplay에 erpAccounts 추가** | core-designer → core-coder | Ops 포털에 ERP 계정 매핑 상태·성공/실패·에러 메시지 표시. |
| **5. erpAccounts 재시도 지원** | core-coder | `retryInitializationTask`에 erpAccounts 분기 추가, init-tenant-erp 호출 또는 ensure 재실행. |

### 추후 개선

| 조치 | 담당 | 상세 |
|------|------|------|
| 테넌트 관리자용 "데이터 동기화 필요" 배너 | core-designer → core-coder | ERP 계정 미생성 시 운영 현황/ERP 화면 상단 경고 배너. |
| 신청자(Trinity) 안내 보강 | core-designer | "설정 완료까지 몇 분 걸릴 수 있습니다" 등 안내 문구. |
| 입금 시 분개 null 반환 시 로그/알림 강화 | core-coder | WARN 레벨 상향 또는 관리자 알림 검토. |

### 모니터링

| 조치 | 상세 |
|------|------|
| 로그 집계 | `ensureErpAccountMappingForTenant` 실패 건수 메트릭/로그 집계. |
| 주기 점검 | 주 1회 등으로 ERP 시딩 실패 테넌트 수 확인. |

---

## 4. 다음 액션

### 1단계: 백엔드 수정 (core-coder)

1. **AccountingServiceImpl**: `ensureErpAccountMappingForTenant` 실패 시 예외 rethrow 또는 `boolean` 반환.
2. **OnboardingServiceImpl**: 4단계 결과/예외로 `erpAccounts=FAILED` 저장.
3. **AccountingBackfillController**: init-tenant-erp 실패 시 4xx/5xx 응답.

참조: `docs/troubleshooting/ONBOARDING_ERP_SEEDING_ERROR_ANALYSIS.md` §6 수정 제안 체크리스트.

### 2단계: UX 개선 (core-designer → core-coder)

1. **InitializationStatusDisplay**에 erpAccounts 표시 및 재시도 버튼 연동.
2. `retryInitializationTask`에 erpAccounts 재시도 분기 추가.

### 3단계: 테스트 보완 (core-tester)

1. P0 테스트: 온보딩 승인 후 erpAccounts 상태·accounts 검증, confirm-deposit→분개 생성.
2. P0 테스트: init-tenant-erp API 실패 시 HTTP 오류 응답 검증.

참조: `docs/project-management/ONBOARDING_ERP_SEEDING_TEST_CASES.md`.

### 4단계: 문서화

- ERP 시딩 실패 시 롤백/복구 정책 문서화 (예: `docs/project-management/ERP_TENANT_ISOLATION.md`).

---

## 5. 산출물·참조 문서

| 구분 | 경로 |
|------|------|
| 에러 분석 상세 | `docs/troubleshooting/ONBOARDING_ERP_SEEDING_ERROR_ANALYSIS.md` |
| 테스트 케이스 | `docs/project-management/ONBOARDING_ERP_SEEDING_TEST_CASES.md` |
| 온보딩·ERP 흐름 | explore 서브에이전트 탐색 보고 (요약 포함) |

---

## 6. 분배실행 요약 (이미 수행 완료)

| Phase | 서브에이전트 | 수행 내용 |
|-------|--------------|-----------|
| 1 | explore | 온보딩 전체 흐름·ensureErpAccountMapping 호출 지점·프로시저·fallback·실패 지점 탐색 |
| 2 | core-debugger | 에러 패턴·트랜잭션 시나리오·init-tenant-erp 없이 사용 가능 여부 분석, ONBOARDING_ERP_SEEDING_ERROR_ANALYSIS.md 작성 |
| 3 | core-coder | OnboardingServiceImpl·AccountingServiceImpl 연동 코드 리뷰, 예외 처리·복구 경로·개선 제안 |
| 4 | core-designer | 온보딩 UX 검토, erpAccounts 표시·재시도·배너 제안 |
| 5 | core-tester | E2E·실패/재시도 시나리오 테스트 케이스 제안, ONBOARDING_ERP_SEEDING_TEST_CASES.md 작성 |
