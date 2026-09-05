# Clinic-OS 잔여 화면 인벤토리

**목적**: maturity queue 「Clinic-OS 잔여」— 이미 Clinic-OS에 정렬된 화면과, 아직 비주얼 정렬이 필요한 화면을 한곳에 둔다.  
**기준일**: 2026-09-05  
**범위**: **문서만** (제품 UI 코드 변경 없음).  
**브랜치 인벤토리**: `develop` @ `beta0629/MindGarden`.

---

## 관련 문서 (SSOT·핸드오프)

| 문서 | 역할 |
|------|------|
| [CLINIC_OS_ADMIN_VISUAL_SSOT.md](./CLINIC_OS_ADMIN_VISUAL_SSOT.md) | 운영자/어드민 비주얼 **SSOT**. Default format = Admin Dashboard V2. |
| [MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md](./MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md) | 매칭 관리 Clinic-OS 정렬 핸드오프 |
| [TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md](./TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md) | 테넌트 PG 설정 Clinic-OS 정렬 핸드오프 |
| [PENCIL_DESIGN_GUIDE.md](./PENCIL_DESIGN_GUIDE.md) | 역사(B0KlA) — **신규 어드민 금지** |
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
| 재무 크롬 | `/erp/financial`, `/erp/dashboard` | `FinancialManagement`, `ErpDashboard` | Ledger/Money quiet header+strip. **모달·환불 허브는 PARTIAL 잔여** |
| 패키지 옵션 카드 | (매칭 관리 내) | `PackageOptionCard` | **패키지 요금 관리(`/admin/package-pricing`)와 별개** |
| 마이페이지 셸 | `/admin/mypage`, `/consultant/mypage` | `MyPage` | `mg-mypage-clinic-os`, MypageQuietHeader/Strip |
| 상담사 대시보드 | `/consultant/dashboard` | `ConsultantDashboardV2` | `mg-v2-clinic-os` |
| 사용자 관리 KPI만 | `/admin/user-management` | Client/Consultant/Staff stats | KPI = mapping-management-summary 패턴. **페이지 셸은 PARTIAL** (B0KlA pills) |
| LNB 정리 | shell | `menuItems` + Flyway | ops/IA. 페이지 크롬 아님 |

---

## 우선순위 잔여 백로그

### P0 — 운영자가 매일 봄 (LNB 노출·고트래픽)

| # | LNB 라벨 | 라우트 | 컴포넌트 | 파일 | 상태 | 근거 / 메모 | 권장 순번 |
|---|----------|--------|----------|------|------|-------------|-----------|
| 1 | 상담일지 (그룹: 상담·기록) | `/admin/consultation-logs` · `/consultant/consultation-logs` | `ConsultationLogView` → `ConsultationLogViewPage` | `frontend/src/components/admin/ConsultationLogView.js`, `.../consultation-log-view/ConsultationLogViewPage.js` | **LEGACY** | B0KlA 셸. SSOT §F #6 | 1 |
| 2a | 메시지 발송 | `/admin/push-monitoring` | `AdminPushMonitoringPage` | `frontend/src/components/admin/PushMonitoring/AdminPushMonitoringPage.jsx` | **LEGACY** | `mg-v2-ad-b0kla` 루트. LNB「알림·메시지」하위 | 2 |
| 2b | 수동 알림 발송 (시스템·설정) | `/admin/manual-notification` | `AdminManualNotificationPage` | `frontend/src/components/admin/manual-notification/AdminManualNotificationPage.js` | **LEGACY** | B0KlA import | 3 |
| 2c | (라우트 존재; LNB 그룹 앵커) | `/admin/notifications` | `AdminNotificationsPage` | `frontend/src/components/admin/AdminNotificationsPage.js` | **LEGACY** | B0KlA + `border-left` 4px 악센트 누수 위험 | 4 |
| 3 | 급여 관리 | `/erp/salary` | `SalaryManagement` | `frontend/src/components/erp/SalaryManagement.js` | **PARTIAL** | `SalaryManagement.clinicOsChrome.test` 있음. 다수 `mg-v2-ad-b0kla__*` 잔존. SSOT §F #3 | 5 |
| 4 | 사용자 관리 | `/admin/user-management` | `UserManagementPage` | `frontend/src/components/admin/UserManagementPage.js` | **PARTIAL** | KPI strip 완료. 셸: B0KlA pill toggle / import 제거 필요 | 6 |

### P1 — 자주 쓰지만 2차

| # | LNB 라벨 | 라우트 | 컴포넌트 | 파일 | 상태 | 근거 / 메모 | 권장 순번 |
|---|----------|--------|----------|------|------|-------------|-----------|
| 5 | 계좌 관리 (계정·권한) | `/admin/accounts` | `AccountManagement` | `frontend/src/components/admin/AccountManagement.js` | **LEGACY** | **마이페이지와 혼동 금지** | 7 |
| 6a | (LNB 숨김 가능; 라우트 존재) | `/admin/common-codes` | `CommonCodeManagement` | `frontend/src/components/admin/CommonCodeManagement.js` | **PARTIAL** | CSS에 Clinic-OS 주장, B0KlA 클래스/import 잔존 | 8 |
| 6b | 센터 코드 (시스템·설정) | `/admin/tenant-common-codes` | `TenantCommonCodeManager` | `frontend/src/components/admin/TenantCommonCodeManager.js` | **LEGACY** | LNB「센터 코드」. 플랫폼 공통코드와 별개 | 9 |
| 7 | 패키지 요금 관리 | `/admin/package-pricing` | `PackagePricingListPage` / `PackagePricingDetailPage` | `frontend/src/components/admin/package-pricing/pages/` | **LEGACY** | forest/B0KlA. **PackageOptionCard와 별개** | 10 |
| 8 | SMS 템플릿 관리 | `/admin/sms-templates` | `SmsTemplateManagementPage` | `frontend/src/components/admin/sms-templates/SmsTemplateManagementPage.js` | **PARTIAL** | B0KlA 없음. `--clinic-os` 계약 없음 | 11 |
| 9 | 상담사 메시지 | `/consultant/messages`, `/consultant/send-message/:id` | `ConsultantMessages`, `ConsultantMessageScreen` | `frontend/src/components/consultant/ConsultantMessages.js`, `ConsultantMessageScreen.js` | **LEGACY** | 상담사 LNB. `/consultant/*` (consultant-ops 아님) | 12 |
| 10 | (재무 잔여) | `/erp/financial` 환불 허브·모달 | `FinancialRefundHubLayout` 등 | `frontend/src/components/erp/financial/FinancialRefundHubLayout.js` | **PARTIAL** | 페이지 크롬 ALIGNED. 환불 허브·급여 모달 `mg-v2-ad-b0kla` 잔여 | 13 |

### P2 — 일일 노출 낮음 / 대량 잔여

| # | LNB 라벨 | 라우트 | 컴포넌트 | 파일 | 상태 | 근거 / 메모 | 권장 순번 |
|---|----------|--------|----------|------|------|-------------|-----------|
| 11a | 예산 관리 | `/erp/budget` | `BudgetManagement` | `frontend/src/components/erp/BudgetManagement.js` | **LEGACY** | 악센트 KPI 카드 | 14 |
| 11b | (라우트; LNB 비노출 가능) | `/erp/items` | `ItemManagement` | `frontend/src/components/erp/ItemManagement.js` | **LEGACY** | 악센트 KPI 카드 | 15 |
| 12 | 상담사 운영 | `/consultant/clients`, `/consultant/schedule`, `/consultant/availability`, `/consultant/consultation-records`, `/consultant/salary-settlement` | Renewal/레거시 쌍 존재 | `frontend/src/components/consultant/*` | **LEGACY** | 대시보드만 ALIGNED. B0KlA 잔존 | 16 |
| 13 | 벌크 어드민 | branding, system-config, shop, compliance, monitoring, wellness 등 | 다수 | `frontend/src/components/admin/**` | **LEGACY** | `AdminDashboardB0KlA.css` import ~**39+** admin 파일 (테스트 제외 기준 대략) | 17 |
| 14 | PG 승인 (ops; LNB 제외 주석) | `/admin/ops/pg-approval` | `PgApprovalManagement` | `frontend/src/components/ops/PgApprovalManagement.js` | **PARTIAL** | menuItems: PG 승인 LNB 제외(P0) 주석 | 18 |
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
- **알림 클러스터**: LNB「메시지 발송」→ `PUSH_MONITORING`. `MANUAL_NOTIFICATION`·`/admin/notifications`는 설정/리다이렉트 앵커로 별도 존재.
- **PG 승인** `/admin/ops/pg-approval`: LNB 제외 정책 주석 있음. 라우트는 유지.

---

## 권장 순차 작업 큐 (maturity 「Clinic-OS 잔여」)

구현은 별도 배치. 이 문서의 권장 순서만:

1. `/admin/consultation-logs` (+ `/consultant/consultation-logs`) — ConsultationLogView 셸
2. `/admin/push-monitoring` — AdminPushMonitoringPage
3. `/admin/manual-notification` — AdminManualNotificationPage
4. `/admin/notifications` — AdminNotificationsPage (4px 악센트 제거 포함)
5. `/erp/salary` — SalaryManagement B0KlA 클래스 정리 (clinicOsChrome 완성)
6. `/admin/user-management` — UserManagementPage 셸 (pill/B0KlA import 제거)
7. `/admin/accounts` — AccountManagement
8. `/admin/common-codes` — CommonCodeManagement
9. `/admin/tenant-common-codes` — TenantCommonCodeManager
10. `/admin/package-pricing` — PackagePricing List/Detail
11. `/admin/sms-templates` — SmsTemplateManagementPage (`--clinic-os` 계약)
12. `/consultant/messages` · `/consultant/send-message/:id`
13. Financial leftovers — RefundHub + financial/salary 모달
14. `/erp/budget` · `/erp/items`
15. 상담사 운영 일괄 (`clients` / `schedule` / `availability` / `consultation-records` / `salary-settlement`)
16. 벌크 어드민 (branding · system-config · shop · compliance · monitoring · wellness …)
17. `/admin/ops/pg-approval`
18. _(제외)_ Admin Dashboard V2 — REFERENCE only

페이지별 체크리스트 복사용: [CLINIC_OS_ADMIN_VISUAL_SSOT.md §G](./CLINIC_OS_ADMIN_VISUAL_SSOT.md).

---

## Out of scope / 혼동 금지

| 혼동하기 쉬운 쌍 | 구분 |
|------------------|------|
| `PackageOptionCard` vs `/admin/package-pricing` | 카드는 매칭 관리 내 ALIGNED. 패키지 요금 **관리 페이지**는 LEGACY 잔여 |
| `/admin/mypage` vs `/admin/accounts` | 마이페이지 셸 ALIGNED. **계좌 관리**는 LEGACY |
| 사용자 관리 KPI vs 페이지 셸 | KPI strip만 정렬. 셸(B0KlA pills)은 P0 #4 |
| 재무 페이지 크롬 vs 환불/모달 | `/erp/financial`·dashboard 크롬 ALIGNED. RefundHub·모달은 P1 #10 |
| Admin Dashboard V2 | 레퍼런스. 「Clinic-OS 잔여」1차 리스타일 대상 아님 |
| 본 문서 | **문서·큐만**. UI 구현·PR 범위에 넣지 말 것 |

---

**최종 업데이트**: 2026-09-05
