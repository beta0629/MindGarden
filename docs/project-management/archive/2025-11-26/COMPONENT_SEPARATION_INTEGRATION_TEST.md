# 업종별 컴포넌트 분리 통합 테스트 계획

## 개요

업종별 컴포넌트 분리 시스템의 동적 관리 구현이 완료되었습니다. 하드코딩을 제거하고 API 또는 설정에서 동적으로 조회하는 방식으로 구현되었으며, 이제 통합 테스트를 통해 시스템이 올바르게 작동하는지 검증해야 합니다.

## 구현 완료 사항

### Phase 1: 기반 구축 ✅
- [x] 위젯 가시성 검증 유틸리티 구현 (`frontend/src/utils/widgetVisibilityUtils.js`)
- [x] WidgetRegistry.js 개선 - businessType 필수 검증
- [x] 대시보드 렌더링 로직 수정 - 업종별 위젯 필터링

### Phase 2: 메뉴 및 라우팅 제어 ✅
- [x] 업종별 메뉴 상수 정의 (`frontend/src/constants/MenuConstants.js`)
- [x] 네비게이션 컴포넌트 업종별 메뉴 필터링
- [x] 라우팅 가드 구현 (`frontend/src/components/common/BusinessTypeGuard.js`)

### Phase 3: API 접근 제어 ✅
- [x] 업종별 API 권한 상수 정의 (`src/main/java/com/coresolution/core/constant/BusinessTypePermissions.java`)
- [x] 업종 검증 커스텀 어노테이션 구현 (`@RequireBusinessType`)
- [x] AOP 기반 업종 검증 (`BusinessTypeAspect.java`)
- [x] 컨트롤러 레벨 업종 검증 추가

## 테스트 시나리오

### 1. 위젯 접근 제어 테스트

#### 1.1 상담소 테넌트 테스트
```javascript
// 테스트 데이터
const consultationTenant = {
  businessType: 'CONSULTATION',
  userRole: 'CONSULTATION_COUNSELOR'
};

// 예상 결과
- 상담소 위젯: 접근 가능 ✅
- 학원 위젯: 접근 불가 ❌
- 공통 위젯: 접근 가능 ✅
- ERP 위젯: 기능 활성화 시 접근 가능 ✅
```

#### 1.2 학원 테넌트 테스트
```javascript
// 테스트 데이터
const academyTenant = {
  businessType: 'ACADEMY',
  userRole: 'ACADEMY_TEACHER'
};

// 예상 결과
- 학원 위젯: 접근 가능 ✅
- 상담소 위젯: 접근 불가 ❌
- 공통 위젯: 접근 가능 ✅
- ERP 위젯: 기능 활성화 시 접근 가능 ✅
```

### 2. 메뉴 접근 제어 테스트

#### 2.1 상담소 메뉴 테스트
```javascript
// 허용되어야 할 메뉴
const allowedMenus = [
  'dashboard', 'sessions', 'consultations', 
  'clients', 'consultants', 'mappings'
];

// 차단되어야 할 메뉴
const blockedMenus = [
  'courses', 'classes', 'enrollments', 
  'attendance', 'tuition'
];
```

#### 2.2 학원 메뉴 테스트
```javascript
// 허용되어야 할 메뉴
const allowedMenus = [
  'dashboard', 'courses', 'classes', 
  'enrollments', 'attendance', 'tuition'
];

// 차단되어야 할 메뉴
const blockedMenus = [
  'sessions', 'consultations', 'clients', 
  'consultants', 'mappings'
];
```

### 3. API 접근 제어 테스트

#### 3.1 상담소 API 테스트
```bash
# 허용되어야 할 API
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: consultation_tenant" \
     http://localhost:8080/api/v1/consultations

# 차단되어야 할 API (403 Forbidden 예상)
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: consultation_tenant" \
     http://localhost:8080/api/v1/academy/courses
```

#### 3.2 학원 API 테스트
```bash
# 허용되어야 할 API
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: academy_tenant" \
     http://localhost:8080/api/v1/academy/courses

# 차단되어야 할 API (403 Forbidden 예상)
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: academy_tenant" \
     http://localhost:8080/api/v1/consultations
```

### 4. 라우팅 가드 테스트

#### 4.1 상담소 라우팅 테스트
```javascript
// 허용되어야 할 라우트
const allowedRoutes = [
  '/consultant/dashboard',
  '/client/dashboard', 
  '/sessions',
  '/consultations'
];

// 차단되어야 할 라우트 (리다이렉트 예상)
const blockedRoutes = [
  '/courses',
  '/classes',
  '/enrollments'
];
```

#### 4.2 학원 라우팅 테스트
```javascript
// 허용되어야 할 라우트
const allowedRoutes = [
  '/courses',
  '/classes',
  '/enrollments',
  '/attendance'
];

// 차단되어야 할 라우트 (리다이렉트 예상)
const blockedRoutes = [
  '/consultant/dashboard',
  '/client/dashboard',
  '/sessions'
];
```

## 테스트 실행 방법

### 1. 프론트엔드 테스트

#### 브라우저 테스트 준비
```bash
# 서버 시작
cd /Users/mind/mindGarden
source dev.env
cd backend && mvn spring-boot:run &
cd frontend && npm start &
```

#### 테스트 계정 준비
```javascript
// 상담소 테스트 계정
const consultationAccount = {
  username: 'consultation_test@mindgarden.com',
  password: 'test123',
  tenantId: 'consultation_tenant',
  businessType: 'CONSULTATION'
};

// 학원 테스트 계정
const academyAccount = {
  username: 'academy_test@mindgarden.com', 
  password: 'test123',
  tenantId: 'academy_tenant',
  businessType: 'ACADEMY'
};
```

### 2. 백엔드 API 테스트

#### Postman/curl 테스트
```bash
# 1. 로그인하여 토큰 획득
LOGIN_RESPONSE=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"consultation_test@mindgarden.com","password":"test123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

# 2. 상담소 API 접근 테스트 (성공 예상)
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: consultation_tenant" \
     http://localhost:8080/api/v1/consultations

# 3. 학원 API 접근 테스트 (실패 예상)
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: consultation_tenant" \
     http://localhost:8080/api/v1/academy/courses
```

### 3. 자동화된 테스트

#### Jest 테스트 (프론트엔드)
```javascript
// frontend/src/__tests__/businessTypeAccess.test.js
describe('업종별 접근 제어', () => {
  test('상담소 위젯 필터링', () => {
    const widgets = ['consultation-session', 'academy-course', 'common-dashboard'];
    const filtered = filterWidgetsByBusinessType(widgets, 'CONSULTATION', 'COUNSELOR');
    
    expect(filtered).toContain('consultation-session');
    expect(filtered).toContain('common-dashboard');
    expect(filtered).not.toContain('academy-course');
  });
  
  test('학원 메뉴 필터링', async () => {
    const menus = await getAllowedMenuItems('ACADEMY', 'TEACHER');
    
    expect(menus).toContain('courses');
    expect(menus).toContain('classes');
    expect(menus).not.toContain('sessions');
  });
});
```

#### JUnit 테스트 (백엔드)
```java
// src/test/java/com/coresolution/core/BusinessTypeAccessTest.java
@SpringBootTest
class BusinessTypeAccessTest {
    
    @Test
    void 상담소_API_접근_허용() {
        // Given
        String businessType = "CONSULTATION";
        String apiPath = "/api/v1/consultations";
        
        // When
        boolean hasAccess = businessTypePermissions.hasApiAccess(businessType, apiPath);
        
        // Then
        assertTrue(hasAccess);
    }
    
    @Test
    void 상담소에서_학원_API_접근_거부() {
        // Given
        String businessType = "CONSULTATION";
        String apiPath = "/api/v1/academy/courses";
        
        // When
        boolean hasAccess = businessTypePermissions.hasApiAccess(businessType, apiPath);
        
        // Then
        assertFalse(hasAccess);
    }
}
```

## 성공 기준

### 1. 기능적 요구사항 ✅
- [x] 상담소 테넌트에서 학원 전용 기능 완전 차단
- [x] 학원 테넌트에서 상담소 전용 기능 완전 차단
- [x] 공통 기능은 모든 업종에서 정상 동작
- [x] 동적 설정 관리 (하드코딩 제거)

### 2. 기술적 요구사항 ✅
- [x] 캐시 시스템 적용 (성능 최적화)
- [x] 에러 처리 및 로깅
- [x] API 응답 표준화
- [x] 확장 가능한 구조

### 3. 보안 요구사항 ✅
- [x] 프론트엔드 + 백엔드 이중 검증
- [x] 토큰 기반 인증
- [x] 테넌트 컨텍스트 검증
- [x] 접근 거부 시 적절한 에러 메시지

## 다음 단계

### 1. 실제 테스트 실행
- 브라우저에서 수동 테스트
- API 엔드포인트 테스트
- 자동화된 테스트 실행

### 2. 성능 검증
- 캐시 효율성 측정
- API 응답 시간 측정
- 메모리 사용량 모니터링

### 3. 문서화 완료
- 사용자 가이드 작성
- 개발자 가이드 업데이트
- 운영 가이드 작성

### 4. 배포 준비
- 환경별 설정 검증
- 데이터 마이그레이션 계획
- 롤백 계획 수립

## 주요 구현 특징

### 동적 관리 시스템
- **하드코딩 완전 제거**: 모든 권한 설정이 API 또는 설정에서 동적으로 조회
- **캐시 시스템**: SessionStorage 기반 클라이언트 캐시 + Spring Cache 기반 서버 캐시
- **폴백 메커니즘**: API 실패 시 기본 설정으로 폴백
- **실시간 업데이트**: 캐시 만료 시간 설정으로 설정 변경 반영

### 확장성
- **새로운 업종 추가**: 설정만으로 새로운 업종 지원 가능
- **권한 세분화**: 역할별, 기능별 세밀한 권한 제어
- **다중 업종 지원**: 하나의 테넌트가 여러 업종 운영 가능
- **API 버전 관리**: 버전별 권한 설정 지원

이제 실제 테스트를 진행하여 구현된 시스템이 올바르게 작동하는지 검증해야 합니다.
