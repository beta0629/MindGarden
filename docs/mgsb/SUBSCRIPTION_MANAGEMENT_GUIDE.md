# 구독 관리 가이드 (만료, 환불, 업그레이드)

**작성일:** 2025-01-XX  
**목적:** 구독 만료, 환불, 업그레이드/다운그레이드 처리 방법 정리

---

## 1. 개요

구독 관리 시스템은 다음과 같은 기능을 제공합니다:
- **만료 처리**: 유효 기간이 지난 구독 자동 처리
- **환불 처리**: 청약 철회 기간 내 환불 처리
- **요금제 변경**: 업그레이드/다운그레이드 처리
- **일시정지/재개**: 구독 일시정지 및 재개

---

## 2. 구독 상태

### 2.1 상태 종류

| 상태 | 설명 | 특징 |
|------|------|------|
| `DRAFT` | 초안 | 온보딩 중 생성된 구독 |
| `PENDING_ACTIVATION` | 활성화 대기 | 첫 결제 대기 중 |
| `INACTIVE` | 비활성 | 생성되었으나 활성화되지 않음 |
| `ACTIVE` | 활성 | 정상 사용 중 |
| `SUSPENDED` | 일시정지 | 결제 실패 또는 관리자 일시정지 |
| `CANCELLED` | 취소 | 사용자 취소 |
| `TERMINATED` | 종료 | 만료 또는 강제 종료 |

### 2.2 상태 전이

```
DRAFT → PENDING_ACTIVATION → ACTIVE
                              ↓
                         SUSPENDED
                              ↓
                         CANCELLED / TERMINATED
```

---

## 3. 만료 처리

### 3.1 자동 만료 처리

**스케줄러 설정:**
- 실행 시간: 매일 오전 2시
- 설정: `subscription.scheduler.enabled=true` (기본값: true)

**처리 로직:**
1. `effectiveTo`가 오늘 이전인 `ACTIVE` 구독 조회
2. 상태를 `SUSPENDED`로 변경
3. `autoRenewal`을 `false`로 설정

**코드 예시:**
```java
@Scheduled(cron = "0 0 2 * * ?")
public void processExpiredSubscriptions() {
    int count = expirationService.processExpiredSubscriptions();
}
```

### 3.2 수동 만료 처리

**API:**
```java
POST /api/v1/billing/subscriptions/{subscriptionId}/expire
{
  "reason": "만료 사유"
}
```

**처리:**
- `ACTIVE` 또는 `SUSPENDED` 상태만 만료 가능
- 상태를 `TERMINATED`로 변경
- `effectiveTo`를 오늘로 설정
- `autoRenewal`을 `false`로 설정

---

## 4. 환불 처리

### 4.1 환불 정책

**청약 철회 기간:**
- 결제일로부터 **15일 이내**만 환불 가능
- 전체 환불 또는 부분 환불 가능

**환불 금액 계산:**
- 일할 계산 방식
- 남은 기간에 대한 비례 환불

### 4.2 환불 처리 프로세스

**1. 환불 가능 여부 확인**
```java
boolean canRefund = refundService.canRefund(subscriptionId, refundDays);
```

**2. 환불 금액 계산**
```java
BigDecimal refundAmount = refundService.calculateRefundAmount(
    subscriptionId, 
    refundDays  // null이면 전체 환불
);
```

**3. 환불 처리**
```java
BigDecimal refundAmount = refundService.processRefund(
    subscriptionId, 
    "환불 사유", 
    refundDays
);
```

**4. 구독 상태 변경**
- 전체 환불: `CANCELLED`로 변경
- 부분 환불: 상태 유지 (필요시 `SUSPENDED`로 변경 가능)

### 4.3 환불 금액 계산 예시

**시나리오:**
- 요금제: 월 100,000원
- 결제일: 2025-01-01
- 환불 요청일: 2025-01-10 (10일 경과)
- 남은 기간: 20일

**계산:**
```
일일 요금 = 100,000원 / 30일 = 3,333원
환불 금액 = 3,333원 × 20일 = 66,660원
```

---

## 5. 요금제 변경 (업그레이드/다운그레이드)

### 5.1 적용 방식

**즉시 적용 (`applyImmediately = true`):**
- 요금제 변경 즉시 적용
- 차액 계산 및 추가 결제/환불 처리
- 남은 기간에 대한 일할 계산

**다음 청구일 적용 (`applyImmediately = false`):**
- 다음 청구일부터 새 요금제 적용
- 차액 없음
- 현재 청구 주기 완료 후 변경

### 5.2 업그레이드 처리

**API:**
```java
POST /api/v1/billing/subscriptions/{subscriptionId}/upgrade
{
  "newPlanId": "premium-plan-id",
  "applyImmediately": true
}
```

**처리 로직:**
1. 새 요금제 확인
2. 차액 계산 (일할 계산)
3. 추가 결제 처리 (PG API 호출)
4. 구독 요금제 변경

**차액 계산 예시:**
- 현재 요금제: 월 100,000원
- 새 요금제: 월 200,000원
- 남은 기간: 15일
- 청구 주기: 30일

```
일일 차액 = (200,000 - 100,000) / 30일 = 3,333원
추가 결제 = 3,333원 × 15일 = 50,000원
```

### 5.3 다운그레이드 처리

**API:**
```java
POST /api/v1/billing/subscriptions/{subscriptionId}/downgrade
{
  "newPlanId": "starter-plan-id",
  "applyImmediately": true
}
```

**처리 로직:**
1. 새 요금제 확인
2. 차액 계산 (일할 계산, 음수)
3. 환불 처리 (PG API 호출)
4. 구독 요금제 변경

**차액 계산 예시:**
- 현재 요금제: 월 200,000원
- 새 요금제: 월 100,000원
- 남은 기간: 15일
- 청구 주기: 30일

```
일일 차액 = (100,000 - 200,000) / 30일 = -3,333원
환불 금액 = 3,333원 × 15일 = 50,000원
```

### 5.4 통합 요금제 변경

**API:**
```java
POST /api/v1/billing/subscriptions/{subscriptionId}/change-plan
{
  "newPlanId": "new-plan-id",
  "applyImmediately": true
}
```

**처리:**
- 업그레이드/다운그레이드 자동 판단
- 차액 계산 및 처리

---

## 6. 일시정지 및 재개

### 6.1 일시정지

**API:**
```java
POST /api/v1/billing/subscriptions/{subscriptionId}/suspend
{
  "reason": "결제 실패"
}
```

**처리:**
- `ACTIVE` 상태만 일시정지 가능
- 상태를 `SUSPENDED`로 변경
- 서비스 접근 제한 (선택적)

### 6.2 재개

**API:**
```java
POST /api/v1/billing/subscriptions/{subscriptionId}/resume
```

**처리:**
- `SUSPENDED` 상태만 재개 가능
- 상태를 `ACTIVE`로 변경
- 서비스 접근 복구

---

## 7. 배치 작업

### 7.1 만료된 구독 자동 처리

**스케줄러:**
- 클래스: `SubscriptionSchedulerConfig`
- 메서드: `processExpiredSubscriptions()`
- 실행 주기: 매일 오전 2시
- 설정: `subscription.scheduler.enabled=true`

**처리 내용:**
1. 만료된 구독 조회 (`effectiveTo < 오늘`)
2. 상태를 `SUSPENDED`로 변경
3. `autoRenewal`을 `false`로 설정

### 7.2 만료 예정 구독 조회

**API:**
```java
List<String> expiringSubscriptions = expirationService
    .findSubscriptionsExpiringWithin(7);  // 7일 이내 만료
```

**용도:**
- 만료 예정 알림 발송
- 갱신 유도 마케팅

---

## 8. 구현 파일

### 8.1 서비스 인터페이스

- `SubscriptionService`: 구독 기본 CRUD 및 상태 변경
- `SubscriptionExpirationService`: 만료 처리
- `SubscriptionRefundService`: 환불 처리
- `SubscriptionPlanChangeService`: 요금제 변경

### 8.2 구현체

- `SubscriptionServiceImpl`: 구독 서비스 구현
- `SubscriptionExpirationServiceImpl`: 만료 처리 구현
- `SubscriptionRefundServiceImpl`: 환불 처리 구현
- `SubscriptionPlanChangeServiceImpl`: 요금제 변경 구현

### 8.3 스케줄러

- `SubscriptionSchedulerConfig`: 배치 작업 설정

---

## 9. API 엔드포인트

### 9.1 구독 상태 변경

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/v1/billing/subscriptions/{id}/expire` | 구독 만료 |
| `POST` | `/api/v1/billing/subscriptions/{id}/suspend` | 구독 일시정지 |
| `POST` | `/api/v1/billing/subscriptions/{id}/resume` | 구독 재개 |
| `POST` | `/api/v1/billing/subscriptions/{id}/cancel` | 구독 취소 |

### 9.2 환불

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/v1/billing/subscriptions/{id}/refund` | 구독 환불 |

### 9.3 요금제 변경

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/v1/billing/subscriptions/{id}/upgrade` | 구독 업그레이드 |
| `POST` | `/api/v1/billing/subscriptions/{id}/downgrade` | 구독 다운그레이드 |
| `POST` | `/api/v1/billing/subscriptions/{id}/change-plan` | 요금제 변경 (통합) |

---

## 10. 주의사항

### 10.1 상태 전이 제약

- `ACTIVE` → `SUSPENDED`: 일시정지 가능
- `SUSPENDED` → `ACTIVE`: 재개 가능
- `ACTIVE` → `CANCELLED`: 취소 가능
- `ACTIVE` → `TERMINATED`: 만료 가능

### 10.2 환불 제약

- 청약 철회 기간: 결제일로부터 15일 이내
- `ACTIVE` 상태만 환불 가능
- 환불 금액이 0보다 커야 함

### 10.3 요금제 변경 제약

- `ACTIVE` 상태만 변경 가능
- 동일한 요금제로 변경 불가
- 새 요금제가 존재해야 함

---

## 11. 향후 개선 사항

1. **PG 연동 강화**
   - 실제 결제/환불 API 호출
   - Webhook 처리

2. **알림 시스템**
   - 만료 예정 알림
   - 환불 완료 알림
   - 요금제 변경 알림

3. **통계 및 리포트**
   - 환불률 분석
   - 업그레이드/다운그레이드 통계
   - 만료 구독 분석

4. **자동 갱신 실패 처리**
   - 재시도 로직
   - 일시정지 자동 처리
   - 만료 전 알림

---

## 12. 참고 문서

- `docs/mgsb/MINDGARDEN_BASED_INTEGRATION_PLAN.md` - 온보딩 프로세스
- `docs/mgsb/TENANT_ID_GENERATION_GUIDE.md` - 테넌트 ID 생성
- `src/main/java/com/coresolution/core/domain/TenantSubscription.java` - 구독 엔티티

