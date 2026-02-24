# ERP 프로시저 자동 분개 생성 테스트 가이드

**작성일**: 2025-12-18  
**목적**: 모든 프로시저가 실행되면 자동으로 분개가 생성되는지 검증

---

## 테스트 범위

### 자동 분개 생성이 적용된 프로시저

1. ✅ **ApplyDiscountAccounting** - 할인 적용 시 매출 거래 + 할인 거래 자동 분개 생성
2. ✅ **ProcessDiscountRefund** - 할인 환불 시 환불 거래 자동 분개 생성
3. ✅ **ProcessPartialRefund** - 부분 환불 시 환불 거래 자동 분개 생성
4. ✅ **ProcessRefundWithSessionAdjustment** - 세션 조정 환불 시 환불 거래 자동 분개 생성
5. ✅ **FinancialTransactionService.createTransaction()** - 모든 수동 거래 생성 시 자동 분개 생성

---

## 테스트 실행 방법

### 1. 통합 테스트 실행

```bash
# Maven을 사용하는 경우
mvn test -Dtest=ErpProcedureJournalEntryIntegrationTest

# 또는 Gradle을 사용하는 경우
./gradlew test --tests ErpProcedureJournalEntryIntegrationTest
```

### 2. 수동 테스트 (API 호출)

#### 2.1 ApplyDiscountAccounting 테스트

```bash
# 1. 할인 적용 프로시저 호출
curl -X POST "http://localhost:8080/api/v1/erp/discount-accounting/apply" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: test-tenant-001" \
  -d '{
    "mappingId": 1,
    "discountCode": "TEST-DISCOUNT-001",
    "originalAmount": 100000,
    "discountAmount": 10000,
    "finalAmount": 90000,
    "appliedBy": "test-user"
  }'

# 2. 생성된 분개 확인
curl -X GET "http://localhost:8080/api/v1/erp/accounting/entries?tenantId=test-tenant-001"
```

#### 2.2 ProcessDiscountRefund 테스트

```bash
# 1. 할인 환불 프로시저 호출
curl -X POST "http://localhost:8080/api/v1/erp/discount-accounting/refund" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: test-tenant-001" \
  -d '{
    "mappingId": 1,
    "refundAmount": 5000,
    "refundReason": "테스트 환불",
    "processedBy": "test-user"
  }'

# 2. 생성된 분개 확인
curl -X GET "http://localhost:8080/api/v1/erp/accounting/entries?tenantId=test-tenant-001"
```

#### 2.3 FinancialTransactionService 테스트

```bash
# 1. 거래 생성
curl -X POST "http://localhost:8080/api/v1/erp/financial/transactions" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: test-tenant-001" \
  -d '{
    "transactionType": "INCOME",
    "category": "CONSULTATION",
    "subcategory": "PACKAGE_SALE",
    "amount": 50000,
    "description": "테스트 거래",
    "transactionDate": "2025-12-18",
    "relatedEntityId": 1,
    "relatedEntityType": "CONSULTANT_CLIENT_MAPPING"
  }'

# 2. 생성된 분개 확인
curl -X GET "http://localhost:8080/api/v1/erp/accounting/entries?tenantId=test-tenant-001"
```

---

## 검증 항목

### 1. 프로시저 실행 성공 확인

- 프로시저가 성공적으로 실행되었는지 확인
- `success: true` 응답 확인

### 2. FinancialTransaction 생성 확인

- 프로시저가 생성한 `FinancialTransaction`이 존재하는지 확인
- 거래 타입, 카테고리, 금액이 올바른지 확인

### 3. 자동 분개 생성 확인

- `AccountingEntry`가 자동으로 생성되었는지 확인
- `JournalEntryLine`이 2개(차변 + 대변) 생성되었는지 확인
- 차변 합계 = 대변 합계 (분개 균형) 확인

### 4. 분개 내용 확인

- 분개 설명에 거래 설명이 포함되어 있는지 확인
- 분개 날짜가 거래 날짜와 일치하는지 확인
- 계정 매핑이 올바른지 확인 (INCOME: 현금/수익, EXPENSE: 비용/현금)

---

## 예상 결과

### ApplyDiscountAccounting 실행 시

1. **매출 거래 (INCOME)** 생성
   - 분개 생성: 현금(차변) / 수익(대변)

2. **할인 거래 (EXPENSE)** 생성
   - 분개 생성: 비용(차변) / 현금(대변)

### ProcessDiscountRefund 실행 시

1. **환불 거래 (EXPENSE)** 생성
   - 분개 생성: 비용(차변) / 현금(대변)

### FinancialTransactionService.createTransaction() 실행 시

1. **거래 생성**
   - INCOME: 분개 생성 (현금/수익)
   - EXPENSE: 분개 생성 (비용/현금)

---

## 문제 해결

### 분개가 생성되지 않는 경우

1. **계정 설정 확인**
   - 공통코드에 `ERP_ACCOUNT_TYPE`이 설정되어 있는지 확인
   - REVENUE, EXPENSE, CASH 계정이 존재하는지 확인

2. **테넌트 ID 확인**
   - `TenantContextHolder`에 올바른 테넌트 ID가 설정되어 있는지 확인

3. **로그 확인**
   - `accountingService.createJournalEntryFromTransaction()` 호출 로그 확인
   - 에러 메시지 확인

### 분개 균형이 맞지 않는 경우

1. **JournalEntryLine 확인**
   - 차변 합계와 대변 합계가 일치하는지 확인
   - 각 라인의 금액이 올바른지 확인

2. **거래 금액 확인**
   - 원본 거래의 금액이 올바른지 확인

---

## 테스트 체크리스트

- [ ] ApplyDiscountAccounting 프로시저 실행 → 자동 분개 생성 확인
- [ ] ProcessDiscountRefund 프로시저 실행 → 자동 분개 생성 확인
- [ ] ProcessPartialRefund 프로시저 실행 → 자동 분개 생성 확인
- [ ] ProcessRefundWithSessionAdjustment 프로시저 실행 → 자동 분개 생성 확인
- [ ] FinancialTransactionService.createTransaction() → 자동 분개 생성 확인
- [ ] 모든 분개의 차변 = 대변 (균형) 확인
- [ ] 테넌트 격리 확인 (다른 테넌트의 분개가 생성되지 않음)

---

## 참고 문서

- `docs/standards/ERP_ADVANCEMENT_STANDARD.md` - ERP 고도화 표준
- `docs/erp-procedure-integration-check.md` - 프로시저 연계 확인 보고서

