# 공통 리다이렉션 시스템 문서

## 개요

공통 리다이렉션 시스템은 사용자 역할별 대시보드 경로를 중앙에서 관리하여 어디서든지 일관된 리다이렉션을 보장하는 시스템입니다.

## 시스템 구조

### 백엔드 (Java)

#### 1. DashboardRedirectUtil.java
**위치**: `src/main/java/com/mindgarden/consultation/util/DashboardRedirectUtil.java`

**주요 메서드**:
- `getDashboardUrl(UserRole userRole, String frontendBaseUrl)`: 완전한 리다이렉트 URL 생성
- `getDashboardPath(UserRole userRole)`: 대시보드 경로만 반환
- `getDashboardDescription(UserRole userRole)`: 역할별 대시보드 설명

**사용 예시**:
```java
// OAuth2Controller에서 사용
String frontendUrl = getFrontendBaseUrl(request);
String redirectUrl = DashboardRedirectUtil.getDashboardUrl(user.getRole(), frontendUrl);
```

### 프론트엔드 (JavaScript)

#### 1. session.js
**위치**: `frontend/src/utils/session.js`

**주요 상수**:
```javascript
const ROLE_DASHBOARD_MAP = {
  'CLIENT': '/client/dashboard',
  'CONSULTANT': '/consultant/dashboard',
  'ADMIN': '/admin/dashboard',
  'BRANCH_SUPER_ADMIN': '/super_admin/dashboard',
  'HQ_ADMIN': '/erp/dashboard',
  'SUPER_HQ_ADMIN': '/super_admin/dashboard',
  'HQ_MASTER': '/super_admin/dashboard'
};
```

**주요 함수**:
- `getDashboardPath(role)`: 역할에 따른 대시보드 경로 반환
- `redirectToDashboardWithFallback(userRole, navigate)`: 공통 리다이렉션 함수
- `redirectToDashboard(userInfo)`: 기존 호환성을 위한 함수

**사용 예시**:
```javascript
// 로그인 컴포넌트에서 사용
import { redirectToDashboardWithFallback } from '../../utils/session';

// React Router와 함께 사용
redirectToDashboardWithFallback(userRole, navigate);

// 또는 단순 리다이렉션
redirectToDashboard(userInfo);
```

## 역할별 대시보드 매핑

| 역할 | 대시보드 경로 | 설명 |
|------|---------------|------|
| `CLIENT` | `/client/dashboard` | 내담자 대시보드 |
| `CONSULTANT` | `/consultant/dashboard` | 상담사 대시보드 |
| `ADMIN` | `/admin/dashboard` | 지점 관리자 대시보드 |
| `BRANCH_SUPER_ADMIN` | `/super_admin/dashboard` | 지점 수퍼 관리자 대시보드 |
| `HQ_ADMIN` | `/erp/dashboard` | 본사 관리자 대시보드 (ERP) |
| `SUPER_HQ_ADMIN` | `/super_admin/dashboard` | 본사 고급 관리자 대시보드 |
| `HQ_MASTER` | `/super_admin/dashboard` | 본사 총관리자 대시보드 |

## 적용된 컴포넌트

### 백엔드
- `OAuth2Controller.java`: 네이버/카카오 OAuth2 로그인 후 리다이렉션

### 프론트엔드
- `OAuth2Callback.js`: OAuth2 콜백 처리 후 리다이렉션
- `TabletLogin.js`: 태블릿 로그인 후 리다이렉션
- `BranchLogin.js`: 지점별 로그인 후 리다이렉션

## 공통 리다이렉션 함수 상세

### `redirectToDashboardWithFallback(userRole, navigate)`

**매개변수**:
- `userRole` (string): 사용자 역할
- `navigate` (function, optional): React Router의 navigate 함수

**동작 방식**:
1. **1차 시도**: React Router navigate (navigate 함수가 제공된 경우)
2. **2차 시도**: window.location.href (100ms 후)
3. **3차 시도**: window.location.replace (1000ms 후, 최종 백업)

**장점**:
- React Router와 window.location 모두 지원
- 단계별 fallback으로 리다이렉션 실패 방지
- 상세한 로깅으로 디버깅 용이

## 시스템 장점

### 1. 중앙 집중식 관리
- 모든 역할별 리다이렉션 로직을 한 곳에서 관리
- 역할 추가/변경 시 한 곳만 수정하면 됨

### 2. 일관성 보장
- 모든 로그인 방식에서 동일한 리다이렉션 적용
- 백엔드와 프론트엔드 간 일치성 보장

### 3. 유지보수 용이성
- 분산된 리다이렉션 로직으로 인한 불일치 방지
- 코드 중복 제거

### 4. 확장성
- 새로운 역할 추가 시 간단한 매핑 추가로 해결
- 다양한 리다이렉션 방식 지원

## 사용 가이드

### 새로운 로그인 컴포넌트 추가 시

1. **import 추가**:
```javascript
import { redirectToDashboardWithFallback } from '../../utils/session';
```

2. **리다이렉션 호출**:
```javascript
// 로그인 성공 후
redirectToDashboardWithFallback(userRole, navigate);
```

### 새로운 역할 추가 시

1. **백엔드 수정** (`DashboardRedirectUtil.java`):
```java
case NEW_ROLE:
    return "/new_role/dashboard";
```

2. **프론트엔드 수정** (`session.js`):
```javascript
const ROLE_DASHBOARD_MAP = {
  // ... 기존 매핑
  'NEW_ROLE': '/new_role/dashboard'
};
```

### 대시보드 경로 변경 시

역할별 대시보드 경로를 변경하려면 백엔드와 프론트엔드의 매핑을 동시에 수정해야 합니다.

## 주의사항

1. **백엔드-프론트엔드 동기화**: 매핑 변경 시 양쪽 모두 수정 필요
2. **기본 경로**: 역할이 없거나 알 수 없는 경우 `/client/dashboard`로 리다이렉션
3. **Fallback 순서**: React Router → window.location.href → window.location.replace 순서로 시도

## 트러블슈팅

### 리다이렉션이 작동하지 않는 경우

1. **콘솔 로그 확인**: 리다이렉션 과정의 상세 로그 확인
2. **역할 확인**: 사용자 역할이 올바르게 설정되었는지 확인
3. **경로 확인**: 대시보드 경로가 실제로 존재하는지 확인

### 역할이 잘못된 대시보드로 이동하는 경우

1. **매핑 확인**: `ROLE_DASHBOARD_MAP`과 `DashboardRedirectUtil`의 매핑이 일치하는지 확인
2. **캐시 확인**: 브라우저 캐시나 빌드 캐시 문제일 수 있음

## 버전 히스토리

- **v1.0.0** (2025-09-12): 초기 공통 리다이렉션 시스템 구현
  - 백엔드 `DashboardRedirectUtil` 클래스 추가
  - 프론트엔드 공통 함수 구현
  - 모든 로그인 컴포넌트에 적용
  - `HQ_ADMIN`을 `/erp/dashboard`로 리다이렉션하도록 수정
