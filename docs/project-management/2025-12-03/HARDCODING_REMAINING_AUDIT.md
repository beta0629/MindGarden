# 남은 하드코딩 점검 보고서

## 📋 목적
프로젝트 전체에서 추가로 발견된 하드코딩 항목 점검 및 수정 계획

## 🔍 발견된 추가 하드코딩 항목

### 1. `frontend/src/components/admin/WidgetBasedAdminDashboard.css`

#### Fallback 값 하드코딩 (50+ 개)
- `#007bff` - primary color fallback
- `#fff` - white fallback  
- `#333` - text-primary fallback
- `#666` - text-secondary fallback
- `#e0e0e0`, `#ddd` - border color fallback
- `#f8f9fa` - bg-secondary fallback
- `#dc3545` - error color fallback
- `#c82333` - error hover fallback
- `rgba(0, 123, 255, 0.1)` - box-shadow
- `rgba(0, 0, 0, 0.05)` - box-shadow
- `2px`, `1px` - border width
- `24px`, `32px`, `400px`, `600px` - 크기 값

### 2. `frontend/src/components/layout/SimpleHeader.css`

#### 하드코딩 항목 (30+ 개)
- `#333`, `#666`, `#999` - text color
- `rgba(108, 92, 231, 0.1)`, `rgba(108, 92, 231, 0.2)` - primary colors
- `rgba(0, 0, 0, 0.05)` - bg-hover
- `#dc3545`, `#c82333` - danger colors
- `#dee2e6`, `#e9ecef` - border/neutral colors
- `60px`, `56px`, `1200px` - 크기 값
- `15px`, `12px`, `8px`, `6px`, `4px`, `2px` - 간격/크기
- `0.2s`, `0.3s` - transition
- `white` - 색상
- `rgba(220, 53, 69, 0.3)`, `rgba(220, 53, 69, 0.5)` - box-shadow
- `80px` - min-width
- `36px` - height
- `translateX(-2px)`, `translateX(-1px)` - transform
- `translateY(-1px)`, `translateY(-10px)` - transform

### 3. `frontend/src/components/ui/AdminMenuSidebarUI.css`

#### 하드코딩 항목
- `rgba(255, 255, 255, 0.1)` - border
- `rgba(255, 255, 255, 0.7)` - text color
- `rgba(255, 255, 255, 0.05)` - background
- `20px` - icon size
- `translateY(-10px)` - transform

### 4. `frontend/src/components/ui/MenuPermissionManagementUI.css`

#### Fallback 값 하드코딩
- `#fef2f2` - error-50 fallback
- `#991b1b` - error-700 fallback
- `300px` - grid column width
- `600px` - min-height
- `1px`, `2px`, `4px` - border width
- `20px` - checkbox size
- `300px` - max-height (모바일)

### 5. `frontend/src/components/ui/TenantCommonCodeManagerUI.css`

#### Fallback 값 하드코딩
- `#fef2f2` - error-50 fallback
- `#991b1b` - error-700 fallback
- `#ffffff` - white fallback
- `300px` - grid column width
- `600px` - min-height

### 6. `frontend/src/components/dashboard/widgets/WelcomeWidget.css`

#### Fallback 값 하드코딩
- `#007bff` - primary color fallback
- `#fff` - white fallback

### 7. `frontend/src/components/client/ClientDashboard.css`

#### Fallback RGB 값 (의도된 fallback)
- `rgba(var(--mg-primary-500-rgb, var(--color-primary-rgb)), ...)` - 패턴 배경용

## 📊 우선순위

### 🔥 높음 (즉시 수정 필요)
1. `SimpleHeader.css` - 레이아웃 컴포넌트 (많은 하드코딩)
2. `WidgetBasedAdminDashboard.css` - 위젯 기반 대시보드 (많은 fallback 값)

### ⚠️ 중간 (단계적 수정)
3. `AdminMenuSidebarUI.css` - UI 컴포넌트
4. `MenuPermissionManagementUI.css` - 관리 UI (일부 fallback)
5. `TenantCommonCodeManagerUI.css` - 관리 UI (일부 fallback)

### 📝 낮음 (Fallback 값 - 허용 가능)
6. `WelcomeWidget.css` - 일부 fallback 값만
7. `ClientDashboard.css` - 패턴 배경용 fallback (복잡한 gradient)

## ✅ 수정 계획

### Phase 1: SimpleHeader.css
- [ ] 모든 색상 하드코딩 제거 (#333, #666, rgba 등)
- [ ] 모든 크기 하드코딩 제거 (px 값들)
- [ ] 모든 transition 하드코딩 제거
- [ ] 모든 transform 하드코딩 제거
- [ ] 모든 box-shadow 하드코딩 제거

### Phase 2: WidgetBasedAdminDashboard.css
- [ ] 모든 fallback 색상 값 제거 (#007bff, #fff 등)
- [ ] 모든 크기 하드코딩 제거
- [ ] 모든 border 하드코딩 제거

### Phase 3: UI 컴포넌트들
- [ ] AdminMenuSidebarUI.css - rgba 값들 제거
- [ ] MenuPermissionManagementUI.css - fallback 값들 정리
- [ ] TenantCommonCodeManagerUI.css - fallback 값들 정리

## 📝 참조
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `frontend/src/styles/unified-design-tokens.css`
- `docs/project-management/2025-12-03/HARDCODING_FIX_FINAL_REPORT.md`

