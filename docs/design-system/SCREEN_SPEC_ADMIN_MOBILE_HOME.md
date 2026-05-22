# 어드민·스태프 모바일 홈 UI/UX 스펙 (Phase 2)

## 1. 개요 및 배경

- **목적**: 어드민·스태프 모바일 앱 진입 시 "오늘 해야 할 일(일정 규모, 처리 대기 건수)"을 3초 이내에 파악할 수 있도록 대시보드를 고도화합니다. 웹 `AdminDashboardV2`의 "운영 큐" 개념을 모바일 라이트에 맞게 압축하여 제공합니다.
- **주요 변경 사항**: AppTopBar 추가, 기존의 단순한 StatCard 2열 배열을 client-home과 통일된 **가로 스크롤형 KPI 스트립**으로 변경, **오늘 일정 1~3건 미리보기** 제공, 처리 대기 배너(P1) 추가.
- **주의**: 어드민 홈이므로 상담사용 기능인 **"미작성 일지 배너"는 철저히 배제**합니다.

## 2. 레이아웃/아이디어 (선정된 안과 이유)

- **상단바 + 큐 요약 + KPI + 스냅샷 + 액션**:
  위에서부터 아래로 스크롤 동선에 맞춰 중요도를 배치합니다.
  (1) `AppTopBar`
  (2) 인사 & 요약 문구
  (3) 대기/긴급 배너 스택 (P1)
  (4) KPI 스트립 (가로형)
  (5) 오늘 일정 미리보기 (1~3건)
  (6) 운영 스냅샷 행 (P1)
  (7) 빠른 액션(QuickActionBar)
- **반응형(모바일) & 패턴 벤치마킹**: `expo-app/app/(client)/(home)/index.tsx` 레이아웃 패턴(높이 52 AppTopBar, 가로 ScrollView KPI 스트립)을 활용하여 전반적인 모바일 UX의 통일감을 부여합니다.
- **역할 분리**: ADMIN과 STAFF 계정에 따라 노출해야 하는 KPI와 메뉴가 상이하므로 철저한 분기 처리를 동반한 UI를 제공합니다.

## 3. 세부 UI/UX 스펙

### 3.1 전체 화면 프레임

- **배경**: `adminTheme.colors.bgMain` (기본 배경색, #FAF9F7 등)
- **전체 구조**: 당겨서 새로고침(`RefreshControl`)이 포함된 세로 방향 `ScrollView` 베이스.
- **섹션 간격 (Gap)**: 구역과 구역 사이 기본 여백은 `adminTheme.spacing.lg` (24px).
- **내부 패딩**: 좌우 여백 `adminTheme.spacing.md` (16px) 적용.

### 3.2 섹션별 상세 디자인

#### A. AppTopBar (P0)
- **높이**: 52px
- **구성**: 타이틀(어드민 홈) + 우측 알림 배지(종 아이콘 + 빨간 dot 표기)
- **데이터 연동**: `useUnreadCount` 기반 알림 배지
- **디자인 토큰**: 배경 `adminTheme.colors.bgMain`, 하단 스크롤 시 그림자/보더라인 적용 권장.

#### B. 인사 & 요약 문구 (P0)
- 상단바 직하단에 배치되는 요약 텍스트. "오늘 N건의 일정, M건의 처리 대기" (`ADMIN_MOBILE_HOME_COPY` 사용)
- **메인 인사말 폰트**: `adminTheme.textStyles.h2` 또는 20~24px 굵게, `adminTheme.colors.gray[900]`
- **서브텍스트**: `adminTheme.textStyles.body2`, `adminTheme.colors.gray[600]`

#### C. 대기·긴급 배너 스택 (P1) - `AdminOpsBannerStack`
- **규칙 1**: **미작성 일지 배너는 절대 금지!** 어드민 홈에 렌더링 되지 않아야 합니다.
- **규칙 2**: 입금/결제 대기, 매칭 대기, 검수 대기 항목(0건 초과 시에만 노출).
- **디자인 토큰**: 
  - 컨테이너 배경: `adminTheme.colors.surfaceAlt` (다크) 또는 연한 틴트 배경
  - 텍스트/아이콘 색상: `adminTheme.colors.primary` 또는 포인트 색상

#### D. KPI 스트립 (P0~P1) - `AdminHomeKpiStrip`
- **구조**: 기존의 화면을 양분하던 flex row 2칸 구조를 버리고, **내담자 홈과 동일한 패턴**을 사용합니다.
- **레이아웃**: 가로 `ScrollView` (`showsHorizontalScrollIndicator={false}`), `gap: 12`, `paddingHorizontal: 16`.
- **개별 카드**: `@/components/atoms/StatCard` 사용 (molecule 패키지의 StatCard는 절대 사용 금지). `minWidth` 약 110px 이상.
- **스타일**: `showAccentBar={true}` 등 기존 컴포넌트 프랍을 활용하여 왼쪽 악센트 바(adminTheme.colors.accent 등) 강조.

#### E. 오늘 일정 미리보기 (P0) - `AdminTodaySchedulePreview`
- **기능**: 상위 1~3건의 일정 목록 표출
- **헤더**: 왼쪽 "오늘 일정 (N건)" (16~18px 굵게), 오른쪽 "전체 보기" 텍스트 (Pressable, `adminTheme.colors.primary`)
- **개별 카드**: 기존 `ScheduleCard` (Molecule) 사용.
  - **제약 조건**: 완전한 **Read-only** 모드로 넘겨야 하므로, `actionLabel`이나 `onActionPress` 속성을 주입하지 않습니다.
  - **텍스트 표시**: `clientName` 프랍 부분에 "내담자 이름 · 상담사 이름" 등 병기.

#### F. 빠른 액션 (P0~P1) - `QuickActionBar`
- **디자인**: `molecules/QuickActionBar` 그대로 사용하되 내부 Item 교체.
- **액션 리스트**: 
  1. 일정 등록 (route: create) - `CalendarPlus` 아이콘
  2. 스케줄 (route: schedule) - `Calendar` 아이콘
  3. 메시지 (route: messages) - `MessageSquare` 아이콘
  4. 매칭 관리 (P1)
  5. 사용자 관리 (P1)
  6. 웹 통합 일정 (P1) - "웹에서 열기" Linking 브릿지 패턴 적용.
- (액션 아이템 개수가 4~5개를 넘어가면 2줄 처리하거나 가로 스크롤/justifyContent 등 조율 필요)

### 3.3 디자인 토큰 맵핑 가이드 (CSS / JS)
- 주조색 (Primary): `adminTheme.colors.primary` (#3D5246)
- 표면색 (Card/Surface): `adminTheme.colors.surface` (#F5F3EF) 또는 `surfaceAlt`
- 배경색: `adminTheme.colors.bgMain` (#FAF9F7)
- 텍스트색: 메인은 `adminTheme.colors.gray[900]` / `[800]`, 보조는 `gray[600]` / `[500]`
- 하드코딩된 Hex 값 금지, 반드시 `adminTheme` 객체 테마 토큰을 주입합니다.

## 4. 상호작용·상태 (역할 분기 포함)

### 4.1 ADMIN vs STAFF 역할 변형 매트릭스

| 영역/지표 | ADMIN 노출 여부 | STAFF 노출 여부 | 예외 / 빈 상태 처리 |
|---|---|---|---|
| **오늘 일정 미리보기** | 노출 | 노출 | (일정이 없으면 `EmptyState` 노출) |
| **읽지 않은 시스템 알림** | 노출 | 노출 | TopBar 알림 배지로 표현 |
| **미작성 일지 배너** | **절대 노출 불가** | **절대 노출 불가** | (코드상 컴포넌트 자체를 Import 하지 말 것) |
| **매칭 목록 / 대기 (P1)** | 노출 | `canViewMappingsOnMobile` 여부 | 권한 없을 시 UI 숨김 (0 렌더 금지) |
| **결제/입금 대기 (P1)** | 노출 | 매칭 권한과 동일 | 403 API 응답 시 조용히 숨김 (앱 크래시 방지) |
| **커뮤니티 검수 대기 (P1)**| 노출 | **노출 불가** (숨김) | STAFF는 접근할 수 없음 |
| **마음날씨 KPI (P1)** | 노출 | **노출 불가** (숨김) | STAFF는 접근할 수 없음 |
| **빠른 액션 - 계정 생성** | 노출 | **노출 불가** | |

### 4.2 로딩, 에러, Empty 스켈레톤 디자인
- **초기 로딩**: 데이터 Fetch 중일 때 `AppTopBar`는 그대로 렌더링하되, KPI 스트립은 `atoms/SkeletonLoader` 2~3개를 가로 배열합니다. 오늘 일정 미리보기 구간에는 `SkeletonCard` 컴포넌트 1~2개를 표출.
- **Pull-to-Refresh**: 뷰 당길 때 ActivityIndicator 발생, 훅의 `refetchAll` 함수 트리거.
- **Empty (일정 없음)**: 목록 길이가 0일 때 `atoms/EmptyState`를 사용하여 "오늘 예정된 일정이 없습니다" 노출.
- **API 에러 (403 포함)**: 데이터 fetch 실패 시 오류 문구를 남발하지 않고(특히 P1 KPI 류), 영역을 조용히 숨기거나 빈 공간 처리(스켈레톤 해제)하여 앱 사용을 방해하지 않습니다.

## 5. 참조 (SSOT 및 관련 문서)

- **디자인 기준 (Web B0KlA)**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`
- **모바일 UX 패턴 벤치마크**: `expo-app/app/(client)/(home)/index.tsx`
- **테마 기준**: `expo-app/src/theme/admin-theme.ts` (`colors.admin` 등 사용)

---

## 6. core-coder 전달 체크리스트 (5항)

> **core-coder**는 본 화면 구현 시 아래 5개 조항을 필수로 지켜야 합니다. UAT 통과 조건과 직결됩니다.

1. **벤치마크 고정 (가로 ScrollView)**: KPI 영역 디자인은 `(client)/(home)/index.tsx`의 "가로 ScrollView 패턴"을 그대로 따라야 합니다. 기존의 어드민 홈 2칸 flex row 레이아웃은 폐기합니다.
2. **StatCard 단일 SSOT**: 모든 홈 KPI는 `@/components/atoms/StatCard`만을 사용합니다. (레거시인 `molecules/StatCard`는 Import 절대 금지)
3. **교차 배치 금지 명문화**: 어드민/스태프 홈에 상담사 전용인 **"미작성 일지 배너 (`usePendingRecords` 등)"를 절대 삽입하지 마십시오.** 또한 STAFF 계정에 검수/마음날씨 등 권한 밖의 UI를 노출하지 않아야 합니다.
4. **ScheduleCard 이중 모드 구현**: 어드민 홈의 "오늘 일정 미리보기" 카드는 `actionLabel`이나 `onActionPress` props 없이 **Read-only**로 넘겨야 합니다. 또한 `clientName` 출력 시 "내담자 · 상담사" 포맷으로 병기되어야 합니다.
5. **P0/P1 스코프 vs Follow-up 분리**: `MobileHomeKpiStrip` 등의 공통 Organism 추출에 집착하지 않아도 됩니다. 화면 안에서 인라인 조합으로 P0 구현을 완료하는 것이 우선이며, Organism 추출은 코딩이 정상 작동한 후 Follow-up 단계에서 고려합니다.
