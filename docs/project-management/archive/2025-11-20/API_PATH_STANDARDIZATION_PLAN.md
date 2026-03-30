# API 경로 표준화 계획

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 계획 수립 중

---

## 📋 개요

현재 CoreSolution의 API 경로는 일관성이 없습니다. 일부는 `/api/v1/`을 사용하고, 일부는 `/api/`만 사용합니다. 이를 `/api/v1/`로 통일하여:

1. API 버전 관리 체계 확립
2. 하위 호환성 보장 (v2, v3 등 확장 가능)
3. 프론트엔드/모바일 앱과의 통합 용이성 향상
4. API 문서화 및 테스트 자동화 용이

---

## 🔍 현재 상태 분석

### 이미 `/api/v1/`을 사용하는 컨트롤러 (5개)

1. **CommonCodeController**: `/api/v1/common-codes` ✅
2. **ConsultationController**: `/api/v1/consultations` ✅
3. **ConsultantController**: `/api/v1/consultants` ✅
4. **OnboardingController**: `/api/v1/onboarding` ✅
5. **BillingController**: `/api/v1/billing` ✅

### `/api/`만 사용하는 컨트롤러 (약 70개)

#### 인증 관련 (5개)
- `AuthController`: `/api/auth`
- `OAuth2Controller`: `/api/auth`
- `SocialAuthController`: `/api/auth/social`
- `PasskeyController`: `/api/auth/passkey`
- `MultiTenantController`: `/api/auth/tenant`

#### 사용자 관련 (5개)
- `UserController`: `/api/users`
- `UserProfileController`: `/api/user/profile`
- `UserAddressController`: `/api/client/addresses`
- `AdminUserController`: `/api/admin/user-management`
- `PasswordResetController`: `/api/password-reset`
- `PasswordManagementController`: `/api/password`

#### 메뉴/권한 관련 (3개)
- `MenuController`: `/api/menu`
- `PermissionManagementController`: `/api/permissions`

#### 클라이언트 관련 (3개)
- `ClientSettingsController`: `/api/client`
- `ClientProfileController`: `/api/client/profile`
- `ClientDashboardController`: `/api/client/dashboard`

#### 상담 관련 (3개)
- `ConsultationMessageController`: `/api/consultation-messages`
- `ConsultantRatingController`: `/api/ratings`
- `ConsultantAvailabilityController`: `/api/consultant-availability`

#### 관리자 관련 (15개)
- `AdminController`: `/api/admin`
- `SimpleAdminController`: `/api/admin`
- `StatisticsController`: `/api/admin/statistics`
- `StatisticsManagementController`: `/api/admin/statistics-management`
- `AmountManagementController`: `/api/admin/amount-management`
- `CssThemeController`: `/api/admin/css-themes`
- `SessionExtensionController`: `/api/admin/session-extensions`
- `ConsultationRecordAlertController`: `/api/admin/consultation-record-alerts`
- `DatabaseFixController`: `/api/admin/database`
- `PlSqlAccountingController`: `/api/admin/plsql-accounting`
- `PlSqlDiscountAccountingController`: `/api/admin/plsql-discount-accounting`
- `PersonalDataDestructionController`: `/api/admin/personal-data-destruction`
- `DiscountAccountingController`: `/api/admin/discount-accounting`
- `SystemToolsController`: `/api/admin`
- `SalaryManagementController`: `/api/admin/salary`
- `SystemConfigController`: `/api/admin/system-config`
- `PlSqlMappingSyncController`: `/api/admin/plsql-mapping-sync`
- `WorkflowAutomationController`: `/api/admin/workflow`
- `SalaryBatchController`: `/api/admin/salary-batch`
- `SalaryConfigController`: `/api/admin/salary-config`

#### 본사 관련 (2개)
- `HQBranchController`: `/api/hq`
- `HQErpController`: `/api/hq/erp`

#### ERP/회계 관련 (5개)
- `ErpController`: `/api/erp`
- `AccountController`: `/api/accounts`
- `AccountIntegrationController`: `/api/account-integration`
- `PaymentController`: `/api/payments`
- `DiscountController`: `/api/discount`

#### 일정 관련 (1개)
- `ScheduleController`: `/api/schedules`

#### 기타 기능 (10개)
- `SmsAuthController`: `/api/sms-auth`
- `MotivationController`: `/api/motivation`
- `PrivacyConsentController`: `/api/privacy-consent`
- `HealingContentController`: `/api/healing`
- `ActivityController`: `/api/activities`
- `SystemNotificationController`: `/api/system-notifications`
- `BackupStatusController`: `/api/admin/backup-status`
- `PhoneMigrationController`: `/api/admin/phone-migration`
- `ComplianceController`: `/api/admin/compliance`
- `ClientSocialAccountController`: `/api/client/social-accounts`
- `PersonalDataRequestController`: `/api/admin/personal-data-request`
- `WellnessAdminController`: `/api/admin/wellness`
- `SystemMonitoringController`: `/api/admin/monitoring`
- `SuperAdminController`: `/api/admin/super`
- `SessionSyncController`: `/api/admin/session-sync`
- `TestDataController`: `/api/admin/test-data`
- `ConsultantRecordsController`: `/api/admin/consultant-records`
- `BusinessTimeController`: `/api/admin/business-time`
- `BranchController`: `/api/branches`
- `BranchManagementController`: `/api/admin/branches`

#### 테스트/개발용 (2개)
- `LocalTestController`: `/api/local-test`
- `PaymentTestController`: `/api/test/payment`

---

## 🎯 표준화 목표

### 1. API 경로 규칙

**표준 형식**: `/api/v1/{resource}`

**예시**:
- `/api/users` → `/api/v1/users`
- `/api/admin/statistics` → `/api/v1/admin/statistics`
- `/api/client/profile` → `/api/v1/client/profile`

### 2. 예외 사항

**인증 관련 API는 `/api/auth` 유지** (보안상 버전 노출 최소화):
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/tenant/switch`

**하위 호환성을 위한 레거시 경로 유지**:
- 기존 경로는 `@Deprecated` 표시
- 레거시 경로에서 새 경로로 리다이렉트 또는 동일한 핸들러 매핑

---

## 📝 마이그레이션 전략

### Phase 4.1: 핵심 API 마이그레이션 ✅ 완료 (2025-11-20)

**대상**: 자주 사용되는 핵심 API (13개)

1. **인증 관련** (하위 호환성 유지) ✅
   - `AuthController`: `/api/auth` → `/api/v1/auth` (레거시 경로 유지) ✅
   - `OAuth2Controller`: `/api/auth` → `/api/v1/auth` (레거시 경로 유지) ✅

2. **사용자 관련** ✅
   - `UserController`: `/api/users` → `/api/v1/users` ✅
   - `UserProfileController`: `/api/user/profile` → `/api/v1/users/profile` ✅
   - `UserAddressController`: `/api/client/addresses` → `/api/v1/users/addresses` ✅

3. **메뉴/권한** ✅
   - `MenuController`: `/api/menu` → `/api/v1/menu` ✅
   - `PermissionManagementController`: `/api/permissions` → `/api/v1/permissions` ✅

4. **상담 관련** ✅
   - `ConsultationMessageController`: `/api/consultation-messages` → `/api/v1/consultation-messages` ✅
   - `ConsultantRatingController`: `/api/ratings` → `/api/v1/ratings` ✅
   - `ConsultantAvailabilityController`: `/api/consultant` → `/api/v1/consultants/availability` ✅

5. **일정 관련** ✅
   - `ScheduleController`: `/api/schedules` → `/api/v1/schedules` ✅

6. **지점 관련** ✅
   - `BranchController`: `/api/branches` → `/api/v1/branches` ✅
   - `BranchManagementController`: `/api/hq/branch-management` → `/api/v1/hq/branch-management` ✅

**완료 시간**: 약 30분

**구현 방식**: 
- Spring의 `@RequestMapping` 배열 기능을 사용하여 새 경로와 레거시 경로 모두 지원
- 하위 호환성 유지 (기존 경로도 계속 동작)

---

### Phase 4.2: 관리자 API 마이그레이션 ✅ 완료 (2025-11-20)

**대상**: Admin 관련 API (16개)

1. **통계/관리** ✅
   - `AdminController`: `/api/admin` → `/api/v1/admin` ✅
   - `StatisticsController`: `/api/admin/statistics` → `/api/v1/admin/statistics` ✅
   - `StatisticsManagementController`: `/api/admin/statistics-management` → `/api/v1/admin/statistics-management` ✅
   - `AmountManagementController`: `/api/admin/amount-management` → `/api/v1/admin/amount-management` ✅

2. **시스템 관리** ✅
   - `SystemConfigController`: `/api/admin/system-config` → `/api/v1/admin/system-config` ✅
   - `SystemToolsController`: `/api/admin` → `/api/v1/admin/system-tools` ✅
   - `SystemMonitoringController`: `/api/admin/monitoring` → `/api/v1/admin/monitoring` ✅

3. **급여 관리** ✅
   - `SalaryManagementController`: `/api/admin/salary` → `/api/v1/admin/salary` ✅
   - `SalaryBatchController`: `/api/admin/salary-batch` → `/api/v1/admin/salary-batch` ✅
   - `SalaryConfigController`: `/api/admin/salary-config` → `/api/v1/admin/salary-config` ✅

4. **기타 관리자 기능** ✅
   - `CssThemeController`: `/api/admin/css-themes` → `/api/v1/admin/css-themes` ✅
   - `SessionExtensionController`: `/api/admin/session-extensions` → `/api/v1/admin/session-extensions` ✅
   - `ConsultationRecordAlertController`: `/api/admin/consultation-record-alerts` → `/api/v1/admin/consultation-record-alerts` ✅
   - `DatabaseFixController`: `/api/admin/database` → `/api/v1/admin/database` ✅
   - `PersonalDataDestructionController`: `/api/admin/personal-data-destruction` → `/api/v1/admin/personal-data-destruction` ✅
   - `WorkflowAutomationController`: `/api/admin/workflow` → `/api/v1/admin/workflow` ✅

**완료 시간**: 약 20분

**구현 방식**: Spring의 `@RequestMapping` 배열 기능을 사용하여 새 경로와 레거시 경로 모두 지원

---

### Phase 4.3: ERP/회계 API 마이그레이션 ✅ 완료 (2025-11-20)

**대상**: ERP 및 회계 관련 API (10개)

1. **ERP** ✅
   - `ErpController`: `/api/erp` → `/api/v1/erp` ✅
   - `HQErpController`: `/api/hq/erp` → `/api/v1/hq/erp` ✅

2. **회계** ✅
   - `AccountController`: `/api/accounts` → `/api/v1/accounts` ✅
   - `AccountIntegrationController`: `/api/account-integration` → `/api/v1/accounts/integration` ✅
   - `PaymentController`: `/api/payments` → `/api/v1/payments` ✅
   - `DiscountController`: `/api/admin/discounts` → `/api/v1/admin/discounts` ✅

3. **PL/SQL 회계** ✅
   - `PlSqlAccountingController`: `/api/admin/plsql-accounting` → `/api/v1/admin/plsql-accounting` ✅
   - `PlSqlDiscountAccountingController`: `/api/admin/plsql-discount-accounting` → `/api/v1/admin/plsql-discount-accounting` ✅
   - `PlSqlMappingSyncController`: `/api/admin/plsql-mapping-sync` → `/api/v1/admin/plsql-mapping-sync` ✅
   - `DiscountAccountingController`: `/api/admin/discount-accounting` → `/api/v1/admin/discount-accounting` ✅

**완료 시간**: 약 15분

**구현 방식**: Spring의 `@RequestMapping` 배열 기능을 사용하여 새 경로와 레거시 경로 모두 지원

---

### Phase 4.4: 클라이언트/상담사 API 마이그레이션 ✅ 완료 (2025-11-20)

**대상**: 클라이언트 및 상담사 관련 API (4개)

1. **클라이언트** ✅
   - `ClientSettingsController`: `/api/client` → `/api/v1/clients` ✅
   - `ClientProfileController`: `/api/client/profile` → `/api/v1/clients/profile` ✅
   - `ClientSocialAccountController`: `/api/client` → `/api/v1/clients/social-accounts` ✅
   - `ClientDashboardController`: `/tablet/client` (Thymeleaf 뷰 컨트롤러, API 마이그레이션 대상 아님)

2. **상담사** ✅
   - `ConsultantController`: 이미 `/api/v1/consultants` ✅ (Phase 4.1에서 확인됨)
   - `ConsultantAvailabilityController`: 이미 `/api/v1/consultants/availability` ✅ (Phase 4.1에서 완료)
   - `ConsultantRecordsController`: `/api/consultant` → `/api/v1/admin/consultant-records` ✅

**완료 시간**: 약 10분

**구현 방식**: Spring의 `@RequestMapping` 배열 기능을 사용하여 새 경로와 레거시 경로 모두 지원

---

### Phase 4.5: 기타 기능 API 마이그레이션 ✅ 완료 (2025-11-20)

**대상**: 나머지 기능 API (10개)

1. **인증/보안** ✅
   - `SmsAuthController`: `/api/sms-auth` → `/api/v1/auth/sms` ✅
   - `PasswordResetController`: `/api/password-reset` → `/api/v1/auth/password-reset` ✅
   - `PasswordManagementController`: `/api/password` → `/api/v1/auth/password` ✅

2. **기능** ✅
   - `MotivationController`: `/api/motivation` → `/api/v1/motivation` ✅
   - `PrivacyConsentController`: `/api/privacy-consent` → `/api/v1/privacy-consent` ✅
   - `HealingContentController`: `/api/healing` → `/api/v1/healing` ✅
   - `ActivityController`: `/api/activities` → `/api/v1/activities` ✅
   - `SystemNotificationController`: `/api/system-notifications` → `/api/v1/system-notifications` ✅

3. **본사** ✅
   - `HQBranchController`: `/api/hq` → `/api/v1/hq` ✅

4. **개발/테스트** ✅
   - `LocalTestController`: `/api/local-test` → `/api/v1/test/local` (개발 환경만) ✅
   - `PaymentTestController`: `/api/test/payment` → `/api/v1/test/payment` (개발 환경만) ✅

**완료 시간**: 약 15분

**구현 방식**: Spring의 `@RequestMapping` 배열 기능을 사용하여 새 경로와 레거시 경로 모두 지원

---

### Phase 4.6: 하위 호환성 및 문서화 ✅ 완료 (2025-11-20)

**작업**:
1. ✅ 레거시 경로에서 새 경로로 동일한 핸들러 매핑 (Spring `@RequestMapping` 배열 사용)
2. ✅ API 마이그레이션 가이드 문서 작성 (`API_PATH_MIGRATION_GUIDE.md`)
3. ✅ 마이그레이션 체크리스트 작성 (`API_PATH_MIGRATION_CHECKLIST.md`)
4. ⏳ API 문서 업데이트 (Swagger/OpenAPI) - 선택적, 향후 진행
5. ✅ 프론트엔드 API 호출 경로 업데이트 가이드 작성 (마이그레이션 가이드에 포함)

**완료 시간**: 약 30분

**구현 방식**: 
- Spring의 `@RequestMapping` 배열 기능으로 하위 호환성 자동 유지
- 레거시 경로는 최소 6개월간 유지 예정
- 프론트엔드는 점진적 마이그레이션 권장

---

## 📊 전체 일정

```
Phase 4.1: ████████████████████ 100% ✅ (핵심 API - 완료)
Phase 4.2: ████████████████████ 100% ✅ (관리자 API - 완료)
Phase 4.3: ████████████████████ 100% ✅ (ERP/회계 API - 완료)
Phase 4.4: ████████████████████ 100% ✅ (클라이언트/상담사 API - 완료)
Phase 4.5: ████████████████████ 100% ✅ (기타 기능 API - 완료)
Phase 4.6: ████████████████████ 100% ✅ (하위 호환성 및 문서화 - 완료)

전체 Phase 4: ████████████████████ 100% ✅ 완료
```

---

## ⚠️ 주의사항

### 1. 하위 호환성 유지

- 기존 경로는 최소 6개월간 유지
- 레거시 경로에 `@Deprecated` 표시
- 레거시 경로에서 새 경로로 리다이렉트 또는 동일한 핸들러 매핑

### 2. 프론트엔드 영향

- 프론트엔드 API 호출 경로 업데이트 필요
- 점진적 마이그레이션 (컴포넌트별로 순차 업데이트)

### 3. 모바일 앱 영향

- 모바일 앱 API 호출 경로 업데이트 필요
- 앱 버전별 하위 호환성 고려

### 4. 테스트

- 각 Phase 완료 후 통합 테스트 필수
- 레거시 경로 동작 확인 필수

---

## 🔗 관련 문서

- [CoreSolution 표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)
- [API 응답 표준화](./API_RESPONSE_STANDARDIZATION.md) (작성 예정)

---

**마지막 업데이트**: 2025-11-20

