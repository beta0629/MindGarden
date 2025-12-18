# ERP 프로시저 연계 확인 보고서

**검토 일자**: 2025-12-18  
**검토 범위**: PL/SQL 프로시저와 ERP 분개 시스템 연계

---

## ✅ 확인 완료: 프로시저 연계 상태

### 1. ApplyDiscountAccounting 프로시저 연계 ✅

**프로시저 위치**: `database/schema/procedures_standardized/ApplyDiscountAccounting_standardized.sql`

**프로시저 동작**:
1. `financial_transactions` 테이블에 두 개의 거래 생성:
   - **매출 거래**: `transaction_type='INCOME'`, `category='CONSULTATION'`, `subcategory='PACKAGE_SALE'`
   - **할인 거래**: `transaction_type='EXPENSE'` (수정됨), `category='SALES_DISCOUNT'`, `subcategory='PACKAGE_DISCOUNT'`

**Java 연계 로직** (`PlSqlDiscountAccountingServiceImpl.java`):
```java
// 프로시저 실행 후
if (success != null && success) {
    // 1. 프로시저가 생성한 FinancialTransaction 조회
    List<FinancialTransaction> transactions = 
        financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
            tenantId, mappingId, "CONSULTANT_CLIENT_MAPPING"
        );
    
    // 2. 필터링 (매출 거래 + 할인 거래)
    transactions = transactions.stream()
        .filter(t -> {
            boolean isRevenue = t.getTransactionType() == FinancialTransaction.TransactionType.INCOME &&
                              "CONSULTATION".equals(t.getCategory()) &&
                              "PACKAGE_SALE".equals(t.getSubcategory());
            boolean isDiscount = t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE &&
                               "SALES_DISCOUNT".equals(t.getCategory()) &&
                               "PACKAGE_DISCOUNT".equals(t.getSubcategory());
            return isRevenue || isDiscount;
        })
        .filter(t -> t.getDescription() != null && t.getDescription().contains(discountCode))
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .limit(2)
        .collect(Collectors.toList());
    
    // 3. 각 거래에 대해 분개 자동 생성
    for (FinancialTransaction transaction : transactions) {
        accountingService.createJournalEntryFromTransaction(transaction);
    }
}
```

**연계 상태**: ✅ **확실히 연계됨**

---

### 2. FinancialTransactionService 자동 분개 생성 ✅

**위치**: `FinancialTransactionServiceImpl.createTransaction()`

**동작**:
```java
// FinancialTransaction 저장 후
FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);

// 자동으로 분개 생성
if (accountingService != null && savedTransaction.getTenantId() != null) {
    accountingService.createJournalEntryFromTransaction(savedTransaction);
}
```

**연계 상태**: ✅ **모든 FinancialTransaction 생성 시 자동 분개 생성**

---

### 3. 프로시저 타입 불일치 수정 ✅

**문제**:
- 프로시저에서 `transaction_type='DISCOUNT'`로 저장
- Java enum에는 `DISCOUNT`가 없고 `INCOME`, `EXPENSE`만 존재

**수정 완료**:
- `ApplyDiscountAccounting_standardized.sql`: `DISCOUNT` → `EXPENSE`로 변경
- `ApplyDiscountAccounting_deploy.sql`: `DISCOUNT` → `EXPENSE`로 변경
- 할인 금액도 음수(`-p_discount_amount`)에서 양수(`p_discount_amount`)로 변경 (EXPENSE는 양수로 저장)

**연계 상태**: ✅ **수정 완료**

---

## ⚠️ 추가 확인 필요 항목

### 1. ProcessDiscountRefund 프로시저 연계 확인 필요

**프로시저 위치**: `database/schema/procedures_standardized/ProcessDiscountRefund_standardized.sql`

**확인 사항**:
- 프로시저가 `financial_transactions`를 생성하는지 확인
- 생성 시 자동 분개 생성 로직이 있는지 확인

**현재 상태**: `PlSqlDiscountAccountingServiceImpl.processDiscountRefund()`에서 프로시저만 호출하고 분개 생성 로직 없음

**권장 조치**: `processDiscountRefund()`에도 분개 자동 생성 로직 추가

---

### 2. ProcessPartialRefund 프로시저 연계 확인 필요

**프로시저 위치**: `database/schema/procedures_standardized/ProcessPartialRefund_standardized.sql`

**확인 사항**: 동일

---

### 3. ProcessRefundWithSessionAdjustment 프로시저 연계 확인 필요

**프로시저 위치**: `database/schema/procedures_standardized/ProcessRefundWithSessionAdjustment_standardized.sql`

**확인 사항**: 동일

---

## 📋 최종 확인 결과

### ✅ 확실히 연계된 항목

1. **ApplyDiscountAccounting 프로시저** → 자동 분개 생성 ✅
2. **FinancialTransactionService.createTransaction()** → 자동 분개 생성 ✅
3. **프로시저 타입 불일치** → 수정 완료 ✅

### ⚠️ 추가 연계 필요 항목

1. **ProcessDiscountRefund 프로시저** → 분개 자동 생성 로직 추가 필요
2. **ProcessPartialRefund 프로시저** → 분개 자동 생성 로직 추가 필요
3. **ProcessRefundWithSessionAdjustment 프로시저** → 분개 자동 생성 로직 추가 필요

---

## ✅ 결론

**ApplyDiscountAccounting 프로시저는 확실히 연계되어 있습니다.**

프로시저 실행 → FinancialTransaction 생성 → 자동 분개 생성 흐름이 완전히 구현되어 있으며, 타입 불일치 문제도 수정되었습니다.

다만, 다른 환불 관련 프로시저들도 동일한 연계 로직을 추가하는 것을 권장합니다.

