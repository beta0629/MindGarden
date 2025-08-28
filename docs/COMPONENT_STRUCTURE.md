# React 컴포넌트 구조 가이드

## 📋 개요

이 문서는 MindGarden React 애플리케이션의 컴포넌트 구조와 사용법을 설명합니다.

## 🏗️ 컴포넌트 아키텍처

### 전체 구조
```
src/
├── components/                 # 재사용 가능한 컴포넌트
│   ├── layout/               # 레이아웃 관련 컴포넌트
│   ├── dashboard/            # 대시보드 관련 컴포넌트
│   ├── auth/                 # 인증 관련 컴포넌트
│   └── profile/              # 프로필 관련 컴포넌트
├── pages/                    # 페이지 컴포넌트
├── services/                 # API 서비스
├── hooks/                    # 커스텀 훅
├── utils/                    # 유틸리티 함수
└── styles/                   # CSS 스타일
```

## 📦 레이아웃 컴포넌트

### 1. TabletLayout

**파일**: `src/components/layout/TabletLayout.js`

**역할**: 전체 태블릿 레이아웃을 관리하는 최상위 컴포넌트

**Props**:
- `children`: 레이아웃 내부에 렌더링할 컨텐츠
- `user`: 현재 로그인한 사용자 정보
- `onLogout`: 로그아웃 처리 함수

**사용법**:
```jsx
import TabletLayout from '../components/layout/TabletLayout';

const ClientDashboard = () => {
  const user = { id: 1, name: '홍길동', role: 'CLIENT' };
  
  const handleLogout = () => {
    // 로그아웃 로직
  };

  return (
    <TabletLayout user={user} onLogout={handleLogout}>
      <CommonDashboard user={user} />
    </TabletLayout>
  );
};
```

**주요 기능**:
- 헤더, 햄버거 메뉴, 하단 네비게이션 관리
- 햄버거 메뉴 열기/닫기 상태 관리
- 로그아웃 처리 및 페이지 이동

### 2. TabletHeader

**파일**: `src/components/layout/TabletHeader.js`

**역할**: 태블릿 헤더를 렌더링하는 컴포넌트

**Props**:
- `user`: 사용자 정보 (로그인 상태에 따라 표시)
- `onHamburgerToggle`: 햄버거 메뉴 토글 함수
- `onProfileClick`: 프로필 페이지 이동 함수

**사용법**:
```jsx
<TabletHeader 
  user={user} 
  onHamburgerToggle={toggleHamburger}
  onProfileClick={() => navigate('/profile')}
/>
```

**주요 기능**:
- 로고 및 브랜딩
- 사용자 프로필 정보 표시
- 햄버거 메뉴 토글 버튼
- 로그인 상태에 따른 조건부 렌더링

### 3. TabletHamburgerMenu

**파일**: `src/components/layout/TabletHamburgerMenu.js`

**역할**: 햄버거 메뉴를 렌더링하는 컴포넌트

**Props**:
- `isOpen`: 메뉴 열림/닫힘 상태
- `onClose`: 메뉴 닫기 함수
- `onLogout`: 로그아웃 처리 함수
- `userRole`: 사용자 역할 (CLIENT, CONSULTANT, ADMIN)

**사용법**:
```jsx
<TabletHamburgerMenu 
  isOpen={isHamburgerOpen}
  onClose={() => setIsHamburgerOpen(false)}
  onLogout={handleLogout}
  userRole={user.role}
/>
```

**주요 기능**:
- 사용자 역할별 메뉴 항목 동적 생성
- 메뉴 클릭 시 해당 페이지로 이동
- 로그아웃 기능
- 오버레이 클릭 시 메뉴 닫기

### 4. TabletBottomNavigation

**파일**: `src/components/layout/TabletBottomNavigation.js`

**역할**: 하단 네비게이션을 렌더링하는 컴포넌트

**Props**:
- `currentPath`: 현재 페이지 경로
- `userRole`: 사용자 역할

**사용법**:
```jsx
<TabletBottomNavigation 
  currentPath={window.location.pathname}
  userRole={user.role}
/>
```

**주요 기능**:
- 사용자 역할별 네비게이션 항목 표시
- 현재 경로에 따른 active 상태 관리
- 클릭 시 해당 페이지로 이동

## 📊 대시보드 컴포넌트

### 1. CommonDashboard

**파일**: `src/components/dashboard/CommonDashboard.js`

**역할**: 모든 사용자 역할에서 공통으로 사용하는 대시보드 컴포넌트

**Props**:
- `user`: 사용자 정보 (역할에 따른 조건부 렌더링)

**사용법**:
```jsx
<CommonDashboard user={user} />
```

**주요 기능**:
- 사용자 역할별 제목 및 부제목 동적 생성
- 환영 메시지 및 현재 시간 표시
- 역할별 요약 패널 조건부 렌더링
- 상담 일정 모듈
- 빠른 액션 버튼
- 최근 활동 목록

**역할별 표시 내용**:

#### 내담자 (CLIENT)
- 상담 일정 요약
- 담당 상담사 정보
- 상담 관련 빠른 액션

#### 상담사 (CONSULTANT)
- 상담 일정 요약
- 상담 통계 (활성 내담자, 이번 주 상담)
- 상담 관리 빠른 액션

#### 관리자 (ADMIN)
- 상담 일정 요약
- 시스템 현황 (전체 사용자, 활성 상담사)
- 시스템 관리 빠른 액션

## 🔌 컴포넌트 사용 패턴

### 1. 기본 사용법
```jsx
import React from 'react';
import TabletLayout from '../components/layout/TabletLayout';
import CommonDashboard from '../components/dashboard/CommonDashboard';

const ClientDashboardPage = () => {
  const user = { id: 1, name: '홍길동', role: 'CLIENT' };
  
  const handleLogout = () => {
    // 로그아웃 로직
  };

  return (
    <TabletLayout user={user} onLogout={handleLogout}>
      <CommonDashboard user={user} />
    </TabletLayout>
  );
};

export default ClientDashboardPage;
```

### 2. 조건부 렌더링
```jsx
const DashboardContent = ({ user }) => {
  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  switch (user.role) {
    case 'CLIENT':
      return <ClientSpecificContent />;
    case 'CONSULTANT':
      return <ConsultantSpecificContent />;
    case 'ADMIN':
      return <AdminSpecificContent />;
    default:
      return <div>알 수 없는 역할입니다.</div>;
  }
};
```

### 3. 이벤트 핸들링
```jsx
const handleProfileClick = () => {
  navigate(`/${user.role.toLowerCase()}/profile`);
};

const handleLogout = async () => {
  try {
    await authService.logout();
    navigate('/login');
  } catch (error) {
    console.error('로그아웃 실패:', error);
  }
};
```

## 🎨 스타일링 가이드

### 1. CSS 클래스 명명 규칙
```css
/* 레이아웃 관련 */
.tablet-layout { }
.tablet-header { }
.tablet-hamburger-menu { }
.tablet-bottom-nav { }

/* 대시보드 관련 */
.tablet-dashboard-page { }
.dashboard-header { }
.welcome-section { }
.summary-panels { }
.consultation-module { }
```

### 2. 반응형 디자인
```css
/* 태블릿 최적화 */
@media (min-width: 768px) and (max-width: 1024px) {
  .tablet-layout {
    min-width: 768px;
    max-width: 1024px;
    margin: 0 auto;
  }
}
```

### 3. 파스텔 톤 색상
```css
:root {
  --primary-100: #f0f9ff;
  --primary-200: #e0f2fe;
  --primary-300: #bae6fd;
  --secondary-100: #fdf2f8;
  --secondary-200: #fce7f3;
  --secondary-300: #fbcfe8;
}
```

## 🧪 테스트 가이드

### 1. 컴포넌트 테스트
```jsx
import { render, screen } from '@testing-library/react';
import TabletHeader from '../TabletHeader';

test('사용자 정보가 올바르게 표시된다', () => {
  const user = { name: '홍길동', role: 'CLIENT' };
  
  render(<TabletHeader user={user} />);
  
  expect(screen.getByText('홍길동')).toBeInTheDocument();
  expect(screen.getByText('CLIENT')).toBeInTheDocument();
});
```

### 2. Props 테스트
```jsx
test('사용자가 없을 때 로그인 링크가 표시된다', () => {
  render(<TabletHeader user={null} />);
  
  expect(screen.getByText('로그인')).toBeInTheDocument();
});
```

## 📝 컴포넌트 확장 가이드

### 1. 새로운 컴포넌트 생성
```jsx
// src/components/new/NewComponent.js
import React from 'react';

const NewComponent = ({ prop1, prop2, children }) => {
  return (
    <div className="new-component">
      <h1>{prop1}</h1>
      <p>{prop2}</p>
      {children}
    </div>
  );
};

export default NewComponent;
```

### 2. 기존 컴포넌트 확장
```jsx
// TabletHeader에 새로운 기능 추가
const TabletHeader = ({ user, onHamburgerToggle, onProfileClick, showNotifications }) => {
  return (
    <header className="tablet-header">
      {/* 기존 헤더 내용 */}
      
      {/* 새로운 알림 기능 */}
      {showNotifications && (
        <div className="notification-bell">
          <i className="bi bi-bell"></i>
        </div>
      )}
    </header>
  );
};
```

## 🔍 디버깅 팁

### 1. 컴포넌트 상태 확인
```jsx
// React Developer Tools 사용
console.log('User:', user);
console.log('Props:', props);
```

### 2. 조건부 렌더링 디버깅
```jsx
const DashboardContent = ({ user }) => {
  console.log('User role:', user?.role);
  console.log('User name:', user?.name);
  
  // 조건부 렌더링 로직
};
```

### 3. 이벤트 핸들러 디버깅
```jsx
const handleClick = (event) => {
  console.log('Click event:', event);
  console.log('Target:', event.target);
  
  // 실제 처리 로직
};
```

## 📚 참고 자료

- [React 컴포넌트 문서](https://react.dev/learn/your-first-component)
- [React Props 문서](https://react.dev/learn/passing-props-to-a-component)
- [React 조건부 렌더링](https://react.dev/learn/conditional-rendering)
- [React 이벤트 처리](https://react.dev/learn/responding-to-events)

---

**📅 마지막 업데이트**: 2024-12-19  
**👤 작성자**: MindGarden Team  
**📧 문의**: 이슈를 통해 연락해주세요
