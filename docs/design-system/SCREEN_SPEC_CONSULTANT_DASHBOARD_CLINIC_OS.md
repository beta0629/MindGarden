# 화면설계·Clinic-OS 부품 매핑 — 상담사 대시보드

**대상**: `/consultant/dashboard` (`ConsultantDashboardV2`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` + live `/erp/dashboard`  
**범위**: Frontend restyle only. 미작성 일지 **쿼리 로직 변경 금지**. 금액·장부 계산 금지.  
**작성**: core-planner 오케스트레이션 → core-designer 스펙 형식 (Task 스폰 불가 환경에서 기획이 스펙 문서화)

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | 상담사(CONSULTANT 전용)가 로그인 직후 오늘 할 일(일지·일정·메시지)에 바로 진입. 클릭 최소. |
| **정보 노출** | 본인 일정·내담자·일지·알림만. 운영·재무·시스템 관리 LNB/문구 비노출. 「센터」표기(테넌트 금지). |
| **레이아웃** | quiet header → summary strip(KPI) → 빠른 액션 → 알림/누락 카드 → 메인 stage(목록·차트). 좌측 4px Pencil 바·이모지 장식 없음. |

---

## 1. Phase 0 인벤토리 (검증된 원인 — CSS 추측 금지)

| # | 증상 | 검증된 파일·심볼 | 원인 |
|---|------|------------------|------|
| 1a | LNB 제목「시스템 관리」 | `DesktopLnb.js` / `MobileLayout.js` default `headerTitle='시스템 관리'`; `ConsultantDashboardV2` → `AdminCommonLayout`에 `title` 미전달(G-14) | ACL `title` 생략 시 레이아웃 기본값이 운영자 문구 |
| 1b | ops LNB 메뉴 | `AdminCommonLayout.js` `menuItems`: API `lnbRawTree.length>0`이면 역할 무관 `normalizeLnbTree`+admin merge | 상담사-only도 API 트리를 그대로 사용 → 운영 메뉴 누출 가능. 폴백 `CONSULTANT_MENU_ITEMS`는 API 실패 시에만 |
| 2 | 로고 → `/admin/dashboard` | `DesktopGnb.js` L41, `MobileGnb.js` L40 `NavLink to={ADMIN_ROUTES.DASHBOARD}` (`'/admin/dashboard'`) | 역할별 home path 미전달. 상담사는 권한 없음 |
| 3 | 빠른 액션 pills 불균일 | `QuickActionBar.js` + `CONSULTANT_DASHBOARD_QUICK_ACTIONS` outline×4 + primary 1; CSS flex-wrap | outline/primary 혼재 + wrap으로 3+1 stretched |
| 4 | KPI label/숫자 overflow | `ContentKpiRow` + `ContentKpiRow.css` B0KlA icon well·h1 value; consultant `iconVariant` blue/green/orange/gray | Clinic-OS summary strip(아이콘 타일 금지)과 불일치 |
| 5 | Mixed accents | `ConsultantDashboard.css` `border-left: 4px` warning/primary/error; chart `--active` vs default 색 분리; badge critical/high | Pencil/B0KlA accent bar·다색 칩 |
| 6 | 본문 ~60%·빈 패널 | `.consultant-dashboard-v2__container` max-width; `__lists-row` 3열 고정 | ERP money-cockpit은 full-bleed stage. 빈 목록이 좁은 3열로 공백 강조 |
| 7 | 스킨 신규 금지 | — | `/erp/dashboard` `MoneyQuietHeader`·hero band·stage 기하 재사용 |
| 8 | 미작성 일지 | `IncompleteRecordsAlert.js` + missing-logs `mg-v2-ad-b0kla__*` | **쿼리 유지**, 카드 크롬만 Clinic-OS surface+hairline |
| 9 | 금액/장부 | — | 변경 금지 |

---

## 2. Clinic-OS 부품 매핑 (재사용)

| 상담사 영역 | ERP `/erp/dashboard` 부품 | 적용 |
|-------------|---------------------------|------|
| 페이지 타이포 | 4-step h1/h2/body-md/caption · `--mg-v2-*` | 전역 |
| Quiet header | `MoneyQuietHeader` 뼈대 (h1 + 우측 MGButton ghost 링크) | ContentHeader를 quiet 계약으로 유지·B0KlA 클래스 제거 |
| Summary strip | `MoneyHeroBand` / `money-hero-band` 3등분 → 상담사는 **4등분 KPI** (라벨 caption + 값 h2, 아이콘 타일 없음) | 신규 스킨 금지, 동일 토큰·기하 |
| 빠른 액션 | header links / MGButton ghost + solid primary **하나** | Zap 아이콘 제거, equal-height row, wrap 시 stretched primary 금지 |
| Main stage | money stage: border 1px neutral-300, radius-lg, neutral-50 | 목록·차트를 stage 안에 |
| 미작성 일지 카드 | surface + hairline, left accent 제거 | IncompleteRecordsAlert 크롬만 |
| 버튼 | `MGButton` only · primary dusty teal | outline 남발 금지 |
| 셸 LNB/GNB | `AdminCommonLayout` + 역할 가드 | 상담사-only: `CONSULTANT_MENU_ITEMS` 강제, LNB 제목「상담」, logoHome=`/consultant/dashboard` |

**금지**: Pencil/B0KlA left 4px bar, admin emoji/SVG ornament, 「테넌트」, 「시스템 관리」(상담사 LNB), 세로 스택 admin-style CTA 덩어리.

---

## 3. 코더 완료 조건

- [ ] 상담사-only 계정 LNB에「시스템 관리」·운영·재무·시스템·설정 그룹 없음
- [ ] GNB 로고 → `/consultant/dashboard` (ADMIN은 `/erp/dashboard` 등 역할 랜딩)
- [ ] 빠른 액션: MGButton, 균등 행, primary solid 1개
- [ ] KPI: summary strip 기하, 숫자/라벨 overflow 없음, 아이콘 타일 없음
- [ ] accent bar·amber/red mixed chip·차트 이색 바 제거(단일 dusty teal)
- [ ] 본문 full-width stage, 빈 상태 EmptyState 톤
- [ ] missing-journal **쿼리 미변경**, 크롬만
- [ ] 하드코딩 게이트 §17 / SETTINGS §1.3 / Go-Live 체크리스트
- [ ] `safeDisplay` / `SafeText` 유지 (COMMON_DISPLAY_BOUNDARY)
- [ ] core-tester 스모크·회귀·콘솔 0

---

## 4. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `frontend/src/components/erp/organisms/moneyCockpit/*`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
