# Core Solution 홈페이지 전면 리뉴얼 화면 설계서 (HOMEPAGE_REDESIGN_SPEC)

## 1. 개요 및 목적
본 문서는 기존 텍스트 위주의 'MindGarden(마음의 정원)' 인트로 페이지를 대체하고, **Core Solution("비즈니스의 핵심을 솔루션하다")**의 브랜드 정체성을 극대화하기 위한 새로운 랜딩 페이지의 UI/UX, 레이아웃, 비주얼 스펙을 정의합니다. 

### 디자인 핵심 방향
- **비주얼 임팩트**: 고품질 이미지(사진) 및 커다란 타이포그래피를 적극 활용하여 방문자의 시선을 사로잡는 몰입감 있는 레이아웃 구성
- **브랜딩 전환**: 'MindGarden' 명칭 완전 배제, 'Core Solution' 브랜드명과 슬로건 강조
- **디자인 시스템 준수**: 아토믹 디자인 패턴(Atomic Design Pattern) 및 `var(--mg-*)` 디자인 토큰 철저히 적용
- **반응형(Responsive)**: 데스크탑, 태블릿, 모바일 해상도에 최적화된 유연한 레이아웃

---

## 2. 화면 구조 및 레이아웃 (페이지 구성)

랜딩 페이지는 크게 5개의 섹션으로 구성됩니다. 각 섹션은 화면의 가로 전체(100vw)를 차지하며, 내부 컨텐츠는 최대 너비(max-width: 1200px) 중앙 정렬을 따릅니다.

### 2.1. Header (GNB)
- **위치**: 화면 상단 고정 (Sticky Header)
- **배경**: 스크롤 전에는 투명(Transparent)하여 Hero 이미지와 어우러지며, 스크롤 시 반투명한 흰색 또는 다크 배경(`rgba(255,255,255,0.9)` + blur 효과)으로 전환.
- **좌측**: Core Solution 텍스트 로고 (크고 명확한 굵기, `var(--mg-font-weight-bold)`)
- **우측**: [로그인] (Text Link 형태), [회원가입] (Primary Button 형태)
- **모바일**: 우측 햄버거 메뉴로 축소

### 2.2. Hero Section (인트로)
- **시각 요소**: 전체 화면 크기(100vh 또는 min-height: 800px)의 고품질 비즈니스/솔루션 관련 사진 배경
  - *이미지 예시(Unsplash)*: `https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=2000` (현대적인 비즈니스 미팅, 세련된 오피스 환경 등)
  - 배경 이미지 위에 어두운 오버레이(`rgba(0,0,0,0.5)`)를 깔아 텍스트 가독성 확보
- **타이포그래피 (중앙 정렬)**:
  - **메인 카피**: "비즈니스의 핵심을 솔루션하다" (사이즈: `var(--mg-font-size-5xl)` 이상, 색상: `var(--mg-color-surface-white)`, 굵기: 800)
  - **서브 카피**: "Core Solution과 함께 비즈니스의 모든 과정을 통합하고 자동화하여 혁신적인 성장을 경험하세요." (사이즈: `var(--mg-font-size-xl)`)
- **CTA 버튼**: [무료로 시작하기] (크고 명확한 Primary 버튼, `var(--mg-color-primary-base)`)

### 2.3. Features Section (핵심 강점)
- **배경**: 밝은 톤 (`var(--mg-color-surface-light)` 또는 `#FAF9F7`)
- **구조**: 상단에 섹션 타이틀, 하단에 3개의 카드(Grid) 나열
- **타이틀**: "복잡한 비즈니스, Core Solution 하나로 끝내세요" (`var(--mg-font-size-3xl)`)
- **카드 구성 (아토믹: Card Organism)**:
  - 각 카드의 상단에 관련 기능을 보여주는 **고품질 이미지** 삽입 (높이 약 240px)
    - *예시 이미지 1*: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800` (데이터 분석/대시보드)
    - *예시 이미지 2*: `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800` (재무/회계 관리)
    - *예시 이미지 3*: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800` (협업 및 커뮤니케이션)
  - 이미지 하단 영역: 기능 제목(`var(--mg-font-size-lg)`, 굵게), 짧은 설명(`var(--mg-font-size-md)`, `var(--mg-color-text-secondary)`)
  - 마우스 호버 시 카드가 살짝 위로 떠오르는 트랜지션 효과(Drop Shadow) 적용

### 2.4. Image & Text Split Section (서비스 몰입감 강화)
- **레이아웃**: 좌우 1:1 분할 레이아웃 (데스크탑 기준). 모바일에서는 상하 배치.
- **좌측 (이미지 영역)**: 화면을 가득 채우는 엣지리스(Edgeless) 형태의 큰 이미지 배치를 통해 시각적 시원함 제공
  - *예시 이미지*: `https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000`
- **우측 (텍스트 영역)**: 
  - 서브 타이틀: "Seamless Integration" (`var(--mg-color-primary-light)`, `var(--mg-font-size-sm)`, 대문자)
  - 메인 타이틀: "모든 데이터를 한 곳에서 투명하게 관리하세요" (`var(--mg-font-size-3xl)`)
  - 본문: "흩어져 있던 재무, 인사, 운영 데이터를 통합하여..."
  - 추가 CTA 텍스트 링크: "자세히 알아보기 →" (`var(--mg-color-primary-base)`, hover 시 밑줄)

### 2.5. Bottom CTA & Footer
- **Bottom CTA**:
  - 배경: `var(--mg-color-primary-dark)` (깊이감 있는 브랜드 컬러 배경)
  - 카피: "지금 바로 비즈니스의 핵심을 바꿔보세요." (`var(--mg-color-surface-white)`, `var(--mg-font-size-3xl)`)
  - 버튼: [회원가입 하고 시작하기] (White 버튼, 글자색은 Primary Dark)
- **Footer**:
  - 기존 어드민/앱의 공통 푸터 또는 랜딩 페이지 전용 간소화된 푸터 적용
  - 저작권, 약관, 개인정보처리방침 등 텍스트(`var(--mg-color-text-tertiary)`)

---

## 3. 디자인 토큰 및 컴포넌트 스펙 (CSS Variables)

구현 시 하드코딩된 색상 및 픽셀 값 사용을 엄격히 금지하며, 아래의 `var(--mg-*)` 토큰을 조합하여 사용합니다.

### 3.1. Typography (타이포그래피)
랜딩 페이지 특성상 큼직한 폰트를 활용하여 시원한 느낌을 주어야 합니다.
- **폰트 패밀리**: `var(--mg-font-family-base)` (Noto Sans KR 등 기존 설정 따름)
- **Hero 메인 카피**: `font-size: clamp(3rem, 5vw, 4.5rem);` (토큰으로 커버 안될 경우 반응형 clamp 활용, 또는 `var(--mg-font-size-5xl)` 이상 적용)
- **섹션 타이틀**: `var(--mg-font-size-3xl)` ~ `var(--mg-font-size-4xl)`
- **본문 (Body)**: `var(--mg-font-size-md)` ~ `var(--mg-font-size-lg)`
- **글꼴 두께**: `var(--mg-font-weight-bold)`, `var(--mg-font-weight-extrabold)` (제목용) / `var(--mg-font-weight-regular)` (본문용)

### 3.2. Color (색상)
어드민 대시보드 샘플의 색상 체계를 랜딩 페이지에 맞게 활용합니다.
- **주조색 (Primary)**: `var(--mg-color-primary-base)` (#3D5246) - 주요 버튼, 강조 텍스트
- **주조색 다크 (Primary Dark)**: `var(--mg-color-primary-dark)` (#2C2C2C) - Bottom CTA 배경, 주요 제목 색상
- **표면/배경 (Surface/Background)**: 
  - 기본 배경: `var(--mg-color-background-base)` (#FAF9F7)
  - 카드 표면: `var(--mg-color-surface-white)` (#FFFFFF)
- **텍스트 (Text)**: 
  - 메인 텍스트: `var(--mg-color-text-primary)` (#2C2C2C)
  - 서브 텍스트: `var(--mg-color-text-secondary)` (#5C6B61)

### 3.3. Spacing & Layout (여백 및 레이아웃)
- **섹션 간 여백**: `padding: var(--mg-spacing-7xl) 0;` (약 120px) (시원하고 여유로운 여백 확보)
- **컴포넌트 간 간격**: `gap: var(--mg-spacing-2xl)` (약 32px)
- **Border Radius**: `border-radius: var(--mg-radius-xl)` (약 16px) - 이미지 모서리, 카드 등
- **Box Shadow**: `box-shadow: var(--mg-shadow-md)` (카드 기본), `var(--mg-shadow-lg)` (호버 시)

---

## 4. 반응형 레이아웃 가이드 (Responsive Constraints)

- **Desktop (1200px 이상)**:
  - 컨텐츠 최대 너비 1200px 중앙 정렬 (`margin: 0 auto`)
  - Features 카드: 3열 Grid (`grid-template-columns: repeat(3, 1fr)`)
  - Image & Text: 좌우 병렬 배치 (`flex-direction: row`)
- **Tablet (768px ~ 1199px)**:
  - 좌우 패딩: `var(--mg-spacing-xl)` 적용
  - Features 카드: 2열 Grid
  - Image & Text: 상하 배치 (`flex-direction: column`)
  - 폰트 크기: 데스크탑 대비 80% 수준으로 축소 조정
- **Mobile (767px 이하)**:
  - 좌우 패딩: `var(--mg-spacing-md)` 적용
  - Hero Section 텍스트: 상단부로 여백 조정 및 폰트 축소 (`clamp` 권장)
  - 모든 Grid: 1열 배치 (`grid-template-columns: 1fr`)
  - 버튼 크기: 모바일에서는 `width: 100%`로 터치 영역 확장 고려

---

## 5. 기존 로직 보존 지침
- 랜딩 페이지 디자인을 전면 개편하더라도, 기존 `Homepage.js` 파일에 존재하는 **사용자 인증 상태에 따른 대시보드 리다이렉트 로직(예: 이미 로그인된 경우 `/admin/dashboard` 등으로 이동)**은 반드시 유지해야 합니다.
- `[로그인]`, `[회원가입]` 버튼 클릭 시 해당 라우트(`/login`, `/register` 등)로 안전하게 연결되어야 합니다.

---
**작성자**: core-designer  
**참조 문서**: `docs/planning/HOMEPAGE_REDESIGN_PLAN.md`, 어드민 대시보드 샘플, PENCIL_DESIGN_GUIDE.md
