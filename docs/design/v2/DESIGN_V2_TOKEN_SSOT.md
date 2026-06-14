# MindGarden 디자인 v2 — 토큰 SSOT (Single Source of Truth)

> **Phase**: A3 — 토큰 SSOT 구현  
> **팔레트**: Calm Forest (사용자 확정)  
> **파일**: `frontend/src/styles/tokens/design-v2-tokens.css`  
> **Visual Spec**: `docs/design/v2/DESIGN_V2_VISUAL_SPEC.md` §A~§J  
> **작성일**: 2026-06-15  

---

## 1. 개요

이 문서는 MindGarden 디자인 v2의 모든 디자인 토큰을 정의하는 SSOT입니다. 모든 컴포넌트와 페이지는 이 토큰만 참조하며, 하드코딩된 색상/크기/간격은 허용되지 않습니다.

### 토큰 명명 규칙

```
--mg-v2-{category}-{role}-{state}
```

| 세그먼트 | 설명 | 예시 |
|----------|------|------|
| `mg-v2` | 디자인 v2 네임스페이스 | — |
| `category` | 토큰 종류 | `color`, `font`, `space`, `radius`, `shadow`, `z`, `transition` |
| `role` | 역할/용도 | `primary-main`, `text-primary`, `surface-bg` |
| `state` | (선택) 상태 | `hover`, `active`, `disabled`, `focus` |

---

## 2. 모드 구성

| 모드 | 활성화 조건 | 설명 |
|------|-------------|------|
| 라이트 | `:root` 기본 | Calm Forest 팔레트 기본 모드 |
| 다크 (자동) | `@media (prefers-color-scheme: dark)` | OS 설정 연동 |
| 다크 (수동) | `[data-theme="dark"]` | JS 토글 지원 |
| 고대비 | `@media (forced-colors: active)` | Windows 고대비 / 접근성 |
| 모션 감소 | `@media (prefers-reduced-motion: reduce)` | 모든 트랜지션 0ms |

---

## 3. 토큰 카테고리별 상세

### 3.1 Color — Brand (5 토큰 × 3 그룹 = 15)

#### Primary (Deep Forest)

| 토큰 | 라이트 | 다크 | forced-colors |
|------|--------|------|---------------|
| `--mg-v2-color-primary-main` | `#3D5246` | `#4A6354` | `Highlight` |
| `--mg-v2-color-primary-light` | `#4A6354` | `#5C6B61` | `Highlight` |
| `--mg-v2-color-primary-dark` | `#2C3B32` | `#3D5246` | `Highlight` |
| `--mg-v2-color-primary-hover` | `#4A6354` | `#5C6B61` | `Highlight` |
| `--mg-v2-color-primary-active` | `#2C3B32` | `#3D5246` | `Highlight` |

#### Secondary (Sage Green)

| 토큰 | 라이트 | 다크 | forced-colors |
|------|--------|------|---------------|
| `--mg-v2-color-secondary-main` | `#6B7F72` | `#829689` | `ButtonFace` |
| `--mg-v2-color-secondary-light` | `#829689` | `#97A89C` | `ButtonFace` |
| `--mg-v2-color-secondary-dark` | `#566558` | `#6B7F72` | `ButtonFace` |

#### Accent (Warm Wood)

| 토큰 | 라이트 | 다크 | forced-colors |
|------|--------|------|---------------|
| `--mg-v2-color-accent-main` | `#8B7355` | `#A38B6D` | — |
| `--mg-v2-color-accent-light` | `#A38B6D` | `#BBA385` | — |
| `--mg-v2-color-accent-dark` | `#73603F` | `#8B7355` | — |

### 3.2 Color — Neutral Scale (10 토큰)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--mg-v2-color-neutral-50` | `#FAF9F7` | `#1A1A1A` |
| `--mg-v2-color-neutral-100` | `#F5F3EF` | `#242424` |
| `--mg-v2-color-neutral-200` | `#E8E5DF` | `#2C2C2C` |
| `--mg-v2-color-neutral-300` | `#D4CFC8` | `#3D3D3D` |
| `--mg-v2-color-neutral-400` | `#B8B2AA` | `#525252` |
| `--mg-v2-color-neutral-500` | `#9C958C` | `#7A7A7A` |
| `--mg-v2-color-neutral-600` | `#7A746D` | `#A3A3A3` |
| `--mg-v2-color-neutral-700` | `#5C5751` | `#C2C2C2` |
| `--mg-v2-color-neutral-800` | `#3D3A36` | `#E0E0E0` |
| `--mg-v2-color-neutral-900` | `#2C2A27` | `#F5F5F5` |

### 3.3 Color — Semantic (4 × 3 = 12 토큰)

| 토큰 | 라이트 | 다크 | WCAG (on bg) |
|------|--------|------|-------------|
| `--mg-v2-color-semantic-success` | `#2E7D32` | `#4CAF50` | 5.3:1 ✓ |
| `--mg-v2-color-semantic-success-light` | `#E8F5E9` | `#1B3A1D` | bg용 |
| `--mg-v2-color-semantic-success-dark` | `#1B5E20` | `#81C784` | — |
| `--mg-v2-color-semantic-warning` | `#AB5500` | `#FF9800` | 4.95:1 ✓ |
| `--mg-v2-color-semantic-warning-light` | `#FFF3E0` | `#3D2800` | bg용 |
| `--mg-v2-color-semantic-warning-dark` | `#E65100` | `#FFB74D` | — |
| `--mg-v2-color-semantic-error` | `#D32F2F` | `#F44336` | 5.1:1 ✓ |
| `--mg-v2-color-semantic-error-light` | `#FFEBEE` | `#3D1515` | bg용 |
| `--mg-v2-color-semantic-error-dark` | `#B71C1C` | `#E57373` | — |
| `--mg-v2-color-semantic-info` | `#0277BD` | `#29B6F6` | 4.56:1 ✓ |
| `--mg-v2-color-semantic-info-light` | `#E1F5FE` | `#0A2A3D` | bg용 |
| `--mg-v2-color-semantic-info-dark` | `#01579B` | `#4FC3F7` | — |

### 3.4 Color — Surface (6 토큰)

| 토큰 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| `--mg-v2-color-surface-bg` | `#FAF9F7` | `#121212` | 페이지 배경 |
| `--mg-v2-color-surface-card` | `#F5F3EF` | `#1E1E1E` | 카드 배경 |
| `--mg-v2-color-surface-raised` | `#FFFFFF` | `#2C2C2C` | 높은 카드/팝오버 |
| `--mg-v2-color-surface-overlay` | `#FFFFFF` | `#383838` | 모달/오버레이 |
| `--mg-v2-color-surface-sidebar` | `#2C2C2C` | `#0A0A0A` | 사이드바 배경 |
| `--mg-v2-color-surface-disabled` | `#E8E5DF` | `#2C2C2C` | 비활성 배경 |

### 3.5 Color — Text (7 토큰)

| 토큰 | 라이트 | 다크 | WCAG (on bg) | 비고 |
|------|--------|------|-------------|------|
| `--mg-v2-color-text-primary` | `#2C2C2C` | `#F5F5F5` | 13.8:1 ✓ | 본문 |
| `--mg-v2-color-text-secondary` | `#5C6B61` | `#A3A3A3` | 5.8:1 ✓ | 보조 |
| `--mg-v2-color-text-tertiary` | `#9C958C` | `#7A7A7A` | 3.1:1 | 장식용만 |
| `--mg-v2-color-text-disabled` | `#D4CFC8` | `#525252` | 1.6:1 | 비활성 예외 |
| `--mg-v2-color-text-inverse` | `#FAF9F7` | `#121212` | — | 어두운 배경용 |
| `--mg-v2-color-text-link` | `#3D5246` | `#7DA68A` | — | 링크 |
| `--mg-v2-color-text-link-hover` | `#2C3B32` | `#97C0A2` | — | 링크 호버 |

### 3.6 Color — Border (4 토큰)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--mg-v2-color-border-default` | `#D4CFC8` | `#3D3D3D` |
| `--mg-v2-color-border-light` | `#E8E5DF` | `#2C2C2C` |
| `--mg-v2-color-border-dark` | `#9C958C` | `#7A7A7A` |
| `--mg-v2-color-border-focus` | `#3D5246` | `#7DA68A` |

### 3.7 Color — Interactive States (6 토큰)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--mg-v2-color-state-hover` | `rgba(61,82,70,0.08)` | `rgba(245,245,245,0.08)` |
| `--mg-v2-color-state-active` | `rgba(61,82,70,0.12)` | `rgba(245,245,245,0.12)` |
| `--mg-v2-color-state-selected` | `rgba(61,82,70,0.16)` | `rgba(245,245,245,0.16)` |
| `--mg-v2-color-state-focus-ring` | `rgba(61,82,70,0.4)` | `rgba(125,166,138,0.4)` |
| `--mg-v2-color-state-disabled-bg` | `#E8E5DF` | `#2C2C2C` |
| `--mg-v2-color-state-disabled-text` | `#B8B2AA` | `#525252` |

### 3.8 Font — Typography (22 토큰)

#### Family (2)
| 토큰 | 값 |
|------|-----|
| `--mg-v2-font-family-base` | `'Noto Sans KR', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, 'Roboto', sans-serif` |
| `--mg-v2-font-family-mono` | `'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace` |

#### Size (11)
| 토큰 | Desktop | Mobile |
|------|---------|--------|
| `--mg-v2-font-size-display` | 3rem (48px) | 2.25rem (36px) |
| `--mg-v2-font-size-h1` | 2.25rem (36px) | 1.75rem (28px) |
| `--mg-v2-font-size-h2` | 1.75rem (28px) | 1.5rem (24px) |
| `--mg-v2-font-size-h3` | 1.5rem (24px) | 1.25rem (20px) |
| `--mg-v2-font-size-h4` | 1.25rem (20px) | 1.125rem (18px) |
| `--mg-v2-font-size-h5` | 1.125rem (18px) | 1rem (16px) |
| `--mg-v2-font-size-body-lg` | 1rem (16px) | 1rem (16px) |
| `--mg-v2-font-size-body-md` | 0.875rem (14px) | 0.875rem (14px) |
| `--mg-v2-font-size-body-sm` | 0.8125rem (13px) | 0.8125rem (13px) |
| `--mg-v2-font-size-caption` | 0.75rem (12px) | 0.75rem (12px) |
| `--mg-v2-font-size-micro` | 0.6875rem (11px) | 0.6875rem (11px) |

> **모바일 크기 조정**: 모바일 반응형 크기는 Phase B 이후 미디어 쿼리에서 오버라이드합니다.

#### Weight (4)
| 토큰 | 값 |
|------|-----|
| `--mg-v2-font-weight-regular` | 400 |
| `--mg-v2-font-weight-medium` | 500 |
| `--mg-v2-font-weight-semibold` | 600 |
| `--mg-v2-font-weight-bold` | 700 |

#### Line Height (5)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--mg-v2-font-line-height-tight` | 1.2 | Display |
| `--mg-v2-font-line-height-heading` | 1.3 | H1, H2 |
| `--mg-v2-font-line-height-subheading` | 1.4 | H3, H4, H5, Caption |
| `--mg-v2-font-line-height-body` | 1.5 | Body, Input |
| `--mg-v2-font-line-height-caption` | 1.4 | Caption, Micro |

### 3.9 Space — 스페이싱 (11 토큰)

4px 기반 그리드. 모든 Margin/Padding은 이 스케일만 사용합니다.

| 토큰 | px | rem |
|------|-----|------|
| `--mg-v2-space-1` | 4px | 0.25rem |
| `--mg-v2-space-2` | 8px | 0.5rem |
| `--mg-v2-space-3` | 12px | 0.75rem |
| `--mg-v2-space-4` | 16px | 1rem |
| `--mg-v2-space-5` | 20px | 1.25rem |
| `--mg-v2-space-6` | 24px | 1.5rem |
| `--mg-v2-space-8` | 32px | 2rem |
| `--mg-v2-space-10` | 40px | 2.5rem |
| `--mg-v2-space-12` | 48px | 3rem |
| `--mg-v2-space-16` | 64px | 4rem |
| `--mg-v2-space-20` | 80px | 5rem |

### 3.10 Grid — 레이아웃 그리드 (11 토큰)

| 토큰 | 값 |
|------|-----|
| `--mg-v2-grid-columns-desktop` | 12 |
| `--mg-v2-grid-columns-tablet` | 8 |
| `--mg-v2-grid-columns-mobile` | 4 |
| `--mg-v2-grid-gutter-desktop` | 1.5rem (24px) |
| `--mg-v2-grid-gutter-tablet` | 1rem (16px) |
| `--mg-v2-grid-gutter-mobile` | 1rem (16px) |
| `--mg-v2-grid-margin-desktop` | 2rem (32px) |
| `--mg-v2-grid-margin-tablet` | 1.5rem (24px) |
| `--mg-v2-grid-margin-mobile` | 1rem (16px) |
| `--mg-v2-grid-container-*` | sm(540) / md(720) / lg(960) / xl(1200) / 2xl(1440) |

### 3.11 Radius — Border Radius (7 토큰)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--mg-v2-radius-none` | 0 | 직각 |
| `--mg-v2-radius-sm` | 0.5rem (8px) | 소형 컴포넌트 |
| `--mg-v2-radius-md` | 0.625rem (10px) | 버튼, 인풋, 카드 (기본) |
| `--mg-v2-radius-lg` | 0.75rem (12px) | 큰 카드 |
| `--mg-v2-radius-xl` | 1rem (16px) | 모달, 토스트 |
| `--mg-v2-radius-2xl` | 1.5rem (24px) | 특수 컨테이너 |
| `--mg-v2-radius-pill` | 9999px | 뱃지, 태그 |

### 3.12 Shadow (6 토큰)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--mg-v2-shadow-xs` | `0 1px 2px rgba(44,42,39,0.05)` | `none` |
| `--mg-v2-shadow-sm` | `0 1px 3px rgba(44,42,39,0.1), 0 1px 2px rgba(44,42,39,0.06)` | `none` |
| `--mg-v2-shadow-md` | `0 4px 6px rgba(44,42,39,0.1), 0 2px 4px rgba(44,42,39,0.06)` | `none` |
| `--mg-v2-shadow-lg` | `0 10px 15px rgba(44,42,39,0.1), 0 4px 6px rgba(44,42,39,0.05)` | `none` |
| `--mg-v2-shadow-xl` | `0 20px 25px rgba(44,42,39,0.1), 0 10px 10px rgba(44,42,39,0.04)` | `none` |
| `--mg-v2-shadow-focus` | focus ring | focus ring |

> **다크 모드 대체**: 다크 모드에서는 shadow 대신 `--mg-v2-border-elevation-{1,2,3}` 사용.

### 3.13 Z-Index (12 토큰)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--mg-v2-z-hidden` | -1 | 숨김 |
| `--mg-v2-z-base` | 0 | 기본 |
| `--mg-v2-z-content` | 1 | 콘텐츠 |
| `--mg-v2-z-content-hover` | 2 | 콘텐츠 호버 |
| `--mg-v2-z-dropdown` | 100 | 드롭다운 |
| `--mg-v2-z-sticky` | 500 | 스티키 요소 |
| `--mg-v2-z-header` | 1000 | 헤더/GNB |
| `--mg-v2-z-overlay` | 7000 | 오버레이 |
| `--mg-v2-z-modal-backdrop` | 10000 | 모달 백드롭 |
| `--mg-v2-z-modal` | 10001 | 모달 콘텐츠 |
| `--mg-v2-z-toast` | 20000 | 토스트 알림 |
| `--mg-v2-z-tooltip` | 30000 | 툴팁 |

### 3.14 Transition (11 토큰)

| 토큰 | 기본값 | reduced-motion |
|------|--------|----------------|
| `--mg-v2-transition-duration-instant` | 100ms | 0ms |
| `--mg-v2-transition-duration-fast` | 200ms | 0ms |
| `--mg-v2-transition-duration-normal` | 300ms | 0ms |
| `--mg-v2-transition-duration-slow` | 500ms | 0ms |
| `--mg-v2-transition-easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | — |
| `--mg-v2-transition-easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | — |
| `--mg-v2-transition-easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | — |
| `--mg-v2-transition-easing-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | — |
| `--mg-v2-transition-fast` | 200ms ease | 0ms |
| `--mg-v2-transition-normal` | 300ms ease | 0ms |
| `--mg-v2-transition-slow` | 500ms ease | 0ms |

### 3.15 Breakpoint (6 토큰, 참조용)

> CSS 변수는 `@media` 쿼리에 직접 사용할 수 없습니다. JS/컴포넌트 내 계산용으로 제공합니다.

| 토큰 | 값 |
|------|-----|
| `--mg-v2-breakpoint-xs` | 0px |
| `--mg-v2-breakpoint-sm` | 576px |
| `--mg-v2-breakpoint-md` | 768px |
| `--mg-v2-breakpoint-lg` | 1024px |
| `--mg-v2-breakpoint-xl` | 1280px |
| `--mg-v2-breakpoint-2xl` | 1536px |

### 3.16 Component 공용 토큰 (4 토큰)

Phase B 아톰 구현 시 확장됩니다. 현재는 공용 크기만 정의합니다.

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--mg-v2-component-height-sm` | 2rem (32px) | Small 컴포넌트 |
| `--mg-v2-component-height-md` | 2.5rem (40px) | Medium 컴포넌트 |
| `--mg-v2-component-height-lg` | 3rem (48px) | Large 컴포넌트 |
| `--mg-v2-component-touch-target` | 2.75rem (44px) | 모바일 터치 최소 크기 |

### 3.17 Opacity (5 토큰)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--mg-v2-opacity-disabled` | 0.5 | 비활성 요소 |
| `--mg-v2-opacity-overlay` | 0.5 | 모달 백드롭 |
| `--mg-v2-opacity-hover` | 0.08 | 호버 오버레이 |
| `--mg-v2-opacity-active` | 0.12 | 액티브 오버레이 |
| `--mg-v2-opacity-selected` | 0.16 | 선택 오버레이 |

---

## 4. 토큰 카테고리 요약

| 카테고리 | 토큰 수 |
|----------|---------|
| Color — Brand | 11 |
| Color — Neutral | 10 |
| Color — Semantic | 12 |
| Color — Surface | 6 |
| Color — Text | 7 |
| Color — Border | 4 |
| Color — States | 6 |
| Font | 22 |
| Space | 11 |
| Grid | 14 |
| Radius | 7 |
| Shadow | 6 |
| Border Width | 4 |
| Z-Index | 12 |
| Transition | 11 |
| Breakpoint | 6 |
| Component | 4 |
| Opacity | 5 |
| Elevation Border (다크) | 3 |
| **총계** | **~161** |

---

## 5. WCAG 2.1 AA 대비 검증

### 라이트 모드 (배경: `#FAF9F7`)

| 텍스트 토큰 | HEX | 대비 | 결과 |
|-------------|-----|------|------|
| `text-primary` | `#2C2C2C` | 13.27:1 | **Pass** (AA, AAA) |
| `text-secondary` | `#5C6B61` | 5.35:1 | **Pass** (AA) |
| `text-tertiary` | `#9C958C` | 2.81:1 | Fail — 장식/large text 전용 |
| `text-disabled` | `#D4CFC8` | 1.47:1 | 비활성 예외 (WCAG 면제) |
| `primary-main` | `#3D5246` | 8.00:1 | **Pass** (AA, AAA) |
| `semantic-success` | `#2E7D32` | 4.87:1 | **Pass** (AA) |
| `semantic-warning` | `#AB5500` | 4.95:1 | **Pass** (AA) |
| `semantic-error` | `#D32F2F` | 4.73:1 | **Pass** (AA) |
| `semantic-info` | `#0277BD` | 4.56:1 | **Pass** (AA) |

### 다크 모드 (배경: `#121212`)

| 텍스트 토큰 | HEX | 대비 | 결과 |
|-------------|-----|------|------|
| `text-primary` | `#F5F5F5` | 17.18:1 | **Pass** (AA, AAA) |
| `text-secondary` | `#A3A3A3` | 7.43:1 | **Pass** (AA, AAA) |
| `text-tertiary` | `#7A7A7A` | 4.36:1 | large text OK |
| `text-disabled` | `#525252` | 2.40:1 | 비활성 예외 (WCAG 면제) |
| `primary-main` | `#4A6354` | 2.86:1 | bg 전용 (텍스트 → inverse 사용) |
| `semantic-success` | `#4CAF50` | 6.74:1 | **Pass** (AA) |
| `semantic-error` | `#F44336` | 5.09:1 | **Pass** (AA) |
| `semantic-warning` | `#FF9800` | 8.69:1 | **Pass** (AA) |
| `semantic-info` | `#29B6F6` | 8.13:1 | **Pass** (AA) |

---

## 6. 기존 mg-* 토큰과의 공존/마이그레이션 정책

### 원칙: 점진적 마이그레이션

| 단계 | Phase | 토큰 | 컴포넌트 | 정책 |
|------|-------|------|----------|------|
| 현재 | A3 | `mg-v2-*` 신설 | 변경 없음 | `mg-v2-*` 신규 prefix로 시작 |
| 다음 | B1~B3 | `mg-v2-*` 확장 | Atom 신규 구현 | 새 컴포넌트는 `mg-v2-*` 만 사용 |
| 이후 | C1~C3 | 기존 `mg-*` 참조 제거 | 페이지 마이그 | 페이지별로 `mg-*` → `mg-v2-*` 전환 |
| 최종 | D | `mg-*` deprecate | 전체 | 기존 토큰 완전 제거, `mg-v2-*` 단독 |

### 공존 규칙
- `mg-v2-*` 와 기존 `mg-*`/`cs-*` 는 동시에 존재할 수 있음
- `main.css` 에서 `design-v2-tokens.css` 는 기존 토큰 이후에 import (cascade 우선순위)
- **절대 금지**: 기존 `mg-*` 토큰 일괄 삭제 (Phase B/C 진행하며 점진적 전환)
- 기존 컴포넌트(MGButton, ActionBar, SegmentedTabs, UnifiedModal 등)는 v1 토큰을 그대로 사용

---

## 7. 기존 컴포넌트 영향 분석

### v1 토큰 사용 컴포넌트 (Phase B 마이그 대상)

| 컴포넌트 | 현재 사용 토큰 | Phase B 마이그 시기 |
|----------|---------------|---------------------|
| MGButton | `--mg-primary-*`, `--cs-primary-*` | B1 (Atom) |
| ActionBar | `--mg-primary-*`, `--mg-secondary-*` | B2 (Molecule) |
| SegmentedTabs | `--mg-primary-*`, 하드코딩 일부 | B2 (Molecule) |
| UnifiedModal | `--mg-*`, `--cs-*` | B2 (Molecule) |
| ContentHeader | `--mg-*` | B2 (Molecule) |
| BadgeSelect | `--mg-*` | B1 (Atom) |
| DataCard | `--mg-*`, `--cs-*` | B3 (Organism) |
| StatWidget | `--mg-*` | B3 (Organism) |

### 영향도 평가
- **변경 없음**: Phase A3는 토큰 정의만 추가. 기존 코드에 영향 0
- **Phase B 시**: 각 컴포넌트를 `mg-v2-*` 토큰으로 전환하면서 visual regression 테스트
- **호환성 보장**: 새 토큰 파일이 기존 토큰과 동일 `:root` 스코프에 있으므로, 혼용 가능

---

## 8. 사용 예시

### 버튼 (Phase B1 에서 구현 예정)

```css
.mg-v2-button-primary {
  background-color: var(--mg-v2-color-primary-main);
  color: var(--mg-v2-color-text-inverse);
  border-radius: var(--mg-v2-radius-md);
  height: var(--mg-v2-component-height-md);
  padding: var(--mg-v2-component-padding-md);
  font-size: var(--mg-v2-font-size-body-md);
  font-weight: var(--mg-v2-font-weight-medium);
  transition: background-color var(--mg-v2-transition-fast);
}

.mg-v2-button-primary:hover {
  background-color: var(--mg-v2-color-primary-hover);
}

.mg-v2-button-primary:active {
  background-color: var(--mg-v2-color-primary-active);
}

.mg-v2-button-primary:focus-visible {
  box-shadow: var(--mg-v2-shadow-focus);
}

.mg-v2-button-primary:disabled {
  opacity: var(--mg-v2-opacity-disabled);
  cursor: not-allowed;
  background-color: var(--mg-v2-color-state-disabled-bg);
  color: var(--mg-v2-color-state-disabled-text);
}
```

### 카드

```css
.mg-v2-card {
  background-color: var(--mg-v2-color-surface-card);
  border-radius: var(--mg-v2-radius-lg);
  padding: var(--mg-v2-space-6);
  box-shadow: var(--mg-v2-shadow-sm);
  border: var(--mg-v2-border-elevation-1, none);
  transition: box-shadow var(--mg-v2-transition-fast);
}

.mg-v2-card:hover {
  box-shadow: var(--mg-v2-shadow-md);
}
```

---

## 9. Visual Regression 게이트 (Phase D 사전 정의)

Phase A3 자체는 컴포넌트를 변경하지 않으므로 visual regression 위험이 없습니다. Phase B/C 마이그 시 다음 기준을 적용합니다:

| 기준 | 임계값 |
|------|--------|
| 라이트 모드 스크린샷 diff | 0% |
| 다크 모드 스크린샷 diff | 0% |
| 모바일(414×896) 터치 타겟 | ≥ 44px |
| Lighthouse 접근성 점수 | ≥ 90 |
| WCAG 명도 대비 (텍스트) | ≥ 4.5:1 |

---

## 10. 다음 단계

| Phase | 작업 | 담당 | 모델 |
|-------|------|------|------|
| B1 | Atom 컴포넌트 (MGButton, MGInput, MGBadge, MGAvatar 등) | core-coder | Claude 4.6 Opus |
| B2 | Molecule 컴포넌트 (ActionBar, SegmentedTabs, FormGroup 등) | core-coder | Claude 4.6 Opus |
| B3 | Organism 컴포넌트 (DataCard, Sidebar, Header 등) | core-coder | Claude 4.6 Opus |
| C1~C3 | 페이지 마이그레이션 (그룹별) | core-coder | Claude 4.6 Opus |
| D | Visual Regression 통과 + 최종 검수 | core-tester | — |
