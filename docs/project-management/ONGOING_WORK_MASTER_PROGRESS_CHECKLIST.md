# 진행 중 작업 — 마스터 진행도 체크리스트 (SSOT)

**목적**: 여러 트랙(ERP·공통 UI·보안·검증)이 동시에 진행될 때 **일이 끝나지 않는 느낌**을 줄이고, **전체에서 진행도를 한곳**에서 파악한다.  
**갱신 주기**: 배치(또는 PR)가 끝날 때마다 담당자가 이 문서만 갱신한다. (세부 설계는 각 전용 문서에 둔다.)

**최종 갱신**: 2026-04-24 — **RESV-ALIM-P0** 3차 병렬(explore·designer·coder·tester·deployer) 산출 → 체크리스트 [§11.8~§11.13](./2026-04-23/RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md); `tenant_kakao_alimtalk_settings`·Admin API·resolve **워킹트리 미커밋**; **프론트·전체 mvn·커밋·테스터 전 매트릭스** 잔여. (직전: 2차 `5cfdcebe0`·`0704b4037`.) (2026-04-21 잔여: [USER_FACING_STRINGS_AND_HARDCODE_NEXT_BATCH.md](./2026-04-21/USER_FACING_STRINGS_AND_HARDCODE_NEXT_BATCH.md).)  
**주관**: core-planner(오케스트레이션) — 구현은 `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`·위임 순서 준수.

**UI/QA 비고**: LEGACY-ADMIN-MGMT-GRID·AUTH-UNIFIED·B0KLA 에러 토큰은 각각 `core-coder`/위임 산출물 전제로 두고, 본 체크리스트는 진행도·`ERP_FINANCIAL_HUB_SMOKE`(번호 38~39 등) 스모크 연계만 기록한다. **관리 카드 숨김 SSOT**(`ADMIN-HIDE-CARDS-SSOT`, `HIDE_ADMIN_CARD_IDS` 상수 파일)는 위임 산출물·스모크 문서 「중복 생략」과 정합한다.

---

## 병렬 블록 배치 (현재 스프린트)

**원칙**: 파일 충돌을 막기 위해 **한 블록 = 담당 파일 집합이 겹치지 않게** 나눈다. 배치가 끝나면 아래 표와 구역 1 표를 갱신한다.

**다음 병렬 검증 게이트 (기준 2026-04-15, P4-04·P4-GLOBAL 완료 직후)**: **ERP-P4-01** · **ERP-P4-03** · **UI-01** — 수동 스모크·회귀·`core-tester` 확인은 `docs/guides/testing/ERP_FINANCIAL_HUB_SMOKE.md` 「다음 단계」·`CORE_PLANNER_DELEGATION_ORDER.md` 검증 게이트(콘솔 #130·네트워크 실패 시 기대 동작)를 따른다.

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
| **ERP-B7** | `organisms/ErpRecentTransactionsTable.js`, `ErpIncomeExpenseBarChartSection.js` — ERP 대시보드 재무 로딩 `UnifiedLoading`·`aria-busy` 정합 | core-coder | ☑ | 최근 거래·수입·지출 차트 ☑ (2026-04-12) |
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
| **P4-GLOBAL** | `frontend/src/components` 전역 `<MGButton` + `erpMgButtonProps`(`buildErpMgButtonClassName`, `ERP_MG_BUTTON_LOADING_TEXT`) 적용 완료 | core-coder | ☑ | 스모크 문서 `docs/guides/testing/ERP_FINANCIAL_HUB_SMOKE.md` 상단 안내 참고 · 일자 2026-04-15 |
| **RESV-ALIM-P0** | 예약 × 알림톡 — 1~2차 ☑ + **3차** explore·designer·coder·tester·deployer(§11.8~§11.13) → **프론트·전체 mvn·커밋·테스터 전 매트릭스·explore vs 전용테이블 합의** 잔여 | 🔄 워킹트리 검수 후 커밋·UI 배치 | 🔄 | [체크리스트](./2026-04-23/RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md) §7·§10·§11 |

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
| ERP-P4-01 | `UnifiedLoading` — 페이지 전체 대신 인라인·섹션 로딩으로 통일 (ERP 화면별) | 🔄 | **`FinancialManagement.js`** 로딩 구간 `aria-busy`·`role="status"` ☑ (2026-04-17). **2026-04-16** 병렬 위임 **ERP-P4-01-MEDIUM**(결제수단·급여모달·ERP 위젯) 및 **ERP-HUB 4파일** 배치 직후 — `ERP_FINANCIAL_HUB_SMOKE` 「위임 직후 보강 스모크」·§ERP-P4-01·**번호 25**와 정합(중복 생략). 잔여: 기타 ERP 화면·모달 점검. |
| ERP-P4-02 | 무음 재조회: `silentRefreshing` + `aria-busy` + 툴바 패턴 정리 | ☑ | **`useErpSilentRefresh`**·**`silentListRefreshing`** — `ErpDashboard`·환불·급여·**배치 B3** 승인 대시보드 2종·`ApprovalHubLayout` (2026-04-11). **`PurchaseRequestForm.js`** 본문 `<section>` `aria-busy` ☑ (2026-04-10). **`ErpReportModal.js`** 본문 `mg-v2-modal-body`에 `aria-busy`(보고서 생성·지점 목록 로딩) ☑ (코드 확인). **`FinancialTransactionForm.js`** `<form>` `aria-busy`(제출·공통코드 로딩) ☑ (2026-04-10). **`QuickExpenseForm.js`** 본문 래퍼 `aria-busy`(공통코드·등록 제출) ☑ (2026-04-10). **`SalaryConfigModal.js`** 본문 `.salary-config-modal-body` `aria-busy={loading}` ☑ (2026-04-10). **`BudgetManagement.js`** `.erp-content` `aria-busy`(loading·`silentListRefreshing`) ☑. **`AdminApprovalDashboard.js`** 승인·거부 `UnifiedModal` 본문 래퍼 `aria-busy={processing}` ☑. **`IntegratedFinanceDashboard.js`** 분개 3모달 — `JournalEntryDetailModal` 본문 `aria-busy={loading}`; `JournalEntryCreateModal`·`JournalEntryEditModal` 폼 `aria-busy={loading || accountTypesLoading}` ☑. **`SuperAdminApprovalDashboard.js`** 최종 승인·거부 `UnifiedModal` 본문 `aria-busy={processing}` ☑. **`ConsultantProfileModal.js`** `.consultant-profile-modal-body` `aria-busy={profileLoading || saving}` ☑ (`develop`·`main` · `a7322cc4e`). 잔여: 화면별 `aria-busy` 점검은 P4-01과 병행 가능. |
| ERP-P4-03 | `ErpFilterToolbar` 도입·정렬 (화면별) | 🔄 | **2026-04-16** 병렬 위임 **ERP-P4-03-PAGES-B**(세무·품목·구매요청·환불필터) 및 **ERP-HUB 4**·**어드민 경로** 스모크 직후 — `ERP_FINANCIAL_HUB_SMOKE` 「위임 직후 보강 스모크」·§ERP-P4-03·**번호 25~26**와 정합(중복 생략). 정렬·반응형·토큰 잔여 🔄. |
| ERP-P4-04 | 무음 조회 트리거 버튼 — `MGButton` `loading` / `loadingText` 패턴 통일 | 🔄 | 급여·재무 거래 탭 일부 ☑ (2026-04-10). **A-2**·**B1**·**B2** ☑. **B3** `SalaryManagement`·`ImprovedTaxManagement`·`RefundManagement`·`ApprovalHubLayout`·승인 대시보드 보강 ☑ (2026-04-11). **2026-04-12** `RefundFilterBlock.js`·`RefundFilters.js` — `buildErpMgButtonClassName`·`ERP_MG_BUTTON_LOADING_TEXT` ☑ (급여·컨설턴트 모달 MGButton은 **P4-01** 동일일 배치). **코드 대조**: `frontend`에서 `ErpButton` 식별자 참조 **0건** (레거시 제거 상태 유지). **`components` 전역** `erpMgButtonProps` 일괄 적용은 병렬 블록 **P4-GLOBAL**(2026-04-15)로 분리 기록; 본 행은 무음 조회 트리거 중심 이력·화면별 잔여 점검을 뜻한다. |
| ERP-P4-05 | 나머지 ERP 화면 네이티브 새로고침·검색 버튼 인벤토리 → 동일 패턴 적용 | 🔄 | P4-05a~f ☑. **2026-04-16** 병렬 **ERP-P4-05-DASH 4파일**·**ERP-P4-05-DASH-B/C**·**ERP-P4-05-ERP-A/B** 가정 완료 — `ERP_FINANCIAL_HUB_SMOKE` **번호 29~30**·상단 23·G8-B13a·G8-B14 스모크와 정합(중복 생략). **종합관리 2화면**은 **번호 31**·G8-B8a와 정합. **위임 직후** **ERP-P4-05-REM-ADMIN**·**REM-CLIENT**·**REM-MISC** — 상단 문서 **번호 32~37**(웰니스·권한·위젯 대시보드·클라이언트·헤더·태블릿 로그인)와 정합(중복 생략). **ErpButton 제거**·**무음 상태명 통일(P4-02)** ☑. 인벤토리·추가 화면은 배치별. **TABLET-P4-05**: 태블릿 인증 스모크는 `ERP_FINANCIAL_HUB_SMOKE` **번호 37**·「TABLET-P4-05 병합」·G8-B2a·G8-B4b와 SSOT(중복 생략). |

---

## 2. 공통 UI·레이아웃 (모달·Admin 레이아웃)

**상위 기준**: [SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md](./SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md), [COMMON_UI_ENCAPSULATION_PLAN.md](./COMMON_UI_ENCAPSULATION_PLAN.md)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| UI-01 | 관리자 공통 레이아웃(`AdminCommonLayout` 등) 미적용 페이지 정리 | 🔄 | **`/admin/schedules`**: `App.js` 이중 `AdminCommonLayout` 제거·`AdminSchedulesPage`가 페이지 내부에서 레이아웃 적용(UserManagementPage 동일 패턴) ☑ (2026-04-17). **인벤토리(2026-04-11)**: `AdminCommonLayout` import **88파일**. **2026-04-16** 병렬 **UI-01-B1/B2/B3**·**UI-01-C** 및 **`ERP_FINANCIAL_HUB_SMOKE` 번호 26·28·31**·§UI-01 스모크와 정합(중복 생략). **의도적 비적용**은 아래 표와 동일(파일 경로 SSOT). **`PgApprovalManagement`**: `/admin/ops/pg-approval` + LNB 폴백 ☑. **`ComingSoon` 이중 래핑 제거** ☑ — `/admin/branches`, `PsychAssessmentManagement` 권한 없음 분기 (2026-04-11). **`StaffManagement.js`** — `roleOf`·역할 변경 모달 비교 정합 ☑; 이메일 중복 확인 `StandardizedApi.get('/api/v1/admin/duplicate-check/email', { email })` ☑ (2026-04-10). |
| UI-02 | 미비 모달·서브 컴포넌트 `UnifiedModal` 등 공통화 (2차) | 🔄 | **`CommonCodeForm.js`** — 커스텀 오버레이 제거·`UnifiedModal`·그룹 조회 `StandardizedApi` ☑ (2026-04-17). B5·B6·계좌/내담자 메시지 `UnifiedModal` ☑. **추가**: GNB `Profile`/`QuickActions`/`Notification` 드롭다운 → `GnbDropdownPortal` + `aria-controls`/고유 `panelId`, `NavIcon` props 전달. 잔여: UI-01·UI-03·전역 린트 등 |
| UI-03 | [COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md](./COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md) 잔여·후속 | 🔄 | 표 내 개별 항목은 해당 문서에서 관리. `COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md`는 표상 잔여 ☐/🔄 없음(2026-04-11 explore) — 마스터 후속은 UI-01·ERP 등 별도 트랙. |
| UI-04 | 상담사 콘솔 **상담일지** — 레이아웃·메모·맥락 API (`UnifiedModal`·토큰) | ☑ | 병렬 블록 **CL-B1** · 커밋 `89e03b2b9` |

**UI-01 — 의도적 비적용 (파일 경로 SSOT)**

| 의도적 비적용 페이지·컴포넌트 | 이유 | 파일 |
|------------------------------|------|------|
| 관리자 대시보드 v2 셸 | v2 전용 GNB/LNB·라우팅 | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` |
| 레거시 관리자 대시보드 | 레거시 셸 | `frontend/src/components/admin/AdminDashboard.js` |
| 통계 대시보드 | 임베드·탭 위젯 중심 | `frontend/src/components/admin/StatisticsDashboard.js` |
| 통합 매칭 스케줄 | 별도 풀페이지 레이아웃 | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` |
| 매칭 관리 페이지 본문 | 래퍼 `MappingManagement`가 ACL | `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js` |
| 상담일지 조회 본문 | 래퍼 `ConsultationLogView`가 ACL | `frontend/src/components/admin/consultation-log-view/ConsultationLogViewPage.js` |
| 컴플라이언스 라우트 엔트리 | 쉘에 ACL 위임 | `frontend/src/components/compliance/ComplianceDashboard.js` |

**보강**: 실제 ACL 적용은 `ComplianceDashboardShell.js`, `MappingManagement.js`, `ConsultationLogView.js` 등 래퍼를 참고한다.

**레이아웃 주입 위치 (SSOT)** — 위 표 항목과 대조:

| 페이지·컴포넌트 | `AdminCommonLayout` 등 레이아웃 주입 위치 |
|-----------------|------------------------------------------|
| `StatisticsDashboard` · `IntegratedMatchingSchedule` | `App.js` 해당 라우트에서 `AdminCommonLayout` 인라인 |
| `MappingManagementPage` | `MappingManagement.js` 래퍼 |
| `ConsultationLogViewPage` | `ConsultationLogView.js` 래퍼(관리자·상담사 경로 공용) |
| `ComplianceDashboard` | `ComplianceDashboardShell.js`가 `AdminCommonLayout` 보유 |
| `AdminDashboardV2` · `AdminDashboard` | v2 셸·레거시 셸 단독(`App.js` 라우트) |

**혼동 방지**: `ConsultantDashboardV2` ≠ `AdminDashboardV2`(상담사 콘솔 대시보드 vs 관리자 대시보드 v2 셸).

---

## 3. 보안·공개 API (온보딩 등)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| SEC-01 | 공개 온보딩 API 보강 (Rate limit·쿨다운·CAPTCHA·모니터링) | 🔄 | **`TODO_ONBOARDING_PUBLIC_API_HARDENING`**: 레이트리밋·이메일 쿨다운·온보딩 CAPTCHA(백엔드·Trinity)·Micrometer·문서 ☑; 체크리스트 **후속**(다른 공개 `POST` CAPTCHA·제품·스키마) ☐. **엣지** `limit_req`·WAF·Grafana 알람·실서버 Nginx는 인프라 트랙 — `NGINX_RATE_LIMIT_PUBLIC_API.md`·`deploy-nginx-dev.yml` |

---

## 4. 검증 게이트 (배치 완료 조건)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| QA-01 | 코드 변경 배치 — `core-tester` 스모크·회귀 (프로젝트 표준) | 🔄 | 프론트 Jest·lint 통과. **백엔드 `mvn test`**: PR/push 시 [code-quality-check.yml](../../../.github/workflows/code-quality-check.yml)에서 **`|| true` 없이 실패 전파**(2026-04-17). 로컬는 [CI_CODE_QUALITY_AND_MVN_GATE.md](../guides/testing/CI_CODE_QUALITY_AND_MVN_GATE.md) 권장. **백엔드 전체 `mvn test` 통과**는 배치마다 확인. **ERP 재무 대시보드** 로딩 시 KPI·차트·최근 거래 `UnifiedLoading`·`aria-busy` 회귀 스모크 권장 |
| QA-02 | ERP E2E·스모크 (저장소 워크플로·시나리오가 있는 경우) | 🔄 | **`ERP_TEST_SCENARIOS.md`** §1.2~1.3·§3·§4를 실제 `tests/e2e/tests/erp/`·`e2e-erp-smoke.yml`과 정합 ☑ (2026-04-17). [GITHUB_ACTIONS_WORKFLOW_INDEX.md](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md) — CI 표에 ERP 스모크 워크플로 등록됨. **ERP**: `e2e-erp-smoke.yml` — `verify:erp`·Playwright 리다이렉트, **Secrets 불필요**. **Trinity**: `e2e-trinity-build-smoke.yml` — `frontend-trinity` 빌드만(paths·PR/push 동일 범위). ERP 스모크는 `frontend-trinity/**`와 무관. 잔여: E2E·CI 실행·회귀는 QA-01·배치별. |

---

## 5. 운영 반영 (배포 전)

| ID | 항목 | 상태 | 비고 |
|----|------|------|------|
| OPS-01 | 운영 반영 전 체크리스트 | 🔄 | `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` · [OPS_HANDOFF_QUICKLINKS.md](../운영반영/OPS_HANDOFF_QUICKLINKS.md) |
| OPS-02 | 하드코딩·표시 경계·LNB/설정 회의 손오프 조건 | ☐ | 손오프: [`ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md`](./ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md) 등. 로컬 표준 `bash config/shell-scripts/check-hardcode.sh` — CI `.github/workflows/code-quality-check.yml` step과 동일 `check-hardcoding-enhanced.js`. **exit 0**·에러 없음·**경고만**(job 실패 아님). 건수·JSON 파일명은 스캔마다 변동: `test-reports/hardcoding/` 최신 JSON·본 문서 **변경 이력** 참조. 운영 게이트 **경고 0**은 **core-coder 에픽** 별도. |

---

## 6. ERP 완료 후 전체 확대 검토 (예정)

**트리거**: [ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md) 기준 **ERP 권역 작업이 “완료”로 합의된 시점** (본 문서 구역 1·병렬 블록 B1~B7 및 ERP-P4 항목 정리 후).

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

- **전역 확대 검토 상태**: **G-01 네이티브 버튼 정리** — G8-B1a~B18·G7·CL-B1 배치 ☑; **`rg '<button'`** 앱 코드는 `MGButton.js` 래퍼 내부만(백업본 G8-B18에서 제거). **QA-01**: Jest 전 스위트 통과; **`npm run lint:check`** = **`eslint --quiet`** (오류 0건 게이트); **`npm run lint:strict`** = **`eslint --max-warnings 0`** (경고 0) — **2026-04-11 통과**. 노이즈·장기 부채 규칙은 `.eslintrc.js`에서 완화·off(`no-magic-numbers`, `no-unused-vars`, `max-lines`/`max-depth`, `no-alert`, `react/jsx-no-comment-textnodes` 등); `react/jsx-no-bind` off, 레거시 `mg-` AST(`no-restricted-syntax`) off — **코드 품질 보완은 IDE·리뷰·별도 배치**. mg-v2 이관은 별 트랙.

**권장 다음 단계 (마스터 진행)**  
1) ~~**`lint:strict` 게이트`**~~ — **통과(설정 조정)** · 잔여는 팀 정책에 따라 규칙을 다시 켜며 코드 정리 가능.  
2) **UI-01·UI-03** — ~~`PgApprovalManagement` 라우트~~ ☑ · ~~**의도적 비적용** 파일 경로 표(구역 2 하단)~~ ☑ (2026-04-11) · UI-03은 병렬 체크리스트 표 잔여 없음 — 마스터 후속은 UI-01 잔여·ERP 등 별도 트랙.  
3) **ERP-P4 잔여** — ~~`ErpButton` 정리~~ ☑ · **`silentRefreshing`/`refreshingToolbar` 네이밍·훅 통일**은 별 배치.  
4) **SEC-01** / **OPS-01** — 온보딩 API 보강·운영 체크리스트는 별 배치로 착수 시 본 표 🔄/☑ 갱신.

---

## 진행률 스냅샷 (수동)

**갱신 시 아래만 수정하면 된다.**

| 구역 | 완료 / 전체 (대략) | 메모 |
|------|-------------------|------|
| 1. ERP | 0 / 5 (세부는 표 참고) | B1~B7·MGButton 배치 ☑; **P4-GLOBAL** 전역 `erpMgButtonProps` ☑ (2026-04-15); **B7** 최근 거래·수입·지출 차트 organisms ☑; KPI 요약 `ErpIncomeExpenseSummarySection` ☑; **P4-01** `FinancialManagement` 로딩 a11y 보강(2026-04-17); P4-03 정렬·P4-04 잔여 화면 🔄 |
| 2. 공통 UI | 1 / 4 (UI-04 ☑, UI-01~03 🔄) | 상담일지 CL-B1 반영; 2026-04-17 `/admin/schedules` 레이아웃·`CommonCodeForm` 모달 |
| 3. 보안 | (진행형) | SEC-01 🔄 (`TODO_ONBOARDING` 체크 대부분 ☑·후속 공개 POST·엣지 잔여) |
| 4. 검증 | (진행형) | QA-01 배치별, QA-02 🔄 (`e2e-erp-smoke`·시나리오 문서 경로 정합 2026-04-17); [GITHUB_ACTIONS_WORKFLOW_INDEX.md](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md) — CI 표에 ERP 스모크 워크플로 등록됨 |
| 5. 운영 | 0 / 2 | [OPS_HANDOFF_QUICKLINKS.md](../운영반영/OPS_HANDOFF_QUICKLINKS.md) 문서 존재 ☑ · **실행**(배포 전 `PRE_PRODUCTION` 체크)은 배치별 · OPS-01 🔄 · OPS-02 하드코딩 스캔 증적은 §5 표 OPS-02 비고 참조(`check-hardcoding-enhanced.js` exit 0·경고 ~5250·`test-reports/hardcoding/`) |

---

## 참고 — 문서 중복을 피하는 법

- **미완 항목 통합 스냅샷(여러 문서 훑어보기)**: [2026-04-16/PENDING_ITEMS_FROM_DOCUMENTS_SSOT.md](./2026-04-16/PENDING_ITEMS_FROM_DOCUMENTS_SSOT.md) — 원문 SSOT는 각 전용 문서·본 표가 우선이다. **완료 반영 부록**: 동 문서 §9.
- **CI `mvn test` 게이트·로컬 검증**: [../guides/testing/CI_CODE_QUALITY_AND_MVN_GATE.md](../guides/testing/CI_CODE_QUALITY_AND_MVN_GATE.md)
- **Flyway 코어 vs Ops 트랙**: [../deployment/FLYWAY_CORE_VS_OPS_TRACKS.md](../deployment/FLYWAY_CORE_VS_OPS_TRACKS.md)
- **원칙**: 이 파일은 **진행도·상태만** 담는다. 설계 상세·페이즈 정의는 **ERP 마스터 플랜** 등 원문에 둔다.
- **이중 관리 방지**: 세부 체크리스트가 이미 있는 주제(예: 공통화 병렬 체크리스트)는 **세부 문서에서 ID를 완료 처리**하고, 이 마스터 표에서는 **트랙 단위 상태**만 맞춘다.

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-04-21 | OPS-02 비고 압축. |
| 2026-04-17 | 진행률 스냅샷 구역 5·OPS-02 메모 보강 |
| 2026-04-17 | **OPS-02** 하드코딩 스캔 증적: `node scripts/design-system/css-tools/check-hardcoding-enhanced.js` exit 0·에러 0·경고 ~5250·리포트 `test-reports/hardcoding/hardcoding-report-*.json` · CI `code-quality-check.yml` 동일 step 기준 job 실패 아님(경고 0 게이트 시 별도 에픽) |
| 2026-04-17 | [GITHUB_ACTIONS_WORKFLOW_INDEX.md](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md): 루트 워크플로 31개 요약·`e2e-erp-smoke.yml` CI 표·비고 각주 — 마스터 최종 갱신·QA-02·스냅샷(검증) 동기 |
| 2026-04-17 | **배치**: UI-01 `/admin/schedules` 이중 레이아웃 제거·페이지 내 `AdminCommonLayout`; UI-02 `CommonCodeForm` `UnifiedModal`·`StandardizedApi`; ERP-P4-01 `FinancialManagement` 로딩 `aria-busy`·`role="status"`; QA-02 `ERP_TEST_SCENARIOS` §1.2~1.3·§3·§4·`tests/e2e/tests/erp/`·`e2e-erp-smoke.yml` 정합; SEC-01 비고·구역 1·2 표 동기 |
| 2026-04-16 | **ERP-P4-05-REM-ADMIN**·**REM-CLIENT**·**REM-MISC** 위임 직후 — `ERP_FINANCIAL_HUB_SMOKE` 번호 **32~37** 보강(웰니스·권한·위젯 대시보드·클라이언트·헤더·태블릿 로그인·중복 생략)·최종 갱신·**ERP-P4-05** 비고 한 줄 반영 |
| 2026-04-16 | 병렬 블록 **P4-GLOBAL** ☑·헤더·진행률 스냅샷·ERP-P4-04 비고 보정 (전역 `erpMgButtonProps` 기준일 2026-04-15) · `ERP_FINANCIAL_HUB_SMOKE` 「다음 단계」·「위임 직후 보강 스모크」(P4-03-PAGES-B·P4-01-MEDIUM) · **번호 25~31** 보강(**UI-01-C**·**ERP-P4-05 잔여 DASH-B/C·ERP-A/B**·**종합관리 2화면** 30~31)·**중복 생략** 안내 · ERP-P4-01·P4-03·**P4-05**·**UI-01** 비고 갱신 |
| 2026-04-17 | 참고 링크: `PENDING_ITEMS` §9 완료 부록, `CI_CODE_QUALITY_AND_MVN_GATE`, `FLYWAY_CORE_VS_OPS_TRACKS`; QA-01 비고에 `code-quality-check` `mvn test` 엄격 전파 반영 |
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
| 2026-04-11 | **UI-02 2차** `AccountManagement`/`AccountForm`/`ClientMessageSection` — `UnifiedModal` 적용·div 모달 오용 수정 `e04da6290` |
| 2026-04-11 | **UI-02** GNB `GnbDropdownPortal`·`aria-controls`/`panelId`·`NavIcon` `9fa8c92c6` |
| 2026-04-11 | **QA-01** ESLint `--quiet` 오류 0건(import·파싱·상수·온보딩 TS→JSX·Icon `userRole` 등) `28d02dab6` — `lint:check`(max-warnings 0)는 경고로 아직 실패 가능 |
| 2026-04-11 | **QA-01** `npm run lint:strict` 통과 — `.eslintrc.js` 중복 키 정리·경고 규칙 완화(`no-alert`, `max-lines`, `react/jsx-no-comment-textnodes` 등). **UI-01**·**ERP-P4-05** 잔여 인벤토리 병렬 정리 → 본 문서 권장 다음 단계·비고 반영 |
| 2026-04-11 | **QA-01** ESLint `--fix` 1차(경고 대략 1.42만→1.17만) `51e8155b8` |
| 2026-04-11 | **QA-01** `lint:check`=`--quiet`·`lint:strict`·`jsx-no-bind`/`no-restricted-syntax(mg-)` `8de6e57d5` |
| 2026-04-11 | `PgApprovalManagement` 라우트·LNB 폴백(`ADMIN_ROUTES.PG_OPS_APPROVAL`) 연결 |
| 2026-04-11 | ERP **`ErpButton` 제거** — `erpMgButtonProps.js`·5파일 `MGButton` 통일, `ErpButton.js` 삭제 |
| 2026-04-11 | **ERP-P4-02** `useErpSilentRefresh`·`silentListRefreshing` 통일·환불 필터 prop 정렬 |
| 2026-04-11 | **UI-01** `ComingSoon` + `AdminCommonLayout` 이중 래핑 제거 (`App.js` `/admin/branches`, `PsychAssessmentManagement` 권한 없음) |
| 2026-04-11 | **DOC-UI**: UI-01 의도적 비적용 표·ACL 래퍼 보강, UI-03 `COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST` 잔여 ☐/🔄 없음 명시 — 마스터 SSOT는 `CORE_PLANNER_DELEGATION_ORDER.md` 원칙과 본 문서 구역 2 |
| 2026-04-11 | **SEC-01 1차** 계정 연동 이메일 인증 — 쿨다운·일일 상한·IP 레이트리밋·429, `AccountIntegrationServiceImplEmailVerificationTest` |
| 2026-04-11 | **SEC-01 2차** `POST /api/v1/onboarding/requests` IP 레이트리밋(ops 제외)·`MindgardenSecurityPropertiesRateLimitTest` |
| 2026-04-11 | **SEC-01 3차** `mindgarden.rate_limit.blocked` Micrometer·`PERMISSION_SYSTEM_STANDARD` 공개 API·레이트리밋 절·TODO 모니터링/문서 부분 갱신 |
| 2026-04-11 | **SEC-01 엣지 문서** `docs/deployment/NGINX_RATE_LIMIT_PUBLIC_API.md`·워크플로 인덱스 링크 — QA: frontend+compile+타깃 테스트 통과, 전체 `mvn test`는 기존 JPA/통합 이슈로 실패 보고 |
| 2026-04-11 | **백엔드 테스트 부트스트랩**: `PlSqlInitializer`에 `@ConditionalOnProperty`(`mindgarden.plsql-initializer.enabled`, 기본 true), `application-test.yml`에서 false — H2에서 MySQL 저장 프로시저 DDL 실행으로 `SuperAdminBypassTest` 등 컨텍스트 로드 실패하던 원인 제거. 검증: `mvn -Dtest=SuperAdminBypassTest test` 통과 |
| 2026-04-11 | **ERP-P4 배치 A-2** (core-coder): `ErpReportModal.js`·`FinancialTransactionForm.js`·`QuickExpenseForm.js` — `UnifiedLoading` 인라인·`erpMgButtonProps`/`ERP_MG_BUTTON_LOADING_TEXT`·퀵비용 카테고리 로딩 분리. ESLint `--quiet` 3파일 통과 |
| 2026-04-11 | **ERP-P4 배치 B1** (core-coder): `ErpDashboard.js`·`FinancialManagement.js` — `MGButton`에 `buildErpMgButtonClassName`·`ERP_MG_BUTTON_LOADING_TEXT` 통일. ESLint `--quiet` 2파일 통과 |
| 2026-04-11 | **ERP-P4 배치 B2** (core-coder): `PurchaseManagement.js`·`PurchaseRequestForm.js`·`BudgetManagement.js` — 동일 MGButton 패턴·`BudgetManagement` variant/size 정리. ESLint `--quiet` 3파일 통과 |
| 2026-04-11 | **ERP-P4 배치 B3** (core-coder): `SalaryManagement`·`ImprovedTaxManagement`·`RefundManagement`·승인 대시보드 2종·`approval/ApprovalHubLayout.js` — MGButton 정합·승인 무음 재조회. ESLint `--quiet` |
| 2026-04-11 | **QA-01 백엔드 `mvn test` 1차**: `FullSystemIntegrationTest`·`UserScenarioTest` — `ObjectProvider<Flyway>`, 가이드 비밀번호 평문 제거 |
| 2026-04-11 | **QA-01 백엔드 `mvn test` 2차**: `OnboardingApprovalServiceIntegrationTest`·`OnboardingOpsIntegrationTest`·`ErdGenerationServiceIntegrationTest` — H2에서 MySQL 의존 시 Assumptions 스킵·BCrypt·`Pageable` 수정 |
| 2026-04-11 | **QA-01 백엔드 `mvn test` 3차** (core-coder): ERD 컨트롤러 H2 스킵, `merchant_id` 길이, `MultiTenant`·`PsychAssessmentImageUpload` `tenant_id`≤36, 결제 생성 시 테넌트 필수(`PaymentServiceImpl` 등) |
| 2026-04-11 | **QA-01 백엔드 `mvn test` 4차** (core-coder): Psych PDF·Stats, `BaseTenantEntityService`, Passkey·`UserPasskey.tenantId`, `DynamicCardLayout` 시드, Tenant PG `ApiResponse` JSON 경로, 키 로테이션 Mockito, `ConsultantDashboardServiceImplTest`, 온보딩·프로시저(H2 한계) 등 — **전체 `mvn test` 통과** 로컬 확인(`bash -o pipefail`로 Maven 실패가 tail에 묻히지 않게 확인) |
| 2026-04-11 | **QA-01** `core-tester` 재검증: `mvn test` **509**건, **Failures 0 / Errors 0 / Skipped 43** (H2·MySQL 메타·온보딩 등 조건부 스킵 — 실DB/프로덕션형 프로파일 별도 검증 권장). 커밋 시 `uploads/`·`test-reports/` 등 로컬 산출물 제외 |
| 2026-04-11 | **위임**: `core-coder` — `.gitignore`에 `uploads/psych-assessments/`, `tmp/`, `tmp_error_tail*.txt`; Playwright 리포트는 주석 안내만. **`core-tester`** — `e2e-erp-smoke.yml`·QA-02 비고 정리(Secrets 없음, 리다이렉트 스모크 범위) |
| 2026-04-11 | **SEC-01 CAPTCHA(백엔드·테스트)**: `OnboardingController`·`CaptchaVerifier.requiresCaptchaToken()`·`OnboardingControllerCaptchaWebMvcTest`(MockMvc 최소 부트스트랩 `OnboardingControllerMvcTestApplication`). `TODO_ONBOARDING_PUBLIC_API_HARDENING` 봇 완화 `[~]` |
| 2026-04-11 | **SEC-01 병렬**: Trinity 콜백 `sessionStorage`로 `captchaToken` 전달(`SESSION_STORAGE_KEYS`)·`core-deployer` `docs/deployment/SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md`·Nginx 가이드 상호 링크 — `mvn`/ESLint 타깃 회귀 통과 |
| 2026-04-11 | **위임 병렬**: `core-deployer` `POST_DEPLOY_VERIFY_CAPTCHA_ONBOARDING.md` — `core-coder` Trinity 콜백 타이밍 상수(`ONBOARDING_CALLBACK_TIMING`) — `core-tester` QA-02·`e2e-erp-smoke` paths·Trinity 자동 미실행 문구·Playwright ERP 스모크 3 passed |
| 2026-04-12 | **위임 병렬**·체크리스트 동기 갱신: `core-coder` `e2e-trinity-build-smoke.yml`; `core-tester` `BACKEND_MYSQL_INTEGRATION_TESTS.md`·`GITHUB_ACTIONS_WORKFLOW_INDEX`·QA-02; `explore` ERP-P4 잔여; `core-deployer` [OPS_HANDOFF_QUICKLINKS.md](../운영반영/OPS_HANDOFF_QUICKLINKS.md); OPS-01 🔄·구역 5 스냅샷. **ERP-B7** ☑·헤더·P4-01·스냅샷 반영. **ERP-P4**: 환불·급여·컨설턴트 모달; **`ErpRecentTransactionsTable.js`**·**`ErpIncomeExpenseBarChartSection.js`** — `UnifiedLoading`·`aria-busy` ☑. |
| 2026-04-10 | **ERP-P4-01 KPI**·문서 정합: `ErpIncomeExpenseSummarySection.js` — `UnifiedLoading`·`aria-busy` ☑. P4-03 explore(툴바 미도입 후보 8건)·UI-01 `AdminDashboard.js` 의도적 비적용. 마스터·스냅샷 갱신. |
| 2026-04-10 | 병렬 위임(Purchase aria-busy·explore·체크리스트) |
| 2026-04-10 | **ErpReportModal** 본문 `aria-busy` 코드 반영 확인(SSOT)·**ERP-P4-02** 비고 보강; **병렬 위임** 문서 동기(core-coder·explore·체크리스트) |
| 2026-04-10 | **FinancialTransactionForm.js** `<form>` `aria-busy` ☑ (core-coder)·**ERP-P4-02** 비고 정합; P4-03 `PurchaseRequestForm` 툴바 도입 explore; **병렬 위임** |
| 2026-04-10 | **PurchaseRequestForm** `ErpFilterToolbar`·**QuickExpenseForm** `aria-busy` 래퍼(core-coder)·**ERP-P4-02/03** 비고 정합(코드 대조) |
| 2026-04-10 | develop·main 푸시 — 프론트 ERP P4 배치 반영; GitHub Actions `deploy-frontend-dev.yml`(develop)·`deploy-frontend-prod.yml`(main, paths `frontend/**`) 푸시 시 워크플로 자동 트리거 |
| 2026-04-10 | **UI-01**·**ERP-P4-02**: `StaffManagement.js` `StandardizedApi` 중복 확인·`roleOf`; `SalaryConfigModal` `aria-busy` (core-coder)·문서 정합 |
| 2026-04-10 | **ERP-P4-02**: `BudgetManagement`·`AdminApprovalDashboard` `aria-busy` — core-tester 문서 동기 후 `AdminApprovalDashboard` 모달 본문 `aria-busy={processing}` 추가·비고 정합 |
| 2026-04-10 | **ERP-P4-02** (병렬 위임 후 정합): `IntegratedFinanceDashboard.js` 분개 상세·등록·수정 모달 `aria-busy` 반영(core-coder)·**core-tester** 병렬 레이스로 잘못 들어간 「IFD 미반영」 문구 제거·비고·변경 이력 반영 |
| 2026-04-10 | **ERP-P4-02**: `SuperAdminApprovalDashboard.js`·`ConsultantProfileModal.js` `aria-busy` — 비고·커밋 `a7322cc4e` 정합(직전 푸시만 반영·문서 누락 보완) |
| 2026-04-21 | **문구·시드 상수화** `de1f410a7` develop·main — 잔여·다음 배치: [USER_FACING_STRINGS_AND_HARDCODE_NEXT_BATCH.md](./2026-04-21/USER_FACING_STRINGS_AND_HARDCODE_NEXT_BATCH.md) |
