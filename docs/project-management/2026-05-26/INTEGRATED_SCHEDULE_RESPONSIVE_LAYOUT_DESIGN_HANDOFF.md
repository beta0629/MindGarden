# 통합 스케줄링 반응형 레이아웃 시안 핸드오프 (Design Handoff)

## 1. 사용자 보고 및 요구사항

**사용자 보고:**
"해상도가 낮은 PC에서는 상단 및 왼쪽 영역 때문에 한 칸만 보이는데 스케줄이 중심이 되어야 할 것 같은데? 상단 노출이 너무 넓게 나오더라구"

**요구사항:**
1. **캘린더가 중심**이 되어야 함.
2. **상단 안내 영역** (공휴일/회기 표기/상담사) 노출 영역 축소 필요.
3. **저해상도 PC** (1280px 이하 또는 1024px) 에서 캘린더 가독성 보장.
4. **좌측 매칭 패널** 도 캘린더 공간 압박하지 않게 조정.

---

## 2. 현재 레이아웃 인벤토리

### 핵심 컴포넌트 및 파일 경로
- **페이지 컨테이너:** `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`
- **스타일시트:** `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css`
- **좌측 매칭 패널:** `<aside className="integrated-schedule__sidebar">`
  - 현재 정책: `width: 320px`, `flex-shrink: 0`.
  - 반응형 정책: 1024px 이하에서 `display: none` 처리됨.
- **캘린더 영역:** `<main className="integrated-schedule__calendar-wrapper">` 내 `UnifiedScheduleComponent` 호출.
- **상단 안내 영역:** `frontend/src/components/ui/Schedule/ScheduleLegend.js` 및 `ScheduleHeader.js`
  - 현재 정책: 공휴일, 회기 표기, 상담사 컬러 칩, 주요 상태가 모두 펼쳐진 상태로 렌더링되어 세로 공간을 많이 차지함.

---

## 3. 시안 작성 (옵션 3종)

### 옵션 A (권고 후보 — 상단 collapsible accordion + 좌측 패널 collapse 토글)

**레이아웃 변경 (Wireframe 요약):**
```text
+---------------------------------------------------+
| [≡] 매칭 목록 (접힘/펼침) | [v] 범례 안내 (접힘/펼침) |
+-----------------------+---------------------------+
| (펼침: 280px)         |                           |
| (접힘: 48px)          |                           |
| - 매칭 카드 1         |       캘린더 영역         |
| - 매칭 카드 2         |       (flex: 1)           |
|                       |                           |
+-----------------------+---------------------------+
```

- **상단 안내 영역 (`ScheduleLegend.js`):** Collapsible Accordion으로 변경. 기본 접힘 상태 유지 (헤더 높이 40-48px). 클릭 시 전체 범례 노출.
- **좌측 매칭 패널 (`IntegratedMatchingSchedule.js`):** 사이드바 Collapse 토글 버튼 추가.
  - 펼침 상태: `width: 280px` (기존 320px에서 약간 축소하여 캘린더 공간 추가 확보).
  - 접힘 상태: `width: 48px` (아이콘 및 카운트 뱃지만 노출).
- **캘린더 영역:** `flex: 1`로 가용 공간을 모두 차지.
- **Break Point 별 노출 정책:**
  - **Desktop (1920px) / Laptop (1440px):** 좌측 패널 기본 펼침, 상단 안내 기본 접힘.
  - **Low-res PC (1280px):** 좌측 패널 기본 접힘 권장, 상단 안내 기본 접힘.
  - **Tablet (1024px 이하):** 좌측 패널 기본 접힘 (또는 기존처럼 숨김 후 Drawer 모달로 제공).
- **작업량 추정:** 중간 (Medium). 기존 컴포넌트에 상태(State)와 CSS 트랜지션 추가 필요.
- **트레이드오프:** 사용자가 범례를 보려면 한 번의 클릭(Depth)이 추가됨. 하지만 스케줄 캘린더 가독성은 극대화됨.

### 옵션 B (좌측 패널 위치 변경 — 우측 또는 상단으로)

- **레이아웃 변경:** 좌측 매칭 패널을 우측 사이드바 또는 상단 가로 스크롤 영역으로 이동.
- **상단 안내 영역:** 옵션 A와 동일하게 Collapsible 적용.
- **Break Point 별 노출 정책:** 상단 가로 스크롤 시 해상도 무관하게 캘린더가 전체 폭을 차지함.
- **작업량 추정:** 높음 (High). 드래그 앤 드롭(Drag & Drop) 로직 및 컴포넌트 구조 대대적 개편 필요.
- **트레이드오프:** 드래그 앤 드롭 동선이 상단->하단 또는 우측->좌측으로 변경되어 기존 사용자의 학습 곡선 발생.

### 옵션 C (분리 페이지)

- **레이아웃 변경:** 매칭 목록 (`/admin/mappings`)과 통합 스케줄링 (`/admin/schedule`) 페이지를 완전히 분리.
- **상호작용:** 매칭 카드 클릭 시 캘린더 뷰로 진입하거나, 캘린더 화면에서 Quick Switcher(모달)로 매칭을 불러옴.
- **작업량 추정:** 매우 높음 (Very High). 라우팅 및 상태 관리 전면 수정.
- **트레이드오프:** "통합 한 화면 관리"라는 본래의 기획 의도와 충돌할 수 있음.

---

## 4. 권고 옵션 및 사용자 컴펜 후보

**권고 옵션: 옵션 A**
- **사유:** 기존 드래그 앤 드롭 UX를 유지하면서, 접힘/펼침(Collapse) 기능만 추가하여 저해상도 PC에서의 캘린더 가독성을 즉각적으로 확보할 수 있습니다. 가장 안정적이고 기획 의도를 해치지 않는 접근입니다.

**사용자 컴펜 (Q1, Q2 후보):**
- **Q1 (옵션 선택):** "제시해 드린 옵션 중, 기존 드래그 앤 드롭을 유지하면서 패널들을 접었다 펼 수 있게 만드는 **옵션 A**로 진행하는 것이 가장 좋아 보입니다. 옵션 A로 진행할까요?"
- **Q2 (상단 안내 영역 Collapse 정책):** "상단 안내 영역(공휴일/범례 등)을 **기본적으로 접어둘까요(캘린더 공간 최대화)**, 아니면 **기본적으로 펼쳐두고 필요할 때만 접게 할까요**?"

---

## 5. 후속 위임 (core-coder) 시 작업 범위

사용자 컴펜 완료 후 `core-coder`에게 위임할 작업 범위입니다:
- **영향 파일:**
  - `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` (좌측 패널 토글 상태 추가)
  - `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css` (접힘 상태 CSS, width 트랜지션 추가)
  - `frontend/src/components/ui/Schedule/ScheduleLegend.js` (Accordion 상태 및 토글 UI 추가)
  - `frontend/src/components/schedule/ScheduleB0KlA.css` (범례 접힘 CSS)
- **예상 LOC:** 약 150~200 라인 변경.
- **작업 지침:** React `useState`를 활용한 토글 로직 구현 및 CSS `transition`을 통한 부드러운 접힘/펼침 애니메이션 적용.

---

## 6. 디자인 토큰 및 반응형 Break Point 정합

- **Break Point 정합:** `docs/standards/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3 기준 준수.
  - `lg (1024px)` 이하에서는 좌측 패널을 숨기거나 Drawer로 전환.
  - `xl (1280px)` 환경을 고려하여 패널 접힘 상태 폭을 48px로 최적화.
- **디자인 토큰:**
  - 통합 색상 및 간격 토큰 사용 (`var(--mg-spacing-*)`, `var(--mg-color-surface-*)`).
  - 옵션 A 캘린더 디자인 통일 합의서 (`docs/project-management/CALENDAR_DESIGN_UNIFICATION_PLAN.md`)와 정합하여 캘린더 내부 셀 디자인은 건드리지 않고 외부 컨테이너 레이아웃만 조정.
