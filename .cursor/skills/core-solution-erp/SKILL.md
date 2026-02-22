---
name: core-solution-erp
description: Core Solution(MindGarden) ERP 연동·거래 생성·트러블슈팅. confirm-payment vs confirm-deposit 흐름, amount-info API, relatedTransactions 조회.
---

# Core Solution ERP 연동 룰

ERP(재무 거래) 연동, 매칭 입금/결제 확인, 거래 생성 관련 작업 시 이 스킬을 적용하세요.

## When to Use

- 매칭 입금 확인 / 결제 확인 API 연동
- amount-info, relatedTransactions 조회 구현
- ERP 거래 미생성 트러블슈팅
- AdminServiceImpl 거래 생성 로직 수정·추가

## ERP 연동 흐름

### confirm-payment vs confirm-deposit

| 구분 | confirm-payment | confirm-deposit |
|------|-----------------|-----------------|
| **API** | `POST /api/v1/admin/mappings/{id}/confirm-payment` | `POST /api/v1/admin/mappings/{id}/confirm-deposit` |
| **요청 파라미터** | paymentMethod, paymentReference, paymentAmount | depositReference |
| **ERP 거래 타입** | INCOME (입금 시) / RECEIVABLES (미수금) | INCOME |
| **용도** | 결제·입금 확인 (금액 포함) | 입금 확인 (현금 수입) |
| **핵심 로직** | AdminServiceImpl.confirmPayment(4arg) → createConsultationIncomeTransaction | AdminServiceImpl.confirmDeposit → createConsultationIncomeTransaction |

### confirm-payment 상세

- **4인자 오버로드** (paymentAmount 포함): 입금 확인 → **INCOME** 거래 생성
- **3인자 오버로드** (금액 없음): 결제 확인 (미수금) → **RECEIVABLES** 거래 생성

### confirm-deposit 상세

- confirm-payment와 **동일한** ERP 거래(INCOME) 생성 로직 적용
- `createConsultationIncomeTransaction`, `createAdditionalSessionIncomeTransaction` 재사용
- packagePrice / paymentAmount 유효성 검사, 중복 거래 방지 포함

## relatedTransactions 조회

### amount-info API

```
GET /api/v1/admin/amount-management/mappings/{mappingId}/amount-info
```

**담당**: `AmountManagementController`, `AmountManagementServiceImpl.getIntegratedAmountInfo()`

**반환 구조**:

- `packagePrice`, `paymentAmount`, `packageName`, `totalSessions`
- `accurateAmount`: 거래용 금액 (packagePrice 우선, 없으면 paymentAmount)
- `relatedTransactions`: 관련 ERP 거래 목록 (id, amount, type, description, createdAt)
- `relatedTransactionCount`: relatedTransactions 개수
- `isConsistent`, `consistencyMessage`, `recommendation`: 금액 일관성 검사 결과

**관련 엔티티**: `CONSULTANT_CLIENT_MAPPING`, `CONSULTANT_CLIENT_MAPPING_ADDITIONAL`, `CONSULTANT_CLIENT_MAPPING_REFUND`

## 트러블슈팅: 거래 미생성 원인

1. **유효 금액 없음**: packagePrice, paymentAmount 모두 null 또는 0 → 거래 스킵
2. **중복 거래 방지**: 동일 mappingId + INCOME 이미 존재 → 정상 종료(에러 아님)
3. **tenantId 누락**: 멀티테넌트 컨텍스트 없음 → 조회·생성 실패
4. **금액 일관성 경고**: packagePrice와 ERP 금액 불일치 시 경고 로그만, 거래는 생성됨

## 로그 키워드 (AdminServiceImpl)

| 키워드 | 의미 |
|--------|------|
| `상담료 수입 거래 자동 생성 완료` | INCOME 거래 생성 성공 |
| `상담료 수입 거래 자동 생성 실패` | INCOME 거래 생성 예외 |
| `중복 거래 방지` | 이미 존재 → 스킵 (정상) |
| `유효한 거래 금액을 결정할 수 없습니다` | packagePrice/paymentAmount 둘 다 없음 |
| `[중앙화] 상담료 수입 거래 생성 완료` | createConsultationIncomeTransaction 성공 |
| `[미수금] 매출채권 거래 생성 완료` | RECEIVABLES 거래 생성 성공 |
| `입금 확인 ERP 거래 스킵` | effectiveAmount 없음으로 거래 미생성 |

상세 트러블슈팅 절차는 `docs/standards/ERP_TROUBLESHOOTING.md` 참조.
