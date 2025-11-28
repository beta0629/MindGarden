# 🔄 CSS 변수 마이그레이션 가이드

> **생성일**: 2025-11-28T06:10:04.413Z  
> **목적**: 분산된 CSS 변수를 통합 시스템으로 마이그레이션

---

## 📊 마이그레이션 현황

| 구분 | 수량 |
|------|------|
| 분석된 파일 | 8개 |
| 총 변수 | 976개 |
| 중복 변수 | 125개 |
| 충돌 변수 | 229개 |

---

## 🎯 새로운 통합 시스템

### 1. 통합 CSS 파일
```css
/* frontend/src/styles/unified-design-tokens.css */
:root {
  --mg-primary-500: #3b82f6;
  --mg-success-500: #10b981;
  /* ... 모든 색상 변수 */
}
```

### 2. 통합 JavaScript 상수
```javascript
// frontend/src/constants/unifiedDesignTokens.js
export const MG_DESIGN_TOKENS = {
  COLORS: {
    PRIMARY_500: 'var(--mg-primary-500)',
    SUCCESS_500: 'var(--mg-success-500)',
    // ...
  }
};
```

---

## 🔄 마이그레이션 단계

### Phase 1: 새로운 시스템 적용
```bash
# 1. 통합 CSS 파일 import 추가
# frontend/src/index.css 또는 App.css에 추가:
@import './styles/unified-design-tokens.css';

# 2. 기존 CSS 변수 파일들 deprecated 처리
# (아직 삭제하지 말고 주석 처리)
```

### Phase 2: 기존 파일 교체
```bash
# 기존 CSS 변수 파일들을 점진적으로 교체
node scripts/replace-css-imports.js
```

### Phase 3: 검증 및 정리
```bash
# 1. 전체 시스템 빌드 테스트
npm run build

# 2. 시각적 회귀 테스트
npm run test:visual

# 3. 사용되지 않는 파일 제거
node scripts/cleanup-old-css-files.js
```

---

## 📋 변경 사항 요약

### 기존 → 새로운 변수명 매핑

| 기존 변수명 | 새로운 변수명 | 비고 |
|-------------|---------------|------|
| `--z-base`, `--z-base` | `--z-base` | 통합됨 |
| `--z-dropdown`, `--z-dropdown` | `--z-dropdown` | 통합됨 |
| `--z-sticky`, `--z-sticky` | `--z-sticky` | 통합됨 |
| `--z-fixed`, `--z-fixed` | `--z-fixed` | 통합됨 |
| `--z-modal-backdrop`, `--z-modal-backdrop` | `--z-modal-backdrop` | 통합됨 |
| `--z-modal`, `--z-modal` | `--z-modal` | 통합됨 |
| `--z-popover`, `--z-popover` | `--z-popover` | 통합됨 |
| `--z-tooltip`, `--z-tooltip` | `--z-tooltip` | 통합됨 |
| `--z-toast`, `--z-toast` | `--z-toast` | 통합됨 |
| `--ios-blue`, `--ios-blue` | `--ios-blue` | 통합됨 |
| `--ios-green`, `--ios-green` | `--ios-green` | 통합됨 |
| `--ios-orange`, `--ios-orange` | `--ios-orange` | 통합됨 |
| `--ios-red`, `--ios-red` | `--ios-red` | 통합됨 |
| `--ios-purple`, `--ios-purple` | `--ios-purple` | 통합됨 |
| `--ios-pink`, `--ios-pink` | `--ios-pink` | 통합됨 |
| `--ios-yellow`, `--ios-yellow` | `--ios-yellow` | 통합됨 |
| `--ios-gray`, `--ios-gray` | `--ios-gray` | 통합됨 |
| `--glass-bg-light`, `--glass-bg-light` | `--glass-bg-light` | 통합됨 |
| `--glass-bg-medium`, `--glass-bg-medium` | `--glass-bg-medium` | 통합됨 |
| `--glass-bg-strong`, `--glass-bg-strong` | `--glass-bg-strong` | 통합됨 |
| `--glass-border`, `--glass-border` | `--glass-border` | 통합됨 |
| `--glass-border-strong`, `--glass-border-strong` | `--glass-border-strong` | 통합됨 |
| `--color-primary`, `--color-primary` | `--color-primary` | 통합됨 |
| `--color-secondary`, `--color-secondary`, `--color-secondary` | `--color-secondary` | 통합됨 |
| `--color-success`, `--color-success` | `--color-success` | 통합됨 |
| `--color-danger`, `--color-danger` | `--color-danger` | 통합됨 |
| `--color-warning`, `--color-warning` | `--color-warning` | 통합됨 |
| `--color-info`, `--color-info` | `--color-info` | 통합됨 |
| `--color-light`, `--color-light` | `--color-light` | 통합됨 |
| `--color-dark`, `--color-dark` | `--color-dark` | 통합됨 |
| `--spacing-xs`, `--spacing-xs`, `--spacing-xs` | `--spacing-xs` | 통합됨 |
| `--spacing-sm`, `--spacing-sm`, `--spacing-sm` | `--spacing-sm` | 통합됨 |
| `--spacing-md`, `--spacing-md`, `--spacing-md` | `--spacing-md` | 통합됨 |
| `--spacing-lg`, `--spacing-lg`, `--spacing-lg` | `--spacing-lg` | 통합됨 |
| `--spacing-xl`, `--spacing-xl`, `--spacing-xl` | `--spacing-xl` | 통합됨 |
| `--spacing-xxl`, `--spacing-xxl`, `--spacing-xxl` | `--spacing-xxl` | 통합됨 |
| `--font-size-xs`, `--font-size-xs`, `--font-size-xs` | `--font-size-xs` | 통합됨 |
| `--font-size-sm`, `--font-size-sm` | `--font-size-sm` | 통합됨 |
| `--font-size-base`, `--font-size-base` | `--font-size-base` | 통합됨 |
| `--font-size-lg`, `--font-size-lg` | `--font-size-lg` | 통합됨 |
| `--font-size-xl`, `--font-size-xl` | `--font-size-xl` | 통합됨 |
| `--font-size-xxl`, `--font-size-xxl` | `--font-size-xxl` | 통합됨 |
| `--font-size-xxxl`, `--font-size-xxxl` | `--font-size-xxxl` | 통합됨 |
| `--font-size-base-desktop`, `--font-size-base-desktop` | `--font-size-base-desktop` | 통합됨 |
| `--font-size-lg-desktop`, `--font-size-lg-desktop` | `--font-size-lg-desktop` | 통합됨 |
| `--font-size-xl-desktop`, `--font-size-xl-desktop` | `--font-size-xl-desktop` | 통합됨 |
| `--font-size-xxl-desktop`, `--font-size-xxl-desktop` | `--font-size-xxl-desktop` | 통합됨 |
| `--font-weight-light`, `--font-weight-light`, `--font-weight-light`, `--font-weight-light` | `--font-weight-light` | 통합됨 |
| `--font-weight-normal`, `--font-weight-normal`, `--font-weight-normal`, `--font-weight-normal`, `--font-weight-normal`, `--font-weight-normal` | `--font-weight-normal` | 통합됨 |
| `--font-weight-medium`, `--font-weight-medium`, `--font-weight-medium`, `--font-weight-medium`, `--font-weight-medium`, `--font-weight-medium` | `--font-weight-medium` | 통합됨 |
| `--font-weight-semibold`, `--font-weight-semibold`, `--font-weight-semibold`, `--font-weight-semibold`, `--font-weight-semibold`, `--font-weight-semibold`, `--font-weight-semibold` | `--font-weight-semibold` | 통합됨 |
| `--font-weight-bold`, `--font-weight-bold`, `--font-weight-bold`, `--font-weight-bold`, `--font-weight-bold`, `--font-weight-bold` | `--font-weight-bold` | 통합됨 |
| `--font-weight-extrabold`, `--font-weight-extrabold`, `--font-weight-extrabold` | `--font-weight-extrabold` | 통합됨 |
| `--border-radius-xxl`, `--border-radius-xxl` | `--border-radius-xxl` | 통합됨 |
| `--shadow-md`, `--shadow-md` | `--shadow-md` | 통합됨 |
| `--shadow-lg`, `--shadow-lg` | `--shadow-lg` | 통합됨 |
| `--transition-normal`, `--transition-normal`, `--transition-normal` | `--transition-normal` | 통합됨 |
| `--breakpoint-sm`, `--breakpoint-sm` | `--breakpoint-sm` | 통합됨 |
| `--breakpoint-md`, `--breakpoint-md`, `--breakpoint-md`, `--breakpoint-md` | `--breakpoint-md` | 통합됨 |
| `--breakpoint-lg`, `--breakpoint-lg` | `--breakpoint-lg` | 통합됨 |
| `--breakpoint-xl`, `--breakpoint-xl` | `--breakpoint-xl` | 통합됨 |
| `--breakpoint-xxl`, `--breakpoint-xxl` | `--breakpoint-xxl` | 통합됨 |
| `--touch-target-min`, `--touch-target-min` | `--touch-target-min` | 통합됨 |
| `--color-text-secondary`, `--color-text-secondary` | `--color-text-secondary` | 통합됨 |
| `--color-text-muted`, `--color-text-muted`, `--color-text-muted` | `--color-text-muted` | 통합됨 |
| `--spacing-xxxl`, `--spacing-xxxl` | `--spacing-xxxl` | 통합됨 |
| `--line-height-normal`, `--line-height-normal` | `--line-height-normal` | 통합됨 |
| `--border-radius-full`, `--border-radius-full` | `--border-radius-full` | 통합됨 |
| `--container-max-width`, `--container-max-width` | `--container-max-width` | 통합됨 |
| `--modal-padding`, `--modal-padding` | `--modal-padding` | 통합됨 |
| `--bg-primary`, `--bg-primary`, `--bg-primary` | `--bg-primary` | 통합됨 |
| `--border-width-thin`, `--border-width-thin` | `--border-width-thin` | 통합됨 |
| `--shadow-xs`, `--shadow-xs` | `--shadow-xs` | 통합됨 |
| `--shadow-2xl`, `--shadow-2xl` | `--shadow-2xl` | 통합됨 |
| `--shadow-glass`, `--shadow-glass` | `--shadow-glass` | 통합됨 |
| `--breakpoint-2xl`, `--breakpoint-2xl` | `--breakpoint-2xl` | 통합됨 |
| `--cream`, `--cream` | `--cream` | 통합됨 |
| `--light-beige`, `--light-beige` | `--light-beige` | 통합됨 |
| `--cocoa`, `--cocoa` | `--cocoa` | 통합됨 |
| `--olive-green`, `--olive-green` | `--olive-green` | 통합됨 |
| `--mint-green`, `--mint-green` | `--mint-green` | 통합됨 |
| `--soft-mint`, `--soft-mint` | `--soft-mint` | 통합됨 |
| `--dark-gray`, `--dark-gray` | `--dark-gray` | 통합됨 |
| `--medium-gray`, `--medium-gray` | `--medium-gray` | 통합됨 |
| `--light-cream`, `--light-cream` | `--light-cream` | 통합됨 |
| `--font-size-2xl`, `--font-size-2xl` | `--font-size-2xl` | 통합됨 |
| `--font-size-3xl`, `--font-size-3xl` | `--font-size-3xl` | 통합됨 |
| `--font-size-4xl`, `--font-size-4xl` | `--font-size-4xl` | 통합됨 |
| `--mg-success_light`, `--mg-success_light` | `--mg-success_light` | 통합됨 |
| `--mg-info_light`, `--mg-info_light` | `--mg-info_light` | 통합됨 |
| `--mg-warning_light`, `--mg-warning_light` | `--mg-warning_light` | 통합됨 |
| `--mg-white`, `--mg-white` | `--mg-white` | 통합됨 |

---

## 🚨 충돌 해결 내역

- **--font-size-sm**: `0.875rem` vs `11px` → 해결됨
- **--font-size-base**: `1rem` vs `13px` → 해결됨
- **--font-size-lg**: `1.125rem` vs `15px` → 해결됨
- **--font-size-xl**: `1.25rem` vs `17px` → 해결됨
- **--font-size-xxl**: `1.25rem` vs `19px` → 해결됨
- **--font-size-xxxl**: `2rem` vs `21px` → 해결됨
- **--font-size-xs**: `0.75rem` vs `0.75rem` → 해결됨
- **--font-size-sm**: `0.875rem` vs `0.875rem` → 해결됨
- **--font-size-base**: `1rem` vs `1rem` → 해결됨
- **--font-size-lg**: `1.125rem` vs `1.125rem` → 해결됨
- **--font-size-xl**: `1.25rem` vs `1.25rem` → 해결됨
- **--font-size-xxl**: `1.25rem` vs `1.5rem` → 해결됨
- **--font-size-xxxl**: `2rem` vs `1.75rem` → 해결됨
- **--ios-text-primary**: `#1d1d1f` vs `#ffffff` → 해결됨
- **--ios-text-secondary**: `#86868b` vs `#8e8e93` → 해결됨
- **--ios-text-tertiary**: `#c7c7cc` vs `#636366` → 해결됨
- **--ios-bg-primary**: `#ffffff` vs `#000000` → 해결됨
- **--ios-bg-secondary**: `#f2f2f7` vs `#1c1c1e` → 해결됨
- **--ios-bg-tertiary**: `#ffffff` vs `#2c2c2e` → 해결됨
- **--glass-bg-light**: `rgba(0, 0, 0, 0.25)` vs `rgba(0, 0, 0, 0.25)` → 해결됨
- **--glass-bg-medium**: `rgba(0, 0, 0, 0.35)` vs `rgba(0, 0, 0, 0.35)` → 해결됨
- **--glass-bg-strong**: `rgba(0, 0, 0, 0.45)` vs `rgba(0, 0, 0, 0.45)` → 해결됨
- **--glass-border**: `rgba(255, 255, 255, 0.2)` vs `rgba(255, 255, 255, 0.1)` → 해결됨
- **--glass-border-strong**: `rgba(255, 255, 255, 0.2)` vs `rgba(255, 255, 255, 0.2)` → 해결됨
- **--color-primary**: `#007bff` vs `#2196F3` → 해결됨
- **--color-secondary**: `#666666` vs `#1976D2` → 해결됨
- **--color-success**: `#10b981` vs `#4CAF50` → 해결됨
- **--color-warning**: `#f59e0b` vs `#FF9800` → 해결됨
- **--color-info**: `#3b82f6` vs `#2196F3` → 해결됨
- **--font-size-xs**: `0.75rem` vs `0.75rem` → 해결됨
- **--font-size-sm**: `0.875rem` vs `0.875rem` → 해결됨
- **--font-size-base**: `1rem` vs `1rem` → 해결됨
- **--font-size-lg**: `1.125rem` vs `1.125rem` → 해결됨
- **--font-size-xl**: `1.25rem` vs `1.25rem` → 해결됨
- **--font-size-xxl**: `1.25rem` vs `1.5rem` → 해결됨
- **--font-size-xxxl**: `2rem` vs `2rem` → 해결됨
- **--border-radius-sm**: `0.25rem` vs `4px` → 해결됨
- **--border-radius-lg**: `0.5rem` vs `12px` → 해결됨
- **--border-radius-xl**: `0.75rem` vs `16px` → 해결됨
- **--shadow-sm**: `0 2px 4px rgba(0, 0, 0, 0.1)` vs `0 1px 3px rgba(0, 0, 0, 0.1)` → 해결됨
- **--shadow-lg**: `none` vs `0 4px 12px rgba(0, 0, 0, 0.1)` → 해결됨
- **--shadow-xl**: `0 25px 50px rgba(0, 0, 0, 0.25)` vs `0 8px 24px rgba(0, 0, 0, 0.15)` → 해결됨
- **--color-background-primary**: `#ffffff` vs `#1a1a1a` → 해결됨
- **--color-background-secondary**: `#f8f9fa` vs `#2d2d2d` → 해결됨
- **--color-background-tertiary**: `#f5f5f5` vs `#404040` → 해결됨
- **--color-text-primary**: `#000000` vs `#ffffff` → 해결됨
- **--color-text-secondary**: `#6b7280` vs `#cccccc` → 해결됨
- **--color-border-default**: `#e0e0e0` vs `#404040` → 해결됨
- **--color-border-light**: `#e9ecef` vs `#555555` → 해결됨
- **--color-border-dark**: `#a8a8a8` vs `#666666` → 해결됨
- **--color-primary**: `#007bff` vs `#0000FF` → 해결됨
- **--color-success**: `#10b981` vs `#008000` → 해결됨
- **--color-warning**: `#f59e0b` vs `#FF8C00` → 해결됨
- **--color-error**: `#F44336` vs `#FF0000` → 해결됨
- **--color-background-primary**: `#ffffff` vs `#FFFFFF` → 해결됨
- **--color-text-primary**: `#000000` vs `#000000` → 해결됨
- **--color-border-default**: `#e0e0e0` vs `#000000` → 해결됨
- **--spacing-lg**: `2rem` vs `16px` → 해결됨
- **--spacing-xl**: `3rem` vs `24px` → 해결됨
- **--font-size-xl**: `1.25rem` vs `1.125rem` → 해결됨
- **--font-size-xxl**: `1.25rem` vs `1.25rem` → 해결됨
- **--spacing-md**: `1.5rem` vs `12px` → 해결됨
- **--spacing-lg**: `2rem` vs `16px` → 해결됨
- **--font-size-lg**: `1.125rem` vs `1rem` → 해결됨
- **--font-size-xl**: `1.25rem` vs `1.125rem` → 해결됨
- **--font-family-ios**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` vs `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` → 해결됨
- **--border-radius-sm**: `0.25rem` vs `4px` → 해결됨
- **--border-radius-md**: `0.375rem` vs `8px` → 해결됨
- **--border-radius-lg**: `0.5rem` vs `12px` → 해결됨
- **--border-radius-xl**: `0.75rem` vs `16px` → 해결됨
- **--border-radius-full**: `50%` vs `50%` → 해결됨
- **--shadow-sm**: `0 2px 4px rgba(0, 0, 0, 0.1)` vs `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)` → 해결됨
- **--shadow-md**: `none` vs `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` → 해결됨
- **--shadow-lg**: `none` vs `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` → 해결됨
- **--shadow-xl**: `0 25px 50px rgba(0, 0, 0, 0.25)` vs `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` → 해결됨
- **--transition-fast**: `0.01s` vs `0.15s ease` → 해결됨
- **--transition-slow**: `0.01s` vs `0.5s ease` → 해결됨
- **--transition-bounce**: `0.01s` vs `0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)` → 해결됨
- **--breakpoint-xs**: `320px` vs `320px` → 해결됨
- **--breakpoint-sm**: `640px` vs `640px` → 해결됨
- **--breakpoint-lg**: `1024px` vs `1024px` → 해결됨
- **--breakpoint-xl**: `1280px` vs `1280px` → 해결됨
- **--modal-max-width**: `1000px` vs `500px` → 해결됨
- **--text-primary**: `var(--color-text-primary)` vs `#ffffff` → 해결됨
- **--text-secondary**: `var(--color-text-secondary)` vs `#a1a1a6` → 해결됨
- **--text-tertiary**: `#c7c7cc` vs `#636366` → 해결됨
- **--bg-primary**: `#ffffff` vs `#1c1c1e` → 해결됨
- **--bg-secondary**: `#f2f2f7` vs `#2c2c2e` → 해결됨
- **--bg-tertiary**: `#ffffff` vs `#3a3a3c` → 해결됨
- **--glass-bg-light**: `rgba(0, 0, 0, 0.25)` vs `rgba(0, 0, 0, 0.25)` → 해결됨
- **--glass-bg-medium**: `rgba(0, 0, 0, 0.35)` vs `rgba(0, 0, 0, 0.35)` → 해결됨
- **--glass-bg-strong**: `rgba(0, 0, 0, 0.45)` vs `rgba(0, 0, 0, 0.45)` → 해결됨
- **--glass-border**: `rgba(255, 255, 255, 0.2)` vs `rgba(255, 255, 255, 0.1)` → 해결됨
- **--glass-border-strong**: `rgba(255, 255, 255, 0.2)` vs `rgba(255, 255, 255, 0.2)` → 해결됨
- **--color-primary**: `#007bff` vs `#0056cc` → 해결됨
- **--color-success**: `#10b981` vs `#007a00` → 해결됨
- **--color-danger**: `#ef4444` vs `#cc0000` → 해결됨
- **--color-warning**: `#f59e0b` vs `#cc6600` → 해결됨
- **--text-primary**: `var(--color-text-primary)` vs `#000000` → 해결됨
- **--text-secondary**: `var(--color-text-secondary)` vs `#333333` → 해결됨
- **--transition-fast**: `0.01s` vs `0.01s` → 해결됨
- **--transition-normal**: `0.01s` vs `0.01s` → 해결됨
- **--transition-slow**: `0.01s` vs `0.01s` → 해결됨
- **--transition-bounce**: `0.01s` vs `0.01s` → 해결됨
- **--color-primary**: `#007bff` vs `#000000` → 해결됨
- **--color-secondary**: `#666666` vs `#666666` → 해결됨
- **--bg-secondary**: `#f2f2f7` vs `#f5f5f5` → 해결됨
- **--shadow-xs**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` vs `none` → 해결됨
- **--shadow-sm**: `0 2px 4px rgba(0, 0, 0, 0.1)` vs `none` → 해결됨
- **--shadow-md**: `none` vs `none` → 해결됨
- **--shadow-lg**: `none` vs `none` → 해결됨
- **--shadow-xl**: `0 25px 50px rgba(0, 0, 0, 0.25)` vs `none` → 해결됨
- **--shadow-2xl**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)` vs `none` → 해결됨
- **--color-primary**: `#007bff` vs `#007bff` → 해결됨
- **--color-border-dark**: `#a8a8a8` vs `#a8a8a8` → 해결됨
- **--color-dark**: `#212529` vs `#212529` → 해결됨
- **--glass-border**: `rgba(255, 255, 255, 0.2)` vs `rgba(255, 255, 255, 0.2)` → 해결됨
- **--spacing-xs**: `0.5rem` vs `0.5rem` → 해결됨
- **--spacing-sm**: `1rem` vs `1rem` → 해결됨
- **--spacing-md**: `1.5rem` vs `1.5rem` → 해결됨
- **--spacing-lg**: `2rem` vs `2rem` → 해결됨
- **--spacing-xl**: `3rem` vs `3rem` → 해결됨
- **--font-size-xs**: `0.75rem` vs `0.75rem` → 해결됨
- **--font-size-sm**: `0.875rem` vs `0.875rem` → 해결됨
- **--font-size-base**: `1rem` vs `1rem` → 해결됨
- **--font-size-lg**: `1.125rem` vs `1.125rem` → 해결됨
- **--font-size-xl**: `1.25rem` vs `1.25rem` → 해결됨
- **--border-width**: `1px` vs `1px` → 해결됨
- **--border-radius-sm**: `0.25rem` vs `0.25rem` → 해결됨
- **--border-radius-md**: `0.375rem` vs `0.375rem` → 해결됨
- **--border-radius-lg**: `0.5rem` vs `0.5rem` → 해결됨
- **--border-radius-xl**: `0.75rem` vs `0.75rem` → 해결됨
- **--font-size-xs**: `0.75rem` vs `0.75rem` → 해결됨
- **--font-size-sm**: `0.875rem` vs `0.875rem` → 해결됨
- **--font-size-lg**: `1.125rem` vs `1.125rem` → 해결됨
- **--font-size-xl**: `1.25rem` vs `1.25rem` → 해결됨
- **--modal-max-width**: `1000px` vs `1000px` → 해결됨
- **--modal-border-radius**: `16px` vs `16px` → 해결됨
- **--status-warning**: `#ffc107` vs `#f59e0b` → 해결됨
- **--color-success**: `#10b981` vs `#28A745` → 해결됨
- **--color-warning**: `#f59e0b` vs `#FFC107` → 해결됨
- **--color-danger**: `#ef4444` vs `#dc3545` → 해결됨
- **--color-border-light**: `#e9ecef` vs `#e9ecef` → 해결됨
- **--color-text-primary**: `#000000` vs `#000000` → 해결됨
- **--text-primary**: `var(--color-text-primary)` vs `var(--color-text-primary)` → 해결됨
- **--text-secondary**: `var(--color-text-secondary)` vs `var(--color-text-secondary)` → 해결됨
- **--text-inverse**: `#FFFFFF` vs `#FFFFFF` → 해결됨
- **--z-index-modal**: `10001` vs `10001` → 해결됨
- **--shadow-sm**: `0 2px 4px rgba(0, 0, 0, 0.1)` vs `0 2px 4px rgba(0, 0, 0, 0.1)` → 해결됨
- **--shadow-xl**: `0 25px 50px rgba(0, 0, 0, 0.25)` vs `0 25px 50px rgba(0, 0, 0, 0.25)` → 해결됨
- **--color-success**: `#10b981` vs `#10b981` → 해결됨
- **--color-warning**: `#f59e0b` vs `#f59e0b` → 해결됨
- **--color-info**: `#3b82f6` vs `#3b82f6` → 해결됨
- **--color-danger**: `#ef4444` vs `#ef4444` → 해결됨
- **--color-text-secondary**: `#6b7280` vs `#6b7280` → 해결됨
- **--spacing-xs**: `0.5rem` vs `0.25rem` → 해결됨
- **--spacing-sm**: `1rem` vs `0.5rem` → 해결됨
- **--spacing-md**: `1.5rem` vs `1rem` → 해결됨
- **--spacing-lg**: `2rem` vs `1.5rem` → 해결됨
- **--spacing-xl**: `3rem` vs `2rem` → 해결됨
- **--font-family-base**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif` vs `'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif` → 해결됨
- **--font-family-mono**: `'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace` vs `'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace` → 해결됨
- **--font-size-xs**: `0.75rem` vs `0.75rem` → 해결됨
- **--font-size-sm**: `0.875rem` vs `0.875rem` → 해결됨
- **--font-size-base**: `1rem` vs `1rem` → 해결됨
- **--font-size-lg**: `1.125rem` vs `1.125rem` → 해결됨
- **--font-size-xl**: `1.25rem` vs `1.25rem` → 해결됨
- **--line-height-tight**: `1.2` vs `1.25` → 해결됨
- **--line-height-relaxed**: `1.8` vs `1.75` → 해결됨
- **--border-width-thick**: `4px` vs `3px` → 해결됨
- **--border-radius-sm**: `0.25rem` vs `0.25rem` → 해결됨
- **--border-radius-md**: `0.375rem` vs `0.5rem` → 해결됨
- **--border-radius-lg**: `0.5rem` vs `0.75rem` → 해결됨
- **--border-radius-xl**: `0.75rem` vs `1rem` → 해결됨
- **--transition-fast**: `0.01s` vs `0.15s ease` → 해결됨
- **--transition-slow**: `0.01s` vs `0.5s ease` → 해결됨
- **--transition-bounce**: `0.01s` vs `0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)` → 해결됨
- **--breakpoint-sm**: `640px` vs `640px` → 해결됨
- **--breakpoint-lg**: `1024px` vs `1024px` → 해결됨
- **--breakpoint-xl**: `1280px` vs `1280px` → 해결됨
- **--container-sm**: `540px` vs `640px` → 해결됨
- **--container-md**: `720px` vs `768px` → 해결됨
- **--container-lg**: `960px` vs `1024px` → 해결됨
- **--container-xl**: `1140px` vs `1280px` → 해결됨
- **--button-height-sm**: `32px` vs `2rem` → 해결됨
- **--button-height-lg**: `48px` vs `3rem` → 해결됨
- **--input-height-sm**: `32px` vs `2rem` → 해결됨
- **--input-height-lg**: `48px` vs `3rem` → 해결됨
- **--header-height**: `60px` vs `4rem` → 해결됨
- **--modal-max-width**: `1000px` vs `32rem` → 해결됨
- **--shadow-sm**: `0 2px 4px rgba(0, 0, 0, 0.1)` vs `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)` → 해결됨
- **--shadow-md**: `none` vs `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` → 해결됨
- **--shadow-lg**: `none` vs `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` → 해결됨
- **--shadow-xl**: `0 25px 50px rgba(0, 0, 0, 0.25)` vs `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` → 해결됨
- **--shadow-inner**: `inset 0 2px 4px rgba(0, 0, 0, 0.1)` vs `inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)` → 해결됨
- **--shadow-glass-strong**: `0 8px 32px 0 rgba(31, 38, 135, 0.5)` vs `0 8px 32px 0 rgba(31, 38, 135, 0.6)` → 해결됨
- **--animation-duration-fast**: `0.15s` vs `150ms` → 해결됨
- **--animation-duration-slow**: `0.5s` vs `500ms` → 해결됨
- **--status-completed**: `#6b7280` vs `#059669` → 해결됨
- **--mg-color**: `#FEE500` vs `#03C75A` → 해결됨
- **--mg-text_color**: `#000000` vs `#FFFFFF` → 해결됨
- **--mg-revenue**: `#27ae60` vs `#28a745` → 해결됨
- **--mg-expense**: `#e74c3c` vs `#dc3545` → 해결됨
- **--mg-primary**: `#667eea` vs `#2196F3` → 해결됨
- **--mg-secondary**: `#6c757d` vs `#1976D2` → 해결됨
- **--mg-success**: `#00b894` vs `#4CAF50` → 해결됨
- **--mg-warning**: `#f093fb` vs `#FF9800` → 해결됨
- **--mg-info**: `#74b9ff` vs `#2196F3` → 해결됨
- **--mg-primary**: `#667eea` vs `#ffffff` → 해결됨
- **--mg-secondary**: `#6c757d` vs `#f8f9fa` → 해결됨
- **--mg-light**: `300` vs `#ffffff` → 해결됨
- **--mg-primary**: `#667eea` vs `#333333` → 해결됨
- **--mg-secondary**: `#6c757d` vs `#666666` → 해결됨
- **--mg-light**: `300` vs `#ffffff` → 해결됨
- **--mg-dark**: `#343a40` vs `#000000` → 해결됨
- **--mg-light**: `300` vs `#f0f0f0` → 해결됨
- **--mg-dark**: `#343a40` vs `#cccccc` → 해결됨
- **--mg-pending**: `#ffc107` vs `#FF9800` → 해결됨
- **--mg-completed**: `#28a745` vs `#4CAF50` → 해결됨
- **--mg-primary**: `#667eea` vs `#6c5ce7` → 해결됨
- **--mg-primary_dark**: `#764ba2` vs `#5a4fcf` → 해결됨
- **--mg-black**: `#2c3e50` vs `#000000` → 해결됨
- **--mg-text_primary**: `#2c3e50` vs `#333333` → 해결됨
- **--mg-text_secondary**: `#6c757d` vs `#666666` → 해결됨
- **--mg-text_muted**: `#6c757d` vs `#999999` → 해결됨
- **--mg-success**: `#00b894` vs `#28a745` → 해결됨
- **--mg-warning**: `#f093fb` vs `#ffc107` → 해결됨
- **--mg-error**: `#F44336` vs `#dc3545` → 해결됨
- **--mg-info**: `#74b9ff` vs `#17a2b8` → 해결됨

---

## 🎯 CI/BI 적용 준비

### 색상 변경 시 수정할 파일
1. **`frontend/src/styles/unified-design-tokens.css`** - 메인 색상 정의
2. 끝! (다른 파일은 수정 불필요)

### CI/BI 색상 적용 예시
```css
:root {
  /* 새로운 브랜드 색상으로 변경 */
  --mg-primary-500: #NEW_BRAND_COLOR;
  --mg-secondary-500: #NEW_SECONDARY_COLOR;
  /* 전체 시스템에 자동 적용됨 */
}
```

---

## 📝 다음 단계

1. **통합 시스템 테스트**: `npm run build && npm run test`
2. **시각적 검증**: 모든 페이지가 기존과 동일하게 표시되는지 확인
3. **기존 파일 정리**: 사용되지 않는 CSS 변수 파일들 제거
4. **CI/BI 준비 완료**: 새로운 브랜드 색상 적용 준비

**💡 이제 CI/BI 변경 시 1개 파일만 수정하면 전체 시스템에 적용됩니다!**
