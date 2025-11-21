# 코어솔루션 개발 체크리스트

**작성일**: 2025-11-20  
**최종 업데이트**: 2025-11-20  
**상태**: 활성 관리 중

---

## ⚠️ 중요: 공통 코드 등록 필요

온보딩 시스템에서 사용하는 공통 코드를 데이터베이스에 등록해야 합니다.

**마이그레이션 파일**: `V35__insert_onboarding_common_codes.sql`

**등록할 코드 그룹**:
- [ ] RISK_LEVEL (위험도) - LOW, MEDIUM, HIGH
- [ ] ONBOARDING_STATUS (온보딩 상태) - PENDING, IN_REVIEW, APPROVED, REJECTED, ON_HOLD

**실행 방법**:
1. Spring Boot 애플리케이션 재시작 (Flyway 자동 실행)
2. 또는 수동으로 SQL 실행

**확인 방법**:
```sql
SELECT * FROM common_codes WHERE code_group IN ('RISK_LEVEL', 'ONBOARDING_STATUS');
```

**주의사항**:
- 이 코드들은 CoreSolution 공통 코드이므로 `tenant_id = NULL`로 등록됩니다.
- 코드가 등록되지 않으면 프론트엔드에서 드롭다운이 비어있거나 오류가 발생할 수 있습니다.
- 개발 환경에서 먼저 테스트 후 프로덕션에 적용하세요.

---

## 🔥 P0 - 즉시 조치 필요 (높은 우선순위)

### 1. 백엔드: Ops 포털 인증/권한 강화
**예상 시간**: 0.5일  
**담당자**: AI Assistant  
**완료일**: 2025-11-20

#### 체크리스트
- [x] `DashboardOpsController` 권한 체크 추가 ✅
  - [x] `@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")` 추가 ✅
  - [ ] 테스트 확인 (추후 진행)
- [x] `PricingPlanOpsController` 권한 체크 추가 ✅
  - [x] `@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")` 추가 ✅
  - [ ] 테스트 확인 (추후 진행)
- [x] `FeatureFlagOpsController` 권한 체크 추가 ✅
  - [x] `@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")` 추가 ✅
  - [ ] 테스트 확인 (추후 진행)
- [x] `OnboardingController` 권한 체크 추가 ✅
  - [x] 요청 생성은 공개 (`POST /api/v1/onboarding/requests`) - 권한 체크 없음 ✅
  - [x] 승인/거부는 관리자만 (`POST /api/v1/onboarding/requests/{id}/decision`) - `@PreAuthorize` 추가 ✅
  - [x] 재시도는 관리자만 (`POST /api/v1/onboarding/requests/{id}/retry`) - `@PreAuthorize` 추가 ✅
  - [ ] 테스트 확인 (추후 진행)
- [ ] 통합 로그인 시스템과 연동 확인 (추후 진행)
  - [ ] JWT/Session 기반 인증 확인
  - [ ] 권한 체크 동작 확인
- [ ] 선택적 인증 설정 (추후 구현)
  - [ ] 공개 메뉴와 보호된 메뉴 분리
  - [ ] SecurityConfig 설정 확인

**참고 파일**:
- `src/main/java/com/coresolution/core/controller/ops/DashboardOpsController.java`
- `src/main/java/com/coresolution/core/controller/ops/PricingPlanOpsController.java`
- `src/main/java/com/coresolution/core/controller/ops/FeatureFlagOpsController.java`
- `src/main/java/com/coresolution/core/controller/OnboardingController.java`

---

### 2. 백엔드: PricingPlanOpsController CRUD 메서드 추가
**예상 시간**: 1일  
**담당자**: AI Assistant  
**완료일**: 2025-11-20

#### 체크리스트
- [x] `POST /api/v1/ops/plans` - 요금제 생성 ✅
  - [x] Controller 메서드 추가 ✅
  - [x] Service 메서드 추가 (`PricingPlanService.createPlan`) ✅
  - [x] DTO 검증 (`PricingPlanCreateRequest`) ✅
  - [x] plan_code 중복 체크 로직 추가 ✅
  - [x] plan_id UUID 자동 생성 ✅
  - [ ] 테스트 작성 (추후 진행)
- [x] `PUT /api/v1/ops/plans/{planId}` - 요금제 수정 ✅
  - [x] Controller 메서드 추가 ✅
  - [x] Service 메서드 추가 (`PricingPlanService.updatePlan`) ✅
  - [x] DTO 검증 (`PricingPlanUpdateRequest`) ✅
  - [ ] 테스트 작성 (추후 진행)
- [x] `DELETE /api/v1/ops/plans/{planId}` - 요금제 비활성화 ✅
  - [x] Controller 메서드 추가 ✅
  - [x] Service 메서드 추가 (`PricingPlanService.deactivatePlan`) ✅
  - [x] 논리 삭제 처리 (BaseEntity.delete() 메서드 사용) ✅
  - [x] isActive = false 설정 ✅
  - [ ] 테스트 작성 (추후 진행)
- [ ] 통합 테스트 (추후 진행)
  - [ ] CRUD 전체 플로우 테스트
  - [ ] 에러 케이스 테스트 (중복 plan_code, 존재하지 않는 planId 등)

**참고 파일**:
- `src/main/java/com/coresolution/core/controller/ops/PricingPlanOpsController.java`
- `src/main/java/com/coresolution/core/service/ops/PricingPlanService.java`
- `frontend-ops/src/components/pricing/PricingManagement.tsx` (UI는 이미 구현됨)

---

### 3. 프론트엔드: 메인 프론트엔드 온보딩 페이지 구현
**예상 시간**: 2-3일  
**담당자**: AI Assistant  
**완료일**: 2025-11-20

#### 체크리스트
- [x] 폴더 구조 생성 ✅
  - [x] `frontend/src/components/onboarding/` 폴더 생성 ✅
- [x] 온보딩 요청 페이지 (`OnboardingRequest.js`) ✅
  - [x] 테넌트 정보 입력 폼 ✅
    - [x] tenantName 입력 필드 ✅
    - [x] businessType 선택 필드 (백엔드 동적 로드) ✅
    - [x] 연락처 입력 필드 ✅
  - [x] 업종 카테고리 동적 로드 (백엔드 API) ✅
  - [x] 위험도 선택 (공통 코드에서 동적 로드) ✅
    - [x] 공통 코드 API 연동 (`RISK_LEVEL` 코드 그룹) ✅
    - [x] 하드코딩 완전 제거 ✅
  - [x] 요청 제출 API 연동 ✅
    - [x] `POST /api/v1/onboarding/requests` 호출 ✅
    - [x] 성공/실패 처리 ✅
    - [x] 로딩 상태 표시 ✅
  - [x] 비즈니스 로직 분리 (`utils/onboardingService.js`) ✅
  - [x] 상수 분리 (`constants/onboarding.js`) ✅
- [x] 온보딩 상태 조회 페이지 (`OnboardingStatus.js`) ✅
  - [x] 상태별 필터링 (공통 코드에서 동적 로드) ✅
    - [x] `ONBOARDING_STATUS` 코드 그룹에서 동적 로드 ✅
  - [x] 요청 목록 표시 ✅
    - [x] 테넌트명, 요청자, 상태, 요청일시 표시 ✅
  - [x] 요청 상세 정보 조회 ✅
    - [x] `GET /api/v1/onboarding/requests/{id}` 호출 ✅
    - [x] 상세 정보 모달 ✅
  - [x] 하드코딩 완전 제거 ✅
- [x] 라우팅 설정 ✅
  - [x] `/onboarding/request` 라우트 추가 ✅
  - [x] `/onboarding/status` 라우트 추가 ✅
- [x] 스타일링 ✅
  - [x] CSS 파일 분리 (`OnboardingRequest.css`, `OnboardingStatus.css`) ✅
  - [x] 인라인 스타일 제거 ✅
  - [x] 반응형 디자인 ✅

**참고 파일**:
- `frontend-ops/app/onboarding/page.tsx` (참고용)
- `frontend-trinity/utils/api.ts` (API 유틸 참고)

---

### 4. 프론트엔드: Trinity 홈페이지 PG SDK 연동 구조 완성
**예상 시간**: 2-3일  
**담당자**: AI Assistant  
**완료일**: 2025-11-20

#### 체크리스트
- [x] 온보딩 등록 페이지 (`frontend-trinity/app/onboarding/page.tsx`) ✅
  - [x] 테넌트 정보 입력 폼 ✅
    - [x] 회사명 입력 ✅
    - [x] 업종 선택 ✅
    - [x] 연락처 입력 ✅
  - [x] 요금제 선택 UI ✅
    - [x] 실시간 가격 정보 표시 (`GET /api/v1/ops/plans/active`) ✅
    - [x] 요금제 카드 형태로 표시 ✅
    - [x] 선택된 요금제 하이라이트 ✅
  - [x] 온보딩 요청 API 연동 ✅
    - [x] `POST /api/v1/onboarding/requests` 호출 ✅
- [x] PG SDK 연동 구조 완성 ✅ (2025-11-20)
  - [x] `paymentGateway.ts` 유틸리티 생성 ✅
    - [x] PaymentGatewaySdk 인터페이스 정의 ✅
    - [x] TestPaymentGatewaySdk 구현 (테스트 모드) ✅
    - [x] PaymentGatewaySdkFactory 구현 (팩토리 패턴) ✅
    - [x] 토스페이먼츠 SDK 연동 준비 (TODO 주석) ✅
    - [x] Stripe SDK 연동 준비 (TODO 주석) ✅
  - [x] 온보딩 페이지에 PG SDK 통합 ✅
    - [x] 카드 정보 입력 폼 개선 ✅
    - [x] 실시간 토큰 생성 로직 구현 ✅
    - [x] 토큰 검증 로직 구현 ✅
    - [x] 에러 처리 개선 ✅
  - [ ] 실제 PG SDK 설치 및 연동 (추후 구현)
    - [ ] 토스페이먼츠 SDK 설치 (`@tosspayments/payment-sdk`)
    - [ ] 또는 Stripe SDK 설치 (`@stripe/stripe-js`)
    - [ ] 실제 SDK 구현체 작성
    - [ ] 환경 변수 설정 (클라이언트 키 등)
    - [ ] 성공/실패 처리
  - [ ] 등록 완료 페이지
    - [ ] 요청 ID 표시
    - [ ] 상태 조회 링크 제공
- [ ] 스타일링
  - [ ] Trinity 홈페이지 디자인 시스템 적용
  - [ ] 반응형 디자인 (모바일/태블릿/데스크탑)
- [ ] 라우팅 설정
  - [ ] `/onboarding` 라우트 확인

**참고 파일**:
- `frontend-trinity/app/page.tsx` (홈페이지 구조 참고)
- `frontend-trinity/utils/api.ts` (API 유틸 이미 있음)

---

## 📋 P1 - 중간 우선순위

### 5. 동적 대시보드 Phase 3: 테스트 및 검증
**예상 시간**: 1일  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 시스템 재부팅
- [ ] 테스트 체크리스트 사용
  - [ ] `DYNAMIC_DASHBOARD_TEST_CHECKLIST.md` 참조
- [ ] 모든 시나리오 검증
  - [ ] 대시보드 생성
  - [ ] 대시보드 수정
  - [ ] 대시보드 삭제
  - [ ] 역할별 대시보드 조회
- [ ] 에러 케이스 확인
  - [ ] 권한 없는 사용자 접근
  - [ ] 존재하지 않는 대시보드 조회
  - [ ] 잘못된 데이터 입력

---

### 6. 표준화 Phase 1: Controller 표준화
**예상 시간**: 2-3주  
**담당자**: AI Assistant  
**완료일**: [ ]

#### 체크리스트
- [x] TenantRoleController 표준화 ✅
- [x] UserRoleAssignmentController 표준화 ✅
- [x] TenantDashboardController 표준화 ✅
- [x] BillingController 표준화 ✅ (2025-11-20)
  - [x] BaseApiController 상속 ✅
  - [x] ApiResponse 사용 ✅
  - [x] try-catch 제거 ✅
- [x] OnboardingController 표준화 ✅ (2025-11-20)
  - [x] BaseApiController 상속 ✅
  - [x] ApiResponse 사용 ✅
  - [x] try-catch 제거 ✅
  - [x] @PreAuthorize 추가 (일부 엔드포인트) ✅
- [x] BusinessCategoryController 표준화 ✅ (2025-11-20)
  - [x] BaseApiController 상속 ✅
  - [x] ApiResponse 사용 ✅
  - [x] try-catch 제거 ✅
- [ ] 다른 Controller 표준화
  - [ ] ErdController
  - [ ] SubscriptionController
  - [ ] OpsAuthController
  - [ ] Academy 관련 Controller들

---

### 7. 표준화 Phase 2: DTO 표준화 계획 수립
**예상 시간**: 2-3시간  
**담당자**: AI Assistant  
**완료일**: 2025-11-20

#### 체크리스트
- [x] 기존 DTO 파일 식별 ✅
  - [x] `src/main/java/com/coresolution/core/dto/` 폴더 스캔 ✅
  - [x] `src/main/java/com/coresolution/core/controller/dto/` 폴더 스캔 ✅
  - [x] `src/main/java/com/coresolution/consultation/dto/` 폴더 스캔 ✅
  - [x] 기타 DTO 파일 위치 확인 ✅
- [x] DTO 분류 ✅
  - [x] 레거시 DTO (*Dto.java): 14개 ✅
  - [x] Request DTO (*Request.java): 52개 ✅
  - [x] Response DTO (*Response.java): 42개 ✅
  - [x] 공통 DTO (ApiResponse, ErrorResponse) ✅
- [x] 마이그레이션 계획 수립 ✅
  - [x] 우선순위 결정 ✅
  - [x] 마이그레이션 순서 결정 ✅
  - [x] 예상 시간 산정 ✅
- [x] 문서 작성 ✅
  - [x] `DTO_STANDARDIZATION_MIGRATION_PLAN.md` 작성 ✅
  - [x] Phase별 체크리스트 작성 ✅
  - [x] 진행 상황 요약 작성 ✅

**현재 상태**:
- ✅ Phase 2.1-2.4: 완료 (핵심 DTO, 일관성 개선, 나머지 DTO)
- ✅ Phase 2.5: 중복 DTO 정리 완료 (ErrorResponse Deprecated 표시) ✅ (2025-11-20)
- ⏳ Phase 2.3: 명확성 개선 (선택적) - P2

**참고 문서**:
- `docs/mgsb/2025-11-20/DTO_STANDARDIZATION_MIGRATION_PLAN.md`
- `docs/mgsb/2025-11-20/DTO_STANDARDIZATION_ANALYSIS.md`

---

### 7. Trinity 홈페이지 추가 기능 (Phase 5)
**예상 시간**: 1-2주  
**담당자**: [ ]  
**완료일**: [ ]

#### Week 1 체크리스트
- [ ] DNS 및 SSL 설정
  - [ ] `dev.e-trinity.co.kr` 개발 환경 설정
- [x] 회사 소개 페이지 ✅ (2025-11-20)
  - [x] `/about` 페이지 생성 ✅
  - [x] 회사 소개 내용 작성 ✅
  - [x] 비전 및 특징 섹션 추가 ✅
- [x] 서비스 소개 페이지 ✅ (2025-11-20)
  - [x] `/services` 페이지 생성 ✅
  - [x] ERP 시스템, 권한 관리, 쉬운 사용 섹션 추가 ✅
  - [x] 각 서비스별 주요 기능 리스트 추가 ✅
- [x] 반응형 디자인 완성 ✅ (2025-11-20)
  - [x] 모바일 최적화 ✅
    - [x] 모바일 메뉴 버튼 추가 ✅
    - [x] 모바일 네비게이션 스타일 ✅
    - [x] 모바일 폰트 크기 및 간격 조정 ✅
  - [x] 태블릿 최적화 ✅
    - [x] 태블릿 그리드 레이아웃 (2열) ✅
    - [x] 태블릿 폰트 크기 조정 ✅
  - [x] 데스크탑 최적화 ✅
    - [x] 데스크탑 그리드 레이아웃 (3열) ✅
    - [x] 호버 효과 추가 ✅
    - [x] 최대 너비 제한 및 중앙 정렬 ✅
- [x] CoreSolution 브랜딩 적용 ✅ (2025-11-20)
  - [x] 브랜딩 상수 정의 ✅
    - [x] BRANDING 섹션 추가 (CORESOLUTION_NAME, CORESOLUTION_TAGLINE 등) ✅
  - [x] Footer 개선 ✅
    - [x] CoreSolution 설명 추가 ✅
    - [x] "Powered by CoreSolution" 추가 ✅
    - [x] 링크 경로 수정 (페이지 경로로 변경) ✅
  - [x] 메타데이터 강화 ✅
    - [x] OpenGraph 메타데이터 개선 ✅
    - [x] Twitter Card 메타데이터 추가 ✅
    - [x] SEO 키워드 추가 ✅
  - [x] 일관된 브랜딩 메시지 적용 ✅
    - [x] Hero 섹션에 CoreSolution 태그라인 적용 ✅
    - [x] 홈페이지 섹션에 CoreSolution 강조 ✅

#### Week 2 체크리스트
- [x] 결제 수단 토큰 저장 API ✅ (이미 구현됨)
  - [x] `POST /api/v1/billing/payment-methods` 구현 확인 ✅
  - [x] PaymentMethodService 구현 확인 ✅
- [x] 구독 생성 API ✅ (이미 구현됨)
  - [x] `POST /api/v1/billing/subscriptions` 구현 확인 ✅
  - [x] SubscriptionService 구현 확인 ✅
- [x] BillingController 표준화 ✅ (2025-11-20)
  - [x] BaseApiController 상속 ✅
  - [x] ApiResponse 사용 ✅
  - [x] try-catch 제거, GlobalExceptionHandler에 위임 ✅
  - [x] @Valid 어노테이션 추가 ✅
- [ ] PG 연동
  - [ ] 토스페이먼츠 또는 Stripe 선택
  - [ ] 실제 PG SDK 연동 (현재는 테스트 모드)
  - [ ] 토큰화 기반 구현
- [ ] 결제 프로세스 구현
- [ ] 실시간 과금 연동
- [ ] 내부 시스템 선택적 인증 및 ERP 자동 구성 연계

---

## 📝 P2 - 낮은 우선순위

### 8. 표준화 Phase 3-6
**예상 시간**: 3-4주  
**담당자**: [ ]  
**완료일**: [ ]

#### Phase 3: 권한 관리 표준화 (1-2주)
- [ ] DynamicPermissionService 표준화
- [ ] SecurityUtils, PermissionCheckUtils 통합
- [ ] 도메인별 권한 서비스 표준화

#### Phase 4: API 경로 표준화
- [ ] API 경로 규칙 정의
- [ ] 기존 API 경로 마이그레이션

#### Phase 5: 서비스 레이어 표준화
- [ ] 서비스 인터페이스 표준화
- [ ] 서비스 구현체 표준화

#### Phase 6: 로깅 표준화
- [ ] 로깅 규칙 정의
- [ ] 기존 로깅 마이그레이션

---

### 9. 동적 대시보드 Phase 4: 성능 최적화
**예상 시간**: 1주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 대시보드 정보 캐싱
  - [ ] Redis 또는 메모리 캐시 적용
  - [ ] 캐시 무효화 전략 수립
- [ ] 컴포넌트 지연 로딩
  - [ ] React.lazy 적용
  - [ ] 코드 스플리팅

---

### 10. Phase 6: 권한 확장 시스템 특화
**예상 시간**: 2주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 업종별 권한 템플릿 확장
- [ ] ABAC 정책 확장
- [ ] 권한 관리 UI/UX 개선
- [ ] 권한 감사 및 로깅

---

### 11. Phase 7: ERP 시스템 특화 및 고도화 ⭐ 핵심 특화 영역
**예상 시간**: 19주 (Phase 1-6)  
**담당자**: [ ]  
**완료일**: [ ]  
**참고**: 
- `ERP_ADVANCEMENT_PLAN.md` - 전체 ERP 고도화 계획
- `ERP_CURRENT_STATUS_AND_ADVANCEMENT.md` - 현재 상태 분석 및 고도화 계획
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화 계획
- `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 7

#### Phase 1: 회계 관리 고도화 (4주)

**Week 1-2: 계정과목 및 분개 시스템**
- [ ] 계정과목 마스터 관리
  - [ ] 계정과목 코드 체계 설계
  - [ ] 계정과목 CRUD API (`/api/erp/accounts`)
  - [ ] 계정과목 계층 구조 관리
- [ ] 분개 (Journal Entry) 시스템
  - [ ] AccountingEntry 엔티티 확장
    - [ ] entry_number 필드 추가
    - [ ] entry_date 필드 추가
    - [ ] total_debit, total_credit 필드 추가
    - [ ] entry_status 필드 추가 (DRAFT, APPROVED, POSTED)
  - [ ] 분개 상세 테이블 생성 (erp_journal_entry_lines)
  - [ ] 분개 CRUD API (`/api/erp/journal-entries`)
  - [ ] 차변/대변 자동 검증 로직
  - [ ] 분개 승인 프로세스 (`/api/erp/journal-entries/{id}/approve`)
  - [ ] 분개 전기 기능 (`/api/erp/journal-entries/{id}/post`)
  - [ ] PL/SQL 프로시저 작성
    - [ ] `CreateJournalEntry`
    - [ ] `AddJournalEntryLine`
    - [ ] `ValidateJournalEntry`
    - [ ] `ApproveAndPostJournalEntry`

**Week 3-4: 원장 및 재무제표**
- [ ] 원장 (Ledger) 시스템
  - [ ] 원장 테이블 생성 (erp_ledgers)
  - [ ] 원장 자동 생성 로직 (분개 전기 시)
  - [ ] 계정별 원장 조회 API (`/api/erp/ledgers/{accountId}`)
  - [ ] 기간별 원장 조회 API
  - [ ] 잔액 계산 로직
  - [ ] PL/SQL 프로시저 작성
    - [ ] `GenerateLedgerFromJournalEntry`
    - [ ] `GetAccountLedger`
- [ ] 재무제표 생성
  - [ ] 손익계산서 생성 로직 (`/api/erp/financial-statements/income`)
  - [ ] 재무상태표 생성 로직 (`/api/erp/financial-statements/balance`)
  - [ ] 현금흐름표 생성 로직 (`/api/erp/financial-statements/cashflow`)
  - [ ] 재무제표 조회 API
  - [ ] PL/SQL 프로시저 작성
    - [ ] `GenerateIncomeStatement`
    - [ ] `GenerateBalanceSheet`
    - [ ] `GenerateCashFlowStatement`
- [ ] 결산 처리
  - [ ] 월별 결산 로직 (`/api/erp/period-close/monthly`)
  - [ ] 연도별 결산 로직 (`/api/erp/period-close/yearly`)
  - [ ] 이월 처리 로직

#### Phase 2: 세무 관리 시스템 (3주)

**Week 1: 부가세 관리**
- [ ] 부가세 계산 로직
  - [ ] 공급가액/부가세 자동 계산
  - [ ] 세율 관리 (10%, 0% 등)
  - [ ] 부가세 신고 테이블 생성 (erp_vat_returns)
  - [ ] PL/SQL 프로시저 작성
    - [ ] `CalculateVatForPeriod`
    - [ ] `GenerateVatReturn`
- [ ] 부가세 신고서 생성
  - [ ] 매출세액 계산서
  - [ ] 매입세액 계산서
  - [ ] 부가세 신고서 양식 생성
  - [ ] 부가세 신고서 조회 API (`/api/erp/vat-returns`)
  - [ ] 부가세 신고서 제출 API (`/api/erp/vat-returns/{id}/submit`)

**Week 2: 전자세금계산서**
- [ ] 전자세금계산서 발행
  - [ ] 전자세금계산서 테이블 생성 (erp_electronic_tax_invoices)
  - [ ] 국세청 전자세금계산서 API 연동
  - [ ] 세금계산서 발행 API (`/api/erp/tax-invoices`)
  - [ ] 세금계산서 수정/취소 API
  - [ ] Java 서비스: TaxInvoiceService (외부 API 연동)
- [ ] 전자세금계산서 수신
  - [ ] 매입 세금계산서 수신
  - [ ] 세금계산서 검증

**Week 3: 원천징수 및 연말정산**
- [ ] 원천징수 관리
  - [ ] 원천징수 계산
  - [ ] 원천징수 영수증 발급
  - [ ] 원천징수 조회 API (`/api/erp/withholding-tax`)
- [ ] 연말정산 처리
  - [ ] 소득공제 계산
  - [ ] 연말정산 신고서 생성
  - [ ] 연말정산 처리 API (`/api/erp/year-end-settlement`)

#### Phase 3: 인사 관리 시스템 (4주)

**Week 1-2: 직원 관리**
- [ ] 직원 정보 관리
  - [ ] 직원 테이블 생성 (erp_employees)
  - [ ] 직원 등록/수정/삭제 API (`/api/erp/employees`)
  - [ ] 직원 프로필 관리
  - [ ] 조직도 관리
  - [ ] Java 서비스: EmployeeService (CRUD)
- [ ] 근태 관리
  - [ ] 근태 기록 테이블 생성 (erp_attendance_records)
  - [ ] 출퇴근 기록 API (`/api/erp/attendance`)
  - [ ] 근무 시간 계산 로직
  - [ ] 초과근무 관리
  - [ ] PL/SQL 프로시저 작성
    - [ ] `RecordAttendance`
    - [ ] `GetAttendanceStatistics`
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
  - [ ] 급여 지급 API (`/api/erp/payrolls/{id}/pay`)
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
  - [ ] 정산 규칙 API (`/api/erp/settlement-rules`)
- [ ] 정산 자동 계산
  - [ ] 배치 작업으로 정산 계산
  - [ ] 정산 결과 검증
  - [ ] PL/SQL 프로시저: `CalculateSettlement`
  - [ ] 배치 스케줄러: `SettlementBatchScheduler` 생성
  - [ ] 정산 계산 API (`/api/erp/settlements/calculate`)

**Week 3: 정산 리포트 및 승인**
- [ ] 정산 리포트 생성
  - [ ] 정산 내역 리포트
  - [ ] 정산 요약 리포트
  - [ ] 정산 리포트 조회 API (`/api/erp/settlements/reports`)
- [ ] 정산 승인 프로세스
  - [ ] 정산 승인 워크플로우
  - [ ] 정산 승인 이력
  - [ ] 정산 승인 API (`/api/erp/settlements/{id}/approve`)
  - [ ] 정산 지급 API (`/api/erp/settlements/{id}/pay`)

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

### 12. Phase 8: 브랜딩 시스템 구현
**예상 시간**: 1주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 로고 업로드 및 관리 API
- [ ] 상호(회사명) 관리
- [ ] 브랜딩 정보 저장 (branding_json)
- [ ] 헤더에 로고 및 상호 표시 (모든 페이지)
- [ ] 대시보드에 로고 및 상호 표시
- [ ] Fallback 로직 구현 (코어시스템 로고/상호로 대체)
- [ ] 브랜딩 커스터마이징 UI

---

### 13. Phase 9: 사용성 강화 및 모바일 앱 준비
**예상 시간**: 2주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 사용성 테스트 (실제 소상공인 대상)
- [ ] 자동화 검증 (입력 최소화 확인)
- [ ] 모바일 반응형 UI 완성
- [ ] 모바일 앱 개발 환경 구축
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 벤치마크
- [ ] 문서화

---

## 📊 진행 상황 요약

### P0 (즉시 조치 필요)
- [ ] 1. 백엔드: Ops 포털 인증/권한 강화 (0.5일)
- [ ] 2. 백엔드: PricingPlanOpsController CRUD 추가 (1일)
- [ ] 3. 프론트엔드: 메인 프론트엔드 온보딩 페이지 (2-3일)
- [ ] 4. 프론트엔드: Trinity 홈페이지 온보딩 등록 페이지 (2-3일)

**P0 총 예상 시간**: 약 6-7일

### P1 (중간 우선순위)
- [ ] 5. 동적 대시보드 Phase 3: 테스트 및 검증 (1일)
- [ ] 6. DTO 표준화 계획 수립 (2-3시간)
- [ ] 7. Trinity 홈페이지 추가 기능 (1-2주)

### P2 (낮은 우선순위)
- [ ] 8. 표준화 Phase 3-6 (3-4주)
- [ ] 9. 동적 대시보드 Phase 4: 성능 최적화 (1주)
- [ ] 10. 권한 확장 시스템 특화 (2주)
- [ ] 11. ERP 시스템 특화 및 고도화 (3주)
- [ ] 12. 브랜딩 시스템 구현 (1주)
- [ ] 13. 사용성 강화 및 모바일 앱 준비 (2주)

---

**마지막 업데이트**: 2025-11-20  
**다음 리뷰 예정일**: 2025-11-27 (주간 회의)

