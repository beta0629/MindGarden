# 역할별 디자인 토큰 정의서 (상담사·내담자)

본 문서는 MindGarden 앱의 상담사(CONSULTANT) 및 내담자(CLIENT) 전용 테마를 위한 디자인 토큰 정의서입니다.
`PENCIL_DESIGN_GUIDE.md`를 기반으로 하되 도메인에 맞게 따뜻하고 편안한 감성, 전문성을 강조하도록 확장되었습니다.
코더는 실제 구현 시 아래 명시된 `var(--mg-*)` 형태의 토큰만을 사용해야 합니다.

## 1. 색상 시스템 (Color Palette)

### 1.1 내담자 테마 (Client Theme) - 따뜻한 코랄·크림 톤
안심과 편안함을 주는 색상군으로 구성됩니다.

| 용도 | 설명 | 토큰 명칭 | 참조 색상(hex) |
|---|---|---|---|
| Main Background | 앱 전체 배경 | `var(--mg-client-bg-main)` | `#FAF9F7` (크림) |
| Surface / Card | 카드 및 블록 배경 | `var(--mg-client-surface)` | `#FFFFFF` 또는 `#F5F3EF` |
| Primary | 주조색 (버튼, 활성 아이콘) | `var(--mg-client-primary)` | `#E07A5F` (코랄) |
| Primary Light | 보조 강조 | `var(--mg-client-primary-light)` | `#F2CC8F` (연한 코랄/샌드) |
| Primary Dark | 텍스트 강조, 호버 | `var(--mg-client-primary-dark)` | `#C06A50` |
| Gradient | 메인 그라디언트 | `var(--mg-client-gradient)` | `linear-gradient(to right, #E07A5F, #F2CC8F)` |

### 1.2 상담사 테마 (Consultant Theme) - 차분한 그린·민트 톤
전문성과 신뢰를 주는 차분한 색상군으로 구성됩니다.

| 용도 | 설명 | 토큰 명칭 | 참조 색상(hex) |
|---|---|---|---|
| Main Background | 앱 전체 배경 | `var(--mg-consultant-bg-main)` | `#FAF9F7` |
| Surface / Card | 카드 및 블록 배경 | `var(--mg-consultant-surface)` | `#F5F3EF` |
| Primary | 주조색 (버튼, 활성 아이콘) | `var(--mg-consultant-primary)` | `#3D5246` (다크 그린) |
| Primary Light | 보조 강조 (선택됨 등) | `var(--mg-consultant-primary-light)` | `#6B7F72` (민트/세이지) |
| Primary Dark | 텍스트 강조, 호버 | `var(--mg-consultant-primary-dark)` | `#2A3A31` |
| Gradient | 메인 그라디언트 | `var(--mg-consultant-gradient)` | `linear-gradient(to right, #3D5246, #6B7F72)` |

### 1.3 공통 색상 (Common Colors)

| 용도 | 토큰 명칭 | 설명 |
|---|---|---|
| Text Main | `var(--mg-color-text-main)` | 본문 텍스트 (`#2C2C2C`) |
| Text Secondary | `var(--mg-color-text-secondary)` | 보조 텍스트, 캡션 (`#5C6B61`) |
| Border | `var(--mg-color-border-main)` | 카드 테두리, 구분선 (`#D4CFC8`) |
| Error | `var(--mg-color-error)` | 에러, 긴급 내담자 표시 (`#E57373`) |
| Success | `var(--mg-color-success)` | 완료, 긍정 표시 (`#81C784`) |

## 2. 타이포그래피 스케일 (Typography)

폰트 패밀리는 **Noto Sans KR**을 기본으로 사용합니다. (`var(--mg-font-family-body)`)

| 용도 | 폰트 크기 토큰 | 굵기 토큰 | 적용 속성 |
|---|---|---|---|
| 앱/페이지 제목 | `var(--mg-font-size-2xl)` (24px) | `var(--mg-font-weight-semibold)` (600) | `h1`, AppTopBar 제목 |
| 섹션 제목 | `var(--mg-font-size-xl)` (20px) | `var(--mg-font-weight-semibold)` (600) | 카드/섹션 타이틀 |
| 주요 본문 / 강조 | `var(--mg-font-size-lg)` (18px) | `var(--mg-font-weight-medium)` (500) | 메트릭 주요 숫자 |
| 일반 본문 | `var(--mg-font-size-base)` (16px) | `var(--mg-font-weight-normal)` (400) | 가독성을 위한 기본 폰트 |
| 보조 본문 | `var(--mg-font-size-sm)` (14px) | `var(--mg-font-weight-normal)` (400) | 리스트 아이템, 부가 설명 |
| 캡션 / 라벨 | `var(--mg-font-size-xs)` (12px) | `var(--mg-font-weight-medium)` (500) | 바텀 네비 라벨, 뱃지 |

## 3. 간격 스케일 (Spacing)

충분한 여백을 두어 모던하고 답답하지 않은 UI를 구성합니다.

| 크기 | 토큰 명칭 | 픽셀(px) | 적용 예시 |
|---|---|---|---|
| XS | `var(--mg-spacing-xs)` | 4px | 아이콘과 텍스트 사이 |
| SM | `var(--mg-spacing-sm)` | 8px | 카드 내 항목 간격 |
| MD | `var(--mg-spacing-md)` | 16px | 리스트 아이템 간격, 기본 패딩 |
| LG | `var(--mg-spacing-lg)` | 24px | 컨테이너 패딩, 섹션 간 여백 |
| XL | `var(--mg-spacing-xl)` | 32px | 화면 상하단 메인 여백 |
| 2XL| `var(--mg-spacing-2xl)`| 48px | 큰 구획 구분 |

## 4. 둥근 모서리 스케일 (Border Radius)

전체적으로 부드럽고 따뜻한 인상을 주기 위해 큰 곡률을 사용합니다.

| 용도 | 토큰 명칭 | 픽셀(px) | 적용 예시 |
|---|---|---|---|
| SM | `var(--mg-radius-sm)` | 4px | 체크박스, 작은 뱃지 |
| MD | `var(--mg-radius-md)` | 8px | 텍스트 입력 필드, 작은 버튼 |
| LG | `var(--mg-radius-lg)` | 12px | 기본 버튼, 작은 카드 |
| XL | `var(--mg-radius-xl)` | 16px | 메인 카드, 모달창 (App 기본 곡률) |
| FULL| `var(--mg-radius-full)`| 9999px | 원형 아바타, 둥근 뱃지 |

## 5. 그림자 스케일 (Elevation / Shadows)

Glassmorphism과 Premium Design 방향성에 맞춰 은은하고 깊이감 있는 그림자를 사용합니다.

| 단계 | 토큰 명칭 | 설명 | 적용 예시 |
|---|---|---|---|
| 0 | `var(--mg-shadow-none)` | 없음 | 플랫 컨테이너 |
| 1 | `var(--mg-shadow-sm)` | 얕은 그림자 | 호버되지 않은 카드 |
| 2 | `var(--mg-shadow-md)` | 부드러운 그림자 | 상단 바, 바텀 네비게이션 |
| 3 | `var(--mg-shadow-lg)` | 깊은 그림자 | 클릭/호버된 카드, 플로팅 버튼 |
| 4 | `var(--mg-shadow-xl)` | 강한 그림자 | 모달 팝업, 드롭다운 메뉴 |
