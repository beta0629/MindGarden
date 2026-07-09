# 상담사 대시보드 V2.1 개선 UI/UX 스펙 (Design Freeze)

## 1. 개요 및 배경
본 스펙은 상담사 대시보드의 V2.1 최종 개선안을 정의합니다. Web과 App 환경에서 동일한 데이터를 제공하되, 각 플랫폼의 특성에 맞는 레이아웃(Web LNB vs App AppShell)을 적용합니다. B0KlA 어드민 대시보드 샘플 수준의 높은 시각적 완성도(G1-02_FULL 동급)를 보장하며, Web과 App 간의 크로스 링크를 엄격히 금지합니다.

**목표**: 스켈레톤 UI, NextSession Hero, QuickAction 5, ListTableView 등 UX 10요인 및 P0 잔여 갭 전면 해소.
**API·기능 SSOT**: Web `ConsultantDashboardV2` + `ScheduleController` Phase1 API가 단일 진실 공급원입니다.

---

## 2. 레이아웃 구조 (B0KlA 기반)

### 2.1 Web `/consultant/dashboard` (LNB 기반)
- **전체 구조**: 좌측 고정 사이드바(260px) + 우측 메인 영역
- **배경**: `var(--mg-color-background-main)` (#FAF9F7)
- **상단 바**: `ContentHeader` (브레드크럼 + 제목 + 액션)
- **섹션 블록**: 각 콘텐츠는 독립된 블록으로 감싸며, 배경 `var(--mg-color-surface-main)`, 테두리 `1px solid var(--mg-color-border-main)`, `border-radius: var(--mg-radius-16)` 적용. 
- **좌측 악센트**: 타이틀 좌측에 4px `var(--mg-color-primary-main)` 악센트 바 사용.

### 2.2 반응형 브레이크포인트 (1280 / 768 / 414)
- **1280px (Desktop)**: 최대 너비 1200px 중앙 정렬. 스크롤 없이 KPI 4블록이 한눈에 들어오도록 카드 높이 최대 120px 최적화. 가로 스크롤 지옥 금지.
- **768px (Tablet)**: 사이드바 오버레이(드로어) 전환. 메인 콘텐츠는 100% 너비. KPI 2x2 그리드 배열.
- **414px (Mobile)**: 단일 컬럼 형태. 리스트와 카드 내 패딩 축소, 터치 타겟은 최소 44px 이상 보장.

---

## 3. 세부 UI/UX 스펙 (섹션별 아토믹 디자인)

### 3.1 KPI 4-grid (Tier)
- **Web**: 상단 가로 4열(`grid-template-columns: repeat(4, 1fr)`) 또는 화면 크기에 따라 2x2.
- **디자인**: `ContentKpiRow` 재사용. 숫자 강조(24px, 600, `var(--mg-color-text-main)`), 라벨(12px, `var(--mg-color-text-secondary)`).

### 3.2 다음 상담 Hero (NextSession)
- **목적**: 가장 임박한 다음 상담을 최상단 섹션 블록에서 강조하여 즉각적인 인지 도모.
- **디자인**: 넓은 면적의 영웅(Hero) 배너 스타일. 주요 액션(일지 열기, 스케줄 상세)을 명확한 Primary 버튼으로 제공.

### 3.3 오늘/다가오는 일정 (ListTableView)
- **컴포넌트**: `ProfileCard` 오용 절대 금지. 반드시 `ListTableView`(Compact 밀도)로 롤백.
- **CTA ≤ 1 원칙**: 행별 인라인 버튼 다중 배치 금지. 섹션 상단 우측에 "전체 일정 보기" 단일 액션 배치.
- **항목**: 시간, 내담자명, 상담 종류, 뱃지 상태.

### 3.4 빠른 액션 (QuickAction 4~5)
- **항목**: 일정 등록, 일정 확인, 내담자 메시지, 일지 작성, 정산 확인 등 핵심 4~5개 액션.
- **배치 (Web)**: `ContentHeader` 우측 혹은 주요 KPI 하단에 정제된 버튼/아이콘 그룹.
- **배치 (App)**: 가로 스크롤 혹은 상단 카드 하단의 QuickActionBar 형태로 구현.

### 3.5 월간 통계 차트 (chart-empty)
- **디자인**: 막대 또는 꺾은선 차트. 높이 Web 300px.
- **빈 데이터**: 데이터가 없을 경우 `chart-empty` 컴포넌트 렌더링.

---

## 4. API 매핑 및 Empty / Loading / Error 스펙

| 섹션 | Empty 상태 | Loading (스켈레톤) | Error (Graceful) |
|------|-----------|--------------------|-----------------|
| **KPI 4-grid** | 숫자 `0` | `ContentKpiRow` 4칸 스켈레톤 | `-` 표시 · 재시도 아이콘 |
| **미작성 일지** | 알림 영역 숨김 | 인라인 스피너 | 섹션 생략 (콘솔 warn) |
| **다음 상담 Hero** | 섹션 숨김 | 거대한 카드 스켈레톤 (1개) | 카드 숨김 |
| **오늘·어제 일정** | "예정된 일정이 없습니다" | `ListTableView` 3줄 스켈레톤 | "데이터를 불러오지 못했습니다" |
| **주간 차트** | `chart-empty` 일러스트 | 차트 영역 스켈레톤 블록 | "통계를 불러올 수 없습니다" |

*주의: 앱(App) 환경에서 Pull-to-refresh(당겨서 새로고침) UX는 기본 탑재되어야 하며, 웹은 별도 새로고침 버튼 또는 컴포넌트 마운트 로직에 의존합니다.*

---

## 5. 다크 모드 및 Must-not 규정

### 5.1 다크 모드 (Dark Cascade)
- **색상**: 배경 `var(--mg-dark-background-main)`, 서페이스 `var(--mg-dark-surface-main)`, 텍스트 `var(--mg-dark-text-main)`.
- 하드코딩된 hex 값 금지. 브라우저/시스템 테마 전환 시 끊김 없이 CSS 변수 체인 호환.

### 5.2 금지 사항 (Must-not)
- **ProfileCard 렌더링 금지**: 목록 영역에 `ProfileCard` 사용 시 렌더링 성능 및 레이아웃 이질감 발생.
- **인라인 스타일 금지**: `style={{}}` 절대 금지. `var(--mg-*)`와 `mg-v2-*` 유틸 클래스만 허용.
- **Cross-Link 금지**: Expo 앱 전용 경로(`/(consultant)/(home)/`)를 Web `clientDashboardRoutes.js` 류에 하드코딩 금지.

---

## 6. core-coder Handoff 체크리스트 (Admin 대비)
- [ ] B0KlA 섹션 블록(`mg-v2-ad-b0kla__section`) 단위로 페이지 래핑.
- [ ] `ListTableView` (Compact) 전면 적용 완료.
- [ ] 1280px 스크롤 없이 상단 KPI 4-grid 정상 렌더링 확인.
- [ ] 다음 상담 Hero 배너 적용 완료.
- [ ] 4~5개의 단일 진실 QuickAction이 올바르게 맵핑되었는가.
- [ ] 로딩 시 깜빡임 없이 정교한 섹션 단위 스켈레톤 UI가 렌더링 되는가.
- [ ] 다크 모드 토글 시 표, 글꼴, 차트 툴팁의 색상이 완벽히 반전되는가.
- [ ] `safeDisplay`를 통한 빈 데이터 오류(`undefined`) 방어 코드가 적용되었는가.