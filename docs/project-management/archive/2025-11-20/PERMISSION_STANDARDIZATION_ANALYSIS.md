# 권한 관리 표준화 분석 및 마이그레이션 계획

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 분석 완료, 마이그레이션 계획 수립 중

---

## 📊 현재 권한 관리 패턴 분석

### 1. SecurityUtils (역할 기반 권한 체크)

**위치**: `com.coresolution.consultation.util.SecurityUtils`

**사용 패턴**:
- `SecurityUtils.checkPermission(session, UserRole...)` - 역할 기반 권한 체크
- `SecurityUtils.hasAnyRole(session, UserRole...)` - 역할 확인
- `SecurityUtils.checkHQPermission(session)` - 본사 권한 체크
- `SecurityUtils.checkAdminPermission(session)` - 관리자 권한 체크
- `SecurityUtils.checkMenuPermission(session, menuGroup)` - 메뉴 권한 체크 (PermissionMatrix 사용)
- `SecurityUtils.checkApiPermission(session, apiPath)` - API 권한 체크 (PermissionMatrix 사용)
- `SecurityUtils.checkFeaturePermission(session, feature)` - 기능 권한 체크 (PermissionMatrix 사용)

**특징**:
- UserRole enum 기반 (하드코딩된 역할)
- PermissionMatrix 사용 (정적 권한 매트릭스)
- ResponseEntity 반환 (에러 응답 포함)

**사용처**: 3개 파일
- `SecurityAspect.java` (AOP)
- `MenuController.java`
- `SecurityUtils.java` (자체)

**문제점**:
- 하드코딩된 역할 기반 (동적 역할 시스템과 불일치)
- PermissionMatrix는 정적 (데이터베이스 기반 동적 권한과 충돌 가능)

---

### 2. PermissionCheckUtils (동적 권한 체크)

**위치**: `com.coresolution.consultation.util.PermissionCheckUtils`

**사용 패턴**:
- `PermissionCheckUtils.checkPermission(session, permissionCode, dynamicPermissionService)` - 동적 권한 체크
- `PermissionCheckUtils.checkAuthentication(session)` - 인증 체크
- `PermissionCheckUtils.checkAdminPermission(session, dynamicPermissionService)` - 관리자 권한 체크
- `PermissionCheckUtils.checkStatisticsPermission(session, dynamicPermissionService)` - 통계 권한 체크

**특징**:
- DynamicPermissionService 사용 (데이터베이스 기반)
- Spring Security 컨텍스트 설정 포함
- ResponseEntity 반환 (에러 응답 포함)

**사용처**: 12개 파일
- Academy 관련 Controller 4개
- StatisticsController
- ScheduleController
- Salary 관련 Controller 3개
- AdminController
- ConsultantRecordsController
- PermissionCheckUtils (자체)

**장점**:
- 동적 권한 시스템 사용 (데이터베이스 기반)
- 유연한 권한 관리 가능

---

### 3. DynamicPermissionService (동적 권한 서비스)

**위치**: `com.coresolution.consultation.service.DynamicPermissionService`

**사용 패턴**:
- `dynamicPermissionService.hasPermission(user, permissionCode)` - 권한 체크
- `dynamicPermissionService.hasPermission(roleName, permissionCode)` - 역할 기반 권한 체크
- `dynamicPermissionService.getUserPermissions(user)` - 사용자 권한 목록 조회
- `dynamicPermissionService.getRolePermissions(roleName)` - 역할 권한 목록 조회

**특징**:
- 데이터베이스 기반 동적 권한 관리
- 캐싱 지원
- 역할별 권한 관리

**사용처**: 38개 파일
- Controller: 20개+
- Service: 10개+
- Utils: 2개

**장점**:
- 동적 권한 관리 (데이터베이스 기반)
- 테넌트별 권한 관리 가능
- 확장성 높음

---

### 4. SecurityAspect (AOP 기반 권한 체크)

**위치**: `com.coresolution.consultation.aspect.SecurityAspect`

**사용 패턴**:
- `@RequireRole` 어노테이션 기반
- `SecurityUtils.checkPermission()` 사용

**특징**:
- AOP를 통한 선언적 권한 체크
- SecurityUtils에 의존

**사용처**: 제한적 (어노테이션 사용)

---

### 5. 도메인별 권한 서비스

**예시**: `CommonCodePermissionService`

**특징**:
- 도메인별 권한 로직 캡슐화
- DynamicPermissionService 사용

**사용처**: 제한적

---

## 🔍 문제점 분석

### 문제점 1: 권한 체크 패턴 혼재

**현재 상태**:
```
SecurityUtils.checkPermission() - 역할 기반 (하드코딩)
PermissionCheckUtils.checkPermission() - 동적 권한 (데이터베이스)
dynamicPermissionService.hasPermission() - 직접 호출
SecurityAspect - AOP 기반
```

**영향**:
- 개발자 혼란
- 일관성 부족
- 유지보수 어려움

### 문제점 2: 하드코딩된 역할 vs 동적 역할 시스템

**현재 상태**:
- SecurityUtils는 UserRole enum 사용 (하드코딩)
- DynamicPermissionService는 데이터베이스 기반 동적 역할 사용
- 두 시스템이 공존하며 충돌 가능

**영향**:
- 새로운 역할 추가 시 두 곳 모두 수정 필요
- 동적 역할 시스템의 장점을 활용하지 못함

### 문제점 3: PermissionMatrix 정적 권한

**현재 상태**:
- PermissionMatrix는 정적 상수 클래스
- SecurityUtils의 메뉴/API/기능 권한 체크에 사용
- 데이터베이스 기반 동적 권한과 충돌 가능

**영향**:
- 권한 변경 시 코드 수정 필요
- 동적 권한 관리 불가

---

## 🎯 통합 방안

### 목표: DynamicPermissionService 중심 통합

**표준 패턴**:
1. **Controller 레이어**: `PermissionCheckUtils.checkPermission()` 사용
2. **Service 레이어**: `DynamicPermissionService.hasPermission()` 직접 사용
3. **도메인별 권한**: 도메인별 권한 서비스 사용 (예: `CommonCodePermissionService`)

---

## 📋 마이그레이션 계획

### Phase 3.1: SecurityUtils 분석 및 마이그레이션 계획 (1일)

**작업**:
1. SecurityUtils 사용처 전체 조사
2. 각 사용처별 마이그레이션 전략 수립
3. 하위 호환성 유지 방안 수립

**우선순위**:
- `SecurityUtils.checkPermission()` → `PermissionCheckUtils.checkPermission()`
- `SecurityUtils.checkMenuPermission()` → `DynamicPermissionService` 기반으로 변경
- `SecurityUtils.checkApiPermission()` → `DynamicPermissionService` 기반으로 변경
- `SecurityUtils.checkFeaturePermission()` → `DynamicPermissionService` 기반으로 변경

### Phase 3.2: PermissionCheckUtils 표준화 (1일)

**작업**:
1. PermissionCheckUtils를 표준 권한 체크 유틸리티로 정의
2. 모든 Controller에서 사용하도록 가이드 작성
3. 하위 호환성 메서드 제공

### Phase 3.3: SecurityUtils 마이그레이션 (2-3일)

**작업**:
1. SecurityUtils의 역할 기반 메서드들을 Deprecated 표시
2. DynamicPermissionService 기반 메서드로 대체
3. 사용처 점진적 마이그레이션

### Phase 3.4: PermissionMatrix 마이그레이션 (2-3일)

**작업**:
1. PermissionMatrix의 권한 정보를 데이터베이스로 마이그레이션
2. SecurityUtils의 메뉴/API/기능 권한 체크를 DynamicPermissionService 기반으로 변경
3. 하위 호환성 유지

---

## ✅ 체크리스트

### Phase 3.1: 분석 및 계획
- [x] SecurityUtils 사용처 조사
- [x] PermissionCheckUtils 사용처 조사
- [x] DynamicPermissionService 사용처 조사
- [x] 문제점 분석
- [x] 통합 방안 수립
- [x] 마이그레이션 계획 작성

### Phase 3.2: PermissionCheckUtils 표준화 ✅ 완료 (2025-11-20)
- [x] PermissionCheckUtils를 표준 유틸리티로 정의
  - [x] JavaDoc 업데이트 (표준 유틸리티 명시)
  - [x] 사용 패턴 및 원칙 문서화
- [x] 가이드 문서 작성
  - [x] PERMISSION_CHECK_UTILS_GUIDE.md 작성
  - [x] 사용 패턴 예시 제공
  - [x] 마이그레이션 가이드 포함
- [x] 하위 호환성 메서드 제공
  - [x] 기존 메서드 유지 (하위 호환성)
  - [x] 편의 메서드 제공 (checkAdminPermission, checkStatisticsPermission)

### Phase 3.3: SecurityUtils 마이그레이션 ✅ 완료 (2025-11-20)
- [x] SecurityUtils 역할 기반 메서드 Deprecated 표시 ✅
  - [x] 클래스 레벨 @Deprecated 추가
  - [x] 역할 기반 메서드들 @Deprecated 표시 (hasAnyRole, hasRole, isHQUser, isAdmin, isBranchAdmin)
  - [x] 권한 체크 메서드들 @Deprecated 표시 (checkPermission, checkHQPermission, checkAdminPermission, checkBranchAdminPermission)
  - [x] PermissionMatrix 기반 메서드들 @Deprecated 표시 (checkMenuPermission, checkApiPermission, checkFeaturePermission, getUserPermissions)
  - [x] JavaDoc에 마이그레이션 가이드 추가
- [x] 사용처 점진적 마이그레이션 ✅
  - [x] SecurityAspect.java Deprecated 표시 및 경고 추가
    - [x] 클래스 레벨 @Deprecated 추가
    - [x] JavaDoc에 마이그레이션 가이드 추가
    - [x] @RequireRole 어노테이션 기반이므로 완전 마이그레이션은 어노테이션 변경 필요 (향후 작업)
  - [x] MenuController.java 마이그레이션 완료
    - [x] SecurityUtils.getUserPermissions() → DynamicPermissionService.getUserPermissions() 변경
    - [x] 하위 호환성 유지 (응답 형식 동일)
    - [x] JavaDoc에 마이그레이션 완료 표시

### Phase 3.4: PermissionMatrix 마이그레이션 ✅ 완료 (2025-11-20)
- [x] 마이그레이션 계획 수립 ✅
  - [x] 현재 상태 분석
  - [x] 데이터베이스 스키마 설계
  - [x] 권한 코드 체계 정의
  - [x] 마이그레이션 전략 수립
  - [x] 상세 작업 계획 작성
- [x] Phase 3.4.1: 데이터베이스 마이그레이션 ✅
  - [x] Flyway 마이그레이션 스크립트 작성
  - [x] 메뉴 그룹 권한 코드 정의 (6개)
  - [x] API 패턴 권한 코드 정의 (19개)
  - [x] 기능 권한 코드 정의 (33개)
  - [x] 역할별 권한 매핑 데이터 삽입 (9개 역할)
- [x] Phase 3.4.2: DynamicPermissionService 확장 ✅
  - [x] hasMenuGroupAccess() 메서드 추가
  - [x] hasApiAccess() 메서드 추가
  - [x] mapApiPathToPermissionCode() 헬퍼 메서드 추가
- [x] Phase 3.4.3: SecurityUtils 메서드 변경 ✅
  - [x] checkMenuPermission() 변경
  - [x] checkApiPermission() 변경
  - [x] checkFeaturePermission() 변경
  - [x] getUserPermissions() 변경
  - [x] ApplicationContextAware 구현
  - [x] 폴백 메커니즘 구현
- [x] Phase 3.4.4: PermissionMatrix Deprecated 표시 ✅
  - [x] 클래스 레벨 @Deprecated 추가
  - [x] 필드/메서드 레벨 @Deprecated 추가
  - [x] JavaDoc 마이그레이션 가이드 추가
  - [x] 사용처 점진적 마이그레이션 가이드 작성

---

## 📊 진행 상황

```
Phase 3.1: ████████████████████ 100% ✅ (분석 완료)
Phase 3.2: ████████████████████ 100% ✅ (표준화 완료)
Phase 3.3: ████████████████████ 100% ✅ (마이그레이션 완료)
Phase 3.4: ████████████████████ 100% ✅ (PermissionMatrix 마이그레이션 완료)

전체 Phase 3: ████████████████████ 100% ✅ 완료
```

---

## 🔗 관련 문서

- [표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)
- [오늘 할 일 체크리스트](./TODAY_TODO_CHECKLIST.md)

---

**마지막 업데이트**: 2025-11-20

