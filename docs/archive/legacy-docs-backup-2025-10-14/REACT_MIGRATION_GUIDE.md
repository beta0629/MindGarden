# React 마이그레이션 가이드

## 📋 개요

이 문서는 MindGarden 프로젝트를 Thymeleaf에서 React로 마이그레이션하는 과정을 설명합니다.

## 🔄 마이그레이션 배경

### 기존 Thymeleaf 시스템의 문제점
- **복잡한 템플릿 구조**: 중첩된 fragment와 replace로 인한 복잡성
- **유지보수 어려움**: 페이지별로 독립적인 템플릿 관리
- **재사용성 부족**: 공통 컴포넌트의 제한적인 재사용
- **개발 생산성**: 템플릿 수정 시 전체 페이지 재작성 필요

### React 마이그레이션의 장점
- **컴포넌트 재사용성**: 한 번 만든 컴포넌트를 모든 곳에서 사용
- **상태 관리**: 전역 상태 관리로 데이터 흐름 단순화
- **개발자 경험**: Hot reload, 개발자 도구 등 현대적인 개발 환경
- **유지보수성**: 모듈화된 구조로 코드 관리 용이

## 🏗️ 새로운 아키텍처

### Frontend (React)
```
frontend/
├── src/
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── layout/            # 레이아웃 관련 컴포넌트
│   │   ├── dashboard/         # 대시보드 관련 컴포넌트
│   │   ├── auth/              # 인증 관련 컴포넌트
│   │   └── profile/           # 프로필 관련 컴포넌트
│   ├── pages/                 # 페이지 컴포넌트
│   ├── services/              # API 서비스
│   ├── hooks/                 # 커스텀 훅
│   ├── utils/                 # 유틸리티 함수
│   └── styles/                # CSS 스타일
└── public/                    # 정적 파일
```

### Backend (Spring Boot)
- **기존 API 유지**: OAuth2, 회원가입, 사용자 관리 등
- **새로운 역할**: 백엔드 API 서버로 전환
- **데이터 제공**: JSON 형태로 데이터 제공

## 📦 컴포넌트 시스템

### 1. 레이아웃 컴포넌트

#### TabletLayout
```jsx
const TabletLayout = ({ children, user, onLogout }) => {
  // 전체 레이아웃 관리
  // 헤더, 햄버거 메뉴, 하단 네비게이션 포함
};
```

#### TabletHeader
```jsx
const TabletHeader = ({ user, onHamburgerToggle, onProfileClick }) => {
  // 로고, 사용자 정보, 햄버거 메뉴 토글
  // 사용자 역할에 따른 조건부 렌더링
};
```

#### TabletHamburgerMenu
```jsx
const TabletHamburgerMenu = ({ isOpen, onClose, onLogout, userRole }) => {
  // 역할별 메뉴 항목 동적 생성
  // CLIENT, CONSULTANT, ADMIN 역할별 메뉴
};
```

#### TabletBottomNavigation
```jsx
const TabletBottomNavigation = ({ userRole }) => {
  // 역할별 하단 네비게이션
  // 현재 경로에 따른 active 상태 관리
};
```

### 2. 대시보드 컴포넌트

#### CommonDashboard
```jsx
const CommonDashboard = ({ user }) => {
  // 모든 역할에서 공통 사용
  // 사용자 역할에 따른 조건부 렌더링
  // 환영 메시지, 요약 패널, 상담 일정 등
};
```

## 🔌 API 연동

### 기존 Spring Boot API 활용
```jsx
// 로그인 API
const login = async (credentials) => {
  const response = await axios.post('/api/auth/login', credentials);
  return response.data;
};

// 소셜 로그인
const handleKakaoLogin = () => {
  const kakaoAuthUrl = 'https://kauth.kakao.com/oauth/authorize?' +
    'client_id=YOUR_KAKAO_CLIENT_ID' +
    '&redirect_uri=http://localhost:8080/api/auth/kakao/callback' +
    '&response_type=code';
  
  window.location.href = kakaoAuthUrl;
};
```

### OAuth2 콜백 처리
1. **Spring Boot에서 처리**: 기존 OAuth2 콜백 로직 유지
2. **React로 리다이렉트**: 성공 후 React 대시보드로 이동
3. **세션 유지**: Spring Security 세션 기반 인증

## 🎨 스타일링

### CSS 구조
```css
/* 공통 스타일 */
.tablet-layout { /* 전체 레이아웃 */ }
.tablet-header { /* 헤더 스타일 */ }
.tablet-hamburger-menu { /* 햄버거 메뉴 */ }
.tablet-bottom-nav { /* 하단 네비게이션 */ }

/* 대시보드 스타일 */
.tablet-dashboard-page { /* 대시보드 페이지 */ }
.welcome-section { /* 환영 섹션 */ }
.summary-panels { /* 요약 패널 */ }
.consultation-module { /* 상담 모듈 */ }
```

### 파스텔 톤 디자인 유지
- **기존 색상 팔레트**: 부드러운 파스텔 톤 유지
- **일관된 디자인**: 모든 컴포넌트에서 동일한 디자인 언어
- **반응형 디자인**: 태블릿 최적화 (768px - 1024px)

## 🚀 개발 워크플로우

### 1. 컴포넌트 생성
```bash
# 새 컴포넌트 생성
touch src/components/new/NewComponent.js
```

### 2. 컴포넌트 개발
```jsx
import React from 'react';

const NewComponent = ({ prop1, prop2 }) => {
  return (
    <div className="new-component">
      <h1>{prop1}</h1>
      <p>{prop2}</p>
    </div>
  );
};

export default NewComponent;
```

### 3. 스타일링
```css
/* src/styles/components/NewComponent.css */
.new-component {
  /* 컴포넌트별 스타일 */
}
```

### 4. 테스트 및 통합
```bash
# 개발 서버 실행
npm start

# 빌드
npm run build
```

## 📱 사용자 역할별 UI

### 내담자 (CLIENT)
- **대시보드**: 상담 일정, 담당 상담사 정보
- **프로필**: 개인정보 관리, 프로필 이미지 업로드
- **상담**: 상담 내역, 예약 관리

### 상담사 (CONSULTANT)
- **대시보드**: 상담 통계, 일정 관리
- **내담자**: 내담자 목록, 상담 기록
- **일정**: 상담 일정 관리, 예약 확인

### 관리자 (ADMIN)
- **대시보드**: 시스템 현황, 사용자 통계
- **사용자**: 전체 사용자 관리, 권한 설정
- **시스템**: 시스템 설정, 모니터링

## 🔧 개발 환경 설정

### 필수 패키지
```bash
npm install react react-dom react-router-dom
npm install axios bootstrap bootstrap-icons
npm install @testing-library/react @testing-library/jest-dom
```

### 개발 서버
```bash
# React 개발 서버
cd frontend
npm start

# Spring Boot 백엔드
mvn spring-boot:run -Dspring.profiles.active=local
```

## 📝 마이그레이션 체크리스트

### ✅ 완료된 작업
- [x] React 프로젝트 생성
- [x] 공통 컴포넌트 시스템 구축
- [x] 기존 Thymeleaf 템플릿 백업
- [x] 공통 대시보드 컴포넌트

### 🚧 진행 중인 작업
- [ ] 로그인/회원가입 페이지
- [ ] Spring Boot API 연동
- [ ] 라우팅 시스템 구축
- [ ] CSS 스타일링 적용

### 📋 예정된 작업
- [ ] 프로필 편집 페이지
- [ ] 상담 관리 기능
- [ ] 일정 관리 기능
- [ ] 사용자 관리 기능
- [ ] 테스트 코드 작성
- [ ] 배포 환경 구성

## 🐛 문제 해결

### 일반적인 문제들
1. **컴포넌트 import 오류**: 경로 확인 및 상대 경로 수정
2. **API 연동 실패**: CORS 설정 및 엔드포인트 확인
3. **스타일 적용 안됨**: CSS 파일 import 및 클래스명 확인
4. **라우팅 오류**: React Router 설정 및 경로 확인

### 디버깅 팁
- **React Developer Tools**: 컴포넌트 상태 및 props 확인
- **Network 탭**: API 요청/응답 확인
- **Console 로그**: JavaScript 오류 및 로그 확인

## 📚 참고 자료

- [React 공식 문서](https://react.dev/)
- [React Router 문서](https://reactrouter.com/)
- [Axios 문서](https://axios-http.com/)
- [Bootstrap 문서](https://getbootstrap.com/)

## 🤝 기여 방법

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성 (`feature/기능명`)
3. 코드 작성 및 테스트
4. Pull Request 생성
5. 코드 리뷰 및 머지

---

**📅 마지막 업데이트**: 2024-12-19  
**👤 작성자**: MindGarden Team  
**📧 문의**: 이슈를 통해 연락해주세요
