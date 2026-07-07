# G-14 AdminCommonLayout Pilot 화면설계서

## 1. 개요
- **목표**: G-14 셸 통일 Pilot으로 대시보드 및 통계 화면에 `AdminCommonLayout`을 적용하기 전의 디자인 Handoff 스펙을 정의한다.
- **사용자 관점**:
  1. **사용성**: 관리자가 LNB/GNB 및 본문 헤더를 다른 페이지와 동일한 느낌으로 사용할 수 있어야 한다.
  2. **정보 노출**: 기존 위젯 및 KPI 노출 범위는 유지하되, 이중 헤더를 제거한다.
  3. **레이아웃**: `AdminCommonLayout`의 `children`에는 본문만 포함하며, `ContentHeader`의 `title`과 `loading`은 페이지별로 주입한다.
- **제약 사항 (Must not)**:
  - 이중 LNB 구조 발생 금지
  - 가로 스크롤 깨짐 금지
  - React #130 에러(컴포넌트 언마운트 시 상태 업데이트 등) 발생 금지
- **작업 단위**: 1 PR = 1 화면 가설 (Pilot 1: Dashboard 권장, Pilot 2: Statistics 선택적 진행)

---

## 2. Pilot 1: AdminDashboardV2 (`/admin/dashboard`)

### 2.1. Before / After 와이어프레임 (텍스트)

**[Before]**
```text
+---------------------------------------------------------+
| [DesktopLayout / MobileLayout 직접 사용]                |
| +-----------------------------------------------------+ |
| | GNB (로고, 검색, 알림, 테마, 프로필)                | |
| +-----------------------------------------------------+ |
| | LNB (커스텀 메뉴 로직 포함) | [ContentArea]           | |
| |                             | +---------------------+ |
| |                             | | ContentHeader       | |
| |                             | | (대시보드 제목/부제)| |
| |                             | +---------------------+ |
| |                             | | [KPI Zone]          | |
| |                             | | [Pipeline]          | |
| |                             | | [Charts]            | |
| |                             | | [Admin Grid]        | |
| |                             | +---------------------+ |
+---------------------------------------------------------+
```

**[After]**
```text
+---------------------------------------------------------+
| <AdminCommonLayout title="대시보드" loading={loading}>  |
|   +---------------------------------------------------+ |
|   | [ContentArea]                                     | |
|   | +-----------------------------------------------+ | |
|   | | ContentHeader (대시보드 제목/부제/액션)       | | |
|   | +-----------------------------------------------+ | |
|   | | [KPI Zone]                                    | | |
|   | | [Pipeline]                                    | | |
|   | | [Charts]                                      | | |
|   | | [Admin Grid]                                  | | |
|   | +-----------------------------------------------+ | |
|   +---------------------------------------------------+ |
+---------------------------------------------------------+
```

### 2.2. AdminCommonLayout Props 매핑
- **title**: `t('admin:dashboard.v2.title')` (예: "대시보드")
- **loading**: `loading` (초기 데이터 로딩 상태)
- **children**: `<ContentArea>` 내부의 본문 영역 전체 (기존 `mainContent`에서 `ContentArea` 내부만 추출)
- **searchValue, onSearchChange, onBellClick, onLogout**: 기존 `layoutProps`에 전달하던 핸들러를 그대로 `AdminCommonLayout`에 전달

### 2.3. 디자인 토큰 및 반응형 (B0KlA)
- **컨테이너**: `mg-v2-ad-b0kla` 및 `mg-v2-ad-b0kla__container` 클래스 유지
- **반응형**: 1280px (Desktop), 768px (Tablet) 브레이크포인트에 맞춰 `AdminCommonLayout` 내부의 `DesktopLayout` / `MobileLayout` 자동 전환 활용
- **색상/간격**: `unified-design-tokens.css`의 `var(--mg-*)` 변수 사용

---

## 3. Pilot 2: StatisticsDashboard (`/admin/statistics`) - Optional

### 3.1. Before / After 와이어프레임 (텍스트)

**[Before]**
```text
+---------------------------------------------------------+
| [App.js에서 AdminCommonLayout으로 감싸서 라우팅]        |
| +-----------------------------------------------------+ |
| | <AdminCommonLayout title="통계 대시보드">           | |
| |   +-----------------------------------------------+ | |
| |   | [StatisticsDashboard 내부]                    | | |
| |   | <div className="mg-v2-ad-b0kla">              | | |
| |   |   <ContentArea>                               | | |
| |   |     <ContentHeader title="통계 대시보드" />   | | |
| |   |     [통계 본문 (Cards, Charts, Activity)]     | | |
| |   |   </ContentArea>                              | | |
| |   | </div>                                        | | |
| |   +-----------------------------------------------+ | |
| +-----------------------------------------------------+ |
+---------------------------------------------------------+
* 문제점: App.js에서 이미 AdminCommonLayout을 적용했으나, 내부 구조가 이중으로 래핑되거나 로딩 처리가 파편화됨.
```

**[After]**
```text
+---------------------------------------------------------+
| [App.js 라우팅]                                         |
| <StatisticsDashboard /> (App.js의 AdminCommonLayout 제거) |
|                                                         |
| [StatisticsDashboard 내부]                              |
| <AdminCommonLayout title="통계 대시보드" loading={loading}> |
|   <div className="mg-v2-ad-b0kla">                      |
|     <div className="mg-v2-ad-b0kla__container">         |
|       <ContentArea ariaLabel="통계 대시보드 본문">      |
|         <ContentHeader title="통계 대시보드" />         |
|         <main aria-labelledby="statistics-title">       |
|           [통계 본문 (Cards, Charts, Activity)]         |
|         </main>                                         |
|       </ContentArea>                                    |
|     </div>                                              |
|   </div>                                                |
| </AdminCommonLayout>                                    |
+---------------------------------------------------------+
```

### 3.2. AdminCommonLayout Props 매핑
- **title**: `t('common:misc.App.t_4938fae0')` (예: "통계 대시보드")
- **loading**: `loading` (통계 데이터 로딩 상태)
- **children**: `mg-v2-ad-b0kla` 컨테이너 내부의 `ContentArea` 및 통계 본문

### 3.3. 디자인 토큰 및 반응형 (B0KlA)
- **컨테이너**: 기존 `mg-v2-statistics-dashboard` 클래스와 B0KlA 토큰 유지
- **반응형**: 1280px / 768px 기준 그리드 레이아웃 유지 (`statistics-cards-grid` 등)

---

## 4. 구현 시 주의사항 (코더 전달용)
1. **LNB 커스텀 로직 제거**: `AdminDashboardV2`에 있던 `normalizeLnbMenuItemsForDashboard` 등의 LNB 조작 로직은 `AdminCommonLayout` 내부 로직으로 통합하거나, 전역 LNB 설정으로 이관하여 중복 호출 및 이중 LNB를 방지한다.
2. **로딩 상태 위임**: 개별 화면에서 `UnifiedLoading`을 직접 렌더링하지 않고, `AdminCommonLayout`의 `loading` prop으로 전달하여 셸 레벨에서 일관된 로딩 UI를 제공한다.
3. **App.js 라우트 정리**: `StatisticsDashboard` 적용 시 `App.js`에 하드코딩된 `<AdminCommonLayout>` 래퍼를 제거하고 컴포넌트 내부에서 호출하도록 수정한다.
4. **React #130 방지**: 비동기 데이터 로딩 후 상태 업데이트 시 컴포넌트 언마운트 여부를 확인(cleanup 함수 활용)하여 메모리 누수 경고를 방지한다.
