# Week 6 Day 1: PG 연결 테스트 인터페이스 설계

**작성일:** 2025-01-XX  
**목적:** PG 연결 테스트 시스템 설계 및 구현 검토

## 1. 현재 구현 상태

### 1.1 인터페이스 설계

**파일:** `src/main/java/com/coresolution/core/service/PgConnectionTestService.java`

**설계 상태:** ✅ **완료**

**인터페이스 구조:**
```java
public interface PgConnectionTestService {
    ConnectionTestResponse testConnection(TenantPgConfiguration configuration);
    boolean supports(PgProvider provider);
}
```

**설계 원칙:**
- ✅ 전략 패턴 적용
- ✅ 각 PG Provider별 독립적인 구현
- ✅ 확장 가능한 구조

### 1.2 구현 상태

**토스페이먼츠:**
- ✅ `TossConnectionTestServiceImpl` 구현 완료
- ✅ `/v1/keys` 엔드포인트 사용
- ✅ Basic 인증 방식

**아임포트:**
- ✅ `IamportConnectionTestServiceImpl` 구현 완료
- ✅ `/users/getToken` 엔드포인트 사용
- ✅ API Key/Secret Key 인증

### 1.3 통합 상태

**서비스 통합:**
- ✅ `TenantPgConfigurationServiceImpl`에서 연결 테스트 서비스 자동 선택
- ✅ `List<PgConnectionTestService>` 주입으로 확장 가능
- ✅ `supports()` 메서드로 적절한 서비스 선택

## 2. 설계 검토

### 2.1 인터페이스 설계 평가

**강점:**
- ✅ 단순하고 명확한 인터페이스
- ✅ 확장 가능한 구조
- ✅ 각 PG Provider별 독립적 구현

**개선 사항:**
- ⚠️ 타임아웃 설정 추가 검토
- ⚠️ 재시도 로직 추가 검토
- ⚠️ 연결 테스트 결과 상세 정보 확장

### 2.2 구현 품질 평가

**토스페이먼츠 구현:**
- ✅ 에러 처리 적절
- ✅ 로깅 적절
- ✅ 암호화된 키 복호화 처리

**아임포트 구현:**
- ✅ 에러 처리 적절
- ✅ 로깅 적절
- ✅ API 응답 코드 처리

## 3. 개선 사항

### 3.1 인터페이스 개선 (선택사항)

**타임아웃 설정:**
```java
public interface PgConnectionTestService {
    ConnectionTestResponse testConnection(TenantPgConfiguration configuration);
    boolean supports(PgProvider provider);
    
    // 선택사항: 타임아웃 설정
    default int getTimeoutSeconds() {
        return 10; // 기본 10초
    }
}
```

**재시도 로직:**
- 현재는 재시도 없음
- 필요 시 재시도 로직 추가 가능

### 3.2 에러 처리 개선

**현재 상태:**
- ✅ 기본적인 에러 처리 구현
- ✅ 로깅 적절

**개선 제안:**
- 연결 타임아웃 구분
- 네트워크 오류 구분
- 인증 오류 구분

## 4. 확장 계획

### 4.1 추가 PG Provider 지원

**구현 예정:**
- 카카오페이
- 네이버페이
- PayPal
- Stripe

**구현 패턴:**
1. `PgConnectionTestService` 인터페이스 구현
2. `supports()` 메서드로 Provider 지정
3. Spring Bean으로 등록 (자동 주입)

### 4.2 연결 테스트 결과 상세화

**현재:**
- 성공/실패 여부
- 메시지
- 상세 정보 (JSON)

**개선 제안:**
- 응답 시간 측정
- 에러 코드 분류
- 재시도 횟수 기록

## 5. 사용 예시

### 5.1 연결 테스트 호출

```java
// TenantPgConfigurationServiceImpl에서
PgConnectionTestService testService = connectionTestServices.stream()
    .filter(service -> service.supports(configuration.getPgProvider()))
    .findFirst()
    .orElse(null);

if (testService != null) {
    ConnectionTestResponse response = testService.testConnection(configuration);
    // 결과 저장
}
```

### 5.2 새로운 PG Provider 추가

```java
@Service
@RequiredArgsConstructor
public class KakaoConnectionTestServiceImpl implements PgConnectionTestService {
    
    @Override
    public ConnectionTestResponse testConnection(TenantPgConfiguration configuration) {
        // 카카오페이 연결 테스트 로직
    }
    
    @Override
    public boolean supports(PgProvider provider) {
        return provider == PgProvider.KAKAO;
    }
}
```

## 6. 테스트 계획

### 6.1 단위 테스트

- [ ] 토스페이먼츠 연결 테스트 성공 시나리오
- [ ] 토스페이먼츠 연결 테스트 실패 시나리오
- [ ] 아임포트 연결 테스트 성공 시나리오
- [ ] 아임포트 연결 테스트 실패 시나리오

### 6.2 통합 테스트

- [ ] 실제 PG API 호출 테스트 (테스트 환경)
- [ ] 연결 테스트 결과 저장 확인
- [ ] 여러 PG Provider 동시 테스트

## 7. 결론

**현재 상태:**
- ✅ 인터페이스 설계 완료
- ✅ 토스페이먼츠 구현 완료
- ✅ 아임포트 구현 완료
- ✅ 서비스 통합 완료

**Week 6 Day 1 완료 기준:**
- [x] PG 연결 테스트 인터페이스 설계 완료
- [x] 토스페이먼츠 연결 테스트 구현 완료

**다음 작업:**
- Week 6 Day 2: 아임포트 연결 테스트 검토 및 기타 PG사 구현

## 8. 참고 문서

- `src/main/java/com/coresolution/core/service/PgConnectionTestService.java` - 인터페이스
- `src/main/java/com/coresolution/core/service/impl/TossConnectionTestServiceImpl.java` - 토스 구현
- `src/main/java/com/coresolution/core/service/impl/IamportConnectionTestServiceImpl.java` - 아임포트 구현

