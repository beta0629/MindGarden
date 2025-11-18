# Week 5 Day 4: 접근 제어 구현 (테넌트별)

**작성일:** 2025-01-XX  
**목적:** 테넌트별 리소스 접근 제어 중앙화 및 강화

## 1. 구현 개요

테넌트별 접근 제어를 중앙화하여 일관성 있고 안전한 접근 제어를 구현했습니다.

## 2. 구현 내용

### 2.1 접근 제어 서비스

**파일:** `src/main/java/com/coresolution/core/security/TenantAccessControlService.java`

**주요 기능:**
- 테넌트 접근 권한 검증
- PG 설정 접근 권한 검증
- 운영 포털 접근 권한 검증
- 현재 사용자/테넌트 정보 조회

**접근 제어 규칙:**
1. **테넌트 소유자**: 자신의 테넌트 리소스만 접근 가능
2. **운영 포털 관리자 (ADMIN/OPS)**: 모든 테넌트 리소스 접근 가능
3. **인증되지 않은 사용자**: 모든 접근 거부

### 2.2 컨트롤러 레벨 통합

**변경 사항:**
- `TenantPgConfigurationController`: `TenantAccessControlService` 사용
- 중복된 접근 제어 로직 제거
- 일관된 접근 제어 적용

**이전:**
```java
private void validateTenantAccess(String tenantId) {
    String currentTenantId = TenantContextHolder.getTenantId();
    // ... 중복 로직
}
```

**이후:**
```java
accessControlService.validateTenantAccess(tenantId);
```

### 2.3 서비스 레벨 통합

**변경 사항:**
- `TenantPgConfigurationServiceImpl`: 접근 제어 서비스 통합
- `TenantPgConfigurationDecryptionServiceImpl`: 접근 제어 서비스 통합
- 중복된 권한 검증 로직 제거

**이전:**
```java
if (!configuration.getTenantId().equals(tenantId)) {
    throw new IllegalArgumentException("해당 테넌트의 PG 설정이 아닙니다");
}
```

**이후:**
```java
accessControlService.validateConfigurationAccess(configuration, tenantId);
```

## 3. 접근 제어 흐름

### 3.1 테넌트 포털 접근

```
사용자 요청
  ↓
컨트롤러: accessControlService.validateTenantAccess(tenantId)
  ↓
서비스: accessControlService.validateConfigurationAccess(configuration, tenantId)
  ↓
비즈니스 로직 실행
```

### 3.2 운영 포털 접근

```
운영 포털 관리자 요청
  ↓
@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
  ↓
서비스: accessControlService.validateOpsAccess()
  ↓
비즈니스 로직 실행
```

## 4. 보안 강화 사항

### 4.1 중앙화된 접근 제어

**장점:**
- 일관된 접근 제어 로직
- 유지보수 용이
- 보안 정책 변경 시 한 곳만 수정

### 4.2 다층 방어

**레이어별 접근 제어:**
1. **컨트롤러 레벨**: `@PreAuthorize`, `validateTenantAccess()`
2. **서비스 레벨**: `validateConfigurationAccess()`
3. **데이터 레벨**: Repository 쿼리에서 `tenant_id` 필터링

### 4.3 로깅

**접근 제어 로그:**
- 접근 허용: DEBUG 레벨
- 접근 거부: WARN 레벨
- 운영 포털 접근: DEBUG 레벨

## 5. 사용 예시

### 5.1 테넌트 접근 확인

```java
@Autowired
private TenantAccessControlService accessControlService;

public void someMethod(String tenantId) {
    // 테넌트 접근 권한 확인
    accessControlService.validateTenantAccess(tenantId);
    
    // 비즈니스 로직 실행
}
```

### 5.2 PG 설정 접근 확인

```java
TenantPgConfiguration configuration = configurationRepository
    .findByConfigIdAndIsDeletedFalse(configId)
    .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다"));

// PG 설정 접근 권한 확인
accessControlService.validateConfigurationAccess(configuration, tenantId);

// 비즈니스 로직 실행
```

### 5.3 운영 포털 접근 확인

```java
// 운영 포털 권한 확인
accessControlService.validateOpsAccess();

// 비즈니스 로직 실행
```

## 6. 테스트 계획

### 6.1 단위 테스트

**필요한 테스트:**
- [ ] 테넌트 소유자 접근 허용 테스트
- [ ] 다른 테넌트 접근 거부 테스트
- [ ] 운영 포털 관리자 접근 허용 테스트
- [ ] 인증되지 않은 사용자 접근 거부 테스트

### 6.2 통합 테스트

**필요한 테스트:**
- [ ] 컨트롤러 레벨 접근 제어 테스트
- [ ] 서비스 레벨 접근 제어 테스트
- [ ] 복호화 서비스 접근 제어 테스트

## 7. 향후 개선 사항

### 7.1 접근 로그 기록

**계획:**
- 접근 이력 테이블 생성
- 접근 시도 기록 (성공/실패)
- 감사 목적 로그 저장

### 7.2 세밀한 권한 제어

**계획:**
- 역할 기반 접근 제어 (RBAC) 확장
- 리소스별 권한 설정
- 동적 권한 검증

### 7.3 IP 기반 접근 제어

**계획:**
- 허용된 IP 주소 목록 관리
- IP 기반 접근 제한
- 지역별 접근 제어

## 8. 참고 문서

- `src/main/java/com/coresolution/core/security/TenantAccessControlService.java` - 접근 제어 서비스
- `src/main/java/com/coresolution/core/controller/TenantPgConfigurationController.java` - 테넌트 컨트롤러
- `src/main/java/com/coresolution/core/service/impl/TenantPgConfigurationServiceImpl.java` - PG 설정 서비스

