# Week 5: 보안 테스트 가이드

**작성일:** 2025-01-XX  
**목적:** Week 5 보안 기능 테스트 가이드 및 체크리스트

## 1. 테스트 개요

Week 5에서 구현한 보안 기능들을 검증하기 위한 테스트 가이드입니다.

## 2. 테스트 범위

### 2.1 암호화 테스트
- [ ] AES-256-CBC 암호화/복호화 정확성
- [ ] 키 버전 관리
- [ ] 다중 키 지원
- [ ] 키 로테이션

### 2.2 접근 제어 테스트
- [ ] 테넌트 소유자 접근 허용
- [ ] 다른 테넌트 접근 거부
- [ ] 운영 포털 관리자 접근 허용
- [ ] 인증되지 않은 사용자 접근 거부

### 2.3 PG 설정 암호화 테스트
- [ ] API Key 암호화 저장
- [ ] Secret Key 암호화 저장
- [ ] 복호화 서비스 동작
- [ ] 키 로테이션 동작

## 3. 단위 테스트

### 3.1 접근 제어 서비스 테스트

**파일:** `src/test/java/com/coresolution/core/security/TenantAccessControlServiceTest.java`

**테스트 항목:**
- ✅ 테넌트 접근 권한 확인 (성공)
- ✅ 다른 테넌트 접근 거부
- ✅ 테넌트 컨텍스트 없음 처리
- ✅ 운영 포털 역할 접근 허용
- ✅ PG 설정 접근 권한 확인
- ✅ 운영 포털 접근 권한 확인

**실행 방법:**
```bash
mvn test -Dtest=TenantAccessControlServiceTest
```

### 3.2 키 로테이션 서비스 테스트

**파일:** `src/test/java/com/coresolution/core/service/impl/TenantPgConfigurationKeyRotationServiceTest.java`

**테스트 항목:**
- ✅ 모든 PG 설정 키 로테이션
- ✅ 로테이션 불필요한 경우 처리
- ✅ 부분 실패 처리
- ✅ 테넌트별 키 로테이션

**실행 방법:**
```bash
mvn test -Dtest=TenantPgConfigurationKeyRotationServiceTest
```

## 4. 통합 테스트

### 4.1 PG 설정 암호화 통합 테스트

**테스트 시나리오:**

1. **PG 설정 생성 시 암호화**
   ```java
   // Given: PG 설정 생성 요청
   // When: PG 설정 생성
   // Then: API Key, Secret Key가 암호화되어 저장됨
   ```

2. **PG 설정 조회 시 복호화**
   ```java
   // Given: 암호화된 PG 설정
   // When: 복호화 서비스 호출
   // Then: 복호화된 키 반환
   ```

3. **키 로테이션**
   ```java
   // Given: 이전 키로 암호화된 PG 설정
   // When: 키 로테이션 실행
   // Then: 활성 키로 재암호화됨
   ```

### 4.2 접근 제어 통합 테스트

**테스트 시나리오:**

1. **테넌트 소유자 접근**
   ```java
   // Given: 테넌트 소유자 인증
   // When: 자신의 테넌트 PG 설정 조회
   // Then: 접근 허용
   ```

2. **다른 테넌트 접근 거부**
   ```java
   // Given: 테넌트 A 소유자 인증
   // When: 테넌트 B의 PG 설정 조회
   // Then: AccessDeniedException 발생
   ```

3. **운영 포털 관리자 접근**
   ```java
   // Given: 운영 포털 관리자 인증
   // When: 모든 테넌트 PG 설정 조회
   // Then: 접근 허용
   ```

## 5. 수동 테스트 체크리스트

### 5.1 암호화 테스트

- [ ] **PG 설정 생성**
  1. 테넌트 포털에서 PG 설정 생성
  2. API Key, Secret Key 입력
  3. 데이터베이스에서 암호화된 값 확인
  4. 평문이 저장되지 않았는지 확인

- [ ] **복호화 테스트**
  1. 복호화 서비스 호출
  2. 복호화된 키 확인
  3. 원본 키와 일치하는지 확인

- [ ] **키 로테이션 테스트**
  1. 이전 키로 암호화된 PG 설정 생성
  2. 새 활성 키 설정
  3. 키 로테이션 실행
  4. 활성 키로 재암호화 확인

### 5.2 접근 제어 테스트

- [ ] **테넌트 소유자 접근**
  1. 테넌트 A 사용자로 로그인
  2. 테넌트 A의 PG 설정 조회 → 성공
  3. 테넌트 B의 PG 설정 조회 → 실패

- [ ] **운영 포털 관리자 접근**
  1. 운영 포털 관리자로 로그인
  2. 모든 테넌트의 PG 설정 조회 → 성공

- [ ] **인증되지 않은 사용자**
  1. 인증 없이 API 호출
  2. 접근 거부 확인

## 6. 보안 검증 체크리스트

### 6.1 암호화 검증

- [ ] API Key는 절대 평문으로 저장되지 않음
- [ ] Secret Key는 절대 평문으로 저장되지 않음
- [ ] 암호화된 키는 로그에 출력되지 않음
- [ ] 복호화된 키는 로그에 출력되지 않음
- [ ] 키는 응답에 포함되지 않음 (복호화 서비스 제외)

### 6.2 접근 제어 검증

- [ ] 테넌트 간 데이터 격리 확인
- [ ] 운영 포털 관리자만 모든 테넌트 접근 가능
- [ ] 인증되지 않은 사용자 접근 거부
- [ ] 권한 없는 사용자 접근 거부

### 6.3 키 관리 검증

- [ ] 키는 환경변수로 관리됨
- [ ] 키는 소스 코드에 하드코딩되지 않음
- [ ] 키 로테이션 시 무중단 서비스 가능
- [ ] 이전 키로 암호화된 데이터도 복호화 가능

## 7. 성능 테스트

### 7.1 암호화 성능

- [ ] 대량 PG 설정 암호화 성능 측정
- [ ] 키 로테이션 성능 측정
- [ ] 복호화 성능 측정

### 7.2 접근 제어 성능

- [ ] 접근 제어 검증 오버헤드 측정
- [ ] 다중 테넌트 환경에서의 성능

## 8. 보안 취약점 검사

### 8.1 OWASP Top 10 체크

- [ ] 인증 및 세션 관리 취약점
- [ ] 암호화 취약점
- [ ] 접근 제어 취약점
- [ ] 로깅 및 모니터링 취약점

### 8.2 코드 보안 검사

- [ ] 하드코딩된 키 없음
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] CSRF 방지

## 9. 테스트 실행

### 9.1 전체 테스트 실행

```bash
# 모든 보안 관련 테스트 실행
mvn test -Dtest="*Security*Test,*Encryption*Test,*AccessControl*Test"
```

### 9.2 특정 테스트 실행

```bash
# 접근 제어 테스트만 실행
mvn test -Dtest=TenantAccessControlServiceTest

# 키 로테이션 테스트만 실행
mvn test -Dtest=TenantPgConfigurationKeyRotationServiceTest
```

## 10. 테스트 결과 보고

### 10.1 테스트 결과 요약

테스트 실행 후 다음 정보를 기록:
- 총 테스트 수
- 성공한 테스트 수
- 실패한 테스트 수
- 테스트 커버리지

### 10.2 보안 검증 결과

- 암호화 검증 결과
- 접근 제어 검증 결과
- 키 관리 검증 결과
- 보안 취약점 검사 결과

## 11. 참고 문서

- `docs/mgsb/WEEK5_ENCRYPTION_KEY_MANAGEMENT_POLICY.md` - 키 관리 정책
- `docs/mgsb/WEEK5_AES256_IMPLEMENTATION_REVIEW.md` - 암호화 구현 검토
- `docs/mgsb/WEEK5_PG_ENCRYPTION_INTEGRATION.md` - 암호화 통합
- `docs/mgsb/WEEK5_ACCESS_CONTROL_IMPLEMENTATION.md` - 접근 제어 구현

