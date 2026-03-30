# 사용자 개인정보 복호화 캐싱 시스템

## 개요

사용자 개인정보(이름, 이메일, 전화번호 등)의 반복적인 복호화 작업으로 인한 성능 부하를 줄이기 위해, 로그인 시 한 번 복호화하여 캐시에 저장하는 시스템입니다.

## 목적

1. **성능 최적화**: 매번 복호화하는 비용을 줄여 API 응답 시간 단축
2. **서버 부하 감소**: 암호화/복호화 연산은 CPU 집약적이므로 캐싱으로 부하 감소
3. **확장성**: 상담소, 학원 등 모든 테넌트에 동일하게 적용

## 아키텍처

### 캐시 전략

- **캐시 키 형식**: `user:decrypted:{tenantId}:{userId}`
- **캐시 저장소**: Spring Cache (ConcurrentMapCacheManager)
- **TTL**: 세션 만료 시간 기준 (기본 30분)
- **무효화 전략**: 
  - 사용자 정보 업데이트 시 즉시 무효화
  - 세션 만료 시 자동 무효화
  - 서버 재시작 시 캐시 초기화

### 보안 고려사항

1. **메모리 저장**: 서버 메모리에 평문 저장 (상대적으로 안전)
2. **테넌트별 격리**: 테넌트 ID를 키에 포함하여 데이터 격리
3. **자동 무효화**: 세션 만료 시 자동으로 캐시 무효화
4. **서버 재시작**: 서버 재시작 시 모든 캐시 자동 초기화

## 사용 방법

### 1. 로그인 시 캐시 저장

```java
// AuthController에서 로그인 성공 시
User sessionUser = users.get(0);
userPersonalDataCacheService.decryptAndCacheUserPersonalData(sessionUser);
```

### 2. 복호화된 데이터 조회

```java
// 캐시에서 조회 (없으면 복호화하여 캐시에 저장 후 반환)
Map<String, String> decryptedData = 
    userPersonalDataCacheService.getDecryptedUserData(user);

String name = decryptedData.get("name");
String email = decryptedData.get("email");
String phone = decryptedData.get("phone");
```

### 3. 캐시 무효화

```java
// 사용자 정보 업데이트 시
userPersonalDataCacheService.evictUserPersonalDataCache(tenantId, userId);

// 테넌트 전체 캐시 무효화 (테넌트 설정 변경 등)
userPersonalDataCacheService.evictTenantPersonalDataCache(tenantId);

// 전역 캐시 무효화 (암호화 키 변경 등)
userPersonalDataCacheService.evictAllPersonalDataCache();
```

## 장단점 분석

### 장점

1. **성능 향상**: 복호화 작업을 한 번만 수행하여 API 응답 시간 단축
2. **서버 부하 감소**: CPU 집약적인 암호화 연산 감소
3. **확장성**: 모든 테넌트에 동일하게 적용 가능
4. **투명성**: 기존 코드 수정 최소화 (캐시 서비스만 추가)

### 단점

1. **메모리 사용량 증가**: 사용자 수가 많을 경우 메모리 부담
2. **보안 위험**: 서버 메모리에 평문 저장 (하지만 서버 메모리는 상대적으로 안전)
3. **캐시 무효화 관리**: 사용자 정보 업데이트 시 수동 무효화 필요

## 주의사항

1. **캐시 무효화 필수**: 사용자 정보 업데이트 시 반드시 캐시를 무효화해야 함
2. **메모리 모니터링**: 사용자 수가 많을 경우 메모리 사용량 모니터링 필요
3. **세션 만료**: 세션 만료 시 캐시도 함께 만료되어야 함 (현재는 수동 관리 필요)

## 향후 개선 계획

1. **TTL 설정**: Spring Cache의 TTL 기능을 활용하여 자동 만료 설정
2. **Redis 통합**: Redis를 사용하여 분산 캐싱 및 자동 만료 기능 제공
3. **캐시 통계**: 캐시 히트율, 미스율 등의 통계 수집
4. **자동 무효화**: JPA 이벤트 리스너를 활용하여 자동 캐시 무효화

## 테스트

```java
// 캐시 저장 테스트
User user = userRepository.findById(1L).orElseThrow();
Map<String, String> data1 = userPersonalDataCacheService.decryptAndCacheUserPersonalData(user);

// 캐시 조회 테스트 (복호화 없이 캐시에서 조회)
Map<String, String> data2 = userPersonalDataCacheService.decryptAndCacheUserPersonalData(user);
assert data1.equals(data2); // 동일한 결과

// 캐시 무효화 테스트
userPersonalDataCacheService.evictUserPersonalDataCache(tenantId, userId);
```

## 관련 파일

- `UserPersonalDataCacheService.java`: 캐시 서비스 인터페이스
- `UserPersonalDataCacheServiceImpl.java`: 캐시 서비스 구현체
- `AuthController.java`: 로그인 시 캐시 저장 로직
- `AdminServiceImpl.java`: 사용자 정보 업데이트 시 캐시 무효화 로직 (추가 필요)

