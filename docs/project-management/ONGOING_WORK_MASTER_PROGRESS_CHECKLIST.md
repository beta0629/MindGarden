# 진행 중 작업 — 마스터 진행도 체크리스트 (SSOT)

**목적**: 여러 트랙(ERP·공통 UI·보안·검증)이 동시에 진행될 때 **일이 끝나지 않는 느낌**을 줄이고, **전체에서 진행도를 한곳**에서 파악한다.  
**갱신 주기**: 배치(또는 PR)가 끝날 때마다 담당자가 이 문서만 갱신한다. (세부 설계는 각 전용 문서에 둔다.)

**최종 갱신**: 2026-04-11 (UI-02 2차 일부·UnifiedModal)  
**주관**: core-planner(오케스트레이션) — 구현은 `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`·위임 순서 준수.

---

## 병렬 블록 배치 (현재 스프린트)

**원칙**: 파일 충돌을 막기 위해 **한 블록 = 담당 파일 집합이 겹치지 않게** 나눈다. 배치가 끝나면 아래 표와 구역 1 표를 갱신한다.

| 블록 ID | 범위 (파일·주제) | 담당 | 상태 | 비고 |
|---------|------------------|------|------|------|
| **ERP-B1** | `ErpDashboard.js`, `IntegratedFinanceDashboard.js`, `FinancialCalendarView.js` — 무음 새로고침 트리거를 `MGButton` `loading` 패턴으로 통일 | core-coder | ☑ | `develop` · `68fbd5dfd` (2026-04-11) |
| **ERP-B2** | `ItemManagement.js`, `BudgetManagement.js`, `PurchaseManagement.js` — 무음 재조회 트리거를 `MGButton` `loading`/`loadingText` 패턴으로 통일 | core-coder | ☑ | 동일 커밋 |
| **ERP-B3** | `ImprovedTaxManagement.js`; 환불·승인(`RefundFilters.js`, `RefundFilterBlock.js`, `ApprovalHubLayout.js`) — 무음 새로고침 `MGButton` 통일 | core-coder | ☑ | `develop` · `65e5e5339` (2026-04-11) |
| **ERP-B4a** | `FinancialManagement.js` — 에러 배너 **다시 시도** 네이티브 버튼 → `MGButton` (`loading`·`BudgetManagement`와 동일 계약) | core-coder | ☑ | `develop` · `9dc04b1d1` (2026-04-11) |
| **ERP-B4b** | `organisms/ErpFinanceAdminSyncCard.js` — `Button`(ui) 2곳 → `MGButton`, `initLoading`/`backfillLoading` 연동 | core-coder | ☑ | 동일 커밋 |
| **ERP-B5a** | 승인 대시보드 `AdminApprovalDashboard.js`, `SuperAdminApprovalDashboard.js` — `ErpModal` → `UnifiedModal` 직접 사용(UI-02) | core-coder | ☑ | `develop` · `72e36631b` (2026-04-11) |
| **ERP-B5b** | `QuickExpenseForm.js`, `FinancialTransactionForm.js` — 동일 `ErpModal` → `UnifiedModal` | core-coder | ☑ | 동일 커밋 |
| **ERP-B6a** | `BudgetManagement.js`, `ItemManagement.js`, `PurchaseRequestForm.js` — `ErpModal` → `UnifiedModal` | core-coder | ☑ | `develop` · `c4331820f` (2026-04-11) |
| **ERP-B6b** | `IntegratedFinanceDashboard.js` — 동일 (대용량·모달만 치환) | core-coder | ☑ | 동일 커밋 |
| **ERP-B6c** | `SalaryConfigModal.js`, `SalaryProfileFormModal.js`, `ConsultantProfileModal.js` — 동일 | core-coder | ☑ | 동일 커밋 |
| **G7-B1** | `admin/ConsultantManagement.js` — react-bootstrap `Modal` → `UnifiedModal` (앱 내 유일 BS Modal) | core-coder | ☑ | `develop` · `e79a2f281` (2026-04-11) |
| **G7-B2** | `DuplicateLoginModal.js`, `consultant/ConsultantVacationModal.js` — `ui/Button` → `MGButton` | core-coder | ☑ | 동일 커밋 |
| **G7-B3** | 상담사·모달·기록 8파일 — `ui/Button` → `MGButton` | core-coder | ☑ | `develop` · `0246b4033` (2026-04-11) |
| **G7-B4** | 관리자·설정·대시보드 8파일 — 동일 | core-coder | ☑ | 동일 커밋 |
| **G7-B5** | 앱·UI 17파일 — `ui/Button` → `MGButton`; `WelcomeWidget.js.js` 중복 제거 | core-coder | ☑ | `develop` · `7fe0b1890` (2026-04-11) |
| **G7-B6a** | `Button.stories.js`, `Modal.stories.js`, `Table.stories.js` — `MGButton` | core-coder | ☑ | `develop` · `d8cae5efa` (2026-04-11) |
| **G7-B6b** | `ui/Button`→`MGButton` 래퍼·`MGButton.css` 아이콘 행·예제/테스트/`index.js` Flow 제거·`icons.js`·`Icon.js` 런타임 상수 수정 | core-coder | ☑ | `develop` · `f92553e31` (2026-04-11) |
| **CL-B1** | 상담사 콘솔 **상담일지** — 회기(순번) 메타·「상담 내용」슈퍼블록·2열/스티키 메모·`PUT .../context-profile/notes`·**FULL/STANDARD** 메모 편집·화면설계 `SCREEN_SPEC_CONSULTATION_LOG_ORDER_MEMO.md` | core-coder | ☑ | `develop`·`main` · `89e03b2b9` (2026-04-11) |
| **G8-B1a** | 전역 확대 **G-01** — 미사용 `ErpModal`·`ErpModal.css`·`BaseModal` 제거, `base/index` export 정리 | core-coder | ☑ | `develop` · `d53398a4e` (2026-04-11) |
| **G8-B2a** | **G-01** — `homepage/Homepage.js`, `auth/TabletLogin.js` 네이티브 버튼 → `MGButton` | core-coder | ☑ | `develop` · `903e96644` (2026-04-11) |
| **G8-B1b** | **G-01** — 미사용 `SessionModals.js`·`common/MGModal.js`·`ui/MgModal/` 제거; 주석 보정(`PsychAiReportModalContent`, `ScheduleB0KlA.css`) | core-coder | ☑ | `develop` · `317aadd3f` (2026-04-11) |
| **G8-B2b** | **G-01** — `layout/SimpleHamburgerMenu.js` 네이티브 버튼 → `MGButton` (+ CSS 선택자 보정) | core-coder | ☑ | `develop` · `d5c12ca5b` (2026-04-11) |
| **G8-B3a** | **G-01** — `auth/BranchLogin.js`, `auth/HeadquartersLogin.js` → `MGButton` | core-coder | ☑ | `develop` · `9830a8462` (2026-04-11) |
| **G8-B3b** | **G-01** — `auth/BranchSpecificLogin.js`, `auth/UnifiedLogin.js` → `MGButton` | core-coder | ☑ | `develop` · `445c4a9af` (2026-04-11) |
| **G8-B4a** | **G-01** — `ForgotPassword`·`ResetPassword`·`TenantSelection` + `styles/auth/TenantSelection.css` → `MGButton` | core-coder | ☑ | `develop` · `53245620a` (2026-04-11) |
| **G8-B4b** | **G-01** — `TabletRegister`·`SocialSignupModal`·`AccountIntegrationModal` → `MGButton` | core-coder | ☑ | `develop` · `8b301d37c` (2026-04-11) |
| **G8-B5a** | **G-01** — `UnifiedHeader`·`MGHeader`·`SimpleHeader` + 헤더 CSS(`_header.css`, `SimpleHeader.css`) → `MGButton` | core-coder | ☑ | `develop` · `1620964d6` (2026-04-11) |
| **G8-B5b** | **G-01** — `dashboard/QuickActions`·`landing/CounselingHero`·`CounselingContact` → `MGButton` | core-coder | ☑ | `develop` · `8d642ca87` (2026-04-11) |
| **G8-B6a** | **G-01** — `dashboard-v2` 분자·원자(`NotificationDropdown`·`ProfileDropdown`·`QuickActionsDropdown`·`NavLink`·`NavIcon`) + 관련 CSS → `MGButton` | core-coder | ☑ | `develop` · `e6e302951` (2026-04-11) |
| **G8-B6b** | **G-01** — `MobileLnbDrawer`·`DesktopLnb`·`ContentKpiRow`·`consultant/*`(상담사 6파일) + CSS → `MGButton` (`AdminDashboardV2` 제외) | core-coder | ☑ | `develop` · `4a801abd4` (2026-04-11) |
| **G8-B7a** | **G-01** — `dashboard-v2/AdminDashboardV2.js` + `admin/AdminDashboard/AdminDashboardB0KlA.css` → `MGButton` | core-coder | ☑ | `develop` · `c56ff9f53` (2026-04-11) |
| **G8-B7b** | **G-01** — `schedule/ScheduleDetailModal.js`·`ScheduleB0KlA.css`·`erd/ErdDetailPage.js`·`ErdDetailPage.css` → `MGButton` | core-coder | ☑ | `develop` · `90af6cdb8` (2026-04-11) |
| **G8-B8a** | **G-01** — `ConsultantComprehensiveManagement`·`ClientComprehensiveManagement` + 매핑·B0KlA CSS 보정 → `MGButton` | core-coder | ☑ | `develop` · `562eec9fd` (2026-04-11) |
| **G8-B8b** | **G-01** — `TenantCodeManagement`·`TenantProfile`·`super-admin/PaymentManagement` (+ 각 `.css`) → `MGButton` | core-coder | ☑ | `develop` · `b938e4df0` (2026-04-11) |
| **G8-B9a** | **G-01** — `AdminDashboard`·`CommonCodeManagement`·`BrandingManagement` + `CommonCodeManagementB0KlA.css`·`BrandingManagement.css` → `MGButton` | core-coder | ☑ | `develop` · `7019f445c` (2026-04-11) |
| **G8-B9b** | **G-01** — `ops/PgApprovalManagement`·`MappingTableView`·`WidgetBasedAdminDashboard` (+ CSS) → `MGButton` | core-coder | ☑ | `develop` · `a51f8e429` (2026-04-11) |
| **G8-B10a** | **G-01** — `UserManagement`·`UserManagementPage`·`StaffManagement` + `UserManagement.css`·`MappingSearchSection.css` → `MGButton` | core-coder | ☑ | `develop` · `7754517cd` (2026-04-11) |
| **G8-B10b** | **G-01** — `ConsultationRecordSection`·`ConsultationRecordWidget`·`PrivacyConsentSection` + `ConsultationRecordWidget.css`·`MyPageRenewal.css` → `MGButton` | core-coder | ☑ | `develop` · `4f54682c9` (2026-04-11) |
| **G8-B11a** | **G-01** — `ScheduleList`·`ScheduleCard`·`ScheduleModal` + `ScheduleList.css`·`ScheduleCard.css` → `MGButton` | core-coder | ☑ | `develop` · `60c248b0b` (2026-04-11) |
| **G8-B11b** | **G-01** — `UnifiedNotification`·`UnifiedNotifications`·`SystemNotifications` + `styles/06-components/_notifications.css` → `MGButton` | core-coder | ☑ | `develop` · `de7ade649` (2026-04-11) |
| **G8-B12a** | **G-01** — 공통 `FormModal`·`ConfirmModal`·`PrivacyConsentModal`·`StatisticsModal`·`ConsultationGuideModal`·`ViewModeToggle`·`BadgeSelect`·`PrintComponent`·`ProfileImageInput`·`MGFilter`·`MGPagination` + 관련 CSS → `MGButton` | core-coder | ☑ | `develop` · `4e7e80bdd` (2026-04-11) |
| **G8-B12b** | **G-01** — `mypage`(설정·프로필·비밀번호·`MyPage`)·`UserSettings`·`WellnessNotificationDetail`·`pages/billing/BillingCallback` + 관련 CSS → `MGButton` | core-coder | ☑ | `develop` · `d32e7b4a8` (2026-04-11) |
| **G8-B13a** | **G-01** — `dashboard/widgets/consultation`·`erp`·`admin` 위젯 + 관련 CSS → `MGButton` | core-coder | ☑ | `develop` · `8e6468dbb` (2026-04-11) |
| **G8-B13b** | **G-01** — `dashboard/widgets` 루트·`common/HeaderWidget` 등(consultation/erp/admin 제외) + `Widget.css` 등 → `MGButton` | core-coder | ☑ | `develop` · `5c548e891` (2026-04-11) |
| **G8-B14a** | **G-01** — `dashboard/` 패널·섹션(`widgets/` 제외, `DashboardWidgetManager` 등) + `RecentActivities`·`SummaryPanels`·`WidgetManager` CSS → `MGButton` | core-coder | ☑ | `develop` · `690906a49` (2026-04-11) |
| **G8-B14b** | **G-01** — `dashboard/widgets/**/*.js.js` 중 `<button` 있던 파일 + `Widget.css` 페이지네이션 병기 → `MGButton` | core-coder | ☑ | `develop` · `b78c600ad` (2026-04-11) |
| **G8-B15a** | **G-01** — `schedule`·`erd`·`components/client`·`pages/client` 네이티브 버튼 → `MGButton` | core-coder | ☑ | `develop` · `4b1445b78` (2026-04-11) |
| **G8-B15b** | **G-01** — `components/admin/**` + `unified-design-tokens.css` 탭·버튼 병기 보정 → `MGButton` | core-coder | ☑ | `develop` · `9b5216ab7` (2026-04-11) |
| **G8-B16a** | **G-01** — `consultant/**`·`consultation/**` 네이티브 버튼 → `MGButton` | core-coder | ☑ | `develop` · `1c553164c` (2026-04-11) |
| **G8-B16b** | **G-01** — `academy`·`wellness`·`clinical`·`tenant`·`billing`·`mypage`·`training`·`emotion`·`prediction`·`finance`·`statistics`·`erp/shell`·`layout`(일부)·`common`·`ui` → `MGButton` | core-coder | ☑ | `develop` · `8a520c9ec` (2026-04-11) |
| **G8-B17a** | **G-01** — `components/test/**` 통합 테스트·데모 화면 → `MGButton` | core-coder | ☑ | `develop` · `102143e98` (2026-04-11) |
| **G8-B17b** | **G-01** — `BaseButton`·`BaseCard`·`ErpButton`·`LoadingSpinnerDemo`·`IconExamples`·`DashboardLayout` JSDoc → `MGButton` | core-coder | ☑ | `develop` · `12e0b6f61` (2026-04-11) |
| **G8-B18** | **G-01** — 미참조 `AdminDashboard_backup.js`·`UnifiedScheduleComponent_backup.js` 삭제 + 관련 문서 2건 보정 | core-coder | ☑ | `develop` · `77ac0f292` (2026-04-11) |

**G7-B3 파일**: `consultant/ClientInfoModal.js`, `ClientDetailModal.js`, `MessageSendModal.js`, `EventModal.js`, `ConsultationLogModal.js`, `ConsultationRecordView.js`, `ConsultantAvailability.js`, `records/ConsultantRecordListBlock.js`

**G7-B4 파일**: `admin/SystemConfigManagement.js`, `AdminDashboard.js`, `DashboardFormModal.js`, `StaffManagement.js`, `WidgetConfigModal.js`, `ConsultantComprehensiveManagement.js`, `MappingCreationModal.js`, `ui/TenantCommonCodeManagerUI.js`

**G7-B5 파일**: `admin/mapping/PartialRefundModal.js`, `dashboard/DynamicDashboard.js`, `settings/UserSettings.js`, `ClientComprehensiveManagement/ClientMappingTab.js`, `ClientOverviewTab.js`, `ClientConsultationTab.js`, `billing/SubscriptionManagement.js`, `dashboard/widgets/WelcomeWidget.js`, `super-admin/PaymentManagement.js`, `admin/mapping-management/pages/MappingManagementPage.js`, `erp/PurchaseManagement.js`, `admin/system/SystemTools.js`, `admin/system/SystemStatus.js`, `schedule/DateActionModal.js`, `ui/ConsultantDetailModal.js`, `ui/ThemeSelector/ThemeSelector.js`, `ui/Card/ConsultantCard.js` (+ `widgets/WelcomeWidget.js.js` 삭제)

**G7-B6a 파일**: `ui/Button/Button.stories.js`, `ui/Modal/Modal.stories.js`, `ui/Table/Table.stories.js`

**CL-B1 파일·문서**: `consultant/ConsultationLogModal.js`, `organisms/ConsultationLogFormPanel.js`, `organisms/ConsultationLogClientProfilePanel.js`, `molecules/ConsultationLogSessionHeaderMeta.js`, `schedule/ScheduleB0KlA.css`, `constants/clientProfileContext.js`(+ 테스트), `ClientContextProfileController.java`, `ClientStatsService`/`Impl`, `docs/design-system/SCREEN_SPEC_CONSULTATION_LOG_ORDER_MEMO.md`

**G8-B1a**: 삭제 `erp/common/ErpModal.js`, `ErpModal.css`, `common/modals/BaseModal.js`; 주석 보정 `QuickExpenseForm.css`, `FinancialTransactionForm.css`

**G8-B2a**: `homepage/Homepage.js`, `auth/TabletLogin.js`

**G8-B1b**: 삭제 `common/SessionModals.js`, `common/MGModal.js`, `ui/MgModal/*`; 주석 `psych-assessment/.../PsychAiReportModalContent.js`, `schedule/ScheduleB0KlA.css`

**G8-B2b**: `layout/SimpleHamburgerMenu.js`, `layout/SimpleHamburgerMenu.css`

**G8-B3a**: `auth/BranchLogin.js`, `auth/HeadquartersLogin.js`

**G8-B3b**: `auth/BranchSpecificLogin.js`, `auth/UnifiedLogin.js`

**G8-B4a**: `auth/ForgotPassword.js`, `auth/ResetPassword.js`, `auth/TenantSelection.js`, `styles/auth/TenantSelection.css`

**G8-B4b**: `auth/TabletRegister.js`, `auth/SocialSignupModal.js`, `auth/AccountIntegrationModal.js`

**G8-B5a**: `common/UnifiedHeader.js`, `common/MGHeader.js`, `layout/SimpleHeader.js`, `styles/06-components/_header.css`, `layout/SimpleHeader.css`

**G8-B5b**: `dashboard/QuickActions.js`, `landing/CounselingHero.js`, `landing/CounselingContact.js`

**G8-B6a**: `molecules/NotificationDropdown.js`, `ProfileDropdown.js`, `QuickActionsDropdown.js`, `atoms/NavLink.js`, `NavIcon.js` (+ 드롭다운·네비 관련 `.css`)

**G8-B6b**: `organisms/MobileLnbDrawer.js`, `DesktopLnb.js`, `content/ContentKpiRow.js`, `consultant/IncompleteRecordsAlert.js`, `QuickActionBar.js`, `UrgentClientsSection.js`, `UrgentClientCard.js`, `NextConsultationCard.js`, `ConsultantDashboardV2.js` (+ LNB·KPI·상담사 대시보드 관련 `.css`)

**G8-B7a**: `dashboard-v2/AdminDashboardV2.js`, `admin/AdminDashboard/AdminDashboardB0KlA.css`

**G8-B7b**: `schedule/ScheduleDetailModal.js`, `schedule/ScheduleB0KlA.css`, `erd/ErdDetailPage.js`, `erd/ErdDetailPage.css`

**G8-B8a**: `ConsultantComprehensiveManagement.js`, `ClientComprehensiveManagement.js` + `MappingManagementPage.css`, `MappingListBlock.css`, `MappingSearchSection.css`, `AdminDashboardB0KlA.css`

**G8-B8b**: `TenantCodeManagement.js`·`.css`, `TenantProfile.js`·`.css`, `super-admin/PaymentManagement.js`·`.css`

**G8-B9a**: `AdminDashboard.js`, `CommonCodeManagement.js`, `BrandingManagement.js`, `CommonCodeManagementB0KlA.css`, `BrandingManagement.css`

**G8-B9b**: `ops/PgApprovalManagement.js`, `mapping-management/organisms/MappingTableView.js`·`.css`, `WidgetBasedAdminDashboard.js`·`.css`

**G8-B10a**: `UserManagement.js`, `UserManagementPage.js`, `StaffManagement.js`, `UserManagement.css`, `mapping-management/organisms/MappingSearchSection.css`

**G8-B10b**: `consultant/ConsultationRecordSection.js`, `dashboard/widgets/ConsultationRecordWidget.js`·`.css`, `mypage/components/PrivacyConsentSection.js`, `mypage/MyPageRenewal.css`

**G8-B11a**: `common/ScheduleList.js`·`.css`, `common/ScheduleCard.js`·`.css`, `schedule/ScheduleModal.js`

**G8-B11b**: `common/UnifiedNotification.js`, `notifications/UnifiedNotifications.js`, `notifications/SystemNotifications.js`, `styles/06-components/_notifications.css`

**G8-B12a**: `common/modals/FormModal.js`, `ConfirmModal.js`, `PrivacyConsentModal.js`·`.css`, `StatisticsModal.js`·`.css`, `ConsultationGuideModal.js`, `ViewModeToggle.js`, `BadgeSelect.js`·`.css`, `PrintComponent.js`·`.css`, `ProfileImageInput.js`, `MGFilter.js`·`.css`, `MGPagination.js`·`.css` (+ `styles/main.css` 경로 보정)

**G8-B12b**: `mypage/components/SettingsSection.js`, `ProfileImageUpload.js`, `PasswordChangeModal.js`, `MyPage.js`, `mypage/MyPageRenewal.css`, `settings/UserSettings.js`·`.css`, `wellness/WellnessNotificationDetail.js`·`.css`, `pages/billing/BillingCallback.js`

**G8-B13a**: `dashboard/widgets/consultation/*`, `dashboard/widgets/erp/*`, `dashboard/widgets/admin/*` (위젯 JS·추가 CSS 예: `SystemToolsWidget.css`)

**G8-B13b**: `dashboard/widgets/` 루트 위젯 다수(`BaseWidget`, `FormWidget`, `ScheduleWidget`, `HealingCardWidget`, `MessageWidget`, `NotificationWidget`, `ClientMessageWidget`, `ConsultantClientWidget`, `ErpPurchaseRequestWidget`, `PaymentWidget`, `PurchaseRequestWidget`, `QuickActionsWidget`, `RatableConsultationsWidget`, `RecentActivitiesWidget`, `SummaryPanelsWidget`, `CalendarWidget`, `ActivityListWidget`, `SystemNotificationWidget` 등) + `common/HeaderWidget`·`HeaderWidget.css`, `Widget.css`, 위젯별 `.css` 보정

**G8-B14a**: `ClientMessageSection`, `SystemNotificationSection`, `ScheduleQuickAccess`, `WelcomeSection`, `ConsultantClientSection`, `WeatherCard`, `ErpPurchaseRequestPanel`, `SummaryPanels`, `RecentActivities`, `DashboardWidgetManager/DashboardWidgetManagerPresentation` + `DashboardWidgetManager.css`, `SummaryPanels.css`, `RecentActivities.css`

**G8-B14b**: `widgets/**/*.js.js` 중 버튼 있던 파일(예: `TableWidget`, `PaymentWidget`, `ScheduleWidget`, `MessageWidget`, `NotificationWidget`, `ActivityListWidget`, `QuickActionsWidget`, `FormWidget`, `HealingCardWidget`, `RatingWidget`) + `Widget.css` 보정

**G8-B15a**: `schedule`(백업 제외), `erd`, `components/client`, `pages/client` + 관련 CSS

**G8-B15b**: `admin/**` 전반(백업 제외) + `styles/unified-design-tokens.css`

**G8-B16a**: `consultant/**`, `consultation/**` + `ScheduleB0KlA.css`·`ConsultationReport.css` 등

**G8-B16b**: `academy`·`wellness`·`clinical`·`tenant`·`billing`·`mypage`·`training`·`emotion`·`prediction`·`finance`·`statistics`·`erp/shell`·`layout`(SimpleLayout·DashboardSection)·`common`·`ui` (데모·`MGButton.js` 제외)

**G8-B17a**: `test/IntegrationTest`·`UnifiedModalTest`·`NotificationTest`·`UnifiedHeaderTest`·`UnifiedLoadingTest`·`PaymentTest`

**G8-B17b**: `base/BaseButton`·`BaseCard`, `erp/common/ErpButton`, `common/LoadingSpinnerDemo`, `ui/Icon/IconExamples`, `ui/Layout/DashboardLayout`(JSDoc)

**G8-B18**: 백업 JS 2파일 삭제; `ERP_UX_LABEL_APPLICATION_SPEC.md`, `DEPOSIT_PAYMENT_ERP_REFUND_MEETING_SURVEY.md` 참조 정리 (아카이브·과거 tests/reports JSON 미변경)

---

## 사용 방법

| 단계 | 내용 |
|------|------|
| 1 | 작업 착수 전: 아래 표에서 해당 행 상태를 **진행 중**으로 바꾼다. |
| 2 | PR·배치 완료 후: **완료**로 바꾸고, 필요 시 **비고**에 커밋/PR 번호를 적는다. |
| 3 | 새 트랙이 생기면 **같은 표 형식**으로 행을 추가하고, 상위 기준 문서 링크를 넣는다. |
| 4 | 코드 변경이 있는 배치는 **`core-tester` 검증 게이트**를 통과한 뒤에만 완료로 둔다. |

**상태 기호**

| 기호 | 의미 |
|------|------|
| ☐ | 미착수 |
| 🔄 | 진행 중 |
| ☑ | 완료 |
| — | 해당 없음 / 보류 |

---

## 1. ERP — UX·품질 (로딩·필터·패턴 통일)

**상위 기준**: [ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md)  
**관련**: [ERP_CURRENT_STATE_DB_AND_LOGIC_ANALYSIS.md](./ERP_CURRENT_STATE_DB_AND_LOGIC_ANALYSIS.md), `docs/planning/ERP_TEST_SCENARIOS.md`

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| ERP-P4-01 | `UnifiedLoading` — 페이지 전체 대신 인라인·섹션 로딩으로 통일 (ERP 화면별) | 🔄 | 화면별 잔여 점검 |
| ERP-P4-02 | 무음 재조회: `silentRefreshing` + `aria-busy` + 툴바 패턴 정리 | 🔄 | |
| ERP-P4-03 | `ErpFilterToolbar` 도입·정렬 (화면별) | 🔄 | |
| ERP-P4-04 | 무음 조회 트리거 버튼 — `MGButton` `loading` / `loadingText` 패턴 통일 | 🔄 | 급여·재무 거래 탭 일부 ☑ (2026-04-10) |
| ERP-P4-05 | 나머지 ERP 화면 네이티브 새로고침·검색 버튼 인벤토리 → 동일 패턴 적용 | 🔄 | P4-05a~d ☑; **P4-05e/f** ☑ `c13e3480e` — 급여·환불·탭·상담사모달·구매카드 등 11파일; **`ErpButton.js` 래퍼**·기타 소수만 잔여 |

---

## 2. 공통 UI·레이아웃 (모달·Admin 레이아웃)

**상위 기준**: [SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md](./SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md), [COMMON_UI_ENCAPSULATION_PLAN.md](./COMMON_UI_ENCAPSULATION_PLAN.md)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| UI-01 | 관리자 공통 레이아웃(`AdminCommonLayout` 등) 미적용 페이지 정리 | 🔄 | 1차 병렬 적용 이력 있음 — 잔여 점검 |
| UI-02 | 미비 모달·서브 컴포넌트 `UnifiedModal` 등 공통화 (2차) | 🔄 | B5·B6 `ErpModal`→`UnifiedModal` ☑. **추가**: 계좌 `AccountForm`/관리 화면·내담자 `ClientMessageSection` 상세 모달을 `UnifiedModal`로 통일(div 오용 수정). 잔여: 드롭다운 포털 등 |
| UI-03 | [COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md](./COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md) 잔여·후속 | 🔄 | 표 내 개별 항목은 해당 문서에서 관리 |
| UI-04 | 상담사 콘솔 **상담일지** — 레이아웃·메모·맥락 API (`UnifiedModal`·토큰) | ☑ | 병렬 블록 **CL-B1** · 커밋 `89e03b2b9` |

---

## 3. 보안·공개 API (온보딩 등)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| SEC-01 | 공개 온보딩 API 보강 (Rate limit·쿨다운·CAPTCHA·모니터링) | ☐ | `docs/project-management/2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md` |

---

## 4. 검증 게이트 (배치 완료 조건)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| QA-01 | 코드 변경 배치 — `core-tester` 스모크·회귀 (프로젝트 표준) | 🔄 | 배치마다 해당 |
| QA-02 | ERP E2E·스모크 (저장소 워크플로·시나리오가 있는 경우) | ☐ | `docs/planning/ERP_TEST_SCENARIOS.md` 참고 |

---

## 5. 운영 반영 (배포 전)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| OPS-01 | 운영 반영 전 체크리스트 | ☐ | `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` |
| OPS-02 | 하드코딩·표시 경계·LNB/설정 회의 손오프 조건 | ☐ | `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` 등 |

---

## 6. ERP 완료 후 전체 확대 검토 (예정)

**트리거**: [ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md) 기준 **ERP 권역 작업이 “완료”로 합의된 시점** (본 문서 구역 1·병렬 블록 B1~B6 및 ERP-P4 항목 정리 후).

**목적**: ERP에만 적용했던 패턴·품질 게이트를 **`frontend/src/components/erp` 밖 전역**으로 확대해, 동일 기준의 일관성·회귀 안전을 맞춘다.

| ID | 검토 축 | 범위 (요약) | 담당(권장) |
|----|---------|-------------|------------|
| **G-01** | 프론트·모달 | `src/components` 전역 `ErpModal`·레거시 모달·`UnifiedModal` 미적용 화면 | explore → core-coder |
| **G-02** | 표시 경계·React #130 | `safeDisplay`·`ErpSafeText`·차트·KPI·동적 JSX | `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`, core-component-manager → core-coder |
| **G-03** | API·테넌트 | `StandardizedApi`·`tenantId`·`/api/v1/` 일관성 | explore + core-coder(백엔드 연계 시 `core-solution-backend` 스킬) |
| **G-04** | 레이아웃 | `AdminCommonLayout`·ContentHeader·설정/LNB 회의 손오프 조건 잔여 | UI-01·UI-02와 통합 |
| **G-05** | 보안·공개 API | SEC-01 온보딩·기타 공개 엔드포인트 | `TODO_ONBOARDING_PUBLIC_API_HARDENING.md` |
| **G-06** | 검증 | E2E·스모크·회귀 범위 확대 (ERP + 핵심 사용자 플로우) | core-tester |
| **G-07** | 운영 | `PRE_PRODUCTION_GO_LIVE_CHECKLIST`·하드코딩 CI·배포 paths | core-deployer·운영 체크리스트 |

**진행 방식 (고정)**  
1) **core-planner**: 인벤토리 범위·배치표·우선순위 1장.  
2) **explore**: 파일·패턴별 목록(중복 최소화).  
3) **core-coder**: 배치별 패치(파일 충돌 나누기).  
4) **core-tester**: 배치 완료 게이트.  
5) 본 문서에 **G-01~G-07** 행 상태(☐/🔄/☑)를 갱신.

- **전역 확대 검토 상태**: **G-01 네이티브 버튼 정리** — G8-B1a~B18·G7·CL-B1 배치 ☑; **`rg '<button'`** 앱 코드는 `MGButton.js` 래퍼 내부만(백업본 G8-B18에서 제거). **QA-01**: `CI=true npm test -- --watchAll=false` **전 스위트 통과**(craco `react-router/dom`·관리자 파이프라인·ThemeSelector·App 스모크 등); `npm run lint:check`·`npm run verify:erp`는 잔여 부채로 별도 배치 권장.

**권장 다음 단계 (마스터 진행)**  
1) **UI-02 2차 (잔여)** — `ProfileDropdown`/`NotificationDropdown`/`QuickActionsDropdown` 등 **createPortal** 드롭다운·기타 커스텀 오버레이 점검·필요 시 패턴 통일.  
2) **전역 린트 부채** — `npm run lint:check` 에러 축소 배치(ERP·앱 전역, G-01과 별도).  
3) **ERP-P4 잔여** — `components/erp` 내 인벤토리·MGButton 패턴(ERP-P4-05 비고).  
4) **SEC-01** / **OPS-01** — 온보딩 API 보강·운영 체크리스트는 별 배치로 착수 시 본 표 🔄/☑ 갱신.

---

## 진행률 스냅샷 (수동)

**갱신 시 아래만 수정하면 된다.**

| 구역 | 완료 / 전체 (대략) | 메모 |
|------|-------------------|------|
| 1. ERP | 0 / 5 (세부는 표 참고) | B1~B6·MGButton 배치 ☑; P4 전부 ☐ 아님 — 잔여 🔄 |
| 2. 공통 UI | 1 / 4 (UI-04 ☑, UI-01~03 🔄) | 상담일지 CL-B1 반영 |
| 3. 보안 | 0 / 1 | SEC-01 ☐ |
| 4. 검증 | (진행형) | QA-01 배치별, QA-02 ☐ |
| 5. 운영 | 0 / 2 | OPS 배포·체크리스트 별도 |

---

## 참고 — 문서 중복을 피하는 법

- **원칙**: 이 파일은 **진행도·상태만** 담는다. 설계 상세·페이즈 정의는 **ERP 마스터 플랜** 등 원문에 둔다.
- **이중 관리 방지**: 세부 체크리스트가 이미 있는 주제(예: 공통화 병렬 체크리스트)는 **세부 문서에서 ID를 완료 처리**하고, 이 마스터 표에서는 **트랙 단위 상태**만 맞춘다.

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-04-10 | 최초 작성 — ERP P4 무음 조회·MGButton 일부 반영, 온보딩·레이아웃·검증·운영 구역 추가 |
| 2026-04-10 | 병렬 블록 ERP-B1·B2 표 추가, ERP-P4-05 진행 중 반영 |
| 2026-04-11 | ERP-B1·B2 `core-coder` 병렬 위임; 체크리스트는 커밋 전까지 🔄·미커밋 명시 |
| 2026-04-11 | ERP-B1/B2 커밋 `68fbd5dfd` 반영, develop·main 푸시 |
| 2026-04-11 | ERP-B3 병렬 위임(B3a/B3b), 체크리스트 🔄 |
| 2026-04-11 | ERP-B3 커밋 `65e5e5339`, 체크리스트 ☑ |
| 2026-04-11 | ERP-B4a/B4b 병렬 위임 (재무 오류 재시도·동기화 카드) |
| 2026-04-11 | ERP-B4 커밋 `9dc04b1d1`, 체크리스트 ☑ |
| 2026-04-11 | ERP-B5a/B5b 병렬 위임 — ErpModal→UnifiedModal (승인·폼) |
| 2026-04-11 | ERP-B5 커밋 `72e36631b`, 체크리스트 ☑ |
| 2026-04-11 | ERP-B6a/B6b/B6c 병렬 위임 — ErpModal→UnifiedModal 잔여 7파일 |
| 2026-04-11 | ERP-B6 완료 시 체크리스트·UI-02 비고 갱신 |
| 2026-04-11 | 섹션 6 추가 — ERP 완료 후 전역 확대 검토(G-01~G-07)·절차 |
| 2026-04-11 | G7-B1/B2 병렬 위임(ConsultantManagement·DuplicateLogin·ConsultantVacation) |
| 2026-04-11 | G7-B1/B2 커밋 `e79a2f281`, 체크리스트 ☑ |
| 2026-04-11 | G7-B3/B4 병렬 위임(ui/Button→MGButton 16파일) |
| 2026-04-11 | G7-B3/B4 커밋 `0246b4033`, 체크리스트 ☑ |
| 2026-04-11 | G7-B5 `ui/Button`→`MGButton` 17파일·`WelcomeWidget.js.js` 삭제, 커밋 `7fe0b1890` |
| 2026-04-11 | G7-B6a/B6b 커밋 `f92553e31` — Button MGButton 래퍼, Examples/테스트, `index`, `icons.js`/`Icon` 보정 |
| 2026-04-11 | G7-B6a 스토리 3파일 후속 커밋 `d8cae5efa` (병렬 에이전트 산출물 미커밋 보완) |
| 2026-04-11 | **CL-B1** 상담일지·메모 API·STANDARD 권한 — 커밋 `89e03b2b9`, 병렬 블록·구역2(UI-04)·스냅샷·섹션6 다음 단계 반영 |
| 2026-04-11 | **ERP-P4-05a/b** 병렬 위임(core-coder) — MGButton 7파일, 커밋 `9c84e2f24`; **G-01** explore 인벤토리·G8-B1/B2 블록 제안 |
| 2026-04-11 | develop/main 배포·운영 `deploy-production` 트리거; **ERP-P4-05c/d** 병렬 MGButton 6파일 `e4e4a2f6f` |
| 2026-04-11 | **ERP-P4-05e/f** 병렬 MGButton 11파일 `c13e3480e` |
| 2026-04-11 | **G8-B1a** 데드 코드 제거 `d53398a4e`, **G8-B2a** Homepage·TabletLogin MGButton `903e96644` |
| 2026-04-11 | **G8-B1b** SessionModals·MGModal·ui/MgModal 제거 `317aadd3f`, **G8-B2b** SimpleHamburgerMenu MGButton `d5c12ca5b` |
| 2026-04-11 | **G8-B3a** Branch·HQ 로그인 MGButton `9830a8462`, **G8-B3b** BranchSpecific·UnifiedLogin MGButton `445c4a9af` |
| 2026-04-11 | **G8-B4a** Forgot·Reset·Tenant MGButton `53245620a`, **G8-B4b** TabletRegister·SocialSignup·AccountIntegration `8b301d37c` |
| 2026-04-11 | **G8-B5a** 헤더 3종·CSS MGButton `1620964d6`, **G8-B5b** QuickActions·Counseling 랜딩 `8d642ca87` |
| 2026-04-11 | **G8-B6a** dashboard-v2 분자·원자 MGButton `e6e302951`, **G8-B6b** LNB·KPI·상담사 MGButton `4a801abd4` |
| 2026-04-11 | **G8-B7a** AdminDashboardV2 MGButton `c56ff9f53`, **G8-B7b** ScheduleDetailModal·ErdDetailPage MGButton `90af6cdb8` |
| 2026-04-11 | **G8-B8a** Consultant·Client 종합관리 MGButton `562eec9fd`, **G8-B8b** TenantCode·TenantProfile·PaymentManagement `b938e4df0` |
| 2026-04-11 | **G8-B9a** AdminDashboard·CommonCode·Branding MGButton `7019f445c`, **G8-B9b** PgApproval·MappingTableView·WidgetBasedAdmin `a51f8e429` |
| 2026-04-11 | **G8-B10a** User·Staff 관리 MGButton `7754517cd`, **G8-B10b** 상담기록 위젯·개인정보 동의 MGButton `4f54682c9` |
| 2026-04-11 | **G8-B11a** ScheduleList·ScheduleCard·ScheduleModal MGButton `60c248b0b`, **G8-B11b** 알림 3종·`_notifications.css` MGButton `de7ade649` |
| 2026-04-11 | **G8-B12a** 공통 모달·필터·MGPagination MGButton `4e7e80bdd`, **G8-B12b** mypage·설정·웰니스·BillingCallback MGButton `d32e7b4a8` |
| 2026-04-11 | **G8-B13a** 대시보드 위젯 consultation·erp·admin MGButton `8e6468dbb`, **G8-B13b** 루트·common 위젯 MGButton `5c548e891` |
| 2026-04-11 | **G8-B14a** 대시보드 패널·섹션(위젯 제외) MGButton `690906a49`, **G8-B14b** 위젯 `*.js.js` MGButton `b78c600ad` |
| 2026-04-11 | **G8-B15a** schedule·erd·client MGButton `4b1445b78`, **G8-B15b** admin MGButton `9b5216ab7` |
| 2026-04-11 | **G8-B16a** consultant·consultation MGButton `1c553164c`, **G8-B16b** academy·wellness·ui·common 등 MGButton `8a520c9ec` |
| 2026-04-11 | **G8-B17a** test 화면 MGButton `102143e98`, **G8-B17b** BaseButton·BaseCard·ErpButton·데모 MGButton `12e0b6f61` |
| 2026-04-11 | **G8-B18** 미사용 백업 JS 제거·문서 보정 `77ac0f292`; QA-01 린트·테스트·`verify:erp` 권장 |
| 2026-04-11 | **QA-01** Jest 일부 스위트 수정(ProfileDropdown·Table·위젯·testUtils) `0f69e2cf4` — UI-02 인벤토리: `UnifiedModal` 광범위 적용·RB Modal 없음(explore) |
| 2026-04-11 | **QA-01** Jest 전체 그린 `be919d459` (react-router v7·craco·setupTests·App·ThemeSelector·파이프라인)·develop·main 반영·운영 프론트 배포(`deploy-frontend-prod`) 트리거 |
| 2026-04-11 | **UI-02 2차** `AccountManagement`/`AccountForm`/`ClientMessageSection` — `UnifiedModal` 적용, 내담자 메시지 상세의 잘못된 `div` 모달 마크업 수정 |
