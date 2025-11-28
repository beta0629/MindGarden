# 코어솔루션 미개발 항목 정리 및 우선순위 (실제 소스 확인 반영)

**작성일**: 2025-11-20  
**최종 업데이트**: 2025-11-20 (에러 처리 및 알림 시스템 추가)  
**상태**: 활성 관리 중  
**소스 확인 완료**: ✅

---

## ⚠️ 중요: 공통 코드 등록 필요

온보딩 시스템에서 사용하는 공통 코드가 데이터베이스에 등록되어 있어야 합니다.

**등록된 마이그레이션 파일**: `V35__insert_onboarding_common_codes.sql`

**필요한 코드 그룹**:
1. **RISK_LEVEL** (위험도)
   - LOW (낮음)
   - MEDIUM (보통)
   - HIGH (높음)

2. **ONBOARDING_STATUS** (온보딩 상태)
   - PENDING (대기 중)
   - IN_REVIEW (검토 중)
   - APPROVED (승인됨)
   - REJECTED (거부됨)
   - ON_HOLD (보류)

**실행 방법**:
```bash
# Flyway 마이그레이션 실행 (Spring Boot 시작 시 자동 실행)
# 또는 수동으로 SQL 실행
mysql -u [username] -p [database] < src/main/resources/db/migration/V35__insert_onboarding_common_codes.sql
```

**주의사항**:
- 이 코드들은 CoreSolution 공통 코드이므로 `tenant_id = NULL`로 등록됩니다.
- 코드가 등록되지 않으면 프론트엔드에서 드롭다운이 비어있거나 오류가 발생할 수 있습니다.
- 개발 환경에서 먼저 테스트 후 프로덕션에 적용하세요.

---

## 📊 전체 진행 상황 요약

### 완료된 작업 ✅

#### 백엔드
- **표준화 Phase 0**: 100% 완료
- **표준화 Phase 1**: Controller 표준화 완료
  - ✅ TenantRoleController (BaseApiController 상속 확인)
  - ✅ UserRoleAssignmentController (BaseApiController 상속 확인)
  - ✅ TenantDashboardController (BaseApiController 상속 확인)
- **동적 대시보드 Phase 1-2**: 완료
- **통합 로그인 시스템 (Phase 3)**: 완료
- **온보딩 백엔드 (Phase 4)**: 완료
  - ✅ OnboardingController 구현 완료
  - ✅ OnboardingService 구현 완료
  - ✅ 모든 API 엔드포인트 구현 완료
- **Ops 포털 백엔드 (Phase 4)**: 완료 ✅ (2025-11-20)
  - ✅ DashboardOpsController 구현 완료
  - ✅ PricingPlanOpsController 구현 완료 (CRUD 포함) ✅
  - ✅ FeatureFlagOpsController 구현 완료 (CRUD 포함)
  - ✅ OnboardingController 구현 완료
  - ✅ Ops 포털 인증/권한 강화 완료 ✅ (2025-11-20)
- **에러 처리 및 알림 시스템**: 완료 ✅ (2025-11-20)
  - ✅ `GlobalExceptionHandler`에 `AccessDeniedException` 핸들러 추가 (403 Forbidden 처리)
  - ✅ 프론트엔드 전역 공통 알림 시스템 구현
  - ✅ API 오류 자동 알림 표시 (403, 401, 기타 오류)

#### 프론트엔드
- **frontend-ops (Next.js)**: 대부분 완료
  - ✅ Ops 대시보드 메인 페이지 (`app/dashboard/page.tsx`)
  - ✅ 온보딩 승인 페이지 (`app/onboarding/page.tsx`, `app/onboarding/[id]/page.tsx`)
  - ✅ 요금제 관리 페이지 (`app/pricing/page.tsx`, `PricingManagement.tsx`)
  - ✅ Feature Flag 관리 페이지 (`app/feature-flags/page.tsx`)
  - ✅ 전역 공통 알림 시스템 구현 완료 ✅ (2025-11-20)
    - ✅ `notificationManager` 유틸리티 (`src/utils/notification.ts`)
    - ✅ `GlobalNotification` 컴포넌트 (`src/components/common/GlobalNotification.tsx`)
    - ✅ API 오류 자동 알림 표시 (`clientApi.ts`에서 403, 401, 기타 오류 처리)
- **frontend-trinity (Next.js)**: 기본 구조 완료
  - ✅ Trinity 홈페이지 기본 구조 (`app/page.tsx`)
  - ✅ 실시간 요금제 정보 연동
  - ⚠️ 온보딩 등록 페이지는 부분 구현 (API 유틸만 있음)

---

## 🔥 즉시 조치 필요 (P0 - 높은 우선순위)

### 1. 백엔드: Ops 포털 인증/권한 강화 ⭐
**상태**: ✅ 완료 (2025-11-20)  
**예상 시간**: 0.5일  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 4

**체크리스트**:
- [x] `DashboardOpsController` 권한 체크 추가 (`@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")`) ✅
- [x] `PricingPlanOpsController` 권한 체크 추가 ✅
- [x] `FeatureFlagOpsController` 권한 체크 추가 (이미 create/toggle 있지만 권한 체크 필요) ✅
- [x] `OnboardingController` 권한 체크 추가 ✅
  - [x] 요청 생성은 공개 (`POST /api/v1/onboarding/requests`) - 권한 체크 없음 (의도된 동작) ✅
  - [x] 승인/거부는 관리자만 (`POST /api/v1/onboarding/requests/{id}/decision`) - `@PreAuthorize` 추가 ✅
  - [x] 재시도는 관리자만 (`POST /api/v1/onboarding/requests/{id}/retry`) - `@PreAuthorize` 추가 ✅
- [ ] 통합 로그인 시스템과 연동 확인 (JWT/Session 기반 인증) - 추후 테스트 필요
- [ ] **선택적 인증**: 일부 메뉴만 로그인 필요하도록 설정 (공개 메뉴와 보호된 메뉴 분리) - 추후 구현

**현재 상태**:
- ✅ `TenantPgConfigurationOpsController`: `@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")` 있음
- ✅ `ErdOpsController`: `@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")` 있음
- ✅ `DashboardOpsController`: 권한 체크 추가 완료 (2025-11-20)
- ✅ `PricingPlanOpsController`: 권한 체크 추가 완료 (2025-11-20)
- ✅ `FeatureFlagOpsController`: 권한 체크 추가 완료 (2025-11-20)
- ✅ `OnboardingController`: 선택적 권한 체크 추가 완료 (2025-11-20) - 요청 생성은 공개, 승인/재시도는 관리자만

---

### 2. 백엔드: PricingPlanOpsController CRUD 메서드 추가 ⭐
**상태**: ✅ 완료 (2025-11-20)  
**예상 시간**: 1일  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 4

**체크리스트**:
- [x] `POST /api/v1/ops/plans` - 요금제 생성 ✅
- [x] `PUT /api/v1/ops/plans/{planId}` - 요금제 수정 ✅
- [x] `DELETE /api/v1/ops/plans/{planId}` - 요금제 비활성화 ✅
- [x] `PricingPlanService`에 CRUD 메서드 추가 ✅
  - [x] `createPlan()` 메서드 구현 (plan_code 중복 체크 포함)
  - [x] `updatePlan()` 메서드 구현
  - [x] `deactivatePlan()` 메서드 구현 (소프트 삭제)
- [x] DTO 검증 (`PricingPlanCreateRequest`, `PricingPlanUpdateRequest` 활용) ✅

**현재 상태**:
- ✅ `GET /api/v1/ops/plans` - 모든 요금제 목록 조회
- ✅ `GET /api/v1/ops/plans/active` - 활성화된 요금제 목록 조회
- ✅ `GET /api/v1/ops/plans/code/{planCode}` - plan_code로 조회
- ✅ `GET /api/v1/ops/plans/{planId}` - plan_id로 조회
- ✅ `POST /api/v1/ops/plans` - 요금제 생성 (2025-11-20 완료)
- ✅ `PUT /api/v1/ops/plans/{planId}` - 요금제 수정 (2025-11-20 완료)
- ✅ `DELETE /api/v1/ops/plans/{planId}` - 요금제 비활성화 (2025-11-20 완료)

**참고**: `frontend-ops`의 `PricingManagement.tsx`에서 이미 UI는 구현되어 있지만, 백엔드 API가 없어서 동작하지 않을 수 있음

---

### 3. 프론트엔드: 메인 프론트엔드 온보딩 페이지 구현 ⭐
**상태**: ✅ 완료 (2025-11-20)  
**예상 시간**: 2-3일  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 4

**체크리스트**:
- [x] 온보딩 요청 페이지 (`frontend/src/components/onboarding/OnboardingRequest.js`) ✅
  - [x] 테넌트 정보 입력 폼 (tenantName, businessType 등) ✅
  - [x] 업종 카테고리 동적 로드 (백엔드 API) ✅
  - [x] 위험도 선택 (공통 코드에서 동적 로드) ✅
  - [x] 요청 제출 API 연동 (`POST /api/v1/onboarding/requests`) ✅
  - [x] 하드코딩 제거 (모든 드롭다운은 공통 코드/백엔드에서 가져옴) ✅
  - [x] CSS와 비즈니스 로직 분리 ✅
- [x] 온보딩 상태 조회 페이지 (`frontend/src/components/onboarding/OnboardingStatus.js`) ✅
  - [x] 상태별 요청 목록 필터링 (`GET /api/v1/onboarding/requests?status={status}`) ✅
  - [x] 요청 상세 정보 조회 (`GET /api/v1/onboarding/requests/{id}`) ✅
  - [x] 상태 코드 동적 로드 (공통 코드에서 가져옴) ✅
  - [x] 하드코딩 제거 ✅

**참고**: 
- ✅ `frontend-ops`에는 온보딩 승인 페이지가 이미 구현되어 있음
- ✅ `frontend-trinity`에는 온보딩 API 유틸이 있음 (`utils/api.ts`)
- ✅ `frontend/src/components/onboarding/` 폴더 생성 및 컴포넌트 구현 완료 (2025-11-20)
- ✅ 하드코딩 완전 제거: 모든 드롭다운은 백엔드 공통 코드에서 동적으로 가져옴
- ✅ 비즈니스 로직 분리: `utils/onboardingService.js`에 모든 로직 분리
- ✅ 상수 분리: `constants/onboarding.js`에 모든 상수 정의

---

### 4. 프론트엔드: Trinity 홈페이지 PG SDK 연동 ⭐
**상태**: 온보딩 페이지는 구현 완료, PG SDK 연동 필요  
**예상 시간**: 2-3일  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 5

**체크리스트**:
- [x] 온보딩 등록 페이지 (`frontend-trinity/app/onboarding/page.tsx`) - **구현 완료**
  - [x] 테넌트 정보 입력 폼 (회사명, 업종, 연락처 등)
  - [x] 요금제 선택 UI (실시간 가격 정보 표시, `GET /api/v1/ops/plans/active`)
  - [x] 결제 수단 등록 UI (테스트 모드로 구현됨)
  - [x] 온보딩 요청 API 연동 (`POST /api/v1/onboarding/requests`)
  - [x] 등록 완료 페이지 및 상태 조회 링크
- [ ] 실제 PG SDK 연동 (토스페이먼츠 또는 Stripe)
  - [ ] PG SDK 설치 및 설정
  - [ ] 카드 토큰화 로직 구현
  - [ ] 결제 수단 검증 로직 구현
  - [ ] Webhook 처리 (선택적)
- [ ] 입점사 PG사 등록 단계 (추후 구현)

**현재 상태**:
- ✅ Trinity 홈페이지 기본 구조 (`frontend-trinity/app/page.tsx`)
- ✅ 실시간 요금제 정보 연동 (`getActivePricingPlans`)
- ✅ 온보딩 API 유틸 (`frontend-trinity/utils/api.ts`에 `createOnboardingRequest` 있음)
- ✅ 온보딩 등록 페이지 (`app/onboarding/page.tsx`) **구현 완료** (기본 정보, 업종 선택, 요금제 선택, 결제 수단 등록, 완료 페이지 모두 구현됨)
- ⚠️ 결제 수단 등록은 테스트 모드로 구현됨 (실제 PG SDK 연동 필요)

---

## 📋 중간 우선순위 (P1)

### 5. 동적 대시보드 Phase 3: 테스트 및 검증
**상태**: 대기 중 (시스템 재부팅 필요)  
**예상 시간**: 1일  
**참고**: `MASTER_TODO_AND_IMPROVEMENTS.md`

**체크리스트**:
- [ ] 시스템 재부팅 후 실제 환경 테스트
- [ ] 테스트 체크리스트 사용 (`DYNAMIC_DASHBOARD_TEST_CHECKLIST.md`)
- [ ] 모든 시나리오 검증
- [ ] 에러 케이스 확인

---

### 6. 표준화 Phase 1: Controller 표준화 (진행 중)
**상태**: 진행 중  
**예상 시간**: 2-3주  
**참고**: `CORESOLUTION_STANDARDIZATION_PLAN.md`

**체크리스트**:
- [x] TenantRoleController 표준화 ✅
- [x] UserRoleAssignmentController 표준화 ✅
- [x] TenantDashboardController 표준화 ✅
- [x] BillingController 표준화 ✅ (2025-11-20)
- [x] OnboardingController 표준화 ✅ (2025-11-20)
- [x] BusinessCategoryController 표준화 ✅ (2025-11-20)
- [ ] 다른 Controller 표준화 (ErdController, SubscriptionController 등)

---

### 7. 표준화 Phase 2: DTO 표준화 계획 수립
**상태**: ✅ 완료 (2025-11-20)  
**예상 시간**: 2-3시간 (계획 수립)  
**참고**: `MASTER_TODO_AND_IMPROVEMENTS.md`, `CORESOLUTION_STANDARDIZATION_PLAN.md`

**체크리스트**:
- [x] 기존 DTO 파일 식별 및 분류 ✅
  - [x] 레거시 DTO (*Dto.java): 14개 식별 ✅
  - [x] 표준 Request DTO (*Request.java): 52개 식별 ✅
  - [x] 표준 Response DTO (*Response.java): 42개 식별 ✅
- [x] 마이그레이션 계획 수립 ✅
  - [x] `DTO_STANDARDIZATION_MIGRATION_PLAN.md` 작성 ✅
  - [x] Phase별 우선순위 결정 ✅
  - [x] 마이그레이션 전략 수립 ✅
- [x] 우선순위 결정 ✅
  - [x] Phase 2.1-2.4: 완료 확인 ✅
  - [x] Phase 2.5: 중복 DTO 정리 (P1) ✅
  - [x] Phase 2.3: 명확성 개선 (P2, 선택적) ✅

**현재 상태**:
- ✅ 대부분의 레거시 DTO가 표준화 완료 (Phase 2.1-2.4)
- ✅ ErrorResponse 중복 제거 완료 (Phase 2.5) - Deprecated 표시 완료 ✅ (2025-11-20)
- ⏳ 선택적 개선: PaymentRequest, EmailRequest, AuthRequest 명확화 (Phase 2.3) - 선택적

---

### 8. Trinity 홈페이지 추가 기능 (Phase 5) ⭐
**상태**: 기본 구조만 완료, 추가 기능 미구현  
**예상 시간**: 1-2주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 5

**체크리스트**:

#### Week 1: Trinity 홈페이지 추가 기능
- [ ] DNS 및 SSL 설정 (`dev.e-trinity.co.kr` 개발 환경)
- [x] 회사 소개, 서비스 소개 페이지 완성 ✅ (2025-11-20)
  - [x] `/about` 페이지 생성 ✅
  - [x] `/services` 페이지 생성 ✅
  - [x] Header 네비게이션 업데이트 ✅
- [x] 반응형 디자인 완성 (모바일/태블릿/데스크탑) ✅ (2025-11-20)
  - [x] 모바일 메뉴 버튼 추가 ✅
  - [x] Header 반응형 스타일 개선 ✅
  - [x] Hero 섹션 반응형 개선 ✅
  - [x] Card 컴포넌트 반응형 개선 ✅
  - [x] Pricing 그리드 반응형 개선 (모바일 1열, 태블릿 2열, 데스크탑 3열) ✅
  - [x] Section 반응형 개선 ✅
  - [x] Footer 반응형 개선 ✅
- [x] CoreSolution 브랜딩 적용 ✅ (2025-11-20)
  - [x] 브랜딩 상수 추가 (BRANDING 섹션) ✅
  - [x] Footer에 CoreSolution 정보 추가 ✅
  - [x] 메타데이터 강화 (OpenGraph, Twitter Card) ✅
  - [x] Hero 섹션에 CoreSolution 태그라인 적용 ✅
  - [x] 일관된 브랜딩 메시지 적용 ✅

#### Week 2: 결제 시스템 및 통합
- [x] 결제 수단 토큰 저장 API (`POST /api/v1/billing/payment-methods`) ✅ (이미 구현됨)
- [x] 구독 생성 API (`POST /api/v1/billing/subscriptions`) ✅ (이미 구현됨)
- [x] BillingController 표준화 ✅ (2025-11-20)
  - [x] BaseApiController 상속 ✅
  - [x] ApiResponse 사용 ✅
  - [x] try-catch 제거, GlobalExceptionHandler에 위임 ✅
- [ ] PG 연동 (토스페이먼츠 또는 Stripe, 토큰화 기반)
  - [ ] 실제 PG SDK 연동 (현재는 테스트 모드)
- [ ] 결제 프로세스 구현
- [ ] 실시간 과금 연동
- [ ] 내부 시스템 선택적 인증 및 ERP 자동 구성 연계

---

## 📝 낮은 우선순위 (P2)

### 8. 표준화 Phase 3-6
**상태**: 미시작  
**예상 시간**: 3-4주  
**참고**: `CORESOLUTION_STANDARDIZATION_PLAN.md`

**체크리스트**:
- [ ] Phase 3: 권한 관리 표준화 (1-2주)
- [ ] Phase 4: API 경로 표준화
- [ ] Phase 5: 서비스 레이어 표준화
- [ ] Phase 6: 로깅 표준화

---

### 9. 동적 대시보드 Phase 4: 성능 최적화
**상태**: 대기 중  
**예상 시간**: 1주  
**참고**: `MASTER_TODO_AND_IMPROVEMENTS.md`

**체크리스트**:
- [ ] 대시보드 정보 캐싱
- [ ] 컴포넌트 지연 로딩

---

### 10. Phase 6: 권한 확장 시스템 특화 (2주) ⭐
**상태**: 미시작  
**예상 시간**: 2주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 6

**체크리스트**:
- [ ] 업종별 권한 템플릿 확장
- [ ] ABAC 정책 확장
- [ ] 권한 관리 UI/UX 개선
- [ ] 권한 감사 및 로깅

---

### 11. Phase 7: ERP 시스템 특화 및 고도화 ⭐ 핵심 특화 영역
**상태**: 미시작  
**예상 시간**: 19주 (Phase 1-6)  
**참고**: 
- `ERP_ADVANCEMENT_PLAN.md` - 전체 ERP 고도화 계획
- `ERP_CURRENT_STATUS_AND_ADVANCEMENT.md` - 현재 상태 분석 및 고도화 계획
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화 계획
- `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 7

**현재 ERP 상태**:
- ✅ 재무 관리 (FinancialTransaction) - 기본 거래 기록, 통계
- ✅ 구매 관리 (PurchaseRequest, PurchaseOrder) - 구매 요청/주문, 승인 프로세스
- ✅ 예산 관리 (Budget) - 예산 생성/수정, 사용 추적
- ✅ 재고 관리 (Item) - 재고 현황, 입출고 관리
- ✅ 급여 관리 (SalaryCalculation) - PL/SQL 기반 급여 계산
- ✅ 회계 관리 (AccountingEntry) - 기본 회계 엔트리만 존재
- ❌ 완전한 분개 시스템 (차변/대변 검증, 분개 상세)
- ❌ 원장 시스템
- ❌ 재무제표 생성 (손익계산서, 재무상태표, 현금흐름표)
- ❌ 세무 관리 (부가세, 전자세금계산서, 원천징수)
- ❌ 인사 관리 (직원 정보, 근태, 휴가)
- ❌ 정산 자동화 (업종별 정산 규칙, 자동 계산)
- ❌ 외부 시스템 연동 (회계 시스템, 세무 시스템, 은행)

**체크리스트**:

#### Phase 1: 회계 관리 고도화 (4주)
**Week 1-2: 계정과목 및 분개 시스템**
- [ ] 계정과목 마스터 관리
  - [ ] 계정과목 코드 체계 설계
  - [ ] 계정과목 CRUD API
  - [ ] 계정과목 계층 구조 관리
- [ ] 분개 (Journal Entry) 시스템
  - [ ] AccountingEntry 엔티티 확장 (entry_number, entry_date, total_debit, total_credit, entry_status)
  - [ ] 분개 상세 테이블 생성 (erp_journal_entry_lines)
  - [ ] 분개 생성/수정/삭제 API
  - [ ] 차변/대변 자동 검증 로직
  - [ ] 분개 승인 프로세스
  - [ ] 분개 전기 (Posting) 기능
  - [ ] 분개 이력 관리
  - [ ] PL/SQL 프로시저: `CreateJournalEntry`, `AddJournalEntryLine`, `ValidateJournalEntry`, `ApproveAndPostJournalEntry`

**Week 3-4: 원장 및 재무제표**
- [ ] 원장 (Ledger) 시스템
  - [ ] 원장 테이블 생성 (erp_ledgers)
  - [ ] 원장 자동 생성 로직 (분개 전기 시)
  - [ ] 계정별 원장 조회 API
  - [ ] 기간별 원장 조회 API
  - [ ] 잔액 계산 로직
  - [ ] PL/SQL 프로시저: `GenerateLedgerFromJournalEntry`, `GetAccountLedger`
- [ ] 재무제표 생성
  - [ ] 손익계산서 (Income Statement) 생성 로직
  - [ ] 재무상태표 (Balance Sheet) 생성 로직
  - [ ] 현금흐름표 (Cash Flow Statement) 생성 로직
  - [ ] 재무제표 조회 API
  - [ ] PL/SQL 프로시저: `GenerateIncomeStatement`, `GenerateBalanceSheet`, `GenerateCashFlowStatement`
- [ ] 결산 처리
  - [ ] 월별 결산 로직
  - [ ] 연도별 결산 로직
  - [ ] 이월 처리 로직
  - [ ] 결산 API

#### Phase 2: 세무 관리 시스템 (3주)
**Week 1: 부가세 관리**
- [ ] 부가세 계산 로직
  - [ ] 공급가액/부가세 자동 계산
  - [ ] 세율 관리 (10%, 0% 등)
  - [ ] 부가세 신고 테이블 생성 (erp_vat_returns)
  - [ ] PL/SQL 프로시저: `CalculateVatForPeriod`, `GenerateVatReturn`
- [ ] 부가세 신고서 생성
  - [ ] 매출세액 계산서
  - [ ] 매입세액 계산서
  - [ ] 부가세 신고서 양식 생성
  - [ ] 부가세 신고서 조회 API

**Week 2: 전자세금계산서**
- [ ] 전자세금계산서 발행
  - [ ] 전자세금계산서 테이블 생성 (erp_electronic_tax_invoices)
  - [ ] 국세청 전자세금계산서 API 연동
  - [ ] 세금계산서 발행/수정/취소 API
  - [ ] Java 서비스: TaxInvoiceService (외부 API 연동)
- [ ] 전자세금계산서 수신
  - [ ] 매입 세금계산서 수신
  - [ ] 세금계산서 검증

**Week 3: 원천징수 및 연말정산**
- [ ] 원천징수 관리
  - [ ] 원천징수 계산
  - [ ] 원천징수 영수증 발급
- [ ] 연말정산 처리
  - [ ] 소득공제 계산
  - [ ] 연말정산 신고서 생성

#### Phase 3: 인사 관리 시스템 (4주)
**Week 1-2: 직원 관리**
- [ ] 직원 정보 관리
  - [ ] 직원 테이블 생성 (erp_employees)
  - [ ] 직원 등록/수정/삭제 API
  - [ ] 직원 프로필 관리
  - [ ] 조직도 관리
  - [ ] Java 서비스: EmployeeService (CRUD)
- [ ] 근태 관리
  - [ ] 근태 기록 테이블 생성 (erp_attendance_records)
  - [ ] 출퇴근 기록 API
  - [ ] 근무 시간 계산 로직
  - [ ] 초과근무 관리
  - [ ] PL/SQL 프로시저: `RecordAttendance`, `GetAttendanceStatistics`
- [ ] 휴가 관리
  - [ ] 휴가 신청/승인 API
  - [ ] 휴가 잔여일수 관리
  - [ ] 휴가 이력 관리
  - [ ] Java 서비스: VacationService

**Week 3-4: 급여 관리**
- [ ] 급여 계산 (기존 확장)
  - [ ] 기본급 계산
  - [ ] 수당 계산 (야근수당, 주말수당 등)
  - [ ] 공제 계산 (4대보험, 소득세 등)
  - [ ] 실지급액 계산
  - [ ] 근태 정보 반영
  - [ ] 휴가 차감 로직 추가
  - [ ] 기존 `ProcessIntegratedSalaryCalculation` 프로시저 확장
- [ ] 급여 지급
  - [ ] 급여 명세서 생성
  - [ ] 급여 지급 이력
  - [ ] 급여 조회 권한 관리
- [ ] 평가 관리
  - [ ] 평가 항목 설정
  - [ ] 평가 실시
  - [ ] 평가 결과 관리

#### Phase 4: 정산 관리 고도화 (3주)
**Week 1: 업종별 정산 자동화**
- [ ] 정산 규칙 테이블 생성 (erp_settlement_rules)
- [ ] 정산 결과 테이블 생성 (erp_settlements)
- [ ] 학원 정산
  - [ ] 수강료 정산
  - [ ] 강사 정산
  - [ ] 본사 로열티 정산
  - [ ] PL/SQL 프로시저: `CalculateAcademySettlement`
- [ ] 상담소 정산
  - [ ] 상담료 정산
  - [ ] 상담사 정산
  - [ ] PL/SQL 프로시저: `CalculateConsultationSettlement`
- [ ] 카페/요식업 정산
  - [ ] 매출 정산
  - [ ] 수수료 정산

**Week 2: 정산 계산 엔진**
- [ ] 정산 규칙 엔진 구현
  - [ ] 정산 비율 설정
  - [ ] 정산 주기 설정
  - [ ] 정산 조건 설정
  - [ ] Java 서비스: SettlementRuleService (CRUD)
- [ ] 정산 자동 계산
  - [ ] 배치 작업으로 정산 계산
  - [ ] 정산 결과 검증
  - [ ] PL/SQL 프로시저: `CalculateSettlement`
  - [ ] 배치 스케줄러: `SettlementBatchScheduler`

**Week 3: 정산 리포트 및 승인**
- [ ] 정산 리포트 생성
  - [ ] 정산 내역 리포트
  - [ ] 정산 요약 리포트
  - [ ] 정산 리포트 조회 API
- [ ] 정산 승인 프로세스
  - [ ] 정산 승인 워크플로우
  - [ ] 정산 승인 이력
  - [ ] 정산 승인 API

#### Phase 5: 리포트 및 분석 (2주)
**Week 1: 재무 리포트**
- [ ] 재무 리포트 생성
  - [ ] 월별 재무 리포트
  - [ ] 연도별 재무 리포트
  - [ ] 비교 분석 리포트
  - [ ] 재무 리포트 조회 API
- [ ] 예산 대비 실적 분석
  - [ ] 예산 대비 실적 차이 분석
  - [ ] 예산 달성률 계산
  - [ ] 예산 분석 리포트

**Week 2: 분석 대시보드**
- [ ] 현금흐름 분석
  - [ ] 현금흐름표 생성
  - [ ] 현금흐름 트렌드 분석
- [ ] 손익 분석
  - [ ] 손익 구조 분석
  - [ ] 손익 트렌드 분석
  - [ ] 손익 예측

#### Phase 6: 외부 시스템 연동 (3주)
**Week 1: 회계 시스템 연동**
- [ ] 더존 연동
  - [ ] 더존 API 연동
  - [ ] 데이터 동기화
- [ ] 영림원 연동
  - [ ] 영림원 API 연동
  - [ ] 데이터 동기화

**Week 2: 세무 시스템 연동**
- [ ] 홈택스 연동
  - [ ] 홈택스 API 연동
  - [ ] 세무 신고 자동화
- [ ] 전자세금계산서 연동
  - [ ] 국세청 전자세금계산서 API

**Week 3: 은행 연동**
- [ ] 계좌 조회
  - [ ] 은행 API 연동
  - [ ] 계좌 잔액 조회
  - [ ] 거래 내역 조회
- [ ] 자동 이체
  - [ ] 급여 자동 이체
  - [ ] 정산 자동 이체

#### 공통 작업
- [ ] ERP 서비스 BaseTenantService 패턴 적용
- [ ] BaseProcedureService 생성 (프로시저 호출 표준화)
- [ ] Java 서비스 레이어 구조 개선
- [ ] ERP 통합 테스트
- [ ] ERP 대시보드 및 리포트 UI

---

### 12. Phase 8: 브랜딩 시스템 구현 (1주)
**상태**: 미시작  
**예상 시간**: 1주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 8

**체크리스트**:
- [ ] 로고 업로드 및 관리 API
- [ ] 상호(회사명) 관리
- [ ] 브랜딩 정보 저장 (branding_json)
- [ ] 헤더에 로고 및 상호 표시 (모든 페이지)
- [ ] 대시보드에 로고 및 상호 표시
- [ ] Fallback 로직 구현 (코어시스템 로고/상호로 대체)
- [ ] 브랜딩 커스터마이징 UI

---

### 13. Phase 9: 사용성 강화 및 모바일 앱 준비 (2주)
**상태**: 미시작  
**예상 시간**: 2주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 9

**체크리스트**:
- [ ] 사용성 테스트 (실제 소상공인 대상)
- [ ] 자동화 검증 (입력 최소화 확인)
- [ ] 모바일 반응형 UI 완성
- [ ] 모바일 앱 개발 환경 구축
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 벤치마크
- [ ] 문서화

---

## 📊 우선순위 매트릭스

| 우선순위 | 항목 | 예상 시간 | 상태 | 비고 |
|---------|------|----------|------|------|
| **P0** | 1. 백엔드: Ops 포털 인증/권한 강화 | 0.5일 | ✅ 완료 | 2025-11-20 완료 |
| **P0** | 2. 백엔드: PricingPlanOpsController CRUD 추가 | 1일 | ✅ 완료 | 2025-11-20 완료 |
| **P0** | 에러 처리 및 알림 시스템 구현 | 0.5일 | ✅ 완료 | 2025-11-20 완료 |
| **P0** | 3. 프론트엔드: 메인 프론트엔드 온보딩 페이지 | 2-3일 | 🚧 진행 필요 | frontend-ops에는 있음 |
| **P0** | 4. 프론트엔드: Trinity 홈페이지 PG SDK 연동 | 2-3일 | 🚧 진행 필요 | 온보딩 페이지는 완료, PG SDK 연동 필요 |
| **P1** | 5. 동적 대시보드 Phase 3: 테스트 및 검증 | 1일 | ⏳ 대기 중 | 시스템 재부팅 필요 |
| **P1** | 6. DTO 표준화 계획 수립 | 2-3시간 | ⏳ 대기 중 | |
| **P1** | 7. Trinity 홈페이지 추가 기능 | 1-2주 | ⏳ 대기 중 | 기본 구조만 완료 |
| **P2** | 8. 표준화 Phase 3-6 | 3-4주 | ⏳ 대기 중 | |
| **P2** | 9. 동적 대시보드 Phase 4: 성능 최적화 | 1주 | ⏳ 대기 중 | |
| **P2** | 10. 권한 확장 시스템 특화 | 2주 | ⏳ 대기 중 | |
| **P2** | 11. ERP 시스템 특화 및 고도화 | 19주 | ⏳ 대기 중 | Phase 1-6 상세 계획 있음 |
| **P2** | 12. 브랜딩 시스템 구현 | 1주 | ⏳ 대기 중 | |
| **P2** | 13. 사용성 강화 및 모바일 앱 준비 | 2주 | ⏳ 대기 중 | |

---

## 🎯 다음 주 작업 계획 (권장)

### Week 1 (즉시 시작)
1. **백엔드: Ops 포털 인증/권한 강화** (0.5일)
   - DashboardOpsController, PricingPlanOpsController, FeatureFlagOpsController, OnboardingController에 권한 체크 추가

2. **백엔드: PricingPlanOpsController CRUD 메서드 추가** (1일)
   - createPlan, updatePlan, deactivatePlan 구현

3. **프론트엔드: 메인 프론트엔드 온보딩 페이지 구현** (2-3일)
   - OnboardingRequest 컴포넌트
   - OnboardingStatus 컴포넌트

### Week 2
4. **프론트엔드: Trinity 홈페이지 온보딩 등록 페이지 완성** (2-3일)
5. **동적 대시보드 Phase 3: 테스트 및 검증** (1일)
6. **DTO 표준화 계획 수립** (2-3시간)

---

## 📌 중요 참고사항

### 실제 구현 상태 확인 결과

#### ✅ 이미 구현된 것들
1. **frontend-ops (Next.js)**: 대부분 완료
   - Ops 대시보드, 온보딩 승인, 요금제 관리, Feature Flag 관리 모두 구현됨
2. **백엔드 Ops 포털**: 대부분 완료
   - DashboardOpsController, PricingPlanOpsController, FeatureFlagOpsController 모두 구현됨
   - FeatureFlagOpsController는 CRUD까지 완료
3. **Trinity 홈페이지**: 기본 구조 완료
   - 홈페이지 기본 구조와 실시간 요금제 연동 완료

#### ❌ 아직 구현되지 않은 것들
1. **백엔드**: Ops 포털 인증/권한 강화 (일부만 완료)
   - DashboardOpsController, PricingPlanOpsController, FeatureFlagOpsController, OnboardingController에 @PreAuthorize 없음
2. **백엔드**: PricingPlanOpsController CRUD (조회만 완료)
   - createPlan, updatePlan, deactivatePlan 미구현 (TODO 주석만 있음)
3. **프론트엔드**: 메인 프론트엔드(frontend) 온보딩 페이지
   - frontend/src/components/onboarding/ 폴더 없음
4. **프론트엔드**: Trinity 홈페이지 PG SDK 연동
   - 결제 수단 등록은 테스트 모드로 구현됨, 실제 PG SDK 연동 필요
5. **ERP 시스템**: 문서에 명시된 고도화 기능들 대부분 미구현
   - 회계 관리: 분개 시스템, 원장 시스템, 재무제표 생성 미구현
   - 세무 관리: 부가세 계산, 전자세금계산서 발행, 원천징수 관리 미구현
   - 인사 관리: 직원 정보 관리, 근태 관리, 휴가 관리 미구현
   - 정산 관리: 업종별 정산 자동화, 정산 리포트 생성 미구현
   - 외부 시스템 연동: 회계 시스템, 세무 시스템, 은행 연동 미구현

### 작업 원칙
1. **하위 호환성 유지**: 모든 변경은 기존 기능과 호환되어야 함
2. **점진적 마이그레이션**: 한 번에 모든 것을 변경하지 않음
3. **문서화 필수**: 모든 표준 규칙과 변경사항 문서화
4. **테스트 우선**: 변경 전후 테스트 필수

### 우선순위 결정 기준
1. **보안 관련**: 즉시 조치 (P0)
2. **API 일관성**: 높은 우선순위 (P0-P1)
3. **개발자 경험**: 중간 우선순위 (P1-P2)
4. **운영 효율성**: 낮은 우선순위 (P2-P3)

---

**마지막 업데이트**: 2025-11-20  
**소스 확인 완료**: ✅  
**다음 리뷰 예정일**: 2025-11-27 (주간 회의)

