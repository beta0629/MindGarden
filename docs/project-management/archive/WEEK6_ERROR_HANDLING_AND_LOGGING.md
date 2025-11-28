# Week 6 Day 5: 에러 처리 및 로깅 개선

**작성일:** 2025-01-XX  
**목적:** 연결 테스트 시스템의 에러 처리 및 로깅 개선

## 1. 구현 개요

연결 테스트 시스템의 에러 처리와 로깅을 개선하여 운영 안정성과 디버깅 효율성을 향상시켰습니다.

## 2. 에러 처리 개선

### 2.1 전역 예외 처리기

**파일:** `src/main/java/com/coresolution/core/exception/GlobalExceptionHandler.java`

**기능:**
- 모든 컨트롤러에서 발생하는 예외를 일관되게 처리
- 적절한 HTTP 상태 코드 반환
- 구조화된 에러 응답 제공

**처리하는 예외:**
1. **ConnectionTestException**: 연결 테스트 관련 예외
   - HTTP 500 (Internal Server Error)
   - configId, provider, errorCode 포함

2. **IllegalArgumentException**: 잘못된 인자 예외
   - HTTP 400 (Bad Request)

3. **AccessDeniedException**: 접근 거부 예외
   - HTTP 403 (Forbidden)

4. **MethodArgumentNotValidException**: 유효성 검증 실패
   - HTTP 400 (Bad Request)
   - 필드별 에러 메시지 포함

5. **Exception**: 일반 예외
   - HTTP 500 (Internal Server Error)

### 2.2 커스텀 예외 클래스

**파일:** `src/main/java/com/coresolution/core/exception/ConnectionTestException.java`

**특징:**
- 연결 테스트 관련 예외를 명확히 구분
- configId, provider, errorCode 정보 포함
- 디버깅 및 모니터링에 유용한 컨텍스트 제공

### 2.3 에러 응답 DTO

**파일:** `src/main/java/com/coresolution/core/dto/ErrorResponse.java`

**구조:**
```json
{
  "timestamp": "2025-01-XXT10:00:00",
  "status": 500,
  "error": "Connection Test Failed",
  "message": "연결 테스트 중 오류 발생",
  "path": "/api/v1/tenants/.../test-connection",
  "details": {
    "configId": "...",
    "provider": "TOSS",
    "errorCode": "..."
  }
}
```

## 3. 로깅 개선

### 3.1 구조화된 로깅

**개선 사항:**
- 모든 로그에 컨텍스트 정보 포함 (configId, provider, tenantId)
- 로그 레벨 적절히 사용 (INFO, WARN, ERROR, DEBUG)
- 성능 측정 (duration 포함)

### 3.2 로깅 레벨

**INFO:**
- 연결 테스트 시작/완료
- 성공적인 연결 테스트
- 중요한 비즈니스 이벤트

**WARN:**
- 연결 테스트 실패 (예상 가능한 실패)
- 지원하지 않는 PG Provider
- 유효성 검증 실패

**ERROR:**
- 예상치 못한 예외
- 키 복호화 실패
- 데이터 저장 실패

**DEBUG:**
- 상세한 실행 흐름
- 서비스 호출 정보
- 결과 저장 과정

### 3.3 로깅 예시

**연결 테스트 시작:**
```
INFO: PG 연결 테스트 수행 시작: configId=xxx, provider=TOSS, tenantId=yyy
```

**연결 테스트 성공:**
```
INFO: PG 연결 테스트 성공: configId=xxx, provider=TOSS, tenantId=yyy, duration=1234ms
```

**연결 테스트 실패:**
```
WARN: PG 연결 테스트 실패: configId=xxx, provider=TOSS, tenantId=yyy, result=FAILED, message=..., duration=567ms
```

**예상치 못한 오류:**
```
ERROR: PG 연결 테스트 중 예상치 못한 오류 발생: configId=xxx, provider=TOSS, tenantId=yyy, duration=890ms, error=...
```

## 4. 성능 모니터링

### 4.1 실행 시간 측정

모든 연결 테스트에 대해 실행 시간을 측정하고 로그에 기록합니다:

```java
long startTime = System.currentTimeMillis();
// ... 테스트 수행 ...
long duration = System.currentTimeMillis() - startTime;
log.info("... duration={}ms", duration);
```

### 4.2 성능 로그 활용

- 느린 연결 테스트 식별
- PG Provider별 성능 비교
- 네트워크 문제 감지

## 5. 에러 처리 흐름

### 5.1 연결 테스트 에러 처리

```
1. 키 복호화 실패
   → ERROR 로그 + FAILED 응답

2. 지원하지 않는 PG Provider
   → WARN 로그 + FAILED 응답

3. 연결 테스트 서비스 예외
   → ERROR 로그 + FAILED 응답

4. 결과 저장 실패
   → ERROR 로그 (테스트 결과는 반환)
```

### 5.2 API 에러 처리

```
1. 컨트롤러에서 예외 발생
   → GlobalExceptionHandler가 처리

2. 적절한 HTTP 상태 코드 반환
   → ErrorResponse DTO로 구조화된 응답

3. 로그 기록
   → 예외 유형에 따라 적절한 레벨로 로깅
```

## 6. 모니터링 및 알림

### 6.1 로그 패턴

다음 패턴으로 로그를 모니터링할 수 있습니다:

- **연결 테스트 실패율**: `WARN.*PG 연결 테스트 실패`
- **예상치 못한 오류**: `ERROR.*예상치 못한 오류 발생`
- **성능 저하**: `INFO.*duration=.*` (높은 duration 값)

### 6.2 알림 기준

다음 상황에서 알림을 설정할 수 있습니다:

- ERROR 레벨 로그 발생
- 연결 테스트 실패율이 임계값 초과
- 평균 실행 시간이 임계값 초과

## 7. 보안 고려사항

### 7.1 민감한 정보 보호

- API Key와 Secret Key는 로그에 기록하지 않음
- 에러 메시지에 민감한 정보 포함하지 않음
- 스택 트레이스는 개발 환경에서만 상세히 기록

### 7.2 로그 보관

- 로그 보관 정책 수립
- 개인정보 보호 규정 준수
- 로그 접근 권한 관리

## 8. 개선 효과

### 8.1 운영 안정성

- 일관된 에러 처리로 사용자 경험 개선
- 구조화된 로그로 문제 진단 시간 단축
- 성능 모니터링으로 병목 지점 식별

### 8.2 개발 효율성

- 명확한 에러 메시지로 디버깅 시간 단축
- 컨텍스트 정보로 문제 재현 용이
- 로그 분석 도구 활용 가능

## 9. 참고 문서

- `src/main/java/com/coresolution/core/exception/GlobalExceptionHandler.java` - 전역 예외 처리기
- `src/main/java/com/coresolution/core/exception/ConnectionTestException.java` - 커스텀 예외
- `src/main/java/com/coresolution/core/dto/ErrorResponse.java` - 에러 응답 DTO
- `src/main/java/com/coresolution/core/service/impl/TenantPgConfigurationServiceImpl.java` - 개선된 로깅

