# 관리자 인앱 시각화 UI/UX 스펙 (Admin In-App Visualization Design Handoff)

## 1. 개요 및 배경

- **목적**: 실제 관리자 페이지(인앱) 내에 시각화(Visualization) 요소를 폭넓게 주입하여, 데이터 직관성과 업무 효율성을 높입니다.
- **방향성**: 마인드가든 어드민 대시보드 샘플(B0KlA) 스타일과 `PENCIL_DESIGN_GUIDE.md`를 철저히 준수합니다. 기획(planner) 스펙과 원활하게 병합되어 core-coder가 추측 없이 즉시 구현 가능하도록, 코드 없이 **토큰과 컴포넌트 트리, 제약사항** 중심으로 작성되었습니다.

---

## 2. Platform Patterns (5 Reusable Visual Patterns)

화면 전반에 걸쳐 재사용 가능한 5가지 주요 시각적 패턴을 정의합니다.

1. **Progress (진척도 바)**
   - **용도**: 진행 상태, 적합도 점수 등
   - **스타일**: 높이 4px~8px, 배경 `var(--mg-color-surface-hover)`, 채움 `var(--mg-color-primary-main)`
   - **Radius**: `var(--mg-radius-full)`

2. **Peek (사이드 픽 / 드로어)**
   - **용도**: 목록에서 항목 클릭 시 상세 정보 및 타임라인 표시
   - **스타일**: 폭 `360px`, 우측 슬라이드 인, 배경 `var(--mg-color-background-base)`, 그림자 `var(--mg-shadow-drawer)`
   - **구성**: 상단 고정 헤더(닫기 아이콘 포함) + 본문 스크롤

3. **Empty (빈 데이터 상태)**
   - **용도**: 필터 결과 없음, 내담자 없음 등
   - **스타일**: 중앙 정렬, 아이콘 색상 `var(--mg-color-text-tertiary)`, 상하 여백 최소 `var(--mg-spacing-48)`

4. **Badge Cluster (배지 군집)**
   - **용도**: 상태 태그, 카테고리 등 다수 배지 나열
   - **스타일**: Gap `var(--mg-spacing-8)`, Solid/Outline 배지 혼합 사용. Radius `var(--mg-radius-small)`

5. **Timeline (타임라인)**
   - **용도**: 내담자 이력, 매칭 진행 과정 이력
   - **스타일**: 좌측 축 두께 2px `var(--mg-color-border-default)`, 노드 크기 8x8px `var(--mg-color-primary-main)`

---

## 3. 화면별 UI/UX 스펙

### 3.1 통합일정 Pilot (Integrated Schedule)

#### 레이아웃/아이디어
일정 카드의 진행률 시각화와, 업무 상황에 맞게 뷰 밀도를 조절하는 기능(Toggle), 그리고 빠른 상세 조회를 위한 Side peek 패턴을 통합합니다.

#### ASCII Wireframe
```text
+-------------------------------------------------------------+
|  [ Filter: (All) (Upcoming) (Done) ]   [ Density Toggle ]   |
|                                                             |
|  +-------------------------+   +-------------------------+  |
|  | [======    ] 60%        |   | [==========] 100%       |  |
|  | Title & Time            |   | Title & Time            |  |
|  | [Badge Cluster]         |   | [Badge Cluster]         |  |
|  +-------------------------+   +-------------------------+  |
+-------------------------------------------------------------+
|<--- Side Peek (360px) ---------------------------------------|
|  [x] Details                                                 |
|  | Timeline Node 1                                           |
|  | Timeline Node 2                                           |
+-------------------------------------------------------------+
```

#### 세부 스펙
- **토큰 (Tokens)**
  - 밀도 토글 패딩: Compact `var(--mg-spacing-8)`, Comfortable `var(--mg-spacing-16)`
  - 세그먼트 활성 배경: `var(--mg-color-primary-light)`
  - Side Peek 배경: `var(--mg-color-background-base)`
- **컴포넌트 트리 (Component Tree)**
  - `Template`: IntegratedScheduleTemplate
  - `Organisms`: ScheduleFilterSegment, ScheduleDensityToggle, ScheduleCardGrid, SidePeekDrawer
  - `Molecules`: ScheduleCard, ProgressBar, BadgeCluster, TimelineList
- **접근성 (a11y)**: Progress bar 요소에 `aria-valuenow`, `aria-valuemin`, `aria-valuemax` 속성 필수. 토글 버튼에 `aria-pressed` 적용.
- **Must Not (제약)**:
  - Progress bar 내부 영역에 **빗살무늬(Stripe) 패턴 사용 절대 금지** (어드민 플랫톤 유지).
  - 카드 내 텍스트와 배경의 명도 대비(Contrast) 기준 위반 금지.

---

### 3.2 내담자 List (Client List)

#### 레이아웃/아이디어
표(Table) 형식 안에서 내담자의 상담 진행률을 미니 프로그레스 차트로 표현하여 한눈에 전체 진도를 파악하도록 합니다.

#### ASCII Wireframe
```text
+---------------------------------------------------------+
| Name       | Status    | Consultation Progress          |
|---------------------------------------------------------|
| Client A   | [Active]  | [=====     ] 50%               |
| Client B   | [Paused]  | [==        ] 20%               |
| Client C   | [Done]    | [==========] 100%              |
+---------------------------------------------------------+
```

#### 세부 스펙
- **토큰 (Tokens)**
  - 리스트 배경: `var(--mg-color-surface-base)`
  - 행 구분선: 하단 1px `var(--mg-color-border-divider)`
  - 표 내부 패딩: `var(--mg-spacing-12)`
- **컴포넌트 트리 (Component Tree)**
  - `Template`: ClientListTemplate
  - `Organisms`: ClientTable
  - `Molecules`: ClientTableRow, MiniProgressBar
  - `Atoms`: StatusBadge, ClientNameLabel
- **접근성 (a11y)**: `<table>`, `<th>`, `<td>` 등 시맨틱 구조 유지. 상태 뱃지는 스크린 리더용 숨김 텍스트 포함.
- **Must Not (제약)**:
  - 공간이 좁다는 이유로 **내담자 이름(Name)을 `...` 로 과도하게 숨기기(Hide) 금지**. 최소 10자 이상 텍스트 보장.
  - 리스트 행마다 불필요한 얼룩말(Zebra) 배경색 교차 적용 금지 (Hover 시에만 `var(--mg-color-surface-hover)` 적용).

---

### 3.3 매칭 List (Matching List)

#### 레이아웃/아이디어
내담자와 상담사 간 매칭 목록이며, 적합도(Fit Score)를 시각적인 막대로 표시합니다.

#### ASCII Wireframe
```text
+---------------------------------------------------------+
| Match #    | Counselor | Client   | Fit Score           |
|---------------------------------------------------------|
| M-001      | Dr. Smith | Client A | [████████░░] 80%    |
| M-002      | Dr. Jones | Client D | [██████████] 98%    |
+---------------------------------------------------------+
```

#### 세부 스펙
- **토큰 (Tokens)**
  - 높은 적합도 채움색: `var(--mg-color-primary-main)`
  - 일반 적합도 채움색: `var(--mg-color-primary-light)`
  - 스코어 텍스트: `var(--mg-color-text-primary)`, `font-weight: 600`
- **컴포넌트 트리 (Component Tree)**
  - `Template`: MatchingListTemplate
  - `Organisms`: MatchingTable
  - `Molecules`: FitScoreBar, MatchingRow
  - `Atoms`: ScoreText
- **접근성 (a11y)**: 점수는 시각적 막대 표시에 의존하지 않고, 반드시 명확한 텍스트 수치(%)로 병기.
- **Must Not (제약)**:
  - 적합도 점수에 빨간색이나 지나치게 화려한 다중 그라데이션 사용 금지. 어드민 샘플의 차분한 톤(#3D5246 계열) 유지.

---

### 3.4 Dashboard KPI Zone

#### 레이아웃/아이디어
상단 요약 영역에 핵심 지표(Total, Active 등)를 카드 형태로 배치하고, 미니 스파크라인(Sparkline)을 넣어 증감 추세를 시각화합니다.

#### ASCII Wireframe
```text
+---------------------------------------------------------+
| +----------------+  +----------------+  +-------------+ |
| | Total Clients  |  | Active Matches |  | Revenue     | |
| | 1,240  [+5%]   |  | 342    [-1%]   |  | ₩12.4M      | |
| | ~~~~~^~~~~     |  | ~~~v~~~~~~     |  | ~~^~~^~~~   | |
| +----------------+  +----------------+  +-------------+ |
+---------------------------------------------------------+
```

#### 세부 스펙
- **토큰 (Tokens)**
  - KPI 카드 배경: `var(--mg-color-surface-base)`
  - 테두리: 1px solid `var(--mg-color-border-default)`
  - 스파크라인 선형: `var(--mg-color-primary-main)`
  - 증감 텍스트(상승): `var(--mg-color-success-main)` (제한적 사용)
- **컴포넌트 트리 (Component Tree)**
  - `Template`: DashboardTemplate
  - `Organisms`: KpiZone
  - `Molecules`: KpiCard, SparklineChart
  - `Atoms`: TrendIndicator
- **접근성 (a11y)**: 추세를 보여주는 스파크라인 차트에 `aria-hidden="true"`를 적용하고, 스크린 리더에는 `[+5% 상승]` 텍스트를 명확하게 제공.
- **Must Not (제약)**:
  - KPI 영역 카드에 과도한 Drop Shadow 남용 및 3D 입체 효과 금지. (플랫 디자인 원칙).

---

## 4. 상호작용·상태 (Interaction & States)

- **Hover**: 리스트 행(Row), 카드(Card) 등에 마우스 오버 시 `background: var(--mg-color-surface-hover)` 적용. 커서는 `pointer`.
- **Loading**: 데이터 패치 시 전체 구역을 투명도 0.5로 낮추고 중앙에 `var(--mg-color-primary-main)` 색상의 스피너 노출.
- **Empty State**: 위에서 정의한 Platform Pattern 'Empty' 컴포넌트 재사용.

---

## 5. 참조 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `frontend/src/styles/unified-design-tokens.css`
- B0KlA 어드민 대시보드 샘플: `https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample`