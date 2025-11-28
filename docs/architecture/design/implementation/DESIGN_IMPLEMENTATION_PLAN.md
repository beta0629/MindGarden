# MindGarden 디자인 개선 실행 계획서 🚀

## 📋 문서 기반 분석

### 참조 문서
- `docs/improvement-plans/README.md` - 전체 개선 계획
- `docs/improvement-plans/css/CSS_ARCHITECTURE_IMPROVEMENT_PLAN.md` - CSS 아키텍처
- `docs/improvement-plans/javascript/FRONTEND_ARCHITECTURE_IMPROVEMENT_PLAN.md` - 프론트엔드 아키텍처
- `docs/improvement-plans/design/RESPONSIVE_DESIGN_IMPROVEMENT_PLAN.md` - 반응형 디자인
- `docs/improvement-plans/design/CARD_DESIGN_IMPROVEMENT.md` - 카드 디자인 개선

### 현재 상황
- ✅ CSS 변수 시스템 구축됨 (`styles/variables.css`)
- ✅ 글래스모피즘 스타일 정의됨 (`styles/glassmorphism.css`)
- ✅ 아이폰/아이패드 스타일 변수 추가됨
- ✅ CSS 충돌 일부 해결됨
- ❌ CSS 아키텍처 구조 미구축
- ❌ 컴포넌트 분할 미진행
- ❌ 디자인 시스템 미완성

---

## 🎯 Phase 1: CSS 아키텍처 구축 (우선순위 최상)

### 목표
전체 CSS 구조를 ITCSS 방식으로 재구성하여 충돌을 원천적으로 차단

### 1.1 폴더 구조 생성
```
frontend/src/styles/
├── 01-settings/          # CSS 변수, 색상, 폰트
│   ├── _colors.css       # 색상 시스템
│   ├── _typography.css   # 폰트 시스템
│   ├── _spacing.css      # 간격 시스템
│   ├── _shadows.css      # 그림자 시스템
│   └── _z-index.css      # z-index 레이어
│
├── 02-tools/             # 믹신, 함수
│   ├── _mixins.css       # 재사용 믹신
│   └── _functions.css    # CSS 함수
│
├── 03-generic/           # 리셋, normalize
│   ├── _reset.css        # CSS 리셋
│   └── _normalize.css    # Normalize.css
│
├── 04-elements/          # 기본 HTML 요소
│   ├── _body.css         # body 스타일
│   ├── _headings.css     # h1-h6 스타일
│   ├── _links.css        # a 태그 스타일
│   └── _buttons.css      # 기본 버튼 스타일
│
├── 05-objects/           # 레이아웃, 그리드
│   ├── _container.css    # 컨테이너
│   ├── _grid.css         # 그리드 시스템
│   └── _layout.css       # 레이아웃
│
├── 06-components/        # 재사용 가능한 컴포넌트
│   ├── _cards.css        # 카드 컴포넌트
│   ├── _buttons.css      # 버튼 컴포넌트
│   ├── _modals.css       # 모달 컴포넌트
│   ├── _forms.css        # 폼 컴포넌트
│   └── _tables.css       # 테이블 컴포넌트
│
├── 07-utilities/         # 유틸리티 클래스
│   ├── _spacing.css      # 마진, 패딩
│   ├── _text.css         # 텍스트 유틸리티
│   └── _display.css      # display 유틸리티
│
├── 08-themes/            # 테마별 스타일
│   ├── _light.css        # 라이트 테마
│   └── _dark.css         # 다크 테마
│
└── main.css              # 메인 엔트리 포인트
```

**체크리스트:**
- [ ] 폴더 구조 생성
- [ ] 기존 `variables.css`를 `01-settings/` 폴더로 분할
- [ ] 기존 `glassmorphism.css`를 `06-components/_cards.css`로 이동
- [ ] `main.css` 생성 및 import 순서 정의

---

### 1.2 CSS 변수 시스템 정리

#### 1.2.1 색상 시스템 (`01-settings/_colors.css`)
```css
:root {
  /* 아이폰 시스템 색상 */
  --ios-blue: #007aff;
  --ios-green: #34c759;
  --ios-orange: #ff9500;
  --ios-red: #ff3b30;
  --ios-purple: #5856d6;
  --ios-pink: #ff2d92;
  --ios-yellow: #ffcc00;
  --ios-gray: #8e8e93;

  /* 시맨틱 색상 */
  --color-primary: var(--ios-blue);
  --color-success: var(--ios-green);
  --color-warning: var(--ios-orange);
  --color-danger: var(--ios-red);
  --color-info: var(--ios-purple);

  /* 텍스트 색상 */
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --text-tertiary: #c7c7cc;

  /* 배경 색상 */
  --bg-primary: #ffffff;
  --bg-secondary: #f2f2f7;
  --bg-tertiary: #ffffff;

  /* 글래스모피즘 색상 */
  --glass-bg-light: rgba(255, 255, 255, 0.25);
  --glass-bg-medium: rgba(255, 255, 255, 0.35);
  --glass-bg-strong: rgba(255, 255, 255, 0.45);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-border-strong: rgba(255, 255, 255, 0.3);
}
```

**체크리스트:**
- [ ] `_colors.css` 파일 생성
- [ ] 아이폰 시스템 색상 정의
- [ ] 시맨틱 색상 매핑
- [ ] 글래스모피즘 색상 정의

#### 1.2.2 타이포그래피 시스템 (`01-settings/_typography.css`)
```css
:root {
  /* 폰트 패밀리 */
  --font-family-ios: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
                     'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  /* 모바일 우선 폰트 크기 */
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-xxl: 20px;
  --font-size-xxxl: 22px;

  /* 폰트 두께 */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 라인 높이 */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;
}
```

**체크리스트:**
- [ ] `_typography.css` 파일 생성
- [ ] 아이폰 폰트 패밀리 정의
- [ ] 모바일 우선 폰트 크기 정의
- [ ] 태블릿/데스크톱 반응형 폰트 정의

#### 1.2.3 간격 시스템 (`01-settings/_spacing.css`)
```css
:root {
  /* 간격 시스템 (4px 기준) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
}
```

**체크리스트:**
- [ ] `_spacing.css` 파일 생성
- [ ] 4px 기준 간격 시스템 정의

#### 1.2.4 그림자 시스템 (`01-settings/_shadows.css`)
```css
:root {
  /* 그림자 시스템 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  --shadow-glass: 0 8px 32px rgba(31, 38, 135, 0.37);
  --shadow-glass-strong: 0 12px 40px rgba(31, 38, 135, 0.5);
}
```

**체크리스트:**
- [ ] `_shadows.css` 파일 생성
- [ ] 일반 그림자 정의
- [ ] 글래스모피즘 그림자 정의

#### 1.2.5 Z-Index 시스템 (`01-settings/_z-index.css`)
```css
:root {
  /* Z-Index 레이어 시스템 */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;
}
```

**체크리스트:**
- [ ] `_z-index.css` 파일 생성
- [ ] 레이어 시스템 정의

---

### 1.3 컴포넌트 스타일 재구성

#### 1.3.1 카드 컴포넌트 (`06-components/_cards.css`)

**BEM 네이밍 컨벤션 적용:**
```css
/* 기본 카드 */
.mg-card { }
.mg-card--glass { }
.mg-card--stat { }
.mg-card--management { }

/* 카드 요소 */
.mg-card__header { }
.mg-card__title { }
.mg-card__subtitle { }
.mg-card__body { }
.mg-card__footer { }
.mg-card__icon { }
.mg-card__actions { }

/* 카드 수식어 */
.mg-card--small { }
.mg-card--medium { }
.mg-card--large { }
.mg-card--success { }
.mg-card--warning { }
.mg-card--danger { }
```

**체크리스트:**
- [ ] 기존 `.card` 클래스를 `.mg-card`로 변경
- [ ] BEM 네이밍 적용
- [ ] 글래스모피즘 스타일 통합
- [ ] 아이폰 스타일 적용

#### 1.3.2 버튼 컴포넌트 (`06-components/_buttons.css`)
```css
/* 기본 버튼 */
.mg-btn { }
.mg-btn--primary { }
.mg-btn--secondary { }
.mg-btn--success { }
.mg-btn--danger { }

/* 버튼 크기 */
.mg-btn--small { }
.mg-btn--medium { }
.mg-btn--large { }

/* 버튼 상태 */
.mg-btn--disabled { }
.mg-btn--loading { }
```

**체크리스트:**
- [ ] 버튼 컴포넌트 생성
- [ ] BEM 네이밍 적용
- [ ] 아이폰 스타일 적용

---

## 🎯 Phase 2: 컴포넌트 분할 및 재구성

### 2.1 공통 컴포넌트 생성

#### 디렉토리 구조
```
frontend/src/components/
├── base/                 # 기본 컴포넌트
│   ├── BaseCard/
│   │   ├── BaseCard.js
│   │   └── BaseCard.module.css
│   ├── BaseButton/
│   │   ├── BaseButton.js
│   │   └── BaseButton.module.css
│   └── BaseModal/
│       ├── BaseModal.js
│       └── BaseModal.module.css
│
├── common/               # 공통 컴포넌트
│   ├── StatCard/
│   ├── ManagementCard/
│   └── DashboardHeader/
│
└── admin/                # 관리자 컴포넌트
    └── AdminDashboard/
        ├── AdminDashboard.js
        ├── AdminDashboard.module.css
        └── components/
            ├── DashboardStats.js
            ├── DashboardManagement.js
            └── DashboardModals.js
```

**체크리스트:**
- [ ] `components/base/` 폴더 생성
- [ ] BaseCard 컴포넌트 생성
- [ ] BaseButton 컴포넌트 생성
- [ ] BaseModal 컴포넌트 생성
- [ ] CSS Modules 적용

---

### 2.2 커스텀 훅 생성

```
frontend/src/hooks/
├── useAdminDashboard.js  # AdminDashboard 로직
├── useTheme.js           # 테마 관리
└── useResponsive.js      # 반응형 로직
```

**체크리스트:**
- [ ] `hooks/` 폴더 생성
- [ ] useAdminDashboard 훅 생성
- [ ] useTheme 훅 생성
- [ ] useResponsive 훅 생성

---

## 🎯 Phase 3: 반응형 디자인 완성

### 3.1 브레이크포인트 시스템

```css
/* 02-tools/_mixins.css */
@media (max-width: 767px) { /* 모바일 */ }
@media (min-width: 768px) and (max-width: 1024px) { /* 태블릿 */ }
@media (min-width: 1025px) { /* 데스크톱 */ }
```

**체크리스트:**
- [ ] 브레이크포인트 정의
- [ ] 모바일 스타일 적용
- [ ] 태블릿 스타일 적용
- [ ] 데스크톱 스타일 적용

---

## 📊 전체 실행 체크리스트

### Phase 1: CSS 아키텍처 구축 (1-2주)
- [ ] 1.1 폴더 구조 생성
  - [ ] ITCSS 폴더 구조 생성
  - [ ] 기존 파일 이동 및 분할
  - [ ] main.css 엔트리 포인트 생성
  
- [ ] 1.2 CSS 변수 시스템 정리
  - [ ] _colors.css 생성
  - [ ] _typography.css 생성
  - [ ] _spacing.css 생성
  - [ ] _shadows.css 생성
  - [ ] _z-index.css 생성
  
- [ ] 1.3 컴포넌트 스타일 재구성
  - [ ] _cards.css BEM 네이밍 적용
  - [ ] _buttons.css 생성
  - [ ] _modals.css 생성
  - [ ] _forms.css 생성

### Phase 2: 컴포넌트 분할 (2-3주)
- [ ] 2.1 공통 컴포넌트 생성
  - [ ] BaseCard 컴포넌트
  - [ ] BaseButton 컴포넌트
  - [ ] BaseModal 컴포넌트
  - [ ] CSS Modules 적용
  
- [ ] 2.2 커스텀 훅 생성
  - [ ] useAdminDashboard
  - [ ] useTheme
  - [ ] useResponsive

### Phase 3: 반응형 디자인 (1-2주)
- [ ] 3.1 브레이크포인트 시스템
  - [ ] 모바일 최적화
  - [ ] 태블릿 최적화
  - [ ] 데스크톱 최적화

---

## 🎯 성공 지표

### 정량적 지표
- [ ] CSS 충돌 0건
- [ ] 컴포넌트 평균 크기 200라인 이하
- [ ] CSS 파일 모듈화율 100%
- [ ] BEM 네이밍 적용률 100%

### 정성적 지표
- [ ] 일관된 디자인 시스템
- [ ] 명확한 파일 구조
- [ ] 유지보수 용이성
- [ ] 개발자 경험 향상

---

**작성일**: 2025-10-01  
**버전**: 1.0  
**상태**: 진행 중

