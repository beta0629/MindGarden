# MindGarden 프로젝트 구조

**작성일**: 2025년 10월 14일

---

## 📁 전체 프로젝트 구조

```
mindGarden/
├── backend/                    # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/mindgarden/
│   │   │   │       ├── consultation/      # 메인 패키지
│   │   │   │       │   ├── config/        # 설정 파일
│   │   │   │       │   ├── controller/    # REST 컨트롤러
│   │   │   │       │   ├── service/       # 비즈니스 로직
│   │   │   │       │   ├── repository/    # 데이터 접근
│   │   │   │       │   ├── entity/        # JPA 엔티티
│   │   │   │       │   ├── dto/           # 데이터 전송 객체
│   │   │   │       │   └── util/          # 유틸리티
│   │   │   └── resources/
│   │   │       ├── application.yml        # 앱 설정
│   │   │       └── application-prod.yml   # 운영 설정
│   │   └── test/                          # 테스트 코드
│   ├── pom.xml                            # Maven 의존성
│   └── target/                            # 빌드 결과물
│
├── frontend/                   # React 프론트엔드
│   ├── public/                # 정적 파일
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── admin/         # 관리자 컴포넌트
│   │   │   ├── consultant/    # 상담사 컴포넌트
│   │   │   ├── client/        # 내담자 컴포넌트
│   │   │   ├── common/        # 공통 컴포넌트
│   │   │   ├── mindgarden/    # 디자인 시스템 쇼케이스
│   │   │   ├── auth/          # 인증 컴포넌트
│   │   │   └── layout/        # 레이아웃 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── styles/            # CSS 파일
│   │   │   ├── mindgarden-design-system.css  # 메인 디자인 시스템
│   │   │   ├── design-system/ # 디자인 시스템 CSS
│   │   │   └── 00-core/       # 코어 CSS
│   │   ├── contexts/          # React Context
│   │   ├── hooks/             # Custom Hooks
│   │   ├── utils/             # 유틸리티 함수
│   │   ├── themes/            # 테마 설정
│   │   ├── App.js             # 메인 앱 (인증 필요)
│   │   ├── AppPublic.js       # 공개 앱 (인증 불필요)
│   │   └── index.js           # 엔트리 포인트
│   ├── package.json           # NPM 의존성
│   └── build/                 # 프로덕션 빌드
│
├── docs/                      # 📚 프로젝트 문서
│   ├── README.md              # 문서 인덱스
│   ├── MINDGARDEN_DESIGN_SYSTEM_GUIDE.md      # 디자인 가이드 ⭐
│   ├── DESIGN_SYSTEM_ARCHITECTURE.md          # 아키텍처 ⭐
│   ├── setup/                 # 환경 설정
│   ├── development/           # 개발 가이드
│   ├── architecture/          # 시스템 아키텍처
│   ├── features/              # 기능 명세
│   ├── security/              # 보안
│   ├── deployment/            # 배포
│   ├── testing/               # 테스트
│   ├── api/                   # API 문서
│   ├── maintenance/           # 유지보수
│   ├── troubleshooting/       # 문제 해결
│   ├── migration/             # 마이그레이션
│   ├── releases/              # 릴리즈 노트
│   └── archive/               # 아카이브
│       ├── design-backup-2025-10-14/
│       └── legacy-docs-backup-2025-10-14/
│
├── deployment/                # 배포 스크립트
│   ├── deploy-production.sh
│   └── application-production.yml
│
├── scripts/                   # 유틸리티 스크립트
│   └── *.sh
│
├── sql/                       # SQL 스크립트
│   └── *.sql
│
├── v0-pure-css-prompt.plan.md # 디자인 마이그레이션 마스터 플랜
└── pom.xml                    # 루트 Maven 설정
```

---

## 🎨 프론트엔드 구조 상세

### Components 디렉토리

```
frontend/src/components/
├── admin/                     # 관리자 전용 컴포넌트
│   ├── AdminDashboard.js
│   ├── UserManagement.js
│   ├── BranchManagement.js
│   ├── PermissionManagement.js
│   └── components/
│       └── AccountTable.js
│
├── consultant/                # 상담사 전용 컴포넌트
│   ├── ConsultantDashboard.js
│   ├── ClientList.js
│   └── ScheduleManagement.js
│
├── client/                    # 내담자 전용 컴포넌트
│   ├── ClientDashboard.js
│   └── ConsultationHistory.js
│
├── common/                    # 공통 재사용 컴포넌트
│   ├── Header.js
│   ├── Sidebar.js
│   ├── Modal.js
│   ├── LoadingBar.js
│   └── Notification.js
│
├── mindgarden/                # 디자인 시스템 쇼케이스
│   ├── HeroSection.js
│   ├── StatsDashboard.js
│   ├── ButtonShowcase.js
│   ├── CardShowcase.js
│   ├── ClientCardShowcase.js
│   ├── ConsultantCardShowcase.js
│   ├── DashboardLayoutShowcase.js
│   └── ... (18개 컴포넌트)
│
└── auth/                      # 인증 관련 컴포넌트
    ├── Login.js
    └── PasswordReset.js
```

### Styles 디렉토리

```
frontend/src/styles/
├── mindgarden-design-system.css    # 메인 디자인 시스템 (우선 사용)
│
├── design-system/                  # 세부 디자인 시스템
│   └── admin-design-guidelines.css
│
├── 00-core/                        # 코어 스타일
│   └── _variables.css
│
└── [legacy files...]               # 레거시 CSS (점진적 제거)
```

---

## 📦 백엔드 구조 상세

### Java 패키지 구조

```
src/main/java/com/mindgarden/consultation/
├── config/                    # 설정 클래스
│   ├── SecurityConfig.java    # Spring Security
│   ├── WebConfig.java         # Web 설정
│   └── JpaConfig.java         # JPA 설정
│
├── controller/                # REST API 컨트롤러
│   ├── AdminController.java
│   ├── ConsultantController.java
│   ├── ClientController.java
│   └── AuthController.java
│
├── service/                   # 비즈니스 로직
│   ├── UserService.java
│   ├── ConsultationService.java
│   └── ScheduleService.java
│
├── repository/                # 데이터 접근 (JPA Repository)
│   ├── UserRepository.java
│   └── ConsultationRepository.java
│
├── entity/                    # JPA 엔티티
│   ├── User.java
│   ├── Consultation.java
│   └── Schedule.java
│
├── dto/                       # 데이터 전송 객체
│   ├── request/
│   └── response/
│
└── util/                      # 유틸리티 클래스
    └── DateUtil.java
```

---

## 🗂️ 문서 구조 상세

```
docs/
├── README.md                          # 문서 인덱스 및 빠른 참조
│
├── MINDGARDEN_DESIGN_SYSTEM_GUIDE.md  # 디자인 시스템 가이드 ⭐
├── DESIGN_SYSTEM_ARCHITECTURE.md      # 디자인 아키텍처 ⭐
├── CHANGELOG.md                       # 변경 이력
│
├── setup/                             # 환경 설정
│   ├── ENVIRONMENT_SETUP.md
│   └── PROJECT_STRUCTURE.md (이 파일)
│
├── development/                       # 개발 가이드
│   ├── DEVELOPMENT_GUIDE.md
│   ├── CODING_STANDARDS.md
│   ├── COMPONENT_STRUCTURE.md
│   ├── REACT_GUIDE.md
│   └── BACKEND_GUIDE.md
│
├── architecture/                      # 시스템 아키텍처
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── AUTH_SYSTEM.md
│
├── features/                          # 기능 명세
│   ├── ADMIN_FEATURES.md
│   ├── CONSULTANT_FEATURES.md
│   └── CLIENT_FEATURES.md
│
├── api/                               # API 문서
│   ├── API_REFERENCE.md
│   ├── REST_API.md
│   └── ERROR_CODES.md
│
└── archive/                           # 아카이브
    ├── design-backup-2025-10-14/
    └── legacy-docs-backup-2025-10-14/
```

---

## 🔑 핵심 파일 설명

### 프론트엔드

| 파일 | 설명 |
|------|------|
| `index.js` | React 앱의 엔트리 포인트 |
| `App.js` | 인증이 필요한 메인 앱 (관리자, 상담사, 내담자) |
| `AppPublic.js` | 인증 불필요한 공개 앱 (홈페이지, 로그인) |
| `mindgarden-design-system.css` | 통합 디자인 시스템 CSS |
| `themes/defaultTheme.js` | 기본 테마 설정 |

### 백엔드

| 파일 | 설명 |
|------|------|
| `pom.xml` | Maven 의존성 관리 |
| `application.yml` | 개발 환경 설정 |
| `application-prod.yml` | 운영 환경 설정 (gitignore) |
| `SecurityConfig.java` | Spring Security 설정 |

### 문서

| 파일 | 설명 |
|------|------|
| `MINDGARDEN_DESIGN_SYSTEM_GUIDE.md` | 디자인 시스템 사용 가이드 ⭐ |
| `DESIGN_SYSTEM_ARCHITECTURE.md` | 디자인 시스템 아키텍처 ⭐ |
| `v0-pure-css-prompt.plan.md` | 디자인 마이그레이션 마스터 플랜 |

---

## 📍 파일 네이밍 규칙

### React 컴포넌트

```
PascalCase.js
예: AdminDashboard.js, UserManagement.js
```

### CSS 파일

```
kebab-case.css 또는 PascalCase.css
예: admin-dashboard.css, AdminDashboard.css
```

### 유틸리티 파일

```
camelCase.js
예: dateUtils.js, colorUtils.js
```

### Java 파일

```
PascalCase.java
예: UserService.java, ConsultationController.java
```

---

## 🎯 새 파일 추가 시 가이드

### React 컴포넌트 추가

1. 적절한 폴더에 컴포넌트 생성
2. 디자인 시스템 CSS 클래스 사용
3. PropTypes 또는 JSDoc 추가
4. Export default

```jsx
// components/admin/NewComponent.js
import React from 'react';

const NewComponent = ({ title, data }) => {
  return (
    <div className="mg-card">
      <h3 className="mg-h3">{title}</h3>
      {/* 컴포넌트 내용 */}
    </div>
  );
};

export default NewComponent;
```

### CSS 파일 추가

- 가능하면 `mindgarden-design-system.css` 활용
- 새 CSS 파일 생성 시 반드시 CSS Variables 사용
- 명명 규칙: `mg-` 접두사

```css
/* components/admin/NewComponent.css */
.mg-new-component {
  padding: var(--spacing-lg);
  background: var(--bg-surface);
}
```

---

## 🔄 마이그레이션 대상 파일

현재 레거시 구조에서 새 구조로 마이그레이션이 필요한 주요 파일들:

### 우선순위 1 (Admin)
- `components/admin/AdminDashboard.js`
- `components/admin/AdminDashboard.css`

### 우선순위 2 (Consultant)
- `components/consultant/ConsultantDashboard.js`

### 우선순위 3 (Client)
- `components/client/ClientDashboard.js`

---

**문서 버전**: 1.0  
**마지막 업데이트**: 2025년 10월 14일

