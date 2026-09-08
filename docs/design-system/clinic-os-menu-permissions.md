# 메뉴 권한 (`/admin/menu-permissions`) Clinic-OS TO-BE UI/UX 스펙 (Design Handoff)

**역할**: core-designer · **제품 UI 코드(JS/CSS/Java) 작성 금지** (구현은 core-coder)  
**대상**: `/admin/menu-permissions` (`MenuPermissionManagement`)  
**상태**: **Critic PASS 후 TO-BE** — 본 문서가 비주얼·IA·카피·락 정책의 **단일 핸드오프**.  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**트윈(크롬)**: RefundManagement Clinic-OS (QuietHeader / strip·rail / `__stage`) + UserManagement `TabChipRow` (역할 칩)  
**브랜치**: `cursor/clinic-os-menu-permissions-1665` · base `develop` · **do not merge**

**폐기 AS-IS**: ContentHeader「메뉴 권한 관리」+ 장문 부제 · `AdminDashboardB0KlA` / `mg-v2-ad-b0kla` · 좌측 역할 사이드바 · MGCard + VIEW/CREATE/UPDATE/DELETE 체크 · 본문 `menuCode`/`menuPath` 영문 노출.

---

## 1. 개요·배경 · §0.4

### 1.1 목적
센터 관리자(ADMIN)가 **이 센터**의 역할별 LNB 노출을 **센터 맞춤**으로 조정한다.  
역할 기본값(min-role / 시스템 기본)은 기본이고, 테넌트 `RoleMenuPermission` 행이 있으면 **센터 맞춤**이다.  
센터 관리 설정이 SSOT이며, 역할 템플릿은 기본값일 뿐이다.

### 1.2 §0.4

| 항목 | 요구 |
|------|------|
| **사용성** | 역할 칩 전환 → 레일로 기본/센터맞춤 파악 → 행에서 노출 토글 → 헤더「저장」. 클릭 최소. |
| **정보 노출** | 운영자 본문: **한국어 메뉴명** · 노출 토글 · 잠금(자물쇠+사유) · 「기본」/「센터 맞춤」뱃지. **비노출**: `menuCode`, `menuPath`, 영문 역할 코드, VIEW/CREATE/UPDATE/DELETE 4체크 UI. |
| **레이아웃** | AdminCommonLayout → ContentArea(`--clinic-os`) → **Header → role chips → 기본/센터맞춤 레일 → menu rows(`__stage`)**. |

---

## 2. ASCII 레이아웃 (위→아래)

```text
AdminCommonLayout title="메뉴 권한"
└─ ContentArea.menu-permission--clinic-os
   ├─ QuietHeader
   │     h1「메뉴 권한」
   │     subtitle「이 센터 · 역할별 LNB」
   │     [저장]  MGButton primary · height var(--mg-spacing-36)
   ├─ TabChipRow (역할 칩)  — UserManagement twin
   │     [관리자] [스태프] [상담사] [내담자]
   ├─ Badge rail (기본 / 센터 맞춤)  — Refund rail 밀도 트윈
   │     「기본 N · 센터 맞춤 M」  (동일 중간 컬럼 정렬 힌트)
   └─ __stage
         row: [한국어 메뉴명]  [기본|센터 맞춤]  [토글 | 🔒 사유]
```

**IA 원칙**

| 계층 | 콘텐츠 | 규칙 |
|------|--------|------|
| Header | 제목·부제·저장 | QuietHeader. ContentHeader/B0KlA **금지**. Save = 유일한 solid primary |
| Chips | 역할 전환 | `TabChipRow` only. 활성 primary / 비활성 outline |
| Rail | 기본·센터 맞춤 요약 | stage **위**. 행 뱃지와 **같은 중간 컬럼** 의미(기본 vs 센터 맞춤) |
| Stage | 메뉴 행 목록 | primary SSOT. 카드 그리드·4권한 체크 **폐기** |

---

## 3. 컴포넌트 인벤토리 (재사용 우선)

| 계층 | 컴포넌트 | 규약 |
|------|----------|------|
| Template | `AdminCommonLayout` + `ContentArea` | 필수. `mg-v2-ad-b0kla` **제거** |
| Organism | `MenuPermissionQuietHeader` (신규, Refund/Salary QuietHeader 트윈) | h1 + subtitle + Save `MGButton` |
| Molecule | `TabChipRow` | 역할 칩 SSOT |
| Organism | `MenuPermissionBadgeRail` (신규, RefundActionRail 밀도 트윈) | 기본/센터 맞춤 카운트. MoneyTodoList 복제 금지 |
| Organism | stage rows (기존 UI 재구성) | 한글명 · 뱃지 · 토글/락 |
| Atom | `MGButton` | Save primary h36; 토글은 native/switch 허용 시 토큰만 |
| Atom | `UnifiedLoading`, `SafeText`/`ErpSafeText` | 기존 |
| 금지 | `AdminDashboardB0KlA.css`, `MGCard` 권한 카드 그리드, `ActionBarButton` primary 스킨, 본문 code/path | |

공통 모듈: `/core-solution-common-modules` — TabChipRow · MGButton · AdminCommonLayout · ContentArea 우선.

---

## 4. 한국어 카피 (상수 권장 키 `MP_*` / 기존 `MENU_PERM_*` 정리)

| 키 | TO-BE |
|----|--------|
| `PAGE_TITLE` | **메뉴 권한** |
| `PAGE_SUBTITLE` | **이 센터 · 역할별 LNB** |
| `ARIA_MAIN` | 메뉴 권한 본문 |
| `SAVE_CTA` | 저장 |
| `ROLE_CHIPS_ARIA` | 역할 선택 |
| `BADGE_DEFAULT` | 기본 |
| `BADGE_CENTER` | 센터 맞춤 |
| `RAIL_ARIA` | 기본과 센터 맞춤 요약 |
| `LOCK_SCHEDULE_CREATE` | 상담사는 스케줄을 생성할 수 없습니다. 센터·스태프가 대리 등록합니다. |
| `LOCK_STAFF_OPS_FINANCE` | 스태프에게 운영·재무(장부·이번 달·세금·급여 승인·지급) 권한을 줄 수 없습니다. |
| `LOCK_MIN_ROLE` | 이 역할보다 높은 최소 역할이 필요한 메뉴입니다. |
| `EMPTY_MENUS` | 표시할 메뉴가 없습니다. |

역할 칩 라벨: **관리자** · **스태프** · **상담사** · **내담자** (영문 코드 칩 금지).

---

## 5. 뱃지 규칙 (기본 / 센터 맞춤)

| 뱃지 | 조건 | 표시 위치 |
|------|------|-----------|
| **기본** | 테넌트 `RoleMenuPermission` 활성 행 **없음** (`hasPermission === false`) — 역할/시스템 기본 | 행 **중간 컬럼** + 레일 카운트 |
| **센터 맞춤** | 테넌트 `RoleMenuPermission` 활성 행 **있음** (`hasPermission === true`) | 동일 중간 컬럼 + 레일 카운트 |

센터 관리 설정이 SSOT. 역할 템플릿은 기본값만 제공한다.

---

## 6. 하드 락 매트릭스 (fail-closed)

UI에서 토글 비활성 + 자물쇠 + 사유. BE grant/batch도 **동일 정책으로 거절**.

### 6.1 스케줄 생성 — **상담사(CONSULTANT) 탭만** 잠금

| 역할 칩 | 스케줄 생성 관련 메뉴 | 동작 |
|---------|----------------------|------|
| **상담사** | `CST_SCHEDULE` 및 path/menu가 스케줄 생성·등록에 해당하는 메뉴 (`/consultant/schedule` 등). `canCreate` 부여 시도 포함 | **하드 락** + `LOCK_SCHEDULE_CREATE` |
| **스태프** | 동일 메뉴 | **토글 가능** (admin/staff 대리 스케줄) |
| 관리자·내담자 | 해당 정책 비적용(내담자 스케줄 메뉴는 min-role·일반 규칙) | — |

근거: `DynamicPermissionServiceImpl.canRegisterScheduler` — CONSULTANT false · ADMIN/STAFF true.

### 6.2 운영·재무 — **스태프(STAFF) 탭** 잠금

STAFF에게 다음을 **부여 불가** (노출·생성 모두 fail-closed):

| 영역 | menuCode / path 힌트 |
|------|----------------------|
| 운영·재무 루트 | `ADM_ERP` |
| 이번 달(머니 콕핏) | `ERP_DASHBOARD` · `/erp/dashboard` |
| 장부(ledger) | `ERP_FINANCIAL` · `/erp/financial` |
| 세금 | `ERP_TAX` · `/erp/tax` |
| 급여 승인·지급 | `ERP_SALARY` · `/erp/salary` · `ERP_APPROVALS` · `/erp/approvals` |

사유: `LOCK_STAFF_OPS_FINANCE`.  
근거: `ErpRestrictedPermissions` + `MenuServiceImpl` STAFF에서 `ADM_ERP` strip.

### 6.3 최소 역할 (min-role)

역할 계층 ADMIN(4) > STAFF(3) > CONSULTANT(2) > CLIENT(1).  
`menu.minRequiredRole`보다 낮은 역할에는 부여 불가 — UI 락 + BE 거절 (`LOCK_MIN_ROLE`).

### 6.4 테넌트 격리

모든 API는 세션 `tenantId` 필수. 타 테넌트 roleId/menu 조작 불가.

---

## 7. 토큰·CTA·금지

| 항목 | 계약 |
|------|------|
| Save CTA 높이 | `var(--mg-spacing-36)` (36) — QuickExpense Critic 트윈 |
| Primary | dusty teal `MGButton` solid |
| Paper / stage | `neutral-50` · hairline `neutral-300` · `__stage` min-height 토큰 |
| B0KlA | **금지** (import · class · `--ad-b0kla-*`) |
| 왼쪽 4px accent | **금지** |
| 본문 menuCode/path | **금지** (운영자 body) |

---

## 8. 라우트·LNB

| 항목 | TO-BE |
|------|--------|
| Route | `/admin/menu-permissions` → `MenuPermissionManagement` 마운트 (`Navigate` 리다이렉트 **제거**) |
| 접근 | 센터 ADMIN (ProtectedRoute ADMIN). STAFF 직접 진입 차단 권장 |
| LNB | 「계정·권한」하위에 **메뉴 권한** (`/admin/menu-permissions`) — tenant-safe, ADMIN 중심 |

---

## 9. BE 핸드오프 (코더)

| 항목 | 요구 |
|------|------|
| Grant / batch | STAFF+ops-finance · CONSULTANT+schedule-create · min-role 위반 → `IllegalArgumentException` fail-closed |
| Tenant | `tenantId` 세션 스코프 유지 |
| DTO | 기존 `hasPermission` = 센터 맞춤 판정에 사용. 불필요 필드 확장 최소화 |
| Roles FE | `/api/v1/tenant/roles` 목록 사용(목업 제거 가능하면 제거) |

---

## 10. 완료 체크리스트 (코더·테스터)

- [ ] QuietHeader → TabChipRow → Badge rail → `__stage` 순서
- [ ] 제목「메뉴 권한」·부제「이 센터 · 역할별 LNB」
- [ ] Save CTA height 36 (`--mg-spacing-36`)
- [ ] B0KlA / `AdminDashboardB0KlA` / `mg-v2-ad-b0kla` 없음
- [ ] 본문에 menuCode/path 영문 없음
- [ ] 행: 한글명 · 기본/센터 맞춤 뱃지(중간 컬럼) · 토글 또는 자물쇠+사유
- [ ] CONSULTANT 스케줄 생성 락 · STAFF 운영재무 락 · BE fail-closed
- [ ] Route revive + LNB 항목
- [ ] `*.clinicOsChrome.test.js` lock (RefundManagement twin)
- [ ] 하드코딩 게이트: `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17 · `SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3 · `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

---

## 11. 참조

- `docs/design-system/REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md`
- `docs/design-system/QUICK_EXPENSE_CLINIC_OS_CRITIC_PASS.md`
- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/USER_MANAGEMENT_CLINIC_OS_SHELL_SPEC.md`
- `frontend/src/components/erp/__tests__/RefundManagement.clinicOsChrome.test.js`
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

**최종 업데이트**: 2026-09-08 — Critic PASS 핸드오프 최초 작성.
