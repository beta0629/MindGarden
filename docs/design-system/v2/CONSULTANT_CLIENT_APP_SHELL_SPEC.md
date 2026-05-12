# 앱 셸 레이아웃 스펙 (App Shell Spec)

상담사와 내담자를 위한 모바일 퍼스트 레이아웃 규격입니다.
기존 어드민(AdminCommonLayout)과는 분리된 독립적인 App Shell을 사용합니다.

## 1. 반응형 브레이크포인트 레이아웃

### 1.1 모바일 (< 768px)
- **상단 바 (Top Bar)**: 높이 56px, 고정(Fixed) 배치.
- **콘텐츠 영역 (Main Content)**: 상단 바 아래 ~ 바텀 네비게이션 위 공간 활용. 스크롤 가능.
- **바텀 네비게이션 (Bottom Nav)**: 화면 최하단 고정. 5개의 탭 구성.

### 1.2 태블릿 (768px ~ 1024px)
- **상단 바**: 높이 64px, 패딩 확장.
- **네비게이션**: 모바일과 동일하게 바텀 네비게이션을 유지하거나, 좌측 축약형 사이드 레일(Rail)로 변형 (Width 80px).
- **콘텐츠 영역**: 최대 너비 제어 없이 유동적 확장, 내부 패딩 증가 (`var(--mg-spacing-lg)` 이상).

### 1.3 데스크톱 (1024px +)
- **좌측 사이드바 (Sidebar)**: 데스크톱에서는 바텀 네비게이션이 좌측 사이드바로 이동 (Width 260px).
- **상단 바**: 콘텐츠 영역 상단에만 위치 (Sidebar 제외 영역).
- **콘텐츠 영역**: 최대 너비 제한 (예: 1200px) 및 중앙 정렬.

## 2. 바텀 네비게이션 스펙 (Bottom Navigation)

- **높이**: 64px (안전 영역 제외, 모바일 기기 하단 Safe Area Inset 추가 필요)
- **배경**: `var(--mg-client-surface)` 또는 `var(--mg-consultant-surface)`
- **상단 테두리**: `1px solid var(--mg-color-border-main)`
- **터치 타겟**: 탭 하나당 최소 `44px x 44px` 보장
- **구성 (Icon + Label)**:
  - 아이콘 크기: 24px
  - 텍스트 크기: `var(--mg-font-size-xs)` (12px)
  - 간격: 아이콘과 라벨 사이 4px

### 2.1 상담사 (Consultant) 5탭 구성
1. **홈 (Home)**: 대시보드
2. **스케줄 (Schedule)**: 캘린더
3. **내담자 (Clients)**: 내담자 목록
4. **일지 (Records)**: 상담 일지 작성 및 내역
5. **더보기 (More)**: 설정, 수입, 알림

- **색상 (Active)**: `var(--mg-consultant-primary)`
- **색상 (Inactive)**: `var(--mg-color-text-secondary)`

### 2.2 내담자 (Client) 5탭 구성
1. **홈 (Home)**: 피드
2. **예약 (Booking)**: 상담 예약 플로우
3. **내 상담 (Sessions)**: 이력 및 다가오는 일정
4. **웰니스 (Wellness)**: 마음챙김 및 활동
5. **더보기 (More)**: 프로필, 결제, 설정

- **색상 (Active)**: `var(--mg-client-primary)`
- **색상 (Inactive)**: `var(--mg-color-text-secondary)`

## 3. 상단 바 스펙 (Top Bar)

- **높이**: 모바일 56px / 데스크톱 64px
- **배경색**: 화면 배경과 동일 (`var(--mg-client-bg-main)` 등), 스크롤 시 Glassmorphism 적용 (`backdrop-filter: blur(8px)`)
- **구조**:
  - **Left**: 로고 (홈 화면) 또는 뒤로가기 버튼 (상세 화면)
  - **Center**: 현재 페이지 제목 (굵고 간결하게, `var(--mg-font-size-lg)`)
  - **Right**: 알림 아이콘(Badge 포함), 사용자 프로필 아바타 (크기 32x32px)

## 4. 애니메이션 및 전환 (Transitions)

- 탭 전환: 부드러운 Fade-in (`transition: opacity 0.2s ease`)
- 스크롤 시 상단 바 그림자: 스크롤 높이 0 초과 시 `box-shadow: var(--mg-shadow-sm)` 추가
