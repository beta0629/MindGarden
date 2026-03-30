# 헤더 CSS 표준화 계획

## 📋 목적
표준화 원칙에 따라 `frontend/src/styles/06-components/_header.css` 파일의 모든 하드코딩된 값을 CSS 변수로 변경

## 🚨 발견된 하드코딩 항목

### 1. 간격 (Spacing)
- `gap: 2px;` (line 116, 287)
- `padding: 2px` (line 593, 614)

### 2. 높이 (Height)
- `height: 32px;` (line 188)
- `height: 28px;` (line 203)

### 3. 색상 (Color)
- `rgba(255, 255, 255, 0.95)` (line 5, 62, 315, 468)
- `rgba(209, 209, 214, 0.8)` (line 8)
- `rgba(0, 0, 0, 0.05)` (line 9)
- `rgba(0, 123, 255, 0.2)` (line 85, 332, 485)
- `rgba(20, 20, 20, 0.95)` (line 370)
- `rgba(255, 255, 255, 0.1)` (line 371)
- `rgba(34, 197, 94, 0.1)` (line 621)
- `rgb(34, 197, 94)` (line 622)
- `rgba(239, 68, 68, 0.1)` (line 626)
- `rgb(239, 68, 68)` (line 627)
- `rgba(0, 123, 255, 0.1)` (line 569)
- `rgba(0, 123, 255, 0.15)` (line 574)

### 4. Transform
- `transform: translateX(-1px);` (line 84)
- `transform: translateY(-1px);` (line 484)
- `transform: translateX(4px);` (line 564)

### 5. Box Shadow
- `box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);` (line 9)
- `box-shadow: 0 2px 6px rgba(0, 123, 255, 0.2);` (line 85, 332, 485)
- `box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);` (line 332, 485)

### 6. 너비/높이 (Width/Height)
- `max-width: 120px;` (line 501)
- `max-height: 400px;` (line 543)
- `width: 1px; height: 1px;` (line 452-453)

### 7. Transition
- `transition: transform 0.2s ease, opacity 0.2s ease;` (line 102)

### 8. 기타
- `white` (line 82, 336, 482, 491, 595)
- `color: white;` (line 82, 336, 482, 491, 595)
- `opacity: 0.8;` (line 109, 369)
- `opacity: 0.6;` (line 410)
- `opacity: 0.4;` (line 415)

## ✅ 수정 계획

모든 하드코딩된 값을 CSS 변수로 변경하여 표준화 원칙 준수

## ✅ 완료된 수정 사항

### 1. 색상 하드코딩 제거
- ✅ `rgba(255, 255, 255, 0.95)` → `var(--cs-glass-strong)`
- ✅ `rgba(255, 255, 255, 0.9)` → `var(--cs-glass-white-90)`
- ✅ `rgba(209, 209, 214, 0.8)` → `var(--cs-glass-gray-border)`
- ✅ `rgba(0, 0, 0, 0.05)` → `var(--shadow-default)`
- ✅ `rgba(0, 123, 255, 0.2)` → `var(--shadow-hover-primary)`
- ✅ `rgba(20, 20, 20, 0.95)` → `var(--cs-glass-dark-60)`
- ✅ `rgba(34, 197, 94, 0.1)` → `var(--mg-success-50)`
- ✅ `rgb(34, 197, 94)` → `var(--mg-success-600)`
- ✅ `rgba(239, 68, 68, 0.1)` → `var(--mg-error-50)`
- ✅ `rgb(239, 68, 68)` → `var(--mg-error-600)`
- ✅ `white` → `var(--mg-white)`

### 2. 간격 하드코딩 제거
- ✅ `gap: 2px;` → `var(--spacing-xs, 0.125rem)`
- ✅ `padding: 2px` → `var(--spacing-xs, 0.125rem)`
- ✅ `outline-offset: 2px` → `var(--spacing-xs, 0.125rem)`

### 3. 높이 하드코딩 제거
- ✅ `height: 32px` → `var(--icon-size-lg)`
- ✅ `height: 28px` → `var(--icon-size-md)`
- ✅ `max-height: 400px` → `var(--modal-max-height, 25rem)`
- ✅ `max-width: 120px` → `var(--spacing-xxl, 7.5rem)`

### 4. Border/Outline 하드코딩 제거
- ✅ `border: 1px` → `var(--border-width)`
- ✅ `border: 2px` → `var(--border-width-normal)`
- ✅ `outline: 2px` → `var(--border-width-normal)`

### 5. Transform 하드코딩 제거
- ✅ `transform: translateX(-1px)` → `transform: translateX(calc(var(--spacing-xs) * -1))`
- ✅ `transform: translateY(-1px)` → `transform: translateY(calc(var(--spacing-xs) * -1))`
- ✅ `transform: translateX(4px)` → `transform: translateX(var(--spacing-xs))`

### 6. Box Shadow 하드코딩 제거
- ✅ `box-shadow: 0 2px 20px rgba(...)` → `var(--shadow-default)`
- ✅ `box-shadow: 0 2px 6px rgba(...)` → `var(--shadow-hover-primary)`
- ✅ `box-shadow: 0 2px 8px rgba(...)` → `var(--shadow-hover-primary)`

### 7. Transition 하드코딩 제거
- ✅ `transition: all 0.3s ease` → `var(--transition-normal)`
- ✅ `transition: transform 0.2s ease, opacity 0.2s ease` → `var(--transition-fast)`

### 8. Opacity 하드코딩 제거
- ✅ `opacity: 0.8` → `var(--opacity-hover, 0.8)`
- ✅ `opacity: 0.6` → `var(--opacity-disabled, 0.6)`
- ✅ `opacity: 0.4` → `var(--opacity-disabled-strong, 0.4)`

### 9. Text Shadow 하드코딩 제거
- ✅ `text-shadow: 0 1px 2px` → `var(--spacing-xs)` 기반 변수 사용

## 📝 남은 항목 (Fallback 값)

일부 fallback 값들은 변수가 정의되지 않은 경우를 대비한 것이므로 유지:
- `var(--header-height, 64px)` - fallback
- `var(--header-logo-height, 40px)` - fallback
- Media query breakpoints (768px, 480px) - 표준 breakpoint 값

이러한 값들은 CSS 변수가 정의되어 있으면 자동으로 사용되며, 정의되지 않은 경우에만 fallback 값이 사용됩니다.

## 📝 참조
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `frontend/src/styles/unified-design-tokens.css`

