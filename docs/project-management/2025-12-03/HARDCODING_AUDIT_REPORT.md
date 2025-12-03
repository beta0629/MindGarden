# 하드코딩 점검 보고서

## 📋 목적
프로젝트 전체에서 하드코딩된 CSS 값을 찾아 표준화 원칙에 맞게 수정

## 🔍 발견된 하드코딩 항목

### 1. `frontend/src/styles/dashboard-common-v3.css`

#### 간격/크기 하드코딩
- `280px` (line 44, 145) - grid-template-columns minmax
- `48px` (line 72-73) - 아이콘 크기
- `64px` (line 165-166) - 관리 아이콘 크기
- `-4px` (line 61, 159) - transform translateY

#### Border 하드코딩
- `1px` (line 57, 117, 153) - border width
- `2px` (line 126) - border-bottom width

#### 색상 하드코딩
- `rgba(255, 255, 255, 0.2)` (line 85) - 배경 색상

#### Opacity 하드코딩
- `opacity: 0.9` (line 103)

### 2. `frontend/src/components/layout/SimpleLayout.css`

#### 색상 하드코딩
- `#4A90E2` (line 5) - primary color fallback
- `rgba(0,0,0,0.1)` (line 8) - box-shadow
- `rgba(0, 0, 0, 0.3)` (line 155) - box-shadow

#### 크기 하드코딩
- `1200px` (line 15, 58) - max-width
- `400px` (line 80) - min-height
- `16px`, `14px` (line 142-143, 178-179) - width/height
- `3px` (line 144) - padding
- `10px`, `9px` (line 148, 180) - font-size

#### Border 하드코딩
- `1px` (line 128, 183) - border width
- `1.5px` (line 154) - border width

### 3. `frontend/src/components/client/ClientDashboard.css`

#### 크기 하드코딩
- `35px`, `70px` (line 52-57, 86) - repeating-linear-gradient 패턴 크기

#### 색상 하드코딩
- `rgba(var(--mg-primary-500-rgb, 59, 130, 246), 0.5)` (line 53-54) - fallback RGB 값
- `rgba(var(--mg-success-500-rgb, 16, 185, 129), 0.5)` (line 56-57) - fallback RGB 값
- `rgba(var(--mg-primary-500-rgb, 59, 130, 246), 0.08)` (line 74) - fallback RGB 값
- `rgba(var(--mg-success-500-rgb, 16, 185, 129), 0.08)` (line 75) - fallback RGB 값
- `rgba(var(--mg-primary-400-rgb, 96, 165, 250), 0.08)` (line 76) - fallback RGB 값

#### Opacity 하드코딩
- `opacity: 0.03` (line 50)
- `opacity: 0.8` (line 98)

## 📊 우선순위

### 🔥 높음 (즉시 수정 필요)
1. `dashboard-common-v3.css` - 공통 대시보드 스타일
2. `SimpleLayout.css` - 레이아웃 컴포넌트

### ⚠️ 중간 (단계적 수정)
3. `ClientDashboard.css` - 배경 패턴 (복잡한 gradient)

## ✅ 수정 계획

### Phase 1: dashboard-common-v3.css
- [ ] `280px` → CSS 변수 (예: `var(--stat-card-min-width)`)
- [ ] `48px`, `64px` → `var(--icon-size-lg)`, `var(--icon-size-xl)`
- [ ] `1px`, `2px` → `var(--border-width)`, `var(--border-width-normal)`
- [ ] `-4px` → `calc(var(--spacing-xs) * -1)`
- [ ] `rgba(255, 255, 255, 0.2)` → `var(--cs-glass-light)`
- [ ] `opacity: 0.9` → CSS 변수

### Phase 2: SimpleLayout.css
- [ ] `#4A90E2` → `var(--mg-primary-500)`
- [ ] `rgba(0,0,0,0.1)` → `var(--mg-shadow-light)`
- [ ] `1200px` → `var(--container-max-width)`
- [ ] `400px` → CSS 변수
- [ ] `16px`, `14px` → `var(--icon-size-xs)`, `var(--icon-size-sm)`
- [ ] `3px` → `var(--spacing-xs)`
- [ ] `10px`, `9px` → `var(--font-size-xs)`
- [ ] `1px`, `1.5px` → `var(--border-width)`, CSS 변수

### Phase 3: ClientDashboard.css
- [ ] `35px`, `70px` → CSS 변수
- [ ] `rgba(...)` fallback 값들 → CSS 변수로 정리

## 📝 참조
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `frontend/src/styles/unified-design-tokens.css`

