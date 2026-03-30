# API 경로 마이그레이션 체크리스트

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 백엔드 마이그레이션 완료

---

## 📋 개요

이 문서는 API 경로 표준화 작업의 완료 상태를 추적하는 체크리스트입니다.

---

## ✅ 백엔드 마이그레이션 완료 현황

### Phase 4.1: 핵심 API ✅ 완료

- [x] AuthController: `/api/auth` → `/api/v1/auth`
- [x] OAuth2Controller: `/api/auth` → `/api/v1/auth`
- [x] UserController: `/api/users` → `/api/v1/users`
- [x] UserProfileController: `/api/user/profile` → `/api/v1/users/profile`
- [x] UserAddressController: `/api/client/addresses` → `/api/v1/users/addresses`
- [x] MenuController: `/api/menu` → `/api/v1/menu`
- [x] PermissionManagementController: `/api/permissions` → `/api/v1/permissions`
- [x] ConsultationMessageController: `/api/consultation-messages` → `/api/v1/consultation-messages`
- [x] ConsultantRatingController: `/api/ratings` → `/api/v1/ratings`
- [x] ConsultantAvailabilityController: `/api/consultant` → `/api/v1/consultants/availability`
- [x] ScheduleController: `/api/schedules` → `/api/v1/schedules`
- [x] BranchController: `/api/branches` → `/api/v1/branches`
- [x] BranchManagementController: `/api/hq/branch-management` → `/api/v1/hq/branch-management`

**완료**: 13개 컨트롤러

---

### Phase 4.2: 관리자 API ✅ 완료

- [x] AdminController: `/api/admin` → `/api/v1/admin`
- [x] StatisticsController: `/api/admin/statistics` → `/api/v1/admin/statistics`
- [x] StatisticsManagementController: `/api/admin/statistics-management` → `/api/v1/admin/statistics-management`
- [x] AmountManagementController: `/api/admin/amount-management` → `/api/v1/admin/amount-management`
- [x] SystemConfigController: `/api/admin/system-config` → `/api/v1/admin/system-config`
- [x] SystemToolsController: `/api/admin` → `/api/v1/admin/system-tools`
- [x] SystemMonitoringController: `/api/admin/monitoring` → `/api/v1/admin/monitoring`
- [x] SalaryManagementController: `/api/admin/salary` → `/api/v1/admin/salary`
- [x] SalaryBatchController: `/api/admin/salary-batch` → `/api/v1/admin/salary-batch`
- [x] SalaryConfigController: `/api/admin/salary-config` → `/api/v1/admin/salary-config`
- [x] CssThemeController: `/api/admin/css-themes` → `/api/v1/admin/css-themes`
- [x] SessionExtensionController: `/api/admin/session-extensions` → `/api/v1/admin/session-extensions`
- [x] ConsultationRecordAlertController: `/api/admin/consultation-record-alerts` → `/api/v1/admin/consultation-record-alerts`
- [x] DatabaseFixController: `/api/admin/database` → `/api/v1/admin/database`
- [x] PersonalDataDestructionController: `/api/admin/personal-data-destruction` → `/api/v1/admin/personal-data-destruction`
- [x] WorkflowAutomationController: `/api/admin/workflow` → `/api/v1/admin/workflow`

**완료**: 16개 컨트롤러

---

### Phase 4.3: ERP/회계 API ✅ 완료

- [x] ErpController: `/api/erp` → `/api/v1/erp`
- [x] HQErpController: `/api/hq/erp` → `/api/v1/hq/erp`
- [x] AccountController: `/api/accounts` → `/api/v1/accounts`
- [x] AccountIntegrationController: `/api/account-integration` → `/api/v1/accounts/integration`
- [x] PaymentController: `/api/payments` → `/api/v1/payments`
- [x] DiscountController: `/api/admin/discounts` → `/api/v1/admin/discounts`
- [x] PlSqlAccountingController: `/api/admin/plsql-accounting` → `/api/v1/admin/plsql-accounting`
- [x] PlSqlDiscountAccountingController: `/api/admin/plsql-discount-accounting` → `/api/v1/admin/plsql-discount-accounting`
- [x] PlSqlMappingSyncController: `/api/admin/plsql-mapping-sync` → `/api/v1/admin/plsql-mapping-sync`
- [x] DiscountAccountingController: `/api/admin/discount-accounting` → `/api/v1/admin/discount-accounting`

**완료**: 10개 컨트롤러

---

### Phase 4.4: 클라이언트/상담사 API ✅ 완료

- [x] ClientSettingsController: `/api/client` → `/api/v1/clients`
- [x] ClientProfileController: `/api/client/profile` → `/api/v1/clients/profile`
- [x] ClientSocialAccountController: `/api/client` → `/api/v1/clients/social-accounts`
- [x] ConsultantRecordsController: `/api/consultant` → `/api/v1/admin/consultant-records`

**완료**: 4개 컨트롤러

---

### Phase 4.5: 기타 기능 API ✅ 완료

- [x] SmsAuthController: `/api/sms-auth` → `/api/v1/auth/sms`
- [x] PasswordResetController: `/api/password-reset` → `/api/v1/auth/password-reset`
- [x] PasswordManagementController: `/api/password` → `/api/v1/auth/password`
- [x] MotivationController: `/api/motivation` → `/api/v1/motivation`
- [x] PrivacyConsentController: `/api/privacy-consent` → `/api/v1/privacy-consent`
- [x] HealingContentController: `/api/healing` → `/api/v1/healing`
- [x] ActivityController: `/api/activities` → `/api/v1/activities`
- [x] SystemNotificationController: `/api/system-notifications` → `/api/v1/system-notifications`
- [x] HQBranchController: `/api/hq` → `/api/v1/hq`
- [x] LocalTestController: `/api/local-test` → `/api/v1/test/local`
- [x] PaymentTestController: `/api/test/payment` → `/api/v1/test/payment`

**완료**: 11개 컨트롤러

---

## 📊 전체 완료 현황

**총 완료**: 54개 컨트롤러

```
Phase 4.1: ████████████████████ 100% ✅ (13개)
Phase 4.2: ████████████████████ 100% ✅ (16개)
Phase 4.3: ████████████████████ 100% ✅ (10개)
Phase 4.4: ████████████████████ 100% ✅ (4개)
Phase 4.5: ████████████████████ 100% ✅ (11개)

전체 백엔드: ████████████████████ 100% ✅ (54개)
```

---

## ⏳ 프론트엔드 마이그레이션 (예정)

### 우선순위 1: 핵심 API

- [ ] 인증 API (`/api/auth` → `/api/v1/auth`)
- [ ] 사용자 API (`/api/users` → `/api/v1/users`)
- [ ] 메뉴 API (`/api/menu` → `/api/v1/menu`)
- [ ] 일정 API (`/api/schedules` → `/api/v1/schedules`)

### 우선순위 2: 관리자 API

- [ ] 관리자 대시보드 API
- [ ] 통계 API
- [ ] 시스템 설정 API

### 우선순위 3: 기타 API

- [ ] 상담 관련 API
- [ ] ERP/회계 API
- [ ] 클라이언트/상담사 API

---

## 📝 문서화 작업

- [x] API 경로 표준화 계획 문서 작성
- [x] API 경로 마이그레이션 가이드 작성
- [x] 마이그레이션 체크리스트 작성
- [ ] Swagger/OpenAPI 문서 업데이트 (선택적)
- [ ] 프론트엔드 마이그레이션 가이드 배포

---

## 🔗 관련 문서

- [API 경로 표준화 계획](./API_PATH_STANDARDIZATION_PLAN.md)
- [API 경로 마이그레이션 가이드](./API_PATH_MIGRATION_GUIDE.md)
- [CoreSolution 표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)

---

**마지막 업데이트**: 2025-11-20

