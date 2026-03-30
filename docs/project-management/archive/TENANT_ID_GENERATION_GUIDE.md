# 테넌트 ID 자동 생성 가이드

**작성일:** 2025-01-XX  
**목적:** 온보딩 승인 시 테넌트 ID 자동 생성 로직 및 사용법 정리

---

## 1. 개요

온보딩 승인 시 테넌트가 자동 생성되며, 이때 `tenant_id`가 자동으로 생성됩니다.  
테넌트 ID는 시스템 전반에서 사용되는 고유 식별자로, UUID 기반으로 생성됩니다.

---

## 2. 생성 전략

### 2.1 기본 전략

**테넌트명이 있는 경우:**
- 형식: `{해시8자리}-{UUID}`
- 예: `a1b2c3d4-550e8400-e29b-41d4-a716-446655440000`
- 테넌트명과 업종 타입을 조합하여 SHA-256 해시 생성
- 해시의 처음 8바이트를 접두사로 사용
- 이후 UUID를 조합하여 고유성 보장

**테넌트명이 없는 경우:**
- 형식: 순수 UUID
- 예: `550e8400-e29b-41d4-a716-446655440000`
- 표준 UUID v4 형식 사용

### 2.2 생성 로직

```java
// 테넌트명 기반 생성
String tenantId = tenantIdGenerator.generateTenantId(
    "마인드가든",           // tenantName
    "CONSULTATION"        // businessType (선택적)
);

// 기본 생성 (테넌트명 없음)
String tenantId = tenantIdGenerator.generateTenantId();
```

---

## 3. 구현 위치

### 3.1 서비스 인터페이스

**파일:** `src/main/java/com/coresolution/core/service/TenantIdGenerator.java`

```java
public interface TenantIdGenerator {
    String generateTenantId(String tenantName, String businessType);
    String generateTenantId(String tenantName);
    String generateTenantId();
}
```

### 3.2 구현체

**파일:** `src/main/java/com/coresolution/core/service/impl/TenantIdGeneratorImpl.java`

- `generateFromTenantName()`: 테넌트명 기반 생성
- `generateDefault()`: 기본 UUID 생성

### 3.3 사용 위치

**파일:** `src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java`

```java
// 온보딩 승인 시 자동 생성
if (status == OnboardingStatus.APPROVED) {
    String tenantId = request.getTenantId();
    if (tenantId == null || tenantId.trim().isEmpty()) {
        tenantId = tenantIdGenerator.generateTenantId(
            request.getTenantName(), 
            request.getBusinessType()
        );
        request.setTenantId(tenantId);
    }
    // ... 승인 프로세스 진행
}
```

---

## 4. 프로세스 흐름

### 4.1 온보딩 요청 생성

```
1. 사용자가 온보딩 요청 제출
   - tenantName: "마인드가든"
   - businessType: "CONSULTATION"
   - tenantId: null (아직 생성되지 않음)

2. 온보딩 요청 저장
   - OnboardingRequest 엔티티에 tenantId = null로 저장
```

### 4.2 온보딩 승인 처리

```
1. 온보딩 승인 요청
   - requestId로 OnboardingRequest 조회
   - status를 APPROVED로 변경

2. tenant_id 자동 생성 (없는 경우)
   - tenantId가 null이면 TenantIdGenerator 호출
   - 생성된 tenantId를 OnboardingRequest에 설정

3. PL/SQL 프로시저 호출
   - ProcessOnboardingApproval 프로시저 호출
   - 생성된 tenantId로 테넌트 생성
   - ERD 생성, 권한 템플릿 적용 등 자동 처리

4. 구독 tenant_id 업데이트
   - checklistJson에서 subscriptionId 추출
   - 생성된 tenantId로 구독 업데이트
```

---

## 5. 생성 예시

### 5.1 테넌트명 기반 생성

```java
// 입력
tenantName: "마인드가든"
businessType: "CONSULTATION"

// 처리
1. 입력 조합: "마인드가든:consultation"
2. SHA-256 해시 생성
3. 해시 접두사 추출: "a1b2c3d4"
4. UUID 생성: "550e8400-e29b-41d4-a716-446655440000"
5. 조합: "a1b2c3d4-550e8400-e29b-41d4-a716-446655440000"

// 결과
tenantId: "a1b2c3d4-550e8400-e29b-41d4-a716-446655440000"
```

### 5.2 기본 생성

```java
// 입력
tenantName: null
businessType: null

// 처리
1. UUID v4 생성

// 결과
tenantId: "550e8400-e29b-41d4-a716-446655440000"
```

---

## 6. 특징

### 6.1 고유성 보장

- UUID 기반으로 전역 고유성 보장
- 테넌트명 기반 해시 접두사로 가독성 향상
- 중복 가능성: 거의 없음 (UUID 충돌 확률 매우 낮음)

### 6.2 일관성

- 동일한 테넌트명과 업종 타입으로 생성 시 동일한 해시 접두사
- UUID 부분은 매번 다르므로 완전히 동일한 ID는 생성되지 않음

### 6.3 확장성

- 테넌트명이 없어도 생성 가능
- 업종 타입이 없어도 생성 가능
- 향후 다른 생성 전략으로 확장 가능

---

## 7. 데이터베이스 연동

### 7.1 테넌트 생성

생성된 `tenant_id`는 `CreateOrActivateTenant` PL/SQL 프로시저에 전달되어:

```sql
INSERT INTO tenants (
    tenant_id,      -- 자동 생성된 ID
    name,
    business_type,
    status,
    ...
) VALUES (
    p_tenant_id,   -- 생성된 tenant_id
    p_tenant_name,
    p_business_type,
    'ACTIVE',
    ...
);
```

### 7.2 구독 업데이트

온보딩 승인 후 구독의 `tenant_id`가 자동으로 업데이트됩니다:

```java
// OnboardingServiceImpl.updateSubscriptionTenantId()
subscription.setTenantId(tenantId);  // 생성된 tenant_id
subscriptionRepository.save(subscription);
```

---

## 8. 주의사항

### 8.1 중복 방지

- UUID 기반이므로 중복 가능성은 거의 없음
- 하지만 데이터베이스 UNIQUE 제약조건으로 이중 보장

### 8.2 형식

- `tenant_id`는 항상 36자 (UUID 형식) 또는 45자 (해시 접두사 포함)
- 하이픈(`-`) 포함
- 소문자 영문자와 숫자만 사용

### 8.3 변경 불가

- `tenant_id`는 생성 후 변경 불가 (`updatable = false`)
- 테넌트 삭제 후 재생성 시 새로운 ID 생성

---

## 9. 관련 파일

- **서비스 인터페이스:** `src/main/java/com/coresolution/core/service/TenantIdGenerator.java`
- **구현체:** `src/main/java/com/coresolution/core/service/impl/TenantIdGeneratorImpl.java`
- **사용 위치:** `src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java`
- **PL/SQL 프로시저:** `src/main/resources/db/migration/V13__create_onboarding_approval_procedures.sql`

---

## 10. 향후 개선 사항

1. **테넌트명 기반 슬러그 생성**
   - 예: "마인드가든" → "mindgarden-{uuid}"
   - 더 읽기 쉬운 형식

2. **사용자 정의 형식**
   - 설정 파일에서 생성 형식 지정
   - 예: `tenant.id.format=SLUG` 또는 `UUID`

3. **중복 체크 강화**
   - 생성 전 데이터베이스에서 중복 확인
   - 중복 시 자동 재생성

---

## 11. 참고 문서

- `docs/mgsb/MINDGARDEN_BASED_INTEGRATION_PLAN.md` - 온보딩 프로세스 전체 개요
- `docs/mgsb/CORE_SOLUTION_PLSQL_ARCHITECTURE.md` - PL/SQL 프로시저 아키텍처
- `src/main/resources/db/migration/V13__create_onboarding_approval_procedures.sql` - 테넌트 생성 프로시저

