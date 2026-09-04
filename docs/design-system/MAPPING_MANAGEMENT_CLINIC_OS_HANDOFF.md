# 매칭 관리 Clinic-OS UI/UX 스펙 (Design Handoff)

**대상**: `/admin/mapping-management` (`MappingManagement` → `MappingManagementPage`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` + live `/admin/dashboard`  
**트윈**: `/admin/integrated-schedule` (`IntegratedMatchingSchedule` + `IntegratedScheduleSummaryStrip`), `/erp/purchase` (`PurchaseQuietHeader` + `PurchaseSummaryStrip`)  
**범위**: Frontend chrome only. 비즈니스 로직·API·상태코드·회기/잔여·금액 계산 **변경 금지**.  
**작성**: core-planner 오케스트레이션 → core-designer 스펙 형식 (**Task 스폰 불가** 환경에서 기획이 스펙 문서화; `/core-solution-design-handoff` 준수)  
**첨부 비교**: `user-prod-mapping.png`(구 B0KlA 스킨) vs `01-dev-dashboard.png`(Clinic-OS SSOT) — 워크스페이스에 경로 미존재 시 SSOT·트윈으로 대체 검증

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | 운영자(ADMIN)가 매칭 목록을 빠르게 검색·상태필터·Saved View·card/table/calendar로 전환. 헤더 CTA「새 매칭」이 유일한 primary. |
| **정보 노출** | 매칭 상태·상담사/내담자·회기·금액은 기존과 동일. KPI는 요약 3셀(전체·활성·결제 대기)만 상단 노출; 세부 상태는 필터 칩으로 유지. |
| **레이아웃** | quiet header → search/filters/Saved View → 3-cell summary strip → main stage(리스트). 좌측 4px accent·아이콘 KPI 타일·B0KlA forest CTA 금지. |

---

## 1. 개요 및 배경

구 Pencil/B0KlA 스킨(`AdminDashboardB0KlA.css`, `--ad-b0kla-*`, colored icon wells, forest green CTA)이 Clinic-OS와 불일치한다. 본 작업은 **크롬만** Admin Dashboard V2 / Clinic-OS 토큰·패턴에 정렬한다. card/table/calendar·Saved View·search·status filters **기능 유지**.

---

## 2. 레이아웃 구조 (위→아래)

```
AdminCommonLayout
└─ ContentArea (.mg-v2-mapping-management.mapping-management--clinic-os)
   ├─ ContentHeader (quiet) — title + MGButton solid primary「새 매칭」하나
   ├─ MappingSearchSection — search + status chips + SavedViewControls
   ├─ MappingKpiSection → Clinic-OS 3-cell summary strip (아이콘 타일 없음)
   └─ peek-layout
      ├─ R-MAIN: MappingListBlock stage (card|table|calendar, 동일 기하)
      └─ SidePeekShell (기존)
```

**제외**: 라우트/API/모달 비즈니스 흐름 변경, 통합스케줄 페이지, 전역 `ViewModeToggle` API 변경(페이지 스코프 토큰만).

---

## 3. 세부 UI/UX 스펙

### 3.1 Quiet header

- **컴포넌트**: 기존 `ContentHeader` 유지(트윈 IntegratedMatchingSchedule과 동일 계열).
- **Primary CTA**: `ActionBarButton` + B0KlA green 제거 → **`MGButton` variant solid primary**.
- **토큰**: fill `var(--mg-v2-color-primary-solid)`, hover `var(--mg-v2-color-primary-dark)`, label light surface. 높이 `var(--button-height-sm)` (트윈 `__header-actions`).
- **금지**: `--ad-b0kla-green`, page-specific forest `#3D5246`, hex 하드코딩.

### 3.2 Summary strip (MappingKpiSection)

- **패턴**: `IntegratedScheduleSummaryStrip` / `PurchaseSummaryStrip`.
- **기하**: `grid-template-columns: repeat(3, minmax(0, 1fr))`, surface-secondary, radius-md, cell divider hairline. **아이콘 웰·lucide 타일·좌측 4px 바 금지**.
- **3셀 (한국어)**:
  1. 전체 — `view_all` → filter `ALL`
  2. 활성 매칭 — `view` / id `ACTIVE`
  3. 결제 대기 — `payment` (기존 `handleStatCardClick` 동작 유지)
- **타이포**: label `body-md` + secondary text; value h2 + tabular via `KpiNumeral` + 단위 `건`.
- **클릭**: 기존 `onStatCardClick` 계약 유지(필터/결제 보드). 장식만 제거.

### 3.3 Search / status filters / Saved View

- **기능 유지**. 칩 active: dusty teal subtle 또는 primary-solid 계열(`--mg-v2-color-primary-*`), B0KlA green-bg 제거.
- 토큰: text `var(--mg-v2-color-text-*)`, surface `var(--mg-v2-color-neutral-*)` / border `var(--mg-v2-color-border-*)`.

### 3.4 Main stage + view toggle

- **Stage**: `.mg-v2-mapping-list-block__card` → Clinic-OS single card: `border 1px` `var(--mg-v2-color-neutral-300)`, `var(--mg-v2-radius-lg)`, `var(--mg-v2-color-neutral-50)`, `min-height` ~`36rem` (뷰 전환 단차 금지).
- **ViewModeToggle**: 공통 컴포넌트 class(`mg-v2-ad-b0kla__pill*`)는 유지하되, **mapping 스코프 CSS**에서 `--ad-b0kla-*` → `--mg-v2-*`, active = `var(--mg-v2-color-primary-solid)` (pill 기하 유지, forest 제거).
- card / table / calendar **기능 유지**.

### 3.5 List row / table / calendar chrome

- 모든 `--ad-b0kla-*` → `--mg-v2-*` 대응(text-primary/secondary, neutral surfaces, border, primary-solid/main).
- Empty: 이모지 없음; empty CTA → `MGButton` solid primary 권장(`ActionButton` B0KlA green 제거).
- Calendar today wash: primary subtle `color-mix` 또는 `--mg-v2-color-primary-*` tint — forest green-bg 금지.
- 환불 모달 등 페이지 로컬 CSS의 B0KlA 토큰도 `--mg-v2-*`로 치환(모달 로직 불변).

### 3.6 Import 제거

- `MappingManagement.js`, `MappingManagementPage.js`에서 **`AdminDashboardB0KlA.css` import 제거**.
- 페이지 스코프에 `mapping-management--clinic-os` (또는 동등) 클래스 부여 권장(테스트 락).

### 3.7 사용 토큰 목록 (CSS 변수만)

| 역할 | 토큰 |
|------|------|
| text | `--mg-v2-color-text-primary`, `--mg-v2-color-text-secondary` |
| primary CTA | `--mg-v2-color-primary-solid`, `--mg-v2-color-primary-dark` |
| page/surface | `--mg-v2-color-neutral-50`, `--mg-v2-color-neutral-100`, `--mg-v2-color-surface-secondary` |
| hairline | `--mg-v2-color-neutral-300` / `--mg-v2-color-border-*` |
| type | `--mg-v2-font-size-h1|h2|body-md|caption`, `--mg-v2-font-weight-*` |
| space/radius | `--mg-v2-space-*`, `--mg-v2-radius-md|lg` |
| button height | `--button-height-sm`, `--mg-v2-touch-target-min` |

**금지**: hex 리터럴, `--ad-b0kla-*`, `#3D5246` primary.

### 3.8 아토믹·공통 모듈

| 계층 | 재사용 |
|------|--------|
| Atoms | `MGButton`, `KpiNumeral`, `SafeText` |
| Molecules | `ViewModeToggle`(스코프 리스킨), `SavedViewControls`, summary strip 패턴 |
| Organisms | `MappingSearchSection`, `MappingKpiSection`(strip화), `MappingListBlock` |
| Template/Page | `AdminCommonLayout` + `ContentArea`/`ContentHeader` |

신규 공통 모듈 불필요 — 트윈 strip 패턴을 MappingKpiSection 내부에 이식.

---

## 4. 상호작용·상태

| 상태 | 동작 |
|------|------|
| KPI 셀 클릭 | 기존 `handleStatCardClick` (필터 / 결제 대기 보드) |
| 필터·검색·Saved View | 변경 없음 |
| viewMode card/table/calendar | 변경 없음, stage 기하 동일 |
| Empty | EmptyState 톤, 이모지 없음, primary CTA |
| Loading | 기존 `UnifiedLoading` |
| 모달(생성/환불/이관 등) | 로직 유지; 페이지 CSS B0KlA 토큰만 치환 |

---

## 5. 코더 완료 조건 (체크리스트)

- [ ] `AdminDashboardB0KlA.css` import 제거 (entry + page)
- [ ] Header CTA = `MGButton` solid primary (dusty teal 토큰)
- [ ] KPI = 3-cell summary strip, no icon tiles / accent bars
- [ ] Organism/page CSS: `--ad-b0kla-*` → `--mg-v2-*`; list stage Clinic-OS geometry
- [ ] View toggle active = primary-solid (스코프), B0KlA forest 제거
- [ ] card/table/calendar · Saved View · search · status filters 기능 유지
- [ ] API/상태/회기/금액 로직 무변경
- [ ] hex 하드코딩 없음 (게이트 §17 / SETTINGS §1.3)
- [ ] `MappingManagement.clinicOsChrome.test.js` 추가 (통합스케줄/구매관리 패턴)
- [ ] 기존 mapping-management Jest 통과, CI 깨지지 않음
- [ ] 운영자 라벨 한국어

---

## 6. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` (+ `.css`, `IntegratedScheduleSummaryStrip`, `IntegratedMatchingSchedule.clinicOsChrome.test.js`)
- `frontend/src/components/erp/PurchaseManagement.js` (+ `PurchaseSummaryStrip`, clinicOsChrome test)
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- 스킬: `/core-solution-design-handoff`, `/core-solution-atomic-design`, `/core-solution-common-modules`
