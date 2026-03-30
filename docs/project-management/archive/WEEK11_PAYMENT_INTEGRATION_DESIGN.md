# Week 11: 결제 시스템 통합 설계

## 목표
테넌트별 PG 설정을 결제 시스템에 통합하여, 각 테넌트가 자신의 PG 설정을 사용하여 결제를 진행할 수 있도록 구현

## 현재 상황 분석

### 기존 결제 시스템 구조
1. **PaymentService**: 결제 생성, 조회, 상태 업데이트 등 결제 비즈니스 로직 처리
2. **PaymentGatewayService**: 외부 PG사 API 연동 인터페이스 (TossPaymentServiceImpl 구현)
3. **Payment 엔티티**: `PaymentProvider` enum으로 PG사 구분 (TOSS, IAMPORT 등)

### 문제점
- 현재는 전역 설정 파일(`application.yml`)에서 PG 키를 가져옴
- 테넌트별로 다른 PG 설정을 사용할 수 없음
- `TossPaymentServiceImpl`이 `@Value`로 하드코딩된 키 사용

### 개선 방향
1. 결제 생성 시 테넌트 컨텍스트에서 테넌트 ID 추출
2. 테넌트별 활성화된 PG 설정 조회
3. 조회한 PG 설정의 키를 사용하여 PaymentGatewayService 호출
4. PaymentGatewayService 구현체들이 테넌트별 키를 동적으로 사용하도록 수정

## 설계

### 1. 테넌트별 PG 설정 조회 로직

#### 1.1 TenantPgConfigurationService 확장
```java
/**
 * 테넌트의 활성화된 PG 설정 조회
 * 
 * @param tenantId 테넌트 ID
 * @param pgProvider PG 제공자 (선택적, null이면 모든 활성화된 설정 반환)
 * @return 활성화된 PG 설정 목록
 */
List<TenantPgConfigurationResponse> getActiveConfigurations(
    String tenantId, 
    PgProvider pgProvider
);

/**
 * 테넌트의 특정 PG 제공자에 대한 활성화된 설정 조회
 * 
 * @param tenantId 테넌트 ID
 * @param pgProvider PG 제공자
 * @return 활성화된 PG 설정 (없으면 null)
 */
TenantPgConfigurationDetailResponse getActiveConfigurationByProvider(
    String tenantId, 
    PgProvider pgProvider
);
```

#### 1.2 조회 조건
- `tenantId` 일치
- `status = ACTIVE` (활성화됨)
- `approvalStatus = APPROVED` (승인됨)
- `pgProvider` 일치 (제공된 경우)
- 최신 설정 우선 (여러 개인 경우 `createdAt` 최신 것)

### 2. PaymentGatewayService 수정

#### 2.1 인터페이스 변경
```java
public interface PaymentGatewayService {
    /**
     * 결제 요청 생성 (테넌트별 PG 설정 사용)
     * 
     * @param request 결제 요청 정보
     * @param pgConfig 테넌트 PG 설정 (API Key, Secret Key 포함)
     * @return 결제 응답
     */
    PaymentResponse createPayment(
        PaymentRequest request, 
        TenantPgConfigurationDetailResponse pgConfig
    );
    
    // 기존 메서드들도 pgConfig 파라미터 추가
}
```

#### 2.2 구현체 수정
- `TossPaymentServiceImpl`: `@Value` 대신 `pgConfig`에서 키 추출
- 다른 PG 구현체들도 동일하게 수정

### 3. PaymentService 수정

#### 3.1 결제 생성 플로우
```
1. PaymentRequest에서 tenantId 추출 (또는 TenantContext에서)
2. TenantPgConfigurationService.getActiveConfigurationByProvider() 호출
3. PG 설정이 없으면 예외 발생
4. PaymentGatewayService.createPayment(request, pgConfig) 호출
5. Payment 엔티티에 configId 저장 (선택적)
```

#### 3.2 Payment 엔티티 확장 (선택적)
```java
@Column(name = "pg_config_id")
private String pgConfigId; // 사용된 PG 설정 ID
```

### 4. 에러 처리

#### 4.1 PG 설정이 없는 경우
- `TenantPgConfigurationNotFoundException` 예외 발생
- 에러 메시지: "테넌트의 활성화된 PG 설정을 찾을 수 없습니다."

#### 4.2 여러 활성화된 설정이 있는 경우
- `pgProvider`가 제공되면 해당 제공자 설정 사용
- `pgProvider`가 없으면 첫 번째 활성화된 설정 사용 (또는 예외)

### 5. 캐싱 전략 (선택적)

#### 5.1 Redis 캐싱
- 테넌트별 활성화된 PG 설정을 Redis에 캐싱
- TTL: 1시간
- 키: `pg:config:active:{tenantId}:{pgProvider}`

#### 5.2 캐시 무효화
- PG 설정 승인/거부 시
- PG 설정 활성화/비활성화 시
- PG 설정 수정 시

## 구현 순서

### Day 1
1. ✅ 결제 시스템 통합 설계 문서 작성
2. ✅ 테넌트별 PG 설정 조회 로직 구현
   - `TenantPgConfigurationService`에 `getActiveConfigurations()` 추가
   - `getActiveConfigurationByProvider()` 추가

### Day 2
1. `PaymentGatewayService` 인터페이스 수정
2. `TossPaymentServiceImpl` 수정 (테넌트별 키 사용)
3. 다른 PG 구현체들 수정 (Iamport, Kakao, Naver, Paypal, Stripe)

### Day 3
1. `PaymentService` 수정
   - `createPayment()`에서 테넌트 PG 설정 조회
   - `PaymentGatewayService` 호출 시 PG 설정 전달
2. `Payment` 엔티티에 `pgConfigId` 필드 추가 (선택적)

### Day 4
1. 통합 테스트 작성
2. 테스트 실행 및 버그 수정

### Day 5
1. 성능 테스트
2. 버그 수정 및 최적화

## 테스트 시나리오

### 시나리오 1: 정상 결제 플로우
1. 테넌트 A가 TOSS PG 설정을 활성화
2. 테넌트 A 사용자가 결제 요청
3. 테넌트 A의 TOSS 설정이 사용되는지 확인
4. 결제 성공 확인

### 시나리오 2: PG 설정이 없는 경우
1. 테넌트 B가 PG 설정을 등록하지 않음
2. 테넌트 B 사용자가 결제 요청
3. 예외 발생 확인

### 시나리오 3: 여러 PG 설정이 있는 경우
1. 테넌트 C가 TOSS와 IAMPORT 설정을 모두 활성화
2. PaymentRequest에서 `provider=TOSS` 지정
3. TOSS 설정만 사용되는지 확인

## 보안 고려사항

1. **키 복호화**: PG 설정 조회 시 암호화된 키를 복호화하여 사용
2. **접근 제어**: 테넌트 컨텍스트 검증
3. **로깅**: 민감한 정보(키)는 로그에 기록하지 않음

## 성능 고려사항

1. **캐싱**: 활성화된 PG 설정은 Redis에 캐싱
2. **지연 로딩**: PG 설정은 필요할 때만 조회
3. **배치 처리**: 여러 결제 요청 시 배치로 PG 설정 조회

## 마이그레이션 계획

1. 기존 결제는 전역 설정 사용 (하위 호환성)
2. 테넌트별 설정이 있으면 우선 사용
3. 점진적으로 모든 테넌트가 테넌트별 설정 사용하도록 전환

