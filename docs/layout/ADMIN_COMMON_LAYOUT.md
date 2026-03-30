# AdminCommonLayout 컴포넌트

> GNB/LNB 통합 공통 레이아웃  
> @author MindGarden | @since 2025-02-22

## 위치

```
frontend/src/components/layout/AdminCommonLayout.js
```

## 역할

- `DesktopLayout` / `MobileLayout` 반응형 분기
- 검색, 알림, 로그아웃 등 공통 기능
- 권한별 `menuItems` 전달을 통한 LNB 메뉴 제어
- 로딩 상태 처리 (`UnifiedLoading`)

## Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `children` | ReactNode | - | 페이지 본문 콘텐츠 |
| `title` | string | - | 헤더 제목 (headerTitle) |
| `menuItems` | array | DEFAULT_MENU_ITEMS | LNB 메뉴 아이템 배열 |
| `searchValue` | string | - | 검색 입력값 |
| `onSearchChange` | function | - | 검색 변경 핸들러 |
| `onBellClick` | function | `() => navigate(ADMIN_ROUTES.MESSAGES)` | 알림 클릭 핸들러 |
| `onLogout` | function | `useSession().logout` | 로그아웃 핸들러 |
| `className` | string | `''` | 추가 CSS 클래스 |
| `loading` | boolean | `false` | 로딩 여부 |
| `loadingText` | string | `"데이터를 불러오는 중..."` | 로딩 시 표시 텍스트 |

## 사용 예시

```jsx
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';

// Admin 페이지
<AdminCommonLayout title="매칭 관리" menuItems={DEFAULT_MENU_ITEMS}>
  <MappingManagementPage />
</AdminCommonLayout>

// Client 페이지
<AdminCommonLayout title="회기 관리" menuItems={CLIENT_MENU_ITEMS}>
  <ClientSessionManagement />
</AdminCommonLayout>

// 로딩 상태
<AdminCommonLayout title="스케줄" loading={loading} loadingText="스케줄을 불러오는 중...">
  <UnifiedScheduleComponent />
</AdminCommonLayout>
```

## 내부 구조

```
AdminCommonLayout
├── mg-v2-ad-b0kla, mg-v2-ad-dashboard-v2 (wrapper)
├── useResponsive() → isDesktop (768px 기준)
├── loading ? UnifiedLoading : children
└── isDesktop ? DesktopLayout : MobileLayout
    ├── DesktopGnb (상단 GNB)
    ├── DesktopLnb (좌측 LNB, menuItems 사용)
    └── main (children)
```

## 스타일

- B0KlA 아토믹 디자인 토큰 적용 (`mg-v2-ad-b0kla`)
- `frontend/src/styles/dashboard-common-v3.css`, `admin-theme.css` 연동
