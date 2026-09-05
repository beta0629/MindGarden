# 상담일지 조회 Clinic-OS UI/UX 스펙 (Design Handoff)

**대상**: `/admin/consultation-logs`, `/consultant/consultation-logs` (`ConsultationLogView` → `ConsultationLogViewPage`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` + live `/admin/dashboard`  
**트윈**: `/admin/mapping-management` (`mapping-management--clinic-os`), `/admin/integrated-schedule` (`IntegratedScheduleSummaryStrip`), `/erp/purchase` (`PurchaseQuietHeader` / `PurchaseSummaryStrip`)  
**범위**: Frontend chrome / layout / CSS / class cleanup only. 비즈니스 로직(계산·저장·저널·API·필터 의미) **변경 금지**.  
**작성**: core-planner 오케스트레이션 → design-handoff 형식 (**Task 스폰 불가** 환경에서 기획이 매핑 핸드오프 동형 스펙 문서화; `/core-solution-design-handoff` 준수)

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | 운영자(ADMIN)·상담사(CONSULTANT)가 필터·Saved View로 일지를 찾고, 캘린더/목록/테이블을 전환한 뒤 행·카드·이벤트를 클릭해 모달에서 조회·수정. |
| **정보 노출** | 기존과 동일(상담사·내담자·일시·요약 등). ADMIN은 전체·상담사 필터, CONSULTANT는 본인 범위. KPI 전용 집계 API는 없음. |
| **레이아웃** | quiet header → Saved View → filter → view tabs → **main stage 단일 카드 기하**. Summary strip은 **선택(SSOT optional)** — 기존 KPI 셀이 없으므로 **strip 생략**. 좌측 4px accent·B0KlA forest CTA·페이지별 룩 발명 금지. |

---

## 1. 개요 및 배경

구 Pencil/B0KlA 스킨(`AdminDashboardB0KlA.css`, `mg-v2-ad-b0kla` 래퍼, `--ad-b0kla-*`, forest/green-bg)이 Clinic-OS와 불일치한다. 본 작업은 **크롬만** Admin Dashboard V2 / Clinic-OS 토큰·패턴에 정렬한다. list / filter / write(모달 오픈) · calendar/table · Saved View · deep link **기능 유지**.

---

## 2. 레이아웃 구조 (위→아래)

```
AdminCommonLayout
└─ ConsultationLogViewPage
   └─ ContentArea (.mg-v2-consultation-log-view.consultation-log-view--clinic-os)
      ├─ ContentHeader (quiet) — 제목「상담일지 조회」+ 부제 (한국어)
      ├─ SavedViewControls 행
      ├─ ConsultationLogFilterSection
      ├─ view tabs (캘린더 | 목록 | 테이블) — active = primary-solid
      └─ main stage (list | calendar | table ContentCard, 동일 기하)
         └─ ConsultationLogModal (로직 유지; 페이지 CSS B0KlA 토큰만 치환)
```

**제외**: API·저장·저널·기간 계산·deep link 매칭 로직 변경, summary strip 신설(KPI 부재), `AdminDashboardB0KlA.css` 신규 import, 페이지별 hex 팔레트.

---

## 3. 세부 UI/UX 스펙

### 3.1 Entry 래퍼 (`ConsultationLogView.js`)

- **`AdminDashboardB0KlA.css` import 제거**.
- **`mg-v2-ad-b0kla` / `mg-v2-ad-b0kla__container` 래퍼 제거** — 매핑 `MappingManagement.js`와 동일하게 `AdminCommonLayout` → page 직결.
- 토큰 CSS (`unified-design-tokens` 등) import 유지.

### 3.2 Quiet header

- 기존 `ContentHeader` 유지 (제목·부제 한국어 상수 유지).
- Primary CTA가 헤더에 없으면 추가하지 않음(쓰기 CTA는 카드/행 클릭 → 모달).
- 금지: B0KlA green, forest `#3D5246`, hex 하드코딩.

### 3.3 Summary strip

- **생략 OK** (SSOT optional). 기존 KPI/stat 카드 없음 → 트윈 strip을 억지로 발명하지 않음.
- 후속 KPI가 생기면 `IntegratedScheduleSummaryStrip` / `PurchaseSummaryStrip` 3-cell 패턴으로만 추가.

### 3.4 Filter / Saved View

- 기능 유지. 셀렉트·인풋 보더·라벨 → `--mg-v2-color-*` / `--mg-v2-radius-*` / typography 4-step.
- B0KlA border·radius·green-bg 제거.

### 3.5 View tabs

- `MGButton` 유지. **active** = solid primary dusty teal (`variant="primary"` 또는 스코프 CSS `background: var(--mg-v2-color-primary-solid)` + light label).
- inactive = outline/ghost 계열, slate text, hairline border.
- 높이·radius: dashboard CTA와 정렬 (`--mg-v2-radius-md`, touch target 토큰).
- 금지: `--ad-b0kla-green-bg`, forest active.

### 3.6 Main stage (list / calendar / table)

- Stage `ContentCard` (또는 `__card-wrap` / `__card`): Clinic-OS 단일 카드 기하  
  - `border: 1px solid var(--mg-v2-color-neutral-300)`  
  - `border-radius: var(--mg-v2-radius-lg)`  
  - `background: var(--mg-v2-color-neutral-50)`  
  - `min-height: 36rem` (뷰 전환 단차 금지)  
  - **좌측 4px accent 금지** (`border-left` accent 없음)
- 목록 **아이템** 카드(클릭 인터랙션)는 interaction container로 유지하되 토큰만 `--mg-v2-*`.
- Calendar today wash: primary subtle `color-mix` / `--mg-v2-color-primary-*` tint — forest green-bg 금지.
- Table hover/header: `--mg-v2-color-neutral-*` / primary tint — `--ad-b0kla-*` 제거.

### 3.7 페이지 스코프 클래스

- ContentArea: `mg-v2-consultation-log-view consultation-log-view--clinic-os`
- 테스트 락용 클래스명 고정.

### 3.8 사용 토큰 목록 (CSS 변수만)

| 역할 | 토큰 |
|------|------|
| text | `--mg-v2-color-text-primary`, `--mg-v2-color-text-secondary` |
| primary CTA / active tab | `--mg-v2-color-primary-solid`, `--mg-v2-color-primary-dark`, `--mg-v2-color-primary-main` |
| page/surface | `--mg-v2-color-neutral-50`, `--mg-v2-color-neutral-100`, `--mg-v2-color-surface-secondary` |
| hairline | `--mg-v2-color-neutral-300` / `--mg-v2-color-border-*` |
| type | `--mg-v2-font-size-h1\|h2\|body-md\|caption`, `--mg-v2-font-weight-*` |
| space/radius | `--mg-v2-space-*`, `--mg-v2-radius-md\|lg` |
| button | `--button-height-sm`, `--mg-v2-touch-target-min` |

**금지**: hex 리터럴, `--ad-b0kla-*`, `#3D5246` primary, 신규 `AdminDashboardB0KlA.css`.

### 3.9 아토믹·공통 모듈

| 계층 | 재사용 |
|------|--------|
| Atoms | `MGButton`, `SafeText`(기존) |
| Molecules | `SavedViewControls` |
| Organisms | `ConsultationLogFilterSection`, List/Calendar/Table blocks |
| Template/Page | `AdminCommonLayout` + `ContentArea` / `ContentHeader` / `ContentCard` |

신규 공통 모듈 불필요.

---

## 4. 상호작용·상태

| 상태 | 동작 |
|------|------|
| 필터·Saved View | 변경 없음 |
| viewMode calendar/list/table | 변경 없음, stage 기하 동일 |
| 카드/행/이벤트 클릭 | 기존 `ConsultationLogModal` 오픈 |
| Empty | 이모지 없음; 톤만 Clinic-OS 토큰 |
| Loading | 기존 `UnifiedLoading` |
| Deep link | 로직 유지 |

---

## 5. 코더 완료 조건 (체크리스트)

- [ ] `AdminDashboardB0KlA.css` import 제거 (`ConsultationLogView.js`)
- [ ] `mg-v2-ad-b0kla` / `__container` 래퍼 제거
- [ ] `consultation-log-view--clinic-os` 페이지 스코프
- [ ] quiet header 한국어 유지; summary strip 생략(또는 KPI 있을 때만)
- [ ] view toggle active = primary-solid
- [ ] list/calendar/table stage Clinic-OS geometry; `--ad-b0kla-*` → `--mg-v2-*`
- [ ] hex 하드코딩 없음 (게이트 §17 / SETTINGS §1.3)
- [ ] list/filter/write(모달) 플로우 유지
- [ ] `ConsultationLogView.clinicOsChrome.test.js` (또는 동등) 추가 — MappingManagement 패턴
- [ ] 기존 consultation-log-view / ConsultationLogView Jest 통과
- [ ] B0KlA 잔존 검색 0건 (범위 파일)

---

## 6. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md`
- `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js`
- `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`
- `frontend/src/components/erp/PurchaseManagement.js`
- `frontend/src/components/admin/mapping-management/__tests__/MappingManagement.clinicOsChrome.test.js`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
