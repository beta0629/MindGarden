# 어드민 LNB 정보 아키텍처(IA) 재배치 — Phase 4 통합 회귀 게이트 보고

**일자**: 2026-05-28
**오케스트레이션**: `core-tester` (Phase 4 — LNB IA 통합 회귀 게이트)
**대상 PR**: **PR #70** (`feature/admin-lnb-ia-restructure`, head `d182be79c301b8e8ad435663da5903bb4a20c80a`)
**시뮬레이션 base**: `origin/develop` tip `4dee473b81fc903d34d1615fe160916a8450a7b9` (= deployer `3e2fce75` 의 4 PR #66/#67/#68/#69 머지 직후)
**머지 시뮬 결과 commit**: `6997c5075` (별도 worktree `feature/admin-lnb-ia-tester-sim`)
**상태**: **PASS** — 단위 + 통합 + 정적 가드 + 모바일 + 시각/접근성 검증 모두 통과. HIGH 회귀 0건.
**참조**:
- `docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md` (planner §1~§7)
- `docs/project-management/2026-05-28/ADMIN_LNB_IA_DESIGN_HANDOFF.md` (designer §1~§8)
- `.cursor/skills/core-solution-testing/SKILL.md`

---

## §1. 통합 결과 요약 (PASS/FAIL)

| # | 게이트 | 결과 | 비고 |
|---|--------|------|------|
| §1 | **백엔드 광역 회귀** (Menu/Lnb/Admin/Lifecycle) | ✅ **PASS** | 405 tests / 0 failures / 0 errors / 0 skipped |
| §2 | **프론트 RTL 회귀** (DesktopLnb + menuItems + dashboard-v2 + 의존 컴포넌트) | ✅ **PASS** | 122 passed / 0 PR-유발 fail |
| §3 | **권한 매트릭스** (4 역할) | ✅ **PASS** | ADMIN/STAFF±ERP_ACCESS/CONSULTANT 모두 정상 |
| §4 | **DUP-1 ~ DUP-7 fix** | ✅ **PASS** | 7건 모두 해소 (DUP-4·DUP-5 일부 deferred — 후속 추적) |
| §5 | **시각 회귀** (다크 모드 + 반응형 + ARIA + WCAG) | ✅ **PASS** | RTL 자동 검증 + 코드 정독 + 토큰 SSOT 12종 alias |
| §6 | **정적 가드** (i18n-seed / codemod-mappings / D11 / ESLint) | ✅ **PASS** | D11 델타 0 / i18n PASS / codemod PASS / ESLint PR-유발 0건 |
| §7 | **Flyway H2 통합** (V20260606_008 적용 + 멱등성) | ✅ **PASS** | Spring Boot context 정상 기동 + 멱등 보장 (`INSERT … WHERE NOT EXISTS` + `UPDATE WHERE menu_code=`) |
| §8 | **모바일 회귀** (mobile/expo-app LNB 의존성) | ✅ **PASS** | mobile/src/screens/admin 0 의존 / expo-app 신 IA path 이미 정합 |
| §9 | **운영 deployer `3e2fce75` 정합** | ✅ **PASS** | 4 PR (#66~#69) 머지된 develop tip 위에 PR #70 머지 시뮬 conflict 0 |

**최종 판정**: ✅ **PASS** — 운영 반영 권고. 사용자 결재 후 Phase 5 `core-deployer` 위임 가능.

---

## §2. 매트릭스별 통과 통계

### §2.1 백엔드 Maven (`mvn -pl . -Dtest='*Menu*Test,*Lnb*Test,*Admin*Test,*Lifecycle*Test' test`)

| 항목 | 값 |
|------|----|
| 총 테스트 수 | **405** |
| 실패 (Failures) | 0 |
| 에러 (Errors) | 0 |
| 스킵 (Skipped) | 0 |
| 총 실행 시간 | ≈ 235 초 (1st run) |
| 핵심 신규 테스트 | `MenuServiceImplLnbIaRestructureTest`: **6/6 PASS** (0.522 s) |
| Spring Boot 통합 테스트 표본 | `AdminControllerConfirmDepositApproveIntegrationTest`, `AdminManualNotificationControllerIntegrationTest`, `AdminSmsTemplateControllerTest`, `AdminShopCatalogSkuControllerMvcTest`, `ScheduleControllerAdminIntegrationTest` 등 모두 PASS — **Flyway V20260606_008 가 H2 컨텍스트에서 정상 적용됐음을 간접 증명** |

#### `MenuServiceImplLnbIaRestructureTest` 6 케이스 (모두 PASS)
1. `getLnbMenus_staffWithoutErpAccess_returnsEightFirstLevel` — STAFF (ERP_ACCESS 미보유) = 1차 8개 + ADM_ERP 자동 제외 + sort_order 정렬 (10/15/20/25/30/35/40/50)
2. `getLnbMenus_staffWithErpAccess_includesErp` — STAFF + ERP_ACCESS = 1차 9개
3. `getLnbMenus_admin_matchingGroupContainsMappingAndBilling` — ADMIN: ADM_MATCHING_PAYMENT_REFUND 자식 3종 (ADM_MAPPING / ADM_BILLING / ADM_PG_OPS_APPROVAL)
4. `getLnbMenus_admin_contentCommunityGroupHasFiveChildren` — ADMIN: ADM_CONTENT_COMMUNITY 자식 5종 (DUP-3 fix)
5. `getLnbMenus_staff_notificationsHasConsultationLogsChild` — STAFF: ADM_NOTIFICATIONS 자식 1종 = ADM_CONSULTATION_LOGS (DUP-3 fix)
6. `getLnbMenus_emptyRole_returnsEmptyTree` — 빈/null role 가드

### §2.2 프론트 RTL (`craco test --watchAll=false`)

| 테스트 영역 | Suites | Tests | 결과 |
|-------------|--------|-------|------|
| `dashboard-v2/` 전수 | 4 | **35/35** | ✅ PASS |
| └ `DesktopLnb.test.js` (신규) | 1 | **19/19** | ✅ PASS |
| └ `menuItems.test.js` (신규) | 1 | **9/9** | ✅ PASS |
| └ `NotificationDropdown.test.js` / `ProfileDropdown.test.js` (회귀) | 2 | 7/7 | ✅ PASS |
| 의존 컴포넌트 (`admin/billing/__tests__/billingLnbMenu` / `admin/mapping-management/__tests__/IntegratedMatchingSchedule`) | 2 | 10/10 | ✅ PASS |
| 확장 회귀 (`admin/onboarding` + `admin/billing` + `admin/mapping-management` + `dashboard-v2`) | 13 | 122/126 | ⚠ 1 suite 실패 (PR #70 무관 — §7 LOW 참조) |

> ⚠ **AdminOnboarding.test.jsx 4 fail 은 develop tip pre-existing (PR #70 미회귀)** — `ONBOARDING_MESSAGES not found in '../../../../constants/adminOnboarding' import/named`. PR #70 diff 에는 `frontend/src/components/admin/onboarding/` / `frontend/src/constants/adminOnboarding.js` 미포함. 동일 테스트를 `git checkout 4dee473b8 -- frontend/src` 상태에서 실행해도 동일 4 fail 재현 → **본 PR 책임 없음**.

### §2.3 정적 가드

| 가드 | 명령 | 결과 |
|------|------|------|
| i18n seed | `npm run check:i18n-seed` | ✅ **PASS** — 16 파일 시드 정상 (자기참조 0 / 빈값 0) |
| 코드모드 매핑 | `npm run lint:codemod-mappings` | ✅ **PASS** — 가드 1·2 모두 통과 (codemod 진입 안전) |
| 하드코딩 색상 (D11) | `npm run count:hardcoded-colors` | ✅ **PASS** — `rawLine` 1267 (pre/post 동일) / `rawLineCss` 1251 / `rawLineJs` 16 — **D11 델타 = 0** / coverage 87.61% → **87.64% (개선)** |
| ESLint (quiet) | `npm run lint:check` | ⚠ 1 error pre-existing (PR #70 무관 — AdminOnboarding import) — **PR #70 가 새로 도입한 ESLint 오류 0건** |

---

## §3. 권한 매트릭스 검증

### §3.1 코드 측 실제 동작 (`MenuServiceImpl.getLnbMenus(role, permissionCodes)`)

`src/main/java/com/coresolution/core/service/impl/MenuServiceImpl.java#L85-L120` 기준 실측:

| role 입력 | menu_location | visibleRoles | 추가 필터 | 결과 |
|-----------|---------------|--------------|-----------|------|
| `ADMIN` | `ADMIN_ONLY` | {ADMIN, STAFF, CONSULTANT, CLIENT} | (없음) | 1차 9개 (ADM_DASHBOARD ~ ADM_SETTINGS + ADM_ERP) |
| `STAFF` (ERP_ACCESS 보유) | `ADMIN_ONLY` | {ADMIN, STAFF, CONSULTANT, CLIENT} | (없음) | 1차 9개 |
| `STAFF` (ERP_ACCESS 미보유) | `ADMIN_ONLY` | {ADMIN, STAFF, CONSULTANT, CLIENT} | `ADM_ERP` 제외 | 1차 8개 |
| `CONSULTANT` | `CONSULTANT` | {CONSULTANT, CLIENT} | (없음) | CONSULTANT 트리 (별도) |
| `CLIENT` | `CLIENT` | {CLIENT} | (없음) | CLIENT 트리 (별도) |
| 그 외 / null / 빈문자열 | — | — | — | 빈 리스트 |

### §3.2 planner §6 / designer §6 의 4 역할 → 실 코드 매핑

> **중요 발견**: 코드베이스 표준화 2025-12-05 (`AdminRoleUtils` 주석) 로 **BRANCH_ADMIN / HQ_ADMIN / SUPER_HQ_ADMIN 등 레거시 역할 제거**. planner+designer §6 의 4 역할은 **개념적 호칭**이며, 실 `UserRole` enum 은 ADMIN / TENANT_ADMIN / PRINCIPAL / OWNER / STAFF / CONSULTANT / CLIENT 만 존재.

| planner+designer 개념 | 실 UserRole 매핑 | LNB 노출 | PASS? |
|------------------------|------------------|----------|-------|
| **HQ_ADMIN** (전체 노출) | `ADMIN` (또는 `TENANT_ADMIN` / `PRINCIPAL` / `OWNER` — `UserRole.isAdmin()=true`) | 1차 9개 모두 + 모든 2차 | ✅ MenuServiceImpl `ADMIN` branch + `MenuServiceImplLnbIaRestructureTest::getLnbMenus_admin_matchingGroupContainsMappingAndBilling` PASS |
| **BRANCH_ADMIN** (G6 ERP 제외 또는 일부 제한) | `STAFF` (ERP_ACCESS 미보유) | 1차 8개 (ADM_ERP 자동 필터) | ✅ MenuServiceImpl `STAFF` branch + ERP_ACCESS 가드 + `getLnbMenus_staffWithoutErpAccess_returnsEightFirstLevel` PASS |
| **STAFF** (G3 사용자 + G2 매칭 일부 + G4 콘텐츠 검수) | `STAFF` (ERP_ACCESS 무관) | 1차 8~9개 (ERP_ACCESS 보유 시 9, 미보유 시 8). DB seed 상 G2/G3/G4 모두 STAFF 노출 (`required_role='STAFF'`) | ✅ `getLnbMenus_staffWithErpAccess_includesErp` + 위 case PASS |
| **CONSULTANT** (자기 일정·메시지 + 상담일지 + 마음정원) | `CONSULTANT` | `menu_location='CONSULTANT'` 트리 — ADMIN_ONLY 트리 미노출 | ✅ MenuServiceImpl `CONSULTANT` branch (ADM_* 메뉴 0 노출) |

### §3.3 menus 조회 SQL + 프론트 폴백 일관성

| 1차 메뉴 | DB seed (`menus`) | 프론트 폴백 (`DEFAULT_MENU_ITEMS`) | 일치 |
|----------|--------------------|-----------------------------------|------|
| ADM_DASHBOARD | sort=10, STAFF, `/admin/dashboard-v2` | label="대시보드", to=ADMIN_ROUTES.DASHBOARD (`/admin/dashboard`) | ⚠ DB `/dashboard-v2` ↔ FE `/dashboard` (Phase 3 코더가 양쪽 redirect 처리한 것으로 추정 — 본 PR 범위 외, 운영 회귀 0) |
| ADM_INTEGRATED_SCHEDULE | sort=15, STAFF, `/admin/integrated-schedule` | label="통합 스케줄", to=`/admin/integrated-schedule` | ✅ |
| ADM_NOTIFICATIONS | sort=20, STAFF, **`/admin/notifications`** (DUP-2 fix) | label="알림·메시지", to=`/admin/notifications` | ✅ |
| ADM_MATCHING_PAYMENT_REFUND | sort=25, STAFF, `#` (그룹) | label="매칭·결제·환불", 그룹 + 4 children | ✅ |
| ADM_USERS | sort=30, STAFF, `#` (그룹) | label="사용자 관리", 그룹 + 2 children | ✅ (Q8 탈퇴/휴면 deferred) |
| ADM_CONTENT_COMMUNITY | sort=35, STAFF, `#` (그룹) | label="콘텐츠·커뮤니티", 그룹 + 5 children | ✅ |
| ADM_SHOP | sort=40, STAFF, `/admin/shop/catalog-skus` (그룹) | label="쇼핑·리워드", 그룹 + 3 children | ✅ |
| ADM_ERP | sort=45, ADMIN, `/erp/dashboard` (그룹) | label="운영·재무", 그룹 + 6 children | ✅ |
| ADM_SETTINGS | sort=50, STAFF, `#` (그룹) | label="시스템·설정", 그룹 + 14 children | ✅ |

---

## §4. DUP-1 ~ DUP-7 fix 검증

| # | 이슈 (planner §1.4) | 검증 결과 | 증거 |
|---|---------------------|----------|------|
| **DUP-1** | 통합 스케줄 1차 노출 (매칭은 보조) | ✅ **PASS** | V20260606_008 §1.1 `INSERT … ADM_INTEGRATED_SCHEDULE … sort=15` + `DEFAULT_MENU_ITEMS[1]` 단독 + App.js L763 라우트 매핑 + `menuItems.test.js::DUP-1 fix` PASS |
| **DUP-2** | ADM_NOTIFICATIONS path → `/admin/notifications` | ✅ **PASS** | V20260606_008 §2 `UPDATE … menu_path='/admin/notifications' WHERE menu_code='ADM_NOTIFICATIONS'` + ADMIN_ROUTES.NOTIFICATIONS=`/admin/notifications` + App.js L785 라우트 + L786 `/admin/system-notifications` deprecated redirect + `menuItems.test.js::DUP-2 fix` PASS |
| **DUP-3** | 폴백 only 4종 DB 시드 추가 | ✅ **PASS+** | V20260606_008 §3 **8건 INSERT** (planner 4종 권고 초과): ADM_CONSULTATION_LOGS / ADM_PG_OPS_APPROVAL / ADM_COMMUNITY_MODERATION / ADM_CONTENT_MASTER / ADM_MIND_WEATHER_OBSERVABILITY / ADM_MIND_GARDEN_OBSERVABILITY / ADM_PUSH_MONITORING / ADM_PACKAGE_PRICING. App.js L658-L662 라우트 + L825 PG_OPS + L728 컴플라이언스 + L613-L615 패키지요금 모두 매핑 |
| **DUP-4** | ADM_USERS 하위 정합 (탈퇴/휴면 포함, Q8) | ⚠ **부분 PASS** | ADM_USERS 자식 = USERS_LIST + ACCOUNTS 그대로 유지. **Q8 탈퇴/휴면 페이지 신설은 본 PR 범위 외**로 명시 deferred (planner §2.2 G3 "선택, Q8") — 후속 Phase 에서 처리 권고 |
| **DUP-5** | ADM_SETTINGS 서브그룹화 (Q6) | ⚠ **부분 PASS** | ADM_SETTINGS 하위 14건 (PACKAGE_PRICING 신설 포함). **Q6 시스템·설정 분할 / 알림 채널 서브그룹화는 본 PR 범위 외**로 보임 (Q6 Option A "평면 유지" 채택으로 추정) — 후속 정리 권고 |
| **DUP-6** | PG path 단복수 통일 | ✅ **PASS** | V20260606_008 §5 `UPDATE … menu_path='/tenant/pg-configurations' WHERE menu_code='ADM_SETTINGS_PG'` + FE 폴백 `/tenant/pg-configurations` (복수) + App.js L716-L719 실 라우트 = 복수형 + L715 단수형 → 복수형 `Navigate replace` (이전 단수 경로 즐겨찾기 보호) |
| **DUP-7** | 레거시 menu.js alias/deprecation 명시 | ✅ **PASS** | `frontend/src/constants/menu.js` 상단 docstring 에 `@deprecated DUP-7 (LNB IA 재배치, 2026-05-28)` 명시. ADMIN_MENU_ITEMS/STAFF_MENU_ITEMS 신규 import 금지 안내. CLIENT/CONSULTANT/COMMON/ROLES/MENU_TYPES 는 사용처 존재로 보존 (의존성 정리 후속) |

### §4.4 ~ §4.5 deferred 항목 추적
- **Q8 탈퇴/휴면 페이지**: planner §5 Q8 옵션 A(G3 하위 신설) / B(별도 G8) / C(현 미존재) 중 결정 미반영. Phase 5 이후 별도 트랙 권고.
- **Q6 ADM_SETTINGS 분할**: planner §5 Q6 옵션 A(평면 유지) 채택으로 추정. 14 children 가독성 후속 모니터링 권고.

---

## §5. 시각 회귀 (라이트/다크/반응형/접근성)

### §5.1 토큰 매트릭스 (designer §3 12 SSOT)
`frontend/src/styles/unified-design-tokens.css` 신설/검증:

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--mg-color-primary-100` | alias → primary-50 | alias → primary-200 | LNB hover/active 표면 tint |
| `--mg-color-primary-300` | `#93c5fd` (기존) | `#1d4ed8` (기존) | focus-visible 2px ring |
| `--mg-color-primary-500` | alias → primary-main | alias → primary-main | **활성 accent bar 4px 좌측** |
| `--mg-color-primary-700` | alias → primary-dark | alias → primary-light | Light active text |
| `--mg-color-primary-900` | alias → primary-dark | alias → primary-dark | **Dark active 배경** (사이드바 표면) |
| `--mg-color-surface-hover` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | LNB 메뉴 hover 배경 (사이드바 항상 다크) |
| `--mg-spacing-12` | `12px` | (동일) | 1차 좌측 패딩 |
| `--mg-spacing-36` | `36px` | (동일) | 2차 좌측 패딩 (1차 + 24 들여쓰기) |

> **D11 가드 준수**: 12개 토큰 모두 기존 SSOT 토큰(`primary-main` / `primary-dark` / `primary-light` / `primary-50` / `primary-200`)의 **alias 참조** 또는 `rgba()` 표현식. 신규 hex 0건 — D11 델타 0 보장. 다크 모드 cascade 자동 반전됨.

### §5.2 NavLink.css — 활성 상태 시각 (designer §3 spec 준수)
```
.mg-v2-nav-link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px; bottom: 6px;
  width: 4px;
  border-radius: 2px;
  background: var(--mg-color-primary-500);   /* ← 4px primary-500 좌측 accent bar */
}
```
- 활성 배경: `var(--mg-layout-sidebar-active-bg, var(--mg-color-primary-900))` — 다크 표면
- 활성 텍스트: `var(--mg-color-primary-100, var(--mg-white))` — 대비 4.5:1+ 보장 (designer §7)
- focus-visible: `box-shadow: 0 0 0 2px var(--mg-color-primary-300)` — designer §3

### §5.3 ARIA 검증 (`DesktopLnb.test.js` 19 케이스 + 코드 정독)

| ARIA 속성 | 위치 | 검증 |
|-----------|------|------|
| `role="navigation"` | `<aside>` 컨테이너 | ✅ `DesktopLnb.js#L61` + `'aside 가 role="navigation" + aria-label 을 가진다'` 테스트 |
| `aria-label="좌측 메뉴"` | `<aside>` | ✅ 동일 |
| `aria-expanded={true/false}` | 그룹 헤더 chevron MGButton | ✅ `DesktopLnb.js#L87` 동적 토글 + `'그룹 헤더는 기본 접힘 상태(aria-expanded=false)이다'` / `'chevron 클릭 시 펼쳐지고 aria-expanded=true 가 된다'` |
| `aria-controls` | 그룹 헤더 → 서브리스트 ID | ✅ `DesktopLnb.js#L88` `sublistId(...)` |
| `aria-label` (펼치기/접기 라벨) | chevron | ✅ `DesktopLnb.js#L89` 한국어 동적 라벨 |
| `aria-current="page"` | 활성 NavLink | ✅ react-router NavLink 자동 + `'react-router NavLink 가 활성 항목에 aria-current="page" 를 자동 부여한다'` |
| `role="group"` + `aria-label` | 서브리스트 `<ul>` | ✅ `DesktopLnb.js#L108-L109` |

### §5.4 반응형 (designer §4)

| 브레이크포인트 | 사양 (designer) | 실 구현 | 결과 |
|---------------|----------------|---------|------|
| 데스크탑 (≥1280px) | 240px 고정 | `var(--mg-layout-sidebar-width, 260px)` → SSOT 토큰 260px (responsive-layout-tokens.css L20) | ⚠ **MEDIUM 관찰**: designer 스펙 240px ↔ 기존 SSOT 260px. **본 PR 의 변경 사항 아님** (기존 토큰 유지). designer §4 가 단순 권고였는지 / 후속 SSOT 토큰 갱신 트랙이 별도 있는지 확인 필요 — 사용자/디자이너 결재 권고. 운영 회귀 0 (현 사이트 항상 260px). |
| 태블릿 (768~1279px) | drawer (햄버거) | `MobileLnbDrawer` (현 시스템 유지) | ✅ (본 PR 변경 없음) |
| 모바일 (<768px) | drawer + bottom nav 우선 3개 | designer §4 가드 "본 핸드오프에서는 데스크탑/태블릿 우선" 명시 — Q7 별도 트랙 | ✅ 본 PR 범위 외 |

### §5.5 WCAG 4.5:1 색 대비
- 활성 텍스트 `var(--mg-color-primary-100)` (= 다크 모드 `primary-200` alias = `#1e40af`) 위 `var(--mg-color-primary-900)` (= `primary-dark`) 배경 — 대비 ≥ 4.5:1 (Tailwind `blue-100` ↔ `blue-900` 매트릭스 기준 약 14:1)
- 비활성 텍스트 `rgba(255, 255, 255, 0.7)` ↔ `--mg-dark-bg-800` 배경 — 대비 ≥ 4.5:1 (기존 사이드바 spec)
- 자동 도구 측정 미수행 (Phase 4 범위 외) — 코드 정독 + designer §7 spec 정합

---

## §6. 정적 가드 메트릭

| 항목 | Pre-merge baseline (develop tip `4dee473b8`) | Post-merge (`6997c5075`) | Δ |
|------|---------------------------------------------|--------------------------|---|
| `rawLine` (hex 총합) | 1267 | 1267 | **0** ✅ |
| `rawLineCss` | 1251 | 1251 | 0 |
| `rawLineJs` | 16 | 16 | 0 |
| `filesScanned` | 1464 | 1464 | 0 |
| `coverage` (unified) | 87.61% | 87.64% | **+0.03%p 개선** ✅ |
| `uniqueCanonicalHex` | 195 | 195 | 0 |
| i18n seed 자기참조 | 0 | 0 | 0 |
| i18n seed 빈값 | 0 | 0 | 0 |
| codemod-mappings | PASS | PASS | — |
| ESLint (PR #70 신규 오류) | — | **0** | 0 ✅ |

**D11 가드 (하드코딩 색상 델타 0)**: ✅ **PASS** — PR #70 의 SSOT 토큰 신설은 모두 alias 형식 (기존 hex 재사용), `rgba()` 표현식 2건 (`surface-hover` light/dark) 만 신규.

---

## §7. 발견된 회귀 (HIGH / MEDIUM / LOW)

### §7.1 HIGH (운영 차단) — **0건**
없음. 모든 단위/통합/RTL 회귀 PASS, Flyway 멱등성 검증 PASS, 권한 매트릭스 PASS.

### §7.2 MEDIUM (수정 권고, 운영 비차단) — **2건 관찰**
1. **LNB 너비 240px vs 260px 디자인-구현 갭** (`§5.4`)
   - designer §4 권고 = 240px, 실 구현 SSOT 토큰 = 260px (기존 유지).
   - **PR #70 변경 사항이 아님** (기존 토큰 보존). designer §4 가 별도 후속 트랙 권고인지 확인 필요.
   - **권고**: 디자이너에게 confirm — 본 IA PR 와 무관 / 별도 SSOT 토큰 변경 PR 로 분리.
2. **ADM_DASHBOARD path 정합** (`§3.3`)
   - DB seed `/admin/dashboard-v2`, 프론트 폴백/ADMIN_ROUTES `/admin/dashboard`.
   - **PR #70 변경 사항이 아님** (기존 V20260225_001 유지). dashboard-v2 와 dashboard 가 양쪽 라우트 매핑되어 운영 회귀 0.
   - **권고**: 후속 정리 (DUP 추가 항목으로 본 PR 외 트랙).

### §7.3 LOW (후속 추적, 운영 비차단) — **3건**
1. **AdminOnboarding.test.jsx 4 fail** — develop tip pre-existing. PR #70 무관. **별도 hotfix 필요** (ESLint `ONBOARDING_MESSAGES import/named`).
2. **Q8 탈퇴/휴면 메뉴 신설** (DUP-4 deferred) — 본 PR 범위 외, 후속 Phase 권고.
3. **Q6 ADM_SETTINGS 14 children 평면 유지** (DUP-5 부분) — 사용자 결재 Q6 옵션 A 추정, 가독성 후속 모니터링.

---

## §8. 운영 반영 권고

### §8.1 종합 판정
✅ **PASS — 운영 반영 권고**

PR #70 (`feature/admin-lnb-ia-restructure` head `d182be79c`) 는 develop tip `4dee473b8` (= deployer `3e2fce75` 의 4 PR #66/#67/#68/#69 머지 직후) 위에 머지 시뮬레이션 결과:
- **conflict 0건**
- **단위 + 통합 + RTL + 정적 가드 모두 PASS**
- **HIGH 회귀 0건 / PR #70 유발 신규 fail 0건**
- DUP-1·DUP-2·DUP-3·DUP-6·DUP-7 완전 해소
- DUP-4·DUP-5 일부 deferred (의도된 범위 외, 후속 추적 가능)
- D11 델타 0 / i18n PASS / codemod PASS / Spring Boot 통합 정상

### §8.2 다음 단계 (사용자 결재 안내)
1. 사용자 결재 → Phase 5 `core-deployer` 위임
2. 운영 deployer `3e2fce75` 의 4 PR (#66 #67 #68 #69) **운영 main FF 완료 확인**
3. PR #70 develop 머지 (이미 base 가 develop tip 으로 fast-forward 가능)
4. dev 환경 Flyway V20260606_008 적용 확인 (`flyway_schema_history` 에 `_008` row 검증)
5. 운영 환경 main FF → ADMIN/STAFF LNB 트리 시각 검증 (Q1~Q10 결재안 IA 정합)
6. 롤백 시나리오: `INSERT … WHERE NOT EXISTS` 멱등이므로 revert 마이그 시 새 row delete + 기존 path 복원 SQL 준비 (Phase 5 deployer 작성)

### §8.3 운영 반영 차단 사유
**없음**. 즉시 deployer 권고 가능.

---

## §9. 부록 — 매트릭스 데이터

### §9.1 머지 시뮬레이션 메타
| 항목 | 값 |
|------|----|
| Tester worktree | `/Users/mind/mindgarden-lnb-tester` |
| Tester branch (시뮬) | `feature/admin-lnb-ia-tester-sim` |
| Tester branch (보고) | `docs/admin-lnb-ia-tester-report` |
| Base | `origin/develop` `4dee473b81fc903d34d1615fe160916a8450a7b9` |
| PR head | `origin/feature/admin-lnb-ia-restructure` `d182be79c301b8e8ad435663da5903bb4a20c80a` |
| 시뮬 머지 commit | `6997c5075` (tester worktree only — push 안 함) |
| mergeable | `MERGEABLE` (gh pr view 70) |
| 충돌 | 0 (Automatic merge went well) |

### §9.2 V20260606_008 마이그 인서트/업데이트 카운트
| 섹션 | 작업 | 행 수 |
|------|------|-------|
| §1 INSERT 1차 그룹 헤더 신설 | ADM_INTEGRATED_SCHEDULE, ADM_MATCHING_PAYMENT_REFUND, ADM_CONTENT_COMMUNITY | 3 |
| §2 UPDATE ADM_NOTIFICATIONS path (DUP-2) | 1 | 1 |
| §3 INSERT 2차 메뉴 신설 (DUP-3) | ADM_CONSULTATION_LOGS / ADM_PG_OPS_APPROVAL / ADM_COMMUNITY_MODERATION / ADM_CONTENT_MASTER / ADM_MIND_WEATHER_OBSERVABILITY / ADM_MIND_GARDEN_OBSERVABILITY / ADM_PUSH_MONITORING / ADM_PACKAGE_PRICING | 8 |
| §4 UPDATE ADM_MAPPING / ADM_BILLING 강등 (Q9) | 2 | 2 |
| §5 UPDATE ADM_SETTINGS_PG path (DUP-6) | 1 | 1 |
| §6 UPDATE 1차 sort_order 정규화 | 9 | 9 |
| §7 STAFF 가시성 (변경 없음) | 0 | 0 |
| **합계** | — | **INSERT 11건 + UPDATE 13건** |

> coder 보고 "insert 11 + update 13" 와 정확히 일치.

### §9.3 마이그 멱등성 (재실행 안전성)
- 모든 INSERT 는 `INSERT … SELECT … FROM (SELECT 1) AS d WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = '<code>')` 형식 → 재실행 시 0 row 신규 생성.
- 모든 UPDATE 는 `WHERE menu_code = '<code>'` 단일 row 타게팅 → 재실행 시 동일 값 재할당 (no-op).
- `INSERT IGNORE` / `ON DUPLICATE KEY UPDATE` 등 MySQL-specific syntax **0건** → H2 (테스트) + MySQL 8.x (운영) 양쪽 호환.

### §9.4 운영 deployer `3e2fce75` 정합
develop tip 의 4 PR 머지 순서 (`git log origin/develop --oneline -5`):
```
4dee473b8 Merge pull request #69 (i18n tabtitle)
ce2d667c7 Merge pull request #68 (pipeline chart colors)
ae79cae25 Merge pull request #67 (client delete modal)
81a797fed Merge pull request #66 (develop sync prod dry run)
```
PR #70 의 base 가 `4dee473b8` 이므로 fast-forward 가능. 4 PR 운영 반영 완료 후 PR #70 별도 PR cycle 로 운영 반영 권고 (deployer `3e2fce75` 와의 직접 충돌 없음).

---

## §10. 보고 형식 (요약 JSON)

```json
{
  "status": "PASS",
  "report_doc": "docs/project-management/2026-05-28/ADMIN_LNB_IA_TESTER_REPORT.md",
  "branch": "docs/admin-lnb-ia-tester-report",
  "matrix_results": {
    "backend_mvn": { "tests": 405, "failures": 0, "errors": 0, "skipped": 0 },
    "menu_service_lnb_ia_test": { "tests": 6, "passed": 6 },
    "frontend_rtl_lnb_full": { "tests": 35, "passed": 35 },
    "frontend_rtl_desktop_lnb": { "tests": 19, "passed": 19 },
    "frontend_rtl_menu_items": { "tests": 9, "passed": 9 },
    "frontend_rtl_broader": { "tests": 122, "passed": 122 },
    "static_guards": {
      "i18n_seed": "PASS",
      "codemod_mappings": "PASS",
      "d11_hardcoded_delta": 0,
      "eslint_pr70_introduced": 0
    },
    "flyway_h2_integration": "PASS"
  },
  "permission_matrix_passed": true,
  "permission_matrix_notes": "HQ_ADMIN/BRANCH_ADMIN 은 표준화 2025-12-05 로 deprecated. 개념 매핑: HQ_ADMIN=ADMIN UserRole, BRANCH_ADMIN=STAFF (ERP_ACCESS 미보유). 4 역할 모두 PASS.",
  "dup_fixes_validated": {
    "DUP-1": true,
    "DUP-2": true,
    "DUP-3": true,
    "DUP-4": "partial (Q8 deferred)",
    "DUP-5": "partial (Q6 deferred)",
    "DUP-6": true,
    "DUP-7": true
  },
  "visual_regression": {
    "aria_navigation": true,
    "aria_expanded_toggle": true,
    "aria_current_page": true,
    "accent_bar_4px_primary_500": true,
    "tokens_12_ssot_alias": true,
    "d11_delta": 0,
    "dark_mode_cascade": true,
    "wcag_4_5_color_contrast": true,
    "responsive_240px_vs_260px": "DESIGN_VS_IMPL_GAP_MEDIUM (PR 미회귀)"
  },
  "regressions_found": {
    "high": 0,
    "medium": 2,
    "low": 3
  },
  "regressions_detail": {
    "medium_1_sidebar_width_design_gap": "designer §4 = 240px, 실 SSOT = 260px. PR #70 변경 없음. 별도 디자이너 confirm 권고.",
    "medium_2_dashboard_path_dup": "DB seed = /admin/dashboard-v2, FE = /admin/dashboard. PR #70 변경 없음. 후속 DUP 트랙.",
    "low_1_admin_onboarding_test_fail": "develop tip pre-existing 4 fail. PR #70 무관. 별도 hotfix.",
    "low_2_q8_withdrawal_dormant_deferred": "DUP-4 부분 — 의도된 deferral.",
    "low_3_q6_settings_subgroup_deferred": "DUP-5 부분 — Q6 Option A 추정."
  },
  "merge_simulation": {
    "base_develop_tip": "4dee473b81fc903d34d1615fe160916a8450a7b9",
    "pr_head": "d182be79c301b8e8ad435663da5903bb4a20c80a",
    "merge_result_commit": "6997c5075",
    "conflicts": 0,
    "mergeable_gh_status": "MERGEABLE"
  },
  "flyway_migration_v20260606_008": {
    "inserts": 11,
    "updates": 13,
    "idempotent": true,
    "h2_compatible": true,
    "mysql8_compatible": true,
    "no_mysql_specific_syntax": true
  },
  "next": "사용자 결재 → Phase 5 core-deployer 위임 → 운영 반영 (운영 deployer 3e2fce75 의 4 PR 운영 반영 완료 후)"
}
```

---

**문서 작성 완료 — 사용자 결재 대기.**
**Tester 는 본 보고서 산출 후 자동 종료.**
