# 핵심 컴포넌트 디자인 스펙

본 문서는 상담사/내담자 앱의 주요 컴포넌트들의 시각적 규격과 속성을 정의합니다. 코더는 아래에 정의된 토큰과 상태별 스펙을 준수하여 개발해야 합니다.

## 1. AppShell (Template)
- **역할**: 모바일/데스크톱 라우트를 감싸는 최상위 컨테이너
- **스타일**:
  - `background-color`: `var(--mg-client-bg-main)` 또는 `var(--mg-consultant-bg-main)`
  - `min-height`: `100vh`
- **구조**: TopBar 컴포넌트, Main Content 영역 (패딩 적용), BottomNavigation 컴포넌트 조립

## 2. ScheduleCard (일정 카드 - 상담사용)
대시보드와 스케줄 탭에서 개별 상담 일정을 표시하는 카드입니다.

**상태·배지·과거 슬롯·미시작 보조 문구·액션 규칙(Expo SSOT)**은 [EXPO_APP_SCHEDULE_CARD_STATUS_SPEC.md](./EXPO_APP_SCHEDULE_CARD_STATUS_SPEC.md)를 따른다.

- **컨테이너**:
  - `background`: `var(--mg-consultant-surface)`
  - `border-radius`: `var(--mg-radius-xl)` (16px)
  - `padding`: `var(--mg-spacing-md)` (16px)
  - `box-shadow`: 기본 `var(--mg-shadow-sm)`, Hover 시 `var(--mg-shadow-md)` + `transform: translateY(-2px)`
- **좌측 악센트 바**: 상태별로 색상 구분 (예: 진행중 `var(--mg-consultant-primary)`, 대기중 `var(--mg-color-border-main)`)
- **텍스트 요소**:
  - 시간: `var(--mg-font-size-lg)`, `var(--mg-font-weight-semibold)`, `var(--mg-color-text-main)`
  - 내담자명: `var(--mg-font-size-base)`
  - 태그/구분: `var(--mg-font-size-xs)`, `var(--mg-color-text-secondary)`
- **우측 액션**: '상담 시작' 등 주조색 버튼 포함 (Button 높이 36px, `var(--mg-radius-lg)`)

## 3. ClientCard (내담자 카드 - 상담사용)
내담자 목록에서 사용하는 요약 프로필 카드입니다.

- **구성**:
  - 좌측: 내담자 아바타 (원형 48x48px)
  - 중앙: 내담자명 (`var(--mg-font-size-base)`), 최근 상담일 (`var(--mg-font-size-sm)`)
  - 우측: 위험/긴급 배지 또는 메시지 아이콘 버튼
- **패딩**: 상하 16px, 좌우 20px
- **구분선**: 카드 사이 `border-bottom: 1px solid var(--mg-color-border-main)` 적용 또는 독립된 박스 처리

## 4. ConsultationCard (상담 이력 카드 - 내담자용)
내 상담 화면에서 다가오는 일정이나 과거 이력을 보여주는 카드입니다.

- **디자인 방향**: 따뜻한 느낌 강조 (Client Theme 적용)
- **컨테이너**:
  - `border-radius`: `var(--mg-radius-xl)`
  - `background`: `var(--mg-client-surface)`
  - 내부 여백 넉넉하게: `var(--mg-spacing-lg)` (24px)
- **내용**: 
  - 상단: 상태 라벨 (예: "내일 예정", 배지 컴포넌트 활용)
  - 중간: 상담사 프로필 썸네일(32px) + 전문가 이름
  - 하단: 상담 시간표시 및 "입장하기" / "리뷰 쓰기" 버튼 (풀 사이즈, 높이 48px)

## 5. WellnessCard (웰니스 팁 카드 - 내담자용)
명상, 글귀 등 마음챙김 콘텐츠를 표시합니다.

- **컨테이너**:
  - 이미지 배경 위 어두운 그라디언트 오버레이 또는 부드러운 파스텔톤 배경 (`var(--mg-client-primary-light)` 활용)
  - `border-radius`: `var(--mg-radius-xl)`
- **내용**: 
  - 타이포그래피 강조: 텍스트 크기 `var(--mg-font-size-xl)`
  - 우측 하단 플레이 아이콘 또는 읽기 아이콘 배치

## 6. 예약 플로우 스텝 컴포넌트 (Booking Steps)
원스텝 예약 플로우를 위한 UI 컴포넌트입니다.

- **Step Indicator**: 상단에 진행 상황 바 (Progress bar) 표시 (`height: 4px`, `border-radius: 2px`, 채워진 부분 `var(--mg-client-primary)`)
- **선택 칩 (Chips)**: 가용 시간 선택 등에 사용
  - 기본: `background: transparent`, `border: 1px solid var(--mg-color-border-main)`, `color: var(--mg-color-text-main)`
  - 활성: `background: var(--mg-client-primary)`, `border-color: var(--mg-client-primary)`, `color: white`
  - 패딩: 12px 20px, `border-radius: var(--mg-radius-full)`
- **하단 고정 결제/확인 버튼**:
  - 모바일 화면 하단 (바텀 네비게이션 위)에 고정된 Sticky 영역 (`background: white`, 상단 그림자)
  - 버튼 풀 너비: `100%`, 높이 56px, `border-radius: var(--mg-radius-lg)`
