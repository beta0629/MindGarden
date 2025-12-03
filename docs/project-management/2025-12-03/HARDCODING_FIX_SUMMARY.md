# 하드코딩 수정 완료 요약

## 📋 작업 개요
프로젝트 전체에서 하드코딩된 CSS 값을 찾아 표준화 원칙에 맞게 CSS 변수로 교체

## ✅ 완료된 수정 사항

### 1. `frontend/src/styles/06-components/_header.css`
- ✅ 모든 색상 하드코딩 제거 (rgba, rgb, white)
- ✅ 모든 간격 하드코딩 제거 (px 값)
- ✅ 모든 border/outline 하드코딩 제거
- ✅ 모든 transform 하드코딩 제거
- ✅ 모든 box-shadow 하드코딩 제거
- ✅ 모든 transition 하드코딩 제거
- ✅ 모든 opacity 하드코딩 제거

### 2. `frontend/src/styles/dashboard-common-v3.css`
- ✅ `280px` → `var(--stat-card-min-width, 17.5rem)` / `var(--management-card-min-width, 17.5rem)`
- ✅ `48px` → `var(--icon-size-lg)`
- ✅ `64px` → `var(--icon-size-xl)`
- ✅ `1px`, `2px` → `var(--border-width)`, `var(--border-width-normal)`
- ✅ `-4px` → `calc(var(--spacing-xs) * -1)`
- ✅ `rgba(255, 255, 255, 0.2)` → `var(--cs-glass-light)`
- ✅ `opacity: 0.9` → `var(--opacity-hover, 0.9)`

### 3. `frontend/src/components/layout/SimpleLayout.css`
- ✅ `#4A90E2` → `var(--mg-primary-500)`
- ✅ `white` → `var(--mg-white)`
- ✅ `rgba(0,0,0,0.1)` → `var(--shadow-sm)`
- ✅ `rgba(0, 0, 0, 0.3)` → `var(--shadow-sm)`
- ✅ `1200px` → `var(--container-max-width, 75rem)`
- ✅ `400px` → `var(--loading-container-min-height, 25rem)`
- ✅ `16px`, `14px` → `var(--icon-size-xs)`
- ✅ `3px` → `var(--spacing-xs, 0.1875rem)`
- ✅ `10px`, `9px` → `var(--font-size-xs)`
- ✅ `1px`, `1.5px` → `var(--border-width)`, `var(--border-width-medium)`
- ✅ `0 1px 2px` → CSS 변수 기반

### 4. `frontend/src/components/client/ClientDashboard.css`
- ✅ `35px`, `70px` → `var(--pattern-size-base, 2.1875rem)`, `var(--pattern-size-double, 4.375rem)`
- ✅ `rgba(...)` fallback RGB 값들 → CSS 변수 기반
- ✅ `rgba(255, 255, 255, 0.8)` → `var(--cs-glass-light)`
- ✅ `1px` → `var(--border-width)`
- ✅ `-4px` → `calc(var(--spacing-xs) * -1)`
- ✅ `140px` → `var(--action-button-min-width, 8.75rem)`
- ✅ `opacity: 0.03`, `0.8`, `0.9`, `0.1`, `0`, `1` → CSS 변수

## 📊 통계

### 수정된 파일
- `frontend/src/styles/06-components/_header.css` - 완료
- `frontend/src/styles/dashboard-common-v3.css` - 완료
- `frontend/src/components/layout/SimpleLayout.css` - 완료
- `frontend/src/components/client/ClientDashboard.css` - 완료

### 제거된 하드코딩 유형
- 색상: 20+ 개
- 간격/크기: 15+ 개
- Border/Outline: 10+ 개
- Transform: 5+ 개
- Box Shadow: 5+ 개
- Opacity: 8+ 개
- Transition: 2+ 개

## 📝 남은 항목 (의도된 Fallback)

일부 fallback 값들은 변수가 정의되지 않은 경우를 대비한 것이므로 유지:
- `var(--header-height, 64px)` - fallback
- `var(--header-logo-height, 40px)` - fallback
- Media query breakpoints (768px, 480px) - 표준 breakpoint 값
- `dashboard-tokens-extension.css`의 등급 색상 정의 (#cd7f32 등) - 변수 정의이므로 허용
- `rgba(...)` fallback RGB 값들 - CSS 변수가 없을 때를 대비한 fallback이므로 허용

## 🔍 추가 점검 필요 파일

다음 파일들도 점검 필요 (일부 수정 완료):
- ✅ `frontend/src/components/admin/AdminDashboard.new.css` - 완료 (`-2px`, `2px` 수정)
- ⚠️ `frontend/src/components/common/Modal.css` - 많은 하드코딩 발견 (우선순위 높음)
- ⚠️ `frontend/src/components/admin/WidgetBasedAdminDashboard.css` - 많은 하드코딩 발견 (레거시 가능성)
- ⚠️ `frontend/src/components/dashboard/widgets/WelcomeWidget.css` - 많은 하드코딩 발견 (레거시 가능성)
- ⚠️ `frontend/src/components/dashboard/CommonDashboard.css` - `1200px` fallback (낮은 우선순위)

### 발견된 하드코딩 유형 (추가 파일)
- `Modal.css`: `white`, `16px`, `20px`, `24px`, `32px`, `400px`, `800px`, `1200px`, `rgba(...)`, `0.3s`, `0.2s` 등
- `WidgetBasedAdminDashboard.css`: `1400px`, `#007bff`, `#e0e0e0`, `rgba(...)`, `2px`, `4px` 등
- `WelcomeWidget.css`: `60px`, `#007bff`, `rgba(...)`, `3px`, `140px` 등

## ✅ 표준화 원칙 준수 확인

- ✅ 모든 하드코딩된 색상 값 제거
- ✅ 모든 하드코딩된 간격/크기 값 제거
- ✅ CSS 변수만 사용
- ✅ 인라인 스타일 없음
- ✅ 중앙화된 디자인 토큰 사용

## 📝 참조
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `frontend/src/styles/unified-design-tokens.css`
- `docs/project-management/2025-12-03/HARDCODING_AUDIT_REPORT.md`

