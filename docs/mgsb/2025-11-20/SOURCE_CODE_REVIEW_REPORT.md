# 소스 코드 검토 보고서

**작성일**: 2025-11-20  
**검토 범위**: 문서 폴더와 현재 소스 코드 비교  
**목적**: 문서에 명시된 기능과 실제 구현 상태 비교 및 누락 항목 식별

---

## 📋 검토 결과 요약

### ✅ 문서와 일치하는 구현

1. **Ops 포털 백엔드**
   - ✅ DashboardOpsController 구현 완료
   - ✅ PricingPlanOpsController 조회 API 구현 완료
   - ✅ FeatureFlagOpsController CRUD 구현 완료
   - ✅ OnboardingController 구현 완료

2. **Trinity 홈페이지**
   - ✅ 온보딩 등록 페이지 완전 구현 (`frontend-trinity/app/onboarding/page.tsx`)
   - ✅ 기본 정보 입력, 업종 선택, 요금제 선택, 결제 수단 등록, 완료 페이지 모두 구현됨
   - ✅ 실시간 요금제 정보 연동 완료

3. **통합 로그인 시스템**
   - ✅ JWT 토큰 확장 (tenantId, branchId, permissions 포함)
   - ✅ 통합 로그인 페이지 구현
   - ✅ 테넌트 선택 화면 구현
   - ✅ Refresh Token 구현

4. **BaseTenantService 패턴**
   - ✅ BaseTenantService 인터페이스 및 구현체 존재
   - ✅ 여러 서비스에서 BaseTenantEntityServiceImpl 상속 사용 중

---

## ❌ 문서와 불일치하거나 누락된 구현

### 1. 백엔드: Ops 포털 인증/권한 강화

**문서 요구사항**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 4
- 모든 Ops 컨트롤러에 `@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")` 추가 필요

**실제 상태**:
- ✅ `TenantPgConfigurationOpsController`: 권한 체크 있음
- ✅ `ErdOpsController`: 권한 체크 있음
- ❌ `DashboardOpsController`: 권한 체크 없음
- ❌ `PricingPlanOpsController`: 권한 체크 없음
- ❌ `FeatureFlagOpsController`: 권한 체크 없음 (CRUD는 있지만 권한 체크 없음)
- ❌ `OnboardingController`: 권한 체크 없음 (요청 생성은 공개, 승인은 관리자만 필요)

**영향**: 보안 취약점 - 인증 없이 Ops 포털 API 접근 가능

---

### 2. 백엔드: PricingPlanOpsController CRUD 메서드

**문서 요구사항**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 4
- `POST /api/v1/ops/plans` - 요금제 생성
- `PUT /api/v1/ops/plans/{planId}` - 요금제 수정
- `DELETE /api/v1/ops/plans/{planId}` - 요금제 비활성화

**실제 상태**:
- ✅ 조회 API만 구현됨 (GET 메서드들)
- ❌ CRUD 메서드 미구현 (TODO 주석만 있음)
- ❌ `PricingPlanService`에도 CRUD 메서드 없음

**영향**: 
- `frontend-ops`의 `PricingManagement.tsx`에서 요금제 생성/수정 UI는 있지만 백엔드 API가 없어서 동작하지 않음
- Ops 포털에서 요금제 관리 불가능

---

### 3. 프론트엔드: 메인 프론트엔드 온보딩 페이지

**문서 요구사항**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 4
- `frontend/src/components/onboarding/OnboardingRequest.js` - 온보딩 요청 페이지
- `frontend/src/components/onboarding/OnboardingStatus.js` - 온보딩 상태 조회 페이지

**실제 상태**:
- ❌ `frontend/src/components/onboarding/` 폴더 없음
- ✅ `frontend-ops`에는 온보딩 승인 페이지 있음
- ✅ `frontend-trinity`에는 온보딩 등록 페이지 있음

**영향**: 메인 프론트엔드에서 온보딩 요청 및 상태 조회 불가능

---

### 4. 프론트엔드: Trinity 홈페이지 PG SDK 연동

**문서 요구사항**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 5
- 실제 PG SDK 연동 (토스페이먼츠 또는 Stripe)
- 카드 토큰화 로직
- 결제 수단 검증

**실제 상태**:
- ✅ 온보딩 페이지는 완전히 구현됨
- ⚠️ 결제 수단 등록은 테스트 모드로 구현됨 (`TRINITY_CONSTANTS.PAYMENT.TEST_MODE`)
- ❌ 실제 PG SDK 연동 없음 (TODO 주석만 있음)

**영향**: 실제 결제 수단 등록 불가능, 테스트 모드로만 동작

---

### 5. ERP 시스템 고도화

**문서 요구사항**: 
- `ERP_ADVANCEMENT_PLAN.md` - 전체 ERP 고도화 계획 (19주)
- `ERP_CURRENT_STATUS_AND_ADVANCEMENT.md` - 현재 상태 분석
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화

**실제 상태**:
- ✅ 기본 ERP 서비스 존재 (`ErpServiceImpl`, `PlSqlAccountingServiceImpl`)
- ✅ 기본 재무 관리, 구매 관리, 예산 관리, 재고 관리 구현됨
- ✅ 급여 계산 프로시저 존재 (`ProcessIntegratedSalaryCalculation`)
- ❌ **회계 관리 고도화 미구현**:
  - 분개 시스템 (Journal Entry) 미구현
  - 원장 시스템 (Ledger) 미구현
  - 재무제표 생성 (손익계산서, 재무상태표, 현금흐름표) 미구현
  - 계정과목 관리 미구현
  - 결산 처리 미구현
- ❌ **세무 관리 미구현**:
  - 부가세 계산 및 신고 미구현
  - 전자세금계산서 발행 미구현
  - 원천징수 관리 미구현
  - 연말정산 처리 미구현
- ❌ **인사 관리 미구현**:
  - 직원 정보 관리 미구현
  - 근태 관리 미구현
  - 휴가 관리 미구현
  - 평가 관리 미구현
- ❌ **정산 관리 고도화 미구현**:
  - 업종별 정산 자동화 미구현
  - 정산 리포트 생성 미구현
  - 정산 승인 프로세스 미구현
- ❌ **외부 시스템 연동 미구현**:
  - 회계 시스템 연동 (더존, 영림원 등) 미구현
  - 세무 시스템 연동 (홈택스 등) 미구현
  - 은행 연동 (계좌 조회, 이체) 미구현

**영향**: ERP 시스템이 기본 기능만 제공, 문서에 명시된 고도화 기능 대부분 미구현

---

## 📊 우선순위별 누락 항목 정리

### P0 (즉시 조치 필요)

1. **백엔드: Ops 포털 인증/권한 강화** (0.5일)
   - DashboardOpsController, PricingPlanOpsController, FeatureFlagOpsController, OnboardingController에 권한 체크 추가
   - 보안 취약점 해결

2. **백엔드: PricingPlanOpsController CRUD 메서드 추가** (1일)
   - createPlan, updatePlan, deactivatePlan 구현
   - Ops 포털에서 요금제 관리 가능하도록

3. **프론트엔드: 메인 프론트엔드 온보딩 페이지 구현** (2-3일)
   - OnboardingRequest, OnboardingStatus 컴포넌트 구현

4. **프론트엔드: Trinity 홈페이지 PG SDK 연동** (2-3일)
   - 실제 PG SDK 연동 (토스페이먼츠 또는 Stripe)
   - 카드 토큰화 로직 구현

### P1 (중간 우선순위)

5. **ERP 시스템 고도화** (19주)
   - 문서에 명시된 Phase 1-6 단계별 구현
   - 회계 관리, 세무 관리, 인사 관리, 정산 관리, 외부 시스템 연동

---

## 🔍 추가 발견 사항

### 문서에 명시되지 않았지만 구현된 기능

1. **Trinity 온보딩 페이지 완전 구현**
   - 문서에는 "부분 구현" 또는 "기본 구조만 있음"으로 표시되어 있었으나
   - 실제로는 완전히 구현되어 있음 (기본 정보, 업종 선택, 요금제 선택, 결제 수단 등록, 완료 페이지 모두 구현)

2. **테스트 코드**
   - `OnboardingOpsIntegrationTest` 존재
   - `UnifiedLoginIntegrationTest` 존재
   - 통합 테스트 코드 일부 구현됨

---

## 📝 권장 사항

1. **문서 업데이트 필요**
   - Trinity 온보딩 페이지 상태를 "구현 완료"로 업데이트
   - PG SDK 연동만 남은 것으로 명시

2. **우선순위 재조정**
   - P0 항목부터 즉시 조치
   - ERP 고도화는 장기 계획으로 유지

3. **테스트 코드 보완**
   - 누락된 기능에 대한 테스트 코드 작성
   - 통합 테스트 커버리지 향상

---

**마지막 업데이트**: 2025-11-20  
**검토자**: AI Assistant  
**다음 검토 예정일**: 2025-11-27

