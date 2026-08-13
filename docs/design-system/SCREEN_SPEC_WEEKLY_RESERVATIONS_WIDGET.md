# 주간 예약 현황 위젯 (Weekly Reservations Widget) UI/UX 스펙

**문서 버전**: 1.0 (MVP)
**작성자**: core-designer
**대상 화면**: AdminDashboardV2
**관련 API**: `GET /api/v1/admin/statistics/weekly-reservations?weekOffset=0|-1`

---

## 1. 개요 (Overview)
- **목적**: 어드민(ADMIN)이 한눈에 이번 주(또는 지난주)의 예약 밀도, 요일별 분포, 상태별 비중 및 전주 대비 추이를 파악할 수 있도록 지원.
- **원칙**: 카드 남발을 지양하고, 하나의 위젯(블록) 내에서 KPI, 요일별 추이, 상태별 요약을 압축적으로 제공.
- **제외 범위(Phase 2)**: 월간 캘린더/차트 풀구현, 개별 예약 상세 목록 노출.

---

## 2. 레이아웃 및 배치 (Layout & Placement)

### 2.1 화면 내 배치
- **위치**: `AdminDashboardV2` 본문 내, `ExpectedVisitsWidget` **직상단(바로 위)** 에 배치.
- **배치 의도**: 주간 예약 현황(현재/과거 확정 데이터)을 먼저 파악한 후, 미예약 예상 내담자(미래 예측 데이터)를 확인하는 자연스러운 인지 흐름(Context)을 제공하기 위함.

### 2.2 위젯 내부 구조 (1블록 구성)
- **컨테이너**: `ContentSection` 공통 모듈 사용.
- **헤더 영역**:
  - **Title**: "주간 예약 현황"
  - **Subtitle**: API 응답의 `weekStart` ~ `weekEnd` 활용 (예: "2026.08.10 ~ 2026.08.16")
  - **Actions (우측 상단)**: "이번 주" / "지난주" 전환 토글 (`SegmentedTabs` 또는 `MGButton` 그룹 활용, 1클릭 전환)
- **본문 영역 (Grid/Flex 3단 분할)**:
  - 데스크톱(PC): 가로 3단 분할 (`gap: 24px` 또는 `32px`)
    1. **좌측 (KPI)**: 총 예약 수 및 전주 대비 증감
    2. **중앙 (요일별)**: 월~일 예약 수 미니 바 차트
    3. **우측 (상태별)**: 상태별(BOOKED, CONFIRMED, COMPLETED, CANCELLED) 건수 요약
  - 모바일(Mobile): 세로 스택(Flex column, `gap: 24px`), 요일별 차트는 가로 스크롤 없이 화면 너비에 맞춰 촘촘하게(Compact) 압축 배치.

---

## 3. 아토믹 컴포넌트 및 공통 모듈 (Atomic & Common)

- **Organisms**:
  - `ContentSection`: 위젯 전체 래퍼.
- **Molecules**:
  - `SegmentedTabs` (또는 `MGButton` 2개 조합): 기간 토글 (이번 주 / 지난주).
  - `StatusBadge`: 상태별 라벨 표시 시 재사용.
  - `EmptyState`: 데이터가 없을 경우 노출 (아이콘 + "예약 데이터가 없습니다").
- **Atoms**:
  - `SafeText` / `toDisplayString`: 기간 라벨 등 텍스트 렌더링.
  - `toSafeNumber`: 카운트, 퍼센트 렌더링.

---

## 4. 디자인 토큰 및 색상 (B0KlA Design System)

하드코딩된 색상(Hex) 사용을 엄격히 금지하며, 아래의 `var(--mg-*)` 토큰을 사용합니다.

### 4.1 공통 배경 및 텍스트
- **위젯 배경**: `var(--mg-color-surface-main)` (#F5F3EF)
- **위젯 테두리**: `1px solid var(--mg-color-border-main)` (#D4CFC8), `border-radius: 16px`
- **기본 텍스트**: `var(--mg-color-text-main)` (#2C2C2C)
- **보조 텍스트 (기간, 라벨)**: `var(--mg-color-text-secondary)` (#5C6B61)

### 4.2 섹션별 세부 스타일
1. **KPI 영역 (좌측)**
   - **총 예약 수**: 32px, `font-weight: 700`, `var(--mg-color-text-main)`
   - **전주 대비 증감**:
     - 증가(+): `var(--mg-color-primary-main)` (#3D5246) 텍스트 또는 옅은 배경 배지
     - 감소(-)/동일: `var(--mg-color-text-secondary)` 텍스트
   - **좌측 악센트 바**: `width: 4px`, `border-radius: 2px`, `background-color: var(--mg-color-primary-main)` (KPI 구역 강조용)

2. **요일별 영역 (중앙)**
   - **미니 바 차트**: 7개의 세로 바 (월~일).
   - **바 기본 색상**: `var(--mg-color-border-main)` 또는 옅은 표면색.
   - **바 채움 색상**: `var(--mg-color-primary-light)` (#4A6354). 가장 수치가 높은 요일은 `var(--mg-color-primary-main)` (#3D5246)으로 강조.
   - **라벨(월~일)**: 12px, `var(--mg-color-text-secondary)`.

3. **상태별 영역 (우측)**
   - 4가지 상태(BOOKED, CONFIRMED, COMPLETED, CANCELLED)를 리스트 형태로 세로 배치.
   - 각 항목은 `상태 라벨(StatusBadge) + 건수(toSafeNumber)`의 Flex Row(`justify-content: space-between`) 구조.

---

## 5. 상태별 UI (States)

1. **로딩 상태 (Loading)**
   - `ContentSection` 내부에 스켈레톤(Shimmer) UI 또는 기존 공통 `mg-loading-spinner` 중앙 배치.
   - 높이는 최소 200px 유지하여 레이아웃 점프 방지.
2. **에러 상태 (Error)**
   - `EmptyState` 컴포넌트 활용. 아이콘(AlertCircle 등)과 함께 "데이터를 불러오지 못했습니다." 메시지 노출. 재시도 버튼 제공.
3. **빈 데이터 (Empty)**
   - `EmptyState` 컴포넌트 활용. "해당 주간의 예약 내역이 없습니다." 메시지 노출.

---

## 6. 코더 체크리스트 (Coder Checklist)

- [ ] `AdminDashboardV2.js`에서 `ExpectedVisitsWidget` 컴포넌트 **바로 위**에 `<WeeklyReservationsWidget />`을 배치했는가?
- [ ] UI 내 하드코딩된 색상 없이 `var(--mg-color-*)` 및 `mg-v2-ad-b0kla__*` 클래스를 사용했는가?
- [ ] API 응답 필드(`totalCount`, `byDayOfWeek`, `byStatus`)를 렌더링할 때 `toSafeNumber`와 `toDisplayString`을 적용하여 React #130 에러를 방지했는가? (안전 표시 경계 준수)
- [ ] 모바일 환경(너비 375px 수준)에서 요일별 바 차트가 깨지거나 가로 스크롤이 발생하지 않도록 Flex 속성(`flex-wrap` 또는 `min-width`)을 적절히 처리했는가?
- [ ] 기간 토글(이번 주/지난 주) 시 `weekOffset` 파라미터(0, -1)가 API로 정상 전달되며 로딩 상태가 부드럽게 전환되는가?
- [ ] 월간 캘린더나 복잡한 차트 라이브러리(Chart.js 등)를 무겁게 렌더링하지 않고, CSS 기반의 가벼운 미니 바(Sparkline 형태)로 요일별 추이를 구현했는가? (MVP 제약 준수)