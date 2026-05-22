# 상담사 모바일 홈 (Consultant Mobile Home) UI/UX 스펙

## 1. 개요 및 배경
- **목적**: 상담사가 앱을 열었을 때 출근, 상담 전, 상담 사이의 상황에서 "오늘 무엇을 해야 하는지" 3초 이내에 파악할 수 있도록 정보 밀도와 우선순위를 모바일에 맞게 재구성합니다.
- **해결 문제**: 기존 홈 화면의 단조로움을 개선하고, 웹 대시보드 V2 대비 누락되었던 요약 KPI, 다음 상담 안내, 메시지/알림, 긴급 알림, 빠른 액션 등을 모바일 환경에 최적화하여 제공합니다.

## 2. 레이아웃 / 아이디어
- **선정된 안**: 상단에서 하단으로 `TopBar → 인사+요약 → (알림 스택) → KPI 스트립 → 다음 상담 카드 → 오늘 스케줄 → (스냅샷 행) → 빠른 액션` 순서로 배치합니다. (내담자 홈 패턴 정렬)
- **이유**: 출근 직후에는 오늘 스케줄 규모와 첫 상담이 가장 중요하며, 상담 사이에는 긴급 미작성 일지와 안읽은 메시지 확인이 우선되기 때문입니다.
- **사용성 및 정보 노출**: 
  - 스크롤 깊이는 2~3 화면 분량 이내로 제한합니다.
  - **정책 준수**: COMPLETED(작성 완료) 일지는 홈 및 목록 어디에서도 열람 CTA를 제공하지 않습니다. (데스크톱 전용) 미작성(DRAFT/미완료) 일지에 대해서만 배너 및 CTA를 노출합니다.
  - 내담자 PII 노출은 기존 `ScheduleCard` 수준(이름, 회기 유형)으로 제한하며, 급여 정산 등 민감 정보는 요약만 제공합니다.
  - 매칭 큐, 결제·입금 대기, 커뮤니티 검수 대기 등의 어드민/스태프용 배너 노출은 **절대 금지**됩니다.

## 3. 세부 UI/UX 스펙

### 3.1 P0/P1 섹션 순서 및 와이어프레임

```text
[Top Bar]
---------------------------------------------------
|  (MindGarden 로고)           [🔔(unread 배지)]     |
---------------------------------------------------

[Main Content - Scrollable]
---------------------------------------------------
| [인사 + 요약]                                     |
| 안녕하세요, 김상담 선생님!                           |
| 오늘 3건의 상담이 예정되어 있습니다.                   |
---------------------------------------------------
| [긴급 알림 스택 (에러 톤)]                         |
| ⚠️ 미작성 일지 1건이 있습니다. [바로가기 >]            |
| (P1) 🚨 긴급: 이내담 님 (고위험 분류)                |
---------------------------------------------------
| [KPI 스트립 - 가로 ScrollView]                      |
| [오늘 상담 3건] [안읽은 메시지 2건] [(P1) 신규내담 1명] |
---------------------------------------------------
| [(P1) 다음 상담 카드 - ConsultantNextSessionCard]   |
| [배지: 1시간 뒤] [상담일지 작성 CTA]                 |
| 10:00 - 10:50 | 이내담 님 (초기상담)                |
---------------------------------------------------
| [오늘의 스케줄 - MobileHomeSectionHeader]           |
| ----------------------------------------------- |
| | 10:00 - 10:50                               | |
| | 이내담 님 (초기상담)                             | |
| | [상담 일지 열기] [입장 대기]                     | |
| ----------------------------------------------- |
---------------------------------------------------
| [(P1) 활동 스냅샷 행 - ConsultantHomeSnapshotRow]   |
| [메시지 최근 1스레드] | [급여 정산 요약]              |
---------------------------------------------------
| [빠른 액션 - QuickActionBar]                       |
| [일정 추가 ➕]   [근무 설정 ⏰]                      |
| [(P1) 메시지 💬]  [(P1) 일지 📝]  [(P1) 급여 📋]    |
---------------------------------------------------
```

### 3.2 컴포넌트 아토믹 계층 & 재사용 구조
- **AppTopBar (Organism)**: `app-chrome/AppTopBar` 사용. (내담자 홈과 톤 정렬)
- **인사 및 요약 (Molecule 후보)**: P0 단계에서는 화면 인라인 적용 (후속 `MobileHomeGreetingBlock` 추출).
- **ConsultantPendingRecordsBanner (Molecule)**: 미작성 일지 전용 배너. 어드민에서 재사용 금지.
- **ConsultantUrgentClientBanner (Molecule)**: P1. 긴급 내담자 알림 배너.
- **StatCard (Atom)**: `components/atoms/StatCard.tsx` SSOT 활용. `showAccentBar`, `onPress` 적용. (기존 `molecules/StatCard` 사용 금지)
- **ConsultantHomeKpiStrip (Organism)**: 가로 ScrollView + StatCard의 조합. P0 단계에서는 화면 내 인라인 복제 허용.
- **ConsultantNextSessionCard (Organism)**: P1. 오늘/내일 첫 미완료 스케줄 표시. (내담자 `ConsultationCard`와 혼용 금지)
- **ScheduleCard (Molecule)**: 오늘 스케줄 카드. `consultantScheduleCardUi`의 액션 및 footerHint 유지.
- **QuickActionBar (Molecule)**: 기존 컴포넌트 재사용 및 액션 배열만 P0/P1에 맞게 확장.

### 3.3 Expo Theme 토큰 및 MG 웹 CSS Var 대응 표
코드 내 하드코딩(#hex, 16px 등)을 금지하며, 아래의 RN Theme 토큰을 사용합니다.

| 용도 | Expo RN 토큰 (`theme.colors.*`, `spacing.*`) | MG 웹 CSS 변수 대응 (`var(--mg-*)`) |
|------|---------------------------------------|------------------------------------|
| 메인 배경 | `theme.colors.bgMain` | `var(--mg-color-bg-main)` |
| 섹션 배경/카드 | `theme.colors.surface` | `var(--mg-color-surface)` |
| 기본 텍스트 | `theme.colors.textMain` | `var(--mg-color-text-main)` |
| 보조 텍스트 | `theme.colors.textSecondary` | `var(--mg-color-text-secondary)` |
| 브랜드 주조색 | `theme.colors.primary` (상담사 테마) | `var(--mg-color-primary-main)` |
| 에러/긴급 배너 | `theme.colors.error` / `theme.colors.errorLight` | `var(--mg-color-error-main)` / `-light` |
| 테두리(Border) | `theme.colors.border` | `var(--mg-color-border)` |
| 간격/패딩 | `theme.spacing[4]` (16px), `[6]` (24px) | `var(--mg-spacing-16)`, `var(--mg-spacing-24)` |
| 반경(Radius) | `theme.borderRadius.xl` (16px) | `var(--mg-radius-xl)` |
| 폰트 | `theme.fontFamily.semibold`, `regular` | `font-family: 'Noto Sans KR'` |

## 4. 상호작용 및 상태

### 4.1 상태 정의
- **Loading Skeleton**: KPI 스트립 로딩 시 `SkeletonLoader`, 스케줄 카드 및 다음 상담 카드 로딩 시 `SkeletonCard` 적용.
- **Empty State**: 오늘 스케줄이 0건일 때, `EmptyState` 컴포넌트(메시지: 예정된 상담이 없어요)를 노출합니다. KPI `todayCount`가 0일 경우, "오늘 0건의 상담이 예정되어 있습니다"로 부드럽게 표기.
- **Error State**: API 실패 시 빈 KPI는 화면이 깨지지 않도록 스켈레톤에서 "0" 또는 "-"로 우회 폴백(fallback)하고 부분 렌더링 유지. 앱 크래시 방지.

### 4.2 접근성(a11y) 및 터치 영역
- `AppTopBar`의 알림 배지 및 아이콘 버튼은 최소 터치 영역인 `ADMIN_MIN_TOUCH_TARGET`(44x44px)을 준수.
- 각 `StatCard` 및 배너에 명확한 `accessibilityLabel`과 `accessibilityRole="button"` 부여.
- 인사말 영역에는 `accessibilityRole="header"`를 지정하여 스크린 리더에서 제목으로 인식하게 함.

## 5. core-coder 전달 체크리스트

1. [ ] **벤치마크 일치**: 내담자 홈(`app/(client)/(home)/index.tsx`)의 시각/간격(AppTopBar 높이, 가로 ScrollView + atoms/StatCard minWidth ~110, borderRadius.xl)과 일치해야 합니다. 어드민의 2칸 꽉찬 flex 레이아웃은 참고하지 마십시오.
2. [ ] **StatCard 단일 SSOT 준수**: 홈 KPI는 반드시 `@/components/atoms/StatCard`를 사용합니다. `molecules/StatCard`는 사용하지 마십시오.
3. [ ] **정책 철저 준수 (교차 배치 금지)**: COMPLETED 일지의 열람 CTA 버튼은 홈 어디에도 추가하지 마십시오. 또한 매칭 큐, 입금 큐, 커뮤니티 검수 대기 등의 컴포넌트를 상담사 홈에 올리지 않아야 합니다.
4. [ ] **ScheduleCard 이중 모드 구분**: 상담사 홈의 `ScheduleCard`는 `consultantScheduleCardUi`의 액션 버튼과 footerHint가 온전히 표시되어야 합니다.
5. [ ] **하드코딩 제거**: 색상, 여백, 폰트는 반드시 `theme` 객체를 통해 참조하고, 모든 한글 텍스트는 `consultantHomeCopy.ts`에 상수화하여 사용해야 합니다.

## 6. 참조
- `docs/project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`
- `docs/project-management/MOBILE_HOME_PHASE1B_COMPONENT_PROPOSAL.md`
- `docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md`
- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `frontend/src/styles/unified-design-tokens.css`