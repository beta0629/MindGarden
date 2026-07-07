# 내담자 대시보드 v1.3 Rebuild 핸드오프 (Design Spec)

**상태**: v1.3 Rebuild (Design Handoff) — **App/Web UI 분리 · API 연동 허용** 정책 반영  
**작성자**: `core-planner` (정책) · `core-designer` (v1.2 디자인 SSOT)  
**이전**: v1.2 (`CLIENT_DASHBOARD_REBUILD_HANDOFF_v1.2.md`)  
**SSOT**: `PENCIL_DESIGN_GUIDE.md`, `mindgarden-design-system.pen`, `unified-design-tokens.css`, [`COMPREHENSIVE_IMPROVEMENT_WBS.md`](../project-management/2026-07-07/COMPREHENSIVE_IMPROVEMENT_WBS.md) §「App/Web 분리」

> **[Design Freeze Sign-off (2026-07-07)]**
> - **no defer on visual**: 7/13 개편이 마지막 시각/UX 개선 창구입니다.
> - 이후 UI/UX 부채에 대한 defer(나중에 하기)는 전면 금지됩니다.
> - ROLE-01/02/03 Admin·Client·Consultant, dark cascade, B0KlA, G-14 모두 이번에 freeze 품질로 마감해야 합니다.
> - 시각적 갭(P2 visual)은 P0로 승격되어 7/13 범위 내에서 모두 해소되어야 합니다.

---

## 1. 플랫폼 연동 정책 — UI 분리 + API 연동 허용

> **사용자 확정 (2026-07-07)**: 「앱과 웹은 링크 하면 안 돼 디자인 깨져」 + **「API 연동은 가능하잖어」**

### 1.1 확정 원칙

| 구분 | 허용 | 금지 |
|------|------|------|
| **UI / 네비 / 라우트** | 플랫폼별 독립 SSOT (웹 LNB vs 앱 AppShell) | 앱↔웹 경로 parity, 크로스 deep link, 화면 구조 강제 통합 |
| **API / 데이터** | **허용** — `StandardizedApi`, `/api/v1/*`, `tenantId`, 동일 BE 엔드포인트, 공유 DTO·비즈니스 로직 | (없음 — API 레벨 연동은 정상) |

### 1.2 Must-link 재정의 (UI Must link **폐기**)

| 분류 | 정의 | Client Dashboard 예 |
|------|------|---------------------|
| **API-only Must link** ☑ | 동일 BE·동일 비즈니스 데이터. UI·경로는 각 플랫폼 SSOT | 일정 목록, mappings·회기, unread 메시지 수 — `useClientDashboardData` |
| **Web-only (UI)** | 웹 LNB·데스크톱 레이아웃 전용 | 퀵메뉴 4항목 = LNB minus dashboard; B0KlA `mg-v2-section-block` |
| **App-only (UI)** | Expo AppShell·바텀탭·more | `wellness-hub`, `session-payment`, `mypage` |
| ~~UI Must link~~ **폐기** | 앱 화면·경로를 웹에 억지 매핑 | wellness-hub 퀵메뉴, mypage↔settings parity |

### 1.3 expo-app vs frontend — 공유 가능 범위

| 영역 | 공유 | 비고 |
|------|:----:|------|
| API client | O | `StandardizedApi` / `expo-app/src/api/client.ts` |
| Auth token·세션 | O | 저장소만 플랫폼별 |
| Schedule·mappings·messages API | O | API-only Must link |
| Route map·deep link | X | `clientDashboardRoutes.js` vs `expo-app/app/(client)/*` |
| Tab / 바텀탭 구조 | X | |
| LNB·퀵메뉴 | X | |
| 화면 컴포넌트·CSS | X | cross-import 금지 |

### 1.4 코더·디자이너 적용 규칙

- **디자인·와이어**: 웹만 — B0KlA·LNB·1280/768. 앱 AppShell 시안을 웹에 **강제 이식하지 않음**.
- **데이터·API**: revert(d9a91591) 시 **UI 경로만** 웹-native로 복구; `StandardizedApi` 호출·훅·DTO normalize는 **유지**.
- **웹 UI SSOT**: `menuItems.js` `CLIENT_MENU_ITEMS` = 퀵메뉴; 상수 `frontend/src/constants/clientDashboardRoutes.js`.

---

## 2. 개요 및 목표

기존 v1.1(Freeze)의 파편화된 UI와 클래스를 전면 폐기하고, 아토믹 기반의 신규 디자인 시스템(B0KlA)과 어드민 대시보드 레이아웃 표준을 내담자(Client) 톤앤매너로 이식하여 전면 재구현(Rebuild)합니다.

- **디자인 톤**: 관리자 대시보드의 "섹션 블록(`mg-v2-section-block`) + 좌측 악센트" 구조를 차용하되, 내담자 특성에 맞춰 둥근 모서리(16px)와 부드러운 서페이스(`var(--mg-color-surface-main)`)를 강조하여 편안한 여백 중심의 레이아웃을 제공합니다.
- **핵심 원칙**: 하드코딩된 픽셀/색상값을 배제하고 100% 토큰과 공통 클래스 기반으로 재설계.
- **플랫폼**: 본 핸드오프는 **웹 `ClientDashboard` 전용**. Expo 앱 UI는 별도 AppShell SSOT.

---

## 3. Before & After 와이어프레임

### ❌ Before (현재 엉망인 상태)
- **레이아웃**: 단일 통짜 페이지에 인라인 스타일과 구형 유틸리티 클래스가 혼재.
- **컴포넌트**: `div` 지옥, 카드 간격 불규칙, 반응형 붕괴(모바일에서 카드가 잘리거나 겹침).
- **시각 요소**: 일관성 없는 버튼 색상, 테두리 두께 불일치, 하드코딩된 `#ccc`, `#f5f5f5` 색상.

### 🟢 After (목표 레이아웃 - B0KlA 어드민 스타일 차용)
- **레이아웃**: 최대 너비 `1200px` 중앙 정렬 (모바일 `100%`). 섹션 블록(`mg-v2-section-block`) 단위의 명확한 구획.
- **컴포넌트**: 아토믹 컴포넌트 조합. 섹션 타이틀 좌측에 4px 악센트 바.
- **빠른 메뉴**: 웹 LNB 4항목(스케줄·회기 관리·결제 내역·설정) — **앱 parity 항목 없음**.

---

## 4. 섹션별 컴포넌트 트리 (Atomic)

전체 페이지 래퍼: `<div class="mg-v2-layout-main bg-[var(--mg-color-background-main)]">`

### 4.1 상단 바 (Page Header) ➔ `Organism`
- **`ContentHeader`**: Breadcrumb · Title · `MGButton` (primary)

### 4.2 다음 일정 및 액션 ➔ `Organism`
- **`SectionBlock`** + **ActionCard** grid — 데이터는 schedule API (API-only Must link)

### 4.3 나의 현황 (KPI) ➔ `Organism`
- **`ContentKpiRow`** / KpiGrid — mappings·unread API; drill-down은 **웹-native 경로**만

### 4.4 빠른 메뉴 (Quick Menu) ➔ `Organism`
- Desktop: LNB 정합 4버튼 (`clientDashboardRoutes.js`)
- Mobile: 웹 반응형 그리드 — **앱 BottomNavigation 미사용**

---

## 5. 제거할 Legacy 클래스 및 패턴 (Anti-Patterns)

1. v1.1 이전 유틸·인라인 스타일·하드코딩 hex
2. App-parity 경로·Must link UI 주석
3. 커스텀 모달 → `UnifiedModal`
4. 앱 전용 경로를 웹 navigate 대상으로 추가하는 패턴

---

## 6. d9a91591 revert — API 유지 · UI 점검 체크리스트

| # | 점검 | 기대 |
|---|------|------|
| 1 | 퀵메뉴에 `/client/wellness-hub`·`mypage`·`session-payment` 없음 | PASS |
| 2 | 퀵메뉴 = LNB 4항목, 라벨 `스케줄` | PASS |
| 3 | KPI `navigate` = `CLIENT_DASHBOARD_KPI_ROUTES` (웹) | PASS |
| 4 | `useClientDashboardData` — schedules·mappings·unread API 호출 **존재** | PASS (API 유지) |
| 5 | `clientDashboardRoutes.test.js` — App 경로 exclusion 테스트 | PASS |

---

## 7. Coder 1 PR 완료 정의 (Definition of Done)

- [ ] **토큰 100% 매핑**: `var(--mg-*)` · `mg-v2-*` only
- [ ] **레이아웃**: `mg-v2-section-block` · 좌측 악센트 4px
- [ ] **반응형**: 1280 / 768 이하 단일 컬럼
- [ ] **레거시 제거**: v1.1 잔재 클래스 0
- [ ] **공통 모듈**: `MGButton`, `ContentHeader`, `UnifiedModal`
- [ ] **플랫폼 정책**: UI는 웹 LNB SSOT; API 연동 유지; App parity 경로 0

---

## 8. 버전 이력

| 버전 | 일자 | 비고 |
|------|------|------|
| v1.2 | 2026-07-07 | Rebuild 디자인 핸드오프 (`core-designer`) |
| v1.3 | 2026-07-07 | §1 플랫폼 정책 — UI 분리 + API-only Must link (`core-planner`) |
| v1.4 | 2026-07-07 | §8 UI/UX Quality Gate 추가 (`core-planner` & `core-designer`) |

---

## 9. UI/UX Quality Gate (최고 품질 기준)

모든 디자인 및 UI/UX 개편 작업은 다음의 품질 게이트를 통과해야 합니다.

1. **B0KlA 토큰 100% 매핑**: 하드코딩된 hex/rgba 색상 및 px 단위(`padding`, `margin` 등) 0건 달성 (단축 속성 포함). 오직 `var(--mg-*)` 및 공통 유틸리티 사용.
2. **타이포그래피 및 Grid**: ContentHeader G-14 h1 SSOT 준수, 8px grid 시스템 기반의 일관된 타이포그래피와 간격 유지.
3. **Dark Mode Cascade**: 변경되는 해당 페이지의 다크모드 완벽 호환 (테마 토글 시 깨짐 없음).
4. **반응형 회귀 0건**: 모바일(414px) 및 데스크톱(1280px) 환경 모두에서 UI 깨짐, 겹침, 스크롤 이슈 발생 금지.
5. **A11y (접근성)**: 
   - 탭 네비게이션 시 명확한 Focus Ring.
   - 아이콘 버튼 등 텍스트가 없는 컨트롤에 적절한 `aria-label`.
   - WCAG AA 기준의 명도 대비 충족.
6. **Must-not (금지 사항)**: 
   - 레거시 CSS 잔존 및 불필요한 인라인 스타일.
   - `ContentHeader`와 페이지 내부 이중 제목.
   - `MGButton` 및 `ActionBar` SSOT 위반 (커스텀 버튼 스타일 금지).
7. **시각적 정합성**: `admin-dashboard-sample`의 플랫하고 부드러운 서페이스 중심 스타일과 완벽한 시각적 정합성 보장.
