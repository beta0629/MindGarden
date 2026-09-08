# Clinic-OS 잔여 화면 인벤토리

**목적**: maturity queue 「Clinic-OS 잔여」— 이미 Clinic-OS에 정렬된 화면과, 아직 비주얼 정렬이 필요한 화면을 한곳에 둔다.  
**기준일**: 2026-09-05  
**범위**: **문서만** (제품 UI 코드 변경 없음 — 본 파일 자체).  
**브랜치 인벤토리**: `develop` + messaging/notifications Clinic-OS PR.

---

## 관련 문서 (SSOT·핸드오프)

| 문서 | 역할 |
|------|------|
| [CLINIC_OS_ADMIN_VISUAL_SSOT.md](./CLINIC_OS_ADMIN_VISUAL_SSOT.md) | 운영자/어드민 비주얼 **SSOT**. Default format = Admin Dashboard V2. |
| [MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md](./MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md) | 매칭 관리 Clinic-OS 정렬 핸드오프 |
| [CONSULTATION_LOG_VIEW_CLINIC_OS_HANDOFF.md](./CONSULTATION_LOG_VIEW_CLINIC_OS_HANDOFF.md) | 상담일지 조회 Clinic-OS 정렬 핸드오프 (#854) |
| [MESSAGING_NOTIFICATIONS_CLINIC_OS_HANDOFF.md](./MESSAGING_NOTIFICATIONS_CLINIC_OS_HANDOFF.md) | 알림·메시지 클러스터(3페이지) Clinic-OS 정렬 핸드오프 |
| [TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md](./TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md) | 테넌트 PG 설정 Clinic-OS 정렬 핸드오프 |
| [SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md](./SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md) | 상담사 지급(`/erp/salary`) Clinic-OS 핸드오프 |
| [OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md](./OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md) | 승인 센터(`/erp/approvals`) Clinic-OS 핸드오프 |
| [REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md](./REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md) | 환불 관리(`/erp/refund-management`) Clinic-OS TO-BE 핸드오프 — **ALIGNED** |
| [clinic-os-menu-permissions.md](./clinic-os-menu-permissions.md) | 메뉴 권한(`/admin/menu-permissions`) Clinic-OS Critic PASS 핸드오프 — **구현 중** |
| [SCREEN_SPEC_CONSULTANT_DASHBOARD_CLINIC_OS.md](./SCREEN_SPEC_CONSULTANT_DASHBOARD_CLINIC_OS.md) | 상담사 대시보드 Clinic-OS 스펙 |
| [PENCIL_DESIGN_GUIDE.md](./PENCIL_DESIGN_GUIDE.md) | 역사(B0KlA) — **신규 어드민 금지** |
| [USER_MANAGEMENT_CLINIC_OS_SHELL_SPEC.md](./USER_MANAGEMENT_CLINIC_OS_SHELL_SPEC.md) | 사용자 관리 페이지 셸 Clinic-OS 스펙 |
| [design-system/README.md](./README.md) | 디자인 시스템 인덱스 |

### SSOT 판정 기준 (요약)

- 타이포 **4단계** (h1 / h2 / body-md / caption)
- Primary = **MGButton** dusty teal (dashboard solid primary)
- 크롬: **quiet header** + (선택) **요약 스트립** + **main stage**
- Pencil **왼쪽 4px 악센트 바 금지**
- **신규** `AdminDashboardB0KlA.css` import 금지
- 레퍼런스: **Admin Dashboard V2** (1차 패스 리스타일 대상 아님 — SSOT §F)

---

## 상태 범례

| 상태 | 의미 |
|------|------|
| **ALIGNED** | Clinic-OS 크롬·토큰·버튼 계약 충족 (잔여 B0KlA 없음 또는 의도적으로 제외) |
| **PARTIAL** | 일부만 Clinic-OS (KPI/스트립/테스트만 등). 셸·클래스·모달 잔여 있음 |
| **LEGACY** | B0KlA / forest / 구 셸 위주. Clinic-OS 계약 미적용 |

---

## 이미 Clinic-OS 정렬 (ALIGNED)

| 영역 | 라우트 | 컴포넌트 | 비고 |
|------|--------|----------|------|
| 매칭 관리 | `/admin/mapping-management` | `MappingManagementPage` | `--clinic-os`, MappingKpiSection, lock test. [MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF](./MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md) |
| 통합 스케줄 | `/admin/integrated-schedule` | `IntegratedMatchingSchedule` | `integrated-schedule--clinic-os`, IntegratedScheduleSummaryStrip |
| 테넌트 PG 설정 | `/tenant/pg-configurations*` | `PgConfiguration{List,Create,Edit,Detail}` | TENANT_PG handoff + lock test |
| 구매 / 경비 | `/erp/purchase` | `PurchaseManagement` | PurchaseQuietHeader + PurchaseSummaryStrip |
| 재무 크롬 | `/erp/financial`, `/erp/dashboard` | `FinancialManagement`, `ErpDashboard` | Ledger/Money quiet header+strip. **모달은 PARTIAL 잔여**; RefundHub tabs Clinic-OS |
| 패키지 옵션 카드 | (매칭 관리 내) | `PackageOptionCard` | **패키지 요금 관리(`/admin/package-pricing`)와 별개** |
| 마이페이지 셸 | `/admin/mypage`, `/consultant/mypage` | `MyPage` | `mg-mypage-clinic-os`, MypageQuietHeader/Strip |
| 상담사 대시보드 | `/consultant/dashboard` | `ConsultantDashboardV2` | `mg-v2-clinic-os` |
| 사용자 관리 | `/admin/user-management` | `UserManagementPage` | 페이지 셸 ALIGNED 2026-09-06: `--clinic-os` + ContentHeader + TabChipRow + KPI strip. **embed 내부** Client/Consultant B0KlA pill 탭·`AdminDashboardB0KlA.css`는 의도적 후속. [USER_MANAGEMENT_CLINIC_OS_SHELL_SPEC](./USER_MANAGEMENT_CLINIC_OS_SHELL_SPEC.md) |
| LNB 정리 | shell | `menuItems` + Flyway | ops/IA. 페이지 크롬 아님 |
| 상담일지 조회 | `/admin/consultation-logs` · `/consultant/consultation-logs` | `ConsultationLogView` → `ConsultationLogViewPage` | `#854` ALIGNED. `--clinic-os`, lock test. [CONSULTATION_LOG_VIEW_CLINIC_OS_HANDOFF](./CONSULTATION_LOG_VIEW_CLINIC_OS_HANDOFF.md) |
| 메시지 발송 | `/admin/push-monitoring` | `AdminPushMonitoringPage` | `--clinic-os`, 4-cell summary strip, main stage, lock test |
| 수동 알림 발송 | `/admin/manual-notification` | `AdminManualNotificationPage` | `--clinic-os`, strip 생략, dual stage, lock test |
| 알림·메시지 관리 | `/admin/notifications` | `AdminNotificationsPage` | `--clinic-os`, tabs/stage, organisms class rename, lock test. Form modal `SystemNotificationFormModal` B0KlA class 잔여(의도적 후속) |
| 급여 관리 | `/erp/salary` | `SalaryManagement` | Purchase twin. `SalaryQuietHeader` + `SalarySummaryStrip` + `__stage`. 페이지 B0KlA 없음. **모달 B0KlA 잔여 → P1 #10**. [SALARY_MANAGEMENT_CLINIC_OS_HANDOFF](./SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md) |
| 환불 관리 | `/erp/refund-management` | `RefundManagement` | QuietHeader+3-cell+rail+__stage. [REFUND_MANAGEMENT_CLINIC_OS_HANDOFF](./REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md) |

---

## 우선순위 잔여 백로그

### P0 — 운영자가 매일 봄 (LNB 노출·고트래픽)

| # | LNB 라벨 | 라우트 | 컴포넌트 | 파일 | 상태 | 근거 / 메모 | 권장 순번 |
|---|----------|--------|----------|------|------|-------------|-----------|
| ~~3~~ | ~~급여 관리~~ | ~~`/erp/salary`~~ | ~~`SalaryManagement`~~ | — | **ALIGNED** (상단 표) | ~~PARTIAL~~ → ALIGNED 2026-09-06. 페이지 크롬 완료; 모달 잔여는 P1 #10 | — |
| ~~4~~ | ~~사용자 관리~~ | ~~`/admin/user-management`~~ | ~~`UserManagementPage`~~ | — | **ALIGNED** (상단 표) | ~~PARTIAL~~ → 셸 ALIGNED 2026-09-06. embed 내부 B0KlA pills는 후속 | — |

### P1 — 자주 쓰지만 2차

| # | LNB 라벨 | 라우트 | 컴포넌트 | 파일 | 상태 | 근거 / 메모 | 권장 순번 |
|---|----------|--------|----------|------|------|-------------|-----------|
| 4c | 메뉴 권한 (계정·권한) | `/admin/menu-permissions` | `MenuPermissionManagement` | `frontend/src/components/admin/MenuPermissionManagement.js` | **LEGACY → TO-BE** | Critic PASS 핸드오프 [clinic-os-menu-permissions.md](./clinic-os-menu-permissions.md). 라우트 부활·Clinic-OS 크롬·락 매트릭스 구현 중 (`cursor/clinic-os-menu-permissions-1665`) | 2b |
| 5 | 계좌 관리 (계정·권한) | `/admin/accounts` | `AccountManagement` | `frontend/src/components/admin/AccountManagement.js` | **LEGACY** | **마이페이지와 혼동 금지** | 3 |
| 6a | (LNB 숨김 가능; 라우트 존재) | `/admin/common-codes` | `CommonCodeManagement` | `frontend/src/components/admin/CommonCodeManagement.js` | **PARTIAL** | CSS에 Clinic-OS 주장, B0KlA 클래스/import 잔존 | 4 |
| 6b | 센터 코드 (시스템·설정) | `/admin/tenant-common-codes` | `TenantCommonCodeManager` | `frontend/src/components/admin/TenantCommonCodeManager.js` | **LEGACY** | LNB「센터 코드」. 플랫폼 공통코드와 별개 | 5 |
| 7 | 패키지 요금 관리 | `/admin/package-pricing` | `PackagePricingListPage` / `PackagePricingDetailPage` | `frontend/src/components/admin/package-pricing/pages/` | **LEGACY** | forest/B0KlA. **PackageOptionCard와 별개** | 6 |
| 8 | SMS 템플릿 관리 | `/admin/sms-templates` | `SmsTemplateManagementPage` | `frontend/src/components/admin/sms-templates/SmsTemplateManagementPage.js` | **PARTIAL** | B0KlA 없음. `--clinic-os` 계약 없음 | 7 |
| 9 | 상담사 메시지 | `/consultant/messages`, `/consultant/send-message/:id` | `ConsultantMessages`, `ConsultantMessageScreen` | `frontend/src/components/consultant/ConsultantMessages.js`, `ConsultantMessageScreen.js` | **PARTIAL** | ContentHeader+MGButton 일부. `--clinic-os`/strip 계약 없음. `/consultant/*` (consultant-ops 아님) | 8 |
| 10 | (재무 잔여) | `/erp/financial` 환불 허브·모달 | `FinancialRefundHubLayout` 등 | `frontend/src/components/erp/financial/FinancialRefundHubLayout.js` | **PARTIAL** | 페이지 크롬 ALIGNED. Hub tabs Clinic-OS 정리됨(B0KlA pill 제거). 급여·재무 모달 `mg-v2-ad-b0kla` 잔여 | 9 |
| ~~10b~~ | ~~환불 관리~~ | ~~`/erp/refund-management`~~ | ~~`RefundManagement`~~ | — | **ALIGNED** (상단 표) | ~~LEGACY~~ → ALIGNED 2026-09-08. QuietHeader+3-cell+rail+__stage · lock test | — |

### P2 — 일일 노출 낮음 / 대량 잔여

| # | LNB 라벨 | 라우트 | 컴포넌트 | 파일 | 상태 | 근거 / 메모 | 권장 순번 |
|---|----------|--------|----------|------|------|-------------|-----------|
| 11a | 예산 관리 | `/erp/budget` | `BudgetManagement` | `frontend/src/components/erp/BudgetManagement.js` | **LEGACY** | 악센트 KPI 카드 | 10 |
| 11b | (라우트; LNB 비노출 가능) | `/erp/items` | `ItemManagement` | `frontend/src/components/erp/ItemManagement.js` | **LEGACY** | 악센트 KPI 카드 | 11 |
| 12 | 상담사 운영 | `/consultant/clients`, `/consultant/schedule`, `/consultant/availability`, `/consultant/consultation-records`, `/consultant/salary-settlement` | Renewal/레거시 쌍 존재 | `frontend/src/components/consultant/*` | **LEGACY** | 대시보드만 ALIGNED. B0KlA 잔존 | 12 |
| 13 | 벌크 어드민 | branding, system-config, shop, compliance, monitoring, wellness 등 | 다수 | `frontend/src/components/admin/**` | **LEGACY** | `AdminDashboardB0KlA.css` import ~**39+** admin 파일 (테스트 제외 기준 대략) | 13 |
| 14 | PG 승인 (ops; LNB 제외 주석) | `/admin/ops/pg-approval` | `PgApprovalManagement` | `frontend/src/components/ops/PgApprovalManagement.js` | **PARTIAL** | menuItems: PG 승인 LNB 제외(P0) 주석 | 14 |
| 15 | (레퍼런스) | Admin Dashboard V2 | `AdminDashboardV2` | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` | **REFERENCE** | **1차 패스 리스타일 대상 아님** (SSOT §F) | — |

---

## 라우트 / LNB 인벤토리 메모

| 출처 | 용도 |
|------|------|
| `frontend/src/App.js` | 실제 `Route` 등록 (리다이렉트 포함) |
| `frontend/src/constants/adminRoutes.js` (`ADMIN_ROUTES`) | 어드민 경로 상수 |
| `frontend/src/components/dashboard-v2/constants/menuItems.js` | LNB 라벨·노출 |

**주의**

- **상담사** 화면은 `/consultant/*` (consultant-ops 아님).
- **경비** = `/erp/purchase` (`PurchaseManagement`). LNB「운영·재무」에 purchase가 없을 수 있으나 라우트·ALIGNED 크롬 존재.
- **공통코드** `/admin/common-codes`: 라우트·`ADMIN_ROUTES.COMMON_CODES` 존재. LNB에서 숨김 가능(시스템·설정 주석: 공통코드 제외).
- **센터 코드** `/admin/tenant-common-codes`: LNB「센터 코드」로 노출.
- **알림 클러스터**: LNB「메시지 발송」→ `PUSH_MONITORING`. `MANUAL_NOTIFICATION`·`/admin/notifications`는 설정/리다이렉트 앵커로 별도 존재. **페이지 크롬 ALIGNED** (본 배치).
- **PG 승인** `/admin/ops/pg-approval`: LNB 제외 정책 주석 있음. 라우트는 유지.

---

## 권장 순차 작업 큐 (maturity 「Clinic-OS 잔여」)

구현은 별도 배치. 이 문서의 권장 순서만:

1. `/admin/accounts` — AccountManagement
2. `/admin/common-codes` — CommonCodeManagement
3. `/admin/tenant-common-codes` — TenantCommonCodeManager
4. `/admin/package-pricing` — PackagePricing List/Detail
5. `/admin/sms-templates` — SmsTemplateManagementPage (`--clinic-os` 계약)
6. `/consultant/messages` · `/consultant/send-message/:id`
7. Financial leftovers — financial/salary 모달 (RefundHub tabs Clinic-OS 정리됨)
7b. ~~`/erp/refund-management`~~ — **ALIGNED** 2026-09-08
8. `/erp/budget` · `/erp/items`
9. 상담사 운영 일괄 (`clients` / `schedule` / `availability` / `consultation-records` / `salary-settlement`)
10. 벌크 어드민 (branding · system-config · shop · compliance · monitoring · wellness …)
11. `/admin/ops/pg-approval`
12. _(제외)_ Admin Dashboard V2 — REFERENCE only

**완료·ALIGNED로 이동**: consultation-logs (#854), push-monitoring / manual-notification / notifications (messaging cluster), **급여 관리 `/erp/salary`** (2026-09-06), **사용자 관리 `/admin/user-management` 셸** (2026-09-06; embed B0KlA pills 후속), **환불 관리 `/erp/refund-management`** (2026-09-08).

페이지별 체크리스트 복사용: [CLINIC_OS_ADMIN_VISUAL_SSOT.md §G](./CLINIC_OS_ADMIN_VISUAL_SSOT.md).

---

## Out of scope / 혼동 금지

| 혼동하기 쉬운 쌍 | 구분 |
|------------------|------|
| `PackageOptionCard` vs `/admin/package-pricing` | 카드는 매칭 관리 내 ALIGNED. 패키지 요금 **관리 페이지**는 LEGACY 잔여 |
| `/admin/mypage` vs `/admin/accounts` | 마이페이지 셸 ALIGNED. **계좌 관리**는 LEGACY |
| 사용자 관리 셸 vs embed 탭 | 페이지 셸 ALIGNED. Client/Consultant embed 내부 B0KlA pill 탭은 후속 |
| 재무 페이지 크롬 vs 환불/모달 | `/erp/financial`·dashboard 크롬 ALIGNED. RefundHub tabs Clinic-OS 정리; 재무/급여 모달은 P1 #10 |
| 재무 크롬 vs 환불 관리 페이지 | `/erp/financial` ALIGNED · `/erp/refund-management` **ALIGNED** (2026-09-08) |
| 급여 페이지 크롬 vs 급여 모달 | `/erp/salary` 페이지 크롬 ALIGNED. Config/Profile/Tax/Export 등 모달 B0KlA는 P1 #10 |
| Admin Dashboard V2 | 레퍼런스. 「Clinic-OS 잔여」1차 리스타일 대상 아님 |
| 알림 클러스터 vs SMS 템플릿 | push/manual/notifications 페이지 크롬 ALIGNED. `/admin/sms-templates`는 별도 PARTIAL |
| 본 문서 | **문서·큐**. UI 구현은 별도 PR |

---

**최종 업데이트**: 2026-09-08 — `/erp/refund-management` Clinic-OS 구현·lock test → **ALIGNED**. RefundHub B0KlA pill 제거. 사용자 관리 셸·급여 페이지 크롬 ALIGNED(모달 잔여 P1)는 기존 유지. **메뉴 권한** Critic PASS 핸드오프 추가(`clinic-os-menu-permissions.md`) — P1 #4c TO-BE 구현 큐.
