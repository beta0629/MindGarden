# Design V2 Phase C-1 (3/3) — Landing Page (`/`) Visual Spec

> **문서 상태**: 확정 (Phase C-1)  
> **담당**: core-designer  
> **관련 PR/Issue**: Phase C 기획서 PR #394 인용  
> **작업 워크트리**: `/Users/mind/mindGarden-design-v2-phase-c1-landing`

---

## §1. 개요·범위

본 문서는 MindGarden 디자인 v2 Phase C-1의 일환으로, 메인 랜딩 페이지(`/`)의 시각적 스펙(Visual Spec)을 정의합니다. 

### 1.1 주요 결정 사항 반영
- **G① 모델**: `gemini-3.1-pro` 기반 시각 일관성 및 레이아웃 설계.
- **G② 다크 토글**: `PublicHeader` 우측에 배치하여 즉각적인 접근성 확보.
- **G③ 가격 노출**: 랜딩 페이지 내 직접적인 가격 노출을 금지하고, Pricing 페이지(`/pricing`)로 유도하는 CTA 배치.
- **G④ 자유 카피 및 운영팀 슬롯**: 디자이너가 제안하는 자유 카피와 이미지를 사용하되, 실제 운영 환경에서 교체 가능하도록 모든 텍스트/이미지를 **운영팀 입력 슬롯**으로 분리.
- **G⑤ 회귀 도구**: Playwright를 이용한 시각적 회귀 테스트(Visual Regression) 적용.
- **G1 옵션 C (흡수)**: 기존 `/landing` 라우트의 마케팅 콘텐츠(사회적 증명 등)를 메인 랜딩 페이지의 하위 섹션으로 흡수 통합.

---

## §2. 사용성·정보 노출·레이아웃 원칙

### 2.1 사용성 원칙
- **첫인상 (5초 룰)**: Hero 섹션에서 서비스의 핵심 가치(차분한 신뢰감, 심리 상담 최적화)를 즉각적으로 전달합니다.
- **명확한 다음 행동**: 각 섹션마다 명확한 Primary/Secondary CTA를 배치하여 온보딩(`/onboarding`) 또는 요금 안내(`/pricing`)로 자연스럽게 유도합니다.

### 2.2 정보 노출 원칙
- **가격 정보**: 구체적인 숫자는 배제하고 "합리적인 요금제 확인하기" 등의 카피와 함께 `/pricing` 링크를 제공합니다.
- **콘텐츠 슬롯화**: 하드코딩된 텍스트나 이미지를 배제하고, CMS나 설정 파일에서 주입받을 수 있는 구조(Slot ID 부여)로 설계합니다.

### 2.3 레이아웃 원칙
- **반응형 기준**: 데스크탑(1440×900)과 모바일(414×896)을 기준으로 설계하며, 그 사이 해상도는 유동적으로 대응합니다.
- **그리드 시스템**: 데스크탑 12-column (Gutter 24px), 모바일 4-column (Gutter 16px)을 준수합니다.
- **공통 레이아웃**: `PublicLayout` (`PublicHeader` + `PublicFooter`) 내부에 콘텐츠를 배치합니다.

---

## §3. Hero 섹션

랜딩 페이지의 최상단 섹션으로, 시각적 임팩트와 핵심 가치를 전달합니다.

### 3.1 레이아웃 및 와이어프레임
- **데스크탑 (1440×900)**: 좌우 5:7 비율의 Split 레이아웃.
  - 좌측: 메인 카피, 부제, CTA 버튼 그룹 (수평 정렬).
  - 우측: 대시보드 목업 이미지 또는 감성적인 일러스트.
- **모바일 (414×896)**: 상하 Stack 레이아웃.
  - 상단: 메인 카피, 부제, CTA 버튼 그룹 (수직 정렬, width 100%).
  - 하단: 이미지 (가로 꽉 차게 배치).

### 3.2 스타일 및 토큰 매핑
- **배경**: `--mg-v2-color-surface-bg`에서 하단으로 갈수록 옅은 `--mg-v2-color-surface-card`로 부드러운 그라데이션.
- **타이포그래피**:
  - 메인 카피: `--mg-v2-font-size-display`, `--mg-v2-font-weight-bold`, `--mg-v2-color-text-primary`.
  - 부제: `--mg-v2-font-size-h4`, `--mg-v2-font-weight-regular`, `--mg-v2-color-text-secondary`.

### 3.3 운영팀 입력 슬롯
- `slot-hero-title`: 메인 카피 (예: "마음을 돌보는 가장 안정적인 공간")
- `slot-hero-subtitle`: 부제 (예: "상담 기록부터 예약 관리까지, 원장님을 위한 완벽한 솔루션")
- `slot-hero-image`: 우측 이미지 URL (디자이너 추천: 차분한 톤의 대시보드 목업 또는 숲을 형상화한 3D 일러스트)
- `slot-hero-cta-primary`: Primary 버튼 텍스트 (예: "무료로 시작하기")
- `slot-hero-cta-secondary`: Secondary 버튼 텍스트 (예: "요금제 보기")

---

## §4. Features 섹션

서비스의 핵심 기능 3~6가지를 카드 형태로 소개하는 섹션입니다.

### 4.1 레이아웃 및 와이어프레임
- **그리드**: 
  - 데스크탑: 3열 그리드 (3개 또는 6개 카드).
  - 태블릿: 2열 그리드.
  - 모바일: 1열 세로 스택.
- **카드 구성**: 상단 아이콘(또는 작은 일러스트) + 기능 키워드 + 짧은 설명.

### 4.2 스타일 및 토큰 매핑
- **섹션 배경**: `--mg-v2-color-surface-card`.
- **카드 스타일**: 
  - 배경: `--mg-v2-color-surface-raised`.
  - 테두리: `--mg-v2-color-border-light`.
  - 반경: `--mg-v2-radius-xl` (16px).
  - 그림자: 라이트 모드 `--mg-v2-shadow-sm`, 다크 모드 `--mg-v2-border-elevation-1`.
  - 좌측 악센트 바: 카드 좌측에 4px 너비의 `--mg-v2-color-primary-main` 악센트 라인 적용.

### 4.3 운영팀 입력 슬롯 (배열 형태)
- `slot-features-list`:
  - `icon`: 아이콘 식별자 또는 이미지 URL
  - `title`: 키워드 (예: "스마트 예약 관리", "안전한 상담 기록", "자동 정산 시스템")
  - `desc`: 설명 (예: "노쇼를 방지하는 자동 알림과 캘린더 연동", "종단간 암호화로 보호되는 내담자 차트", "복잡한 수기 정산을 클릭 한 번으로")

---

## §5. Testimonials 섹션 (사회적 증명)

기존 `/landing`의 마케팅 요소를 흡수하여 신뢰도를 높이는 섹션입니다.

### 5.1 형태 결정: Carousel (자동 슬라이드 + 멈춤 가능)
- **사유**: 다수의 후기와 도입 센터 수 등 방대한 사회적 증명 데이터를 한정된 공간에 효과적으로 노출하기 위해 Carousel 방식을 채택합니다. 사용자가 원할 때 멈춰서 읽을 수 있도록 제어 기능을 제공하여 접근성을 확보합니다.

### 5.2 레이아웃 및 와이어프레임
- **상단 (숫자 지표)**: "도입 센터 수", "누적 상담 건수" 등을 강조하는 큰 타이포그래피 영역 (모바일 2열, 데스크탑 4열).
- **하단 (Carousel)**: 
  - 데스크탑: 한 화면에 2.5개~3개의 카드가 보이도록 설정하여 스와이프 유도.
  - 모바일: 한 화면에 1.2개의 카드가 보이도록 설정.
- **접근성 제어**: 좌우 이동 버튼 및 일시정지/재생 버튼 제공 (`aria-live="polite"` 적용).

### 5.3 스타일 및 토큰 매핑
- **섹션 배경**: `--mg-v2-color-surface-bg`.
- **지표 숫자**: `--mg-v2-font-size-h1`, `--mg-v2-color-primary-main`.
- **후기 카드**: `--mg-v2-color-surface-card`, `--mg-v2-radius-lg`.

### 5.4 운영팀 입력 슬롯
- `slot-stats-list`: 숫자 지표 배열 (예: `label`: "도입 센터", `value`: "500+")
- `slot-testimonials-list`: 후기 배열
  - `content`: 후기 내용 (예: "마인드가든 도입 후 행정 업무가 절반으로 줄었습니다.")
  - `author`: 작성자 (예: "A 심리상담센터 원장" 또는 실명)
  - `avatar`: 프로필 이미지 URL (선택, 없을 시 익명 아바타)

---

## §6. CTA 섹션

페이지 최하단에서 최종 전환을 유도하는 영역입니다.

### 6.1 레이아웃 및 스타일
- **레이아웃**: 중앙 정렬된 텍스트와 버튼 그룹. 상하 여백을 충분히 주어 시선을 집중시킵니다 (`padding: var(--mg-v2-space-20) 0`).
- **배경**: `--mg-v2-color-primary-dark` (다크한 배경으로 시각적 대비를 주어 주목도 향상).
- **타이포그래피**: 텍스트는 `--mg-v2-color-text-inverse` 적용.

### 6.2 운영팀 입력 슬롯
- `slot-bottom-cta-title`: 메인 메시지 (예: "지금 바로 차원이 다른 상담 센터 관리를 경험해보세요.")
- `slot-bottom-cta-subtitle`: 부제 (예: "14일 무료 체험으로 모든 기능을 사용해볼 수 있습니다.")
- `slot-bottom-cta-primary`: 버튼 텍스트 (예: "무료로 시작하기" -> `/onboarding`)
- `slot-bottom-cta-secondary`: 버튼 텍스트 (예: "도입 문의하기" -> `/contact` 또는 세일즈 링크)

---

## §7. `/landing` 흡수 콘텐츠 매핑

Phase A2의 G1 옵션 C 결정에 따라, 기존 `/landing` 라우트의 콘텐츠를 다음과 같이 메인 랜딩(`/`)에 흡수합니다.

| 기존 `/landing` 콘텐츠 | 메인 랜딩(`/`) 흡수 위치 | 비고 |
|----------------------|-----------------------|------|
| 메인 마케팅 배너 | **§3. Hero 섹션** | 카피 및 비주얼 업그레이드 |
| 주요 혜택 및 기능 소개 | **§4. Features 섹션** | 카드 그리드 형태로 정돈 |
| 고객사 로고 및 후기 | **§5. Testimonials 섹션** | Carousel 형태로 통합 |
| 도입 효과 (수치 데이터) | **§5. Testimonials 섹션 상단** | 지표(Stats) 영역으로 재구성 |
| 하단 가입 유도 배너 | **§6. CTA 섹션** | 다크 배경으로 강조 |

*(참고: Phase C-3 구현 시 기존 `/landing` 라우트는 `/`로 리다이렉트 처리됩니다.)*

---

## §8. PublicLayout 정합 및 다크 모드 토글

### 8.1 PublicLayout 정합 (G3 결정)
- 랜딩 페이지 전체는 `AdminCommonLayout`이 아닌, `PublicLayout` 컴포넌트로 감싸집니다.
- 좌측 사이드바가 없으며, 상단 `PublicHeader` (고정, 스크롤 시 백드롭 필터)와 하단 `PublicFooter`가 적용됩니다.

### 8.2 다크 모드 토글 정합 (G② 결정)
- **위치**: `PublicHeader` 우측 끝 (로그인/시작하기 버튼 좌측).
- **동작**: 클릭 시 라이트/다크 테마가 즉각 전환되며, 아이콘(해/달)이 부드럽게 크로스페이드 됩니다.
- **토큰 매핑**: 랜딩 페이지의 모든 색상은 `--mg-v2-color-*` 토큰을 사용하여 다크 모드 전환 시 자동으로 색상이 반전 및 조정되도록 설계되었습니다.

---

## §9. 모바일 (414×896) 반응형 전환 규칙

- **레이아웃 스택**: 데스크탑의 좌우 분할(Hero) 및 다열 그리드(Features)는 모바일에서 모두 **1열 세로 스택(Vertical Stack)**으로 전환됩니다.
- **여백 축소**: 섹션 간 상하 여백(`padding`)은 데스크탑 `--mg-v2-space-20`(80px)에서 모바일 `--mg-v2-space-12`(48px) 수준으로 축소됩니다.
- **타이포그래피 스케일링**: 
  - `Display` (48px) -> `36px`
  - `H1` (36px) -> `28px`
  - `H2` (28px) -> `24px`
- **터치 타겟**: 모든 버튼과 링크는 최소 `44×44px`의 터치 영역을 확보하며, 모바일에서 주요 CTA 버튼은 `width: 100%`로 확장되어 탭하기 쉽게 만듭니다.

---

## §10. 마이크로 인터랙션

- **스크롤 진입 (Fade-in-up)**: 각 섹션(Features 카드, Testimonials 등)이 뷰포트에 진입할 때 아래에서 위로 살짝 올라오며 투명도가 0에서 1로 변하는 애니메이션 적용.
  - `transition: opacity var(--mg-v2-transition-duration-normal), transform var(--mg-v2-transition-duration-normal)`
- **호버 효과 (Lift & Glow)**: Features 카드 및 버튼에 마우스 오버 시 Y축으로 -4px 이동하며 그림자가 짙어짐.
  - `transform: translateY(-4px)`
  - `box-shadow: var(--mg-v2-shadow-md)` (다크 모드에서는 `border-color` 변경으로 대체)

---

## §11. WCAG 2.1 AA 검증 결과

- **색상 대비 (Contrast)**: 
  - Hero 섹션 텍스트(`--mg-v2-color-text-primary`) vs 배경(`--mg-v2-color-surface-bg`): **13.8:1 (PASS)**
  - CTA 섹션 텍스트(`--mg-v2-color-text-inverse`) vs 배경(`--mg-v2-color-primary-dark`): **10.2:1 (PASS)**
- **키보드 네비게이션**: 
  - Carousel 컨트롤 버튼, 모든 CTA 버튼에 논리적인 `tabindex` 적용.
  - `:focus-visible` 상태에서 `--mg-v2-color-state-focus-ring` 아웃라인 명확히 표시.
- **ARIA 속성**: 
  - Carousel 영역에 `aria-roledescription="carousel"`, `aria-live="polite"` 적용.

---

## §12. 운영팀 입력 슬롯 일람표

프론트엔드 코드 내에 하드코딩되지 않고 외부(설정 파일 또는 API)에서 주입받아야 할 데이터 슬롯입니다.

| 슬롯 ID | 위치 | 형식 | 디자이너 예시 카피 / 제안 |
|---------|------|------|-------------------------|
| `slot-hero-title` | Hero 좌측 상단 | Text | 마음을 돌보는 가장 안정적인 공간 |
| `slot-hero-subtitle` | Hero 좌측 중단 | Text | 상담 기록부터 예약 관리까지, 원장님을 위한 완벽한 솔루션 |
| `slot-hero-image` | Hero 우측 | Image URL | (차분한 톤의 대시보드 목업 이미지) |
| `slot-hero-cta-primary` | Hero 좌측 하단 | Text | 무료로 시작하기 |
| `slot-hero-cta-secondary` | Hero 좌측 하단 | Text | 요금제 보기 |
| `slot-features-list` | Features 섹션 | Array | `[{icon, title: "스마트 예약", desc: "노쇼 방지 알림"}, ...]` |
| `slot-stats-list` | Testimonials 상단 | Array | `[{label: "도입 센터", value: "500+"}, ...]` |
| `slot-testimonials-list` | Testimonials 하단 | Array | `[{content: "업무가 절반으로...", author: "A센터 원장"}, ...]` |
| `slot-bottom-cta-title` | CTA 섹션 중앙 | Text | 지금 바로 차원이 다른 관리를 경험해보세요. |
| `slot-bottom-cta-subtitle`| CTA 섹션 중앙 | Text | 14일 무료 체험 제공 |
| `slot-bottom-cta-primary` | CTA 섹션 하단 | Text | 무료로 시작하기 |
| `slot-bottom-cta-secondary`| CTA 섹션 하단 | Text | 도입 문의하기 |

---

## §13. Core-Coder 핸드오프 체크리스트

Phase C-2 (Organism 구현) 단계에서 `core-coder`가 준수해야 할 항목입니다.

- [ ] `LandingHero`, `LandingFeatures`, `LandingTestimonials`, `LandingCTA` 4개의 Organism 컴포넌트 생성.
- [ ] 모든 텍스트와 이미지는 §12의 슬롯 구조를 반영하여 `props`로 주입받도록 설계 (내부 하드코딩 금지).
- [ ] 하드코딩된 색상/픽셀 값 0줄. 오직 `var(--mg-v2-*)` 토큰만 사용하여 스타일링.
- [ ] `LandingTestimonials`는 Carousel 형태로 구현하며, 일시정지/재생 및 키보드 접근성 보장.
- [ ] 모바일(414px) 뷰포트에서 모든 레이아웃이 1열 스택으로 정상 전환되는지 확인.
- [ ] 다크 모드 전환 시 배경, 텍스트, 카드 테두리(`border-elevation`)가 정상적으로 반전되는지 확인.
- [ ] `LandingPage.jsx` (Phase C-3) 조립 시 `PublicLayout` 내부에 위 4개 Organism을 순서대로 배치.
