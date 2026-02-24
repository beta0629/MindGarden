# ERP 프로시저 자동 분개 생성 테스트 실행 가이드

**작성일**: 2025-12-18  
**목적**: 실제 환경에서 ERP 프로시저 자동 분개 생성 기능 검증

---

## 테스트 실행 방법

### 방법 1: 자동화 스크립트 사용 (권장)

```bash
# 기본 실행 (기본값 사용)
./scripts/testing/test-erp-procedure-journal-entry.sh

# 커스텀 파라미터 사용
./scripts/testing/test-erp-procedure-journal-entry.sh "tenant-001" 123

# 환경 변수 설정
export BASE_URL="http://localhost:8080"
./scripts/testing/test-erp-procedure-journal-entry.sh
```

### 방법 2: 수동 API 호출

#### 1단계: ApplyDiscountAccounting 프로시저 실행

```bash
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
```

**예상 응답:**
```json
{
  "success": true,
  "message": "할인 적용 완료. 회계거래ID: 123",
  "mappingId": 1
}
```

#### 2단계: 생성된 분개 확인

```bash
curl -X GET "http://localhost:8080/api/v1/erp/accounting/entries" \
  -H "X-Tenant-Id: test-tenant-001"
```

**예상 응답:**
```json
[
  {
    "id": 1,
    "entryNumber": "JE-2025-12-18-001",
    "entryDate": "2025-12-18",
    "description": "거래 자동 분개: 패키지 판매 - 원래 금액 (할인코드: TEST-DISCOUNT-001)",
    "totalDebit": 100000,
    "totalCredit": 100000,
    "entryStatus": "DRAFT"
  },
  {
    "id": 2,
    "entryNumber": "JE-2025-12-18-002",
    "entryDate": "2025-12-18",
    "description": "거래 자동 분개: 패키지 할인 - TEST-DISCOUNT-001 (10000원)",
    "totalDebit": 10000,
    "totalCredit": 10000,
    "entryStatus": "DRAFT"
  }
]
```

#### 3단계: 분개 상세 확인

```bash
curl -X GET "http://localhost:8080/api/v1/erp/accounting/entries/1" \
  -H "X-Tenant-Id: test-tenant-001"
```

**예상 응답:**
```json
{
  "id": 1,
  "entryNumber": "JE-2025-12-18-001",
  "entryDate": "2025-12-18",
  "description": "거래 자동 분개: 패키지 판매 - 원래 금액 (할인코드: TEST-DISCOUNT-001)",
  "totalDebit": 100000,
  "totalCredit": 100000,
  "entryStatus": "DRAFT",
  "lines": [
    {
      "id": 1,
      "accountId": 1,
      "debitAmount": 100000,
      "creditAmount": 0,
      "description": "수익 입금"
    },
    {
      "id": 2,
      "accountId": 2,
      "debitAmount": 0,
      "creditAmount": 100000,
      "description": "패키지 판매 - 원래 금액 (할인코드: TEST-DISCOUNT-001)"
    }
  ]
}
```

#### 4단계: FinancialTransaction 확인

```bash
curl -X GET "http://localhost:8080/api/v1/erp/financial/transactions?tenantId=test-tenant-001&relatedEntityId=1&relatedEntityType=CONSULTANT_CLIENT_MAPPING" \
  -H "X-Tenant-Id: test-tenant-001"
```

---

## 검증 체크리스트

### ✅ 프로시저 실행 검증

- [ ] 프로시저가 성공적으로 실행되었는지 확인 (`success: true`)
- [ ] 에러 메시지가 없는지 확인

### ✅ FinancialTransaction 생성 검증

- [ ] 매출 거래 (INCOME)가 생성되었는지 확인
  - `transactionType`: "INCOME"
  - `category`: "CONSULTATION"
  - `subcategory`: "PACKAGE_SALE"
  - `amount`: 100000

- [ ] 할인 거래 (EXPENSE)가 생성되었는지 확인
  - `transactionType`: "EXPENSE"
  - `category`: "SALES_DISCOUNT"
  - `subcategory`: "PACKAGE_DISCOUNT"
  - `amount`: 10000

### ✅ 자동 분개 생성 검증

- [ ] 매출 거래에 대한 분개가 생성되었는지 확인
  - 분개 설명에 거래 설명이 포함되어 있는지
  - 분개 날짜가 거래 날짜와 일치하는지
  - 분개 라인이 2개인지 (차변 + 대변)

- [ ] 할인 거래에 대한 분개가 생성되었는지 확인
  - 분개 설명에 거래 설명이 포함되어 있는지
  - 분개 날짜가 거래 날짜와 일치하는지
  - 분개 라인이 2개인지 (차변 + 대변)

### ✅ 분개 균형 검증

- [ ] 각 분개의 차변 합계 = 대변 합계 확인
- [ ] 분개 라인의 계정 매핑이 올바른지 확인
  - INCOME: 현금(차변) / 수익(대변)
  - EXPENSE: 비용(차변) / 현금(대변)

---

## 문제 해결

### 프로시저 실행 실패

**증상**: `success: false` 응답

**원인 및 해결**:
1. **매핑 ID가 존재하지 않음**
   - 해결: 실제 존재하는 `mappingId` 사용
   - 확인: `consultant_client_mappings` 테이블 조회

2. **테넌트 ID 불일치**
   - 해결: 올바른 `tenantId` 사용
   - 확인: `X-Tenant-Id` 헤더 확인

3. **프로시저가 데이터베이스에 없음**
   - 해결: 프로시저 배포 스크립트 실행
   - 확인: `database/schema/procedures_standardized/deployment/` 폴더 확인

### 분개가 생성되지 않음

**증상**: 프로시저는 성공했지만 분개가 생성되지 않음

**원인 및 해결**:
1. **계정 설정이 없음**
   - 해결: 공통코드에 `ERP_ACCOUNT_TYPE` 설정
   - 확인: `common_codes` 테이블에서 `ERP_ACCOUNT_TYPE` 조회
   - 필요 계정: REVENUE, EXPENSE, CASH

2. **테넌트 컨텍스트 불일치**
   - 해결: `TenantContextHolder`에 올바른 테넌트 ID 설정 확인
   - 확인: 로그에서 "테넌트 ID 불일치" 메시지 확인

3. **로그 확인**
   - 해결: 백엔드 로그에서 다음 메시지 확인:
     - `✅ ERP 고도화 연동: 분개 생성 완료`
     - `⚠️ ERP 고도화 연동: 분개 생성 실패`

### 분개 균형이 맞지 않음

**증상**: 차변 합계 ≠ 대변 합계

**원인 및 해결**:
1. **거래 금액 확인**
   - 해결: 원본 거래의 금액이 올바른지 확인

2. **분개 라인 확인**
   - 해결: 각 라인의 차변/대변 금액이 올바른지 확인
   - 확인: 분개 상세 API에서 `lines` 배열 확인

---

## 테스트 시나리오

### 시나리오 1: 할인 적용 → 자동 분개 생성

1. ApplyDiscountAccounting 프로시저 실행
2. 매출 거래 (INCOME) 생성 확인
3. 할인 거래 (EXPENSE) 생성 확인
4. 매출 거래에 대한 분개 자동 생성 확인
5. 할인 거래에 대한 분개 자동 생성 확인
6. 분개 균형 확인

### 시나리오 2: 할인 환불 → 자동 분개 생성

1. ProcessDiscountRefund 프로시저 실행
2. 환불 거래 (EXPENSE) 생성 확인
3. 환불 거래에 대한 분개 자동 생성 확인
4. 분개 균형 확인

### 시나리오 3: 수동 거래 생성 → 자동 분개 생성

1. FinancialTransactionService.createTransaction() 호출
2. 거래 생성 확인
3. 거래에 대한 분개 자동 생성 확인
4. 분개 균형 확인

---

## 참고 문서

- `docs/erp-procedure-test-guide.md` - 테스트 가이드
- `docs/erp-procedure-integration-check.md` - 프로시저 연계 확인 보고서
- `docs/standards/ERP_ADVANCEMENT_STANDARD.md` - ERP 고도화 표준

