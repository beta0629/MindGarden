# ERP 프로시저 자동 분개 생성 테스트 실행 요약

**실행 일시**: 2025-12-18  
**테스트 상태**: 준비 완료

---

## ✅ 테스트 준비 완료

### 1. 테스트 코드
- ✅ `ErpProcedureJournalEntryIntegrationTest.java` - 통합 테스트 작성 완료
- ✅ 모든 프로시저의 자동 분개 생성 검증 로직 포함

### 2. 테스트 실행 도구
- ✅ `scripts/testing/test-erp-procedure-journal-entry.sh` - 자동화 스크립트
- ✅ API 경로 수정 완료 (`/api/v1/admin/plsql-discount-accounting/apply`)

### 3. 테스트 문서
- ✅ `docs/erp-procedure-test-guide.md` - 테스트 가이드
- ✅ `docs/erp-procedure-test-execution.md` - 테스트 실행 가이드
- ✅ `docs/erp-test-status.md` - 테스트 상태 문서

---

## 🧪 테스트 실행 방법

### 방법 1: 통합 테스트 (JUnit) - 권장

**실행 명령**:
```bash
mvn test -Dtest=ErpProcedureJournalEntryIntegrationTest -Dspring.profiles.active=test
```

**필수 조건**:
- Maven 설치 (✅ 확인됨: 3.9.9)
- 테스트 데이터베이스 연결
- 테스트용 데이터 준비

**테스트 항목**:
1. ApplyDiscountAccounting 프로시저 → 자동 분개 생성
2. ProcessDiscountRefund 프로시저 → 자동 분개 생성
3. FinancialTransactionService.createTransaction() → 자동 분개 생성
4. 모든 프로시저 통합 테스트

### 방법 2: API 테스트 (실제 서버)

**실행 명령**:
```bash
# 서버 실행 후
./scripts/testing/test-erp-procedure-journal-entry.sh [tenant-id] [mapping-id]
```

**필수 조건**:
- 백엔드 서버 실행 중 (❌ 현재 미실행)
- 실제 tenantId와 mappingId
- 프로시저가 데이터베이스에 배포되어 있어야 함

---

## 📋 테스트 전 확인 사항

### 1. 데이터베이스 확인

```sql
-- 프로시저 존재 확인
SHOW PROCEDURE STATUS WHERE Db = 'core_solution' AND Name = 'ApplyDiscountAccounting';

-- 테스트용 매핑 데이터 확인
SELECT id, tenant_id, discount_code 
FROM consultant_client_mappings 
WHERE tenant_id = 'test-tenant-001' 
LIMIT 1;

-- 계정 설정 확인 (공통코드)
SELECT code, code_name, code_description 
FROM common_codes 
WHERE code_group = 'ERP_ACCOUNT_TYPE' 
AND (tenant_id = 'test-tenant-001' OR tenant_id IS NULL);
```

### 2. 서버 상태 확인

```bash
# 서버 헬스 체크
curl http://localhost:8080/actuator/health

# 프로시저 사용 가능 여부 확인
curl -X GET "http://localhost:8080/api/v1/admin/plsql-discount-accounting/status" \
  -H "X-Tenant-Id: test-tenant-001"
```

---

## 🔍 검증 항목

### ✅ 프로시저 실행 검증
- [ ] 프로시저가 성공적으로 실행되었는지 (`success: true`)
- [ ] 에러 메시지가 없는지

### ✅ FinancialTransaction 생성 검증
- [ ] 매출 거래 (INCOME) 생성 확인
  - `transactionType`: "INCOME"
  - `category`: "CONSULTATION"
  - `subcategory`: "PACKAGE_SALE"
- [ ] 할인 거래 (EXPENSE) 생성 확인
  - `transactionType`: "EXPENSE"
  - `category`: "SALES_DISCOUNT"
  - `subcategory`: "PACKAGE_DISCOUNT"

### ✅ 자동 분개 생성 검증
- [ ] 매출 거래에 대한 분개 자동 생성 확인
- [ ] 할인 거래에 대한 분개 자동 생성 확인
- [ ] 분개 라인이 2개인지 (차변 + 대변)
- [ ] 분개 균형 확인 (차변 = 대변)

---

## 📊 현재 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 테스트 코드 | ✅ 완료 | `ErpProcedureJournalEntryIntegrationTest.java` |
| 테스트 스크립트 | ✅ 완료 | `test-erp-procedure-journal-entry.sh` |
| 테스트 문서 | ✅ 완료 | 3개 문서 작성 완료 |
| Maven | ✅ 사용 가능 | 버전 3.9.9 |
| 백엔드 서버 | ❌ 미실행 | API 테스트를 위해서는 서버 실행 필요 |
| 데이터베이스 | ⚠️ 확인 필요 | 테스트 데이터 준비 필요 |

---

## 🚀 다음 단계

### 즉시 실행 가능
1. **통합 테스트 실행**
   ```bash
   mvn test -Dtest=ErpProcedureJournalEntryIntegrationTest -Dspring.profiles.active=test
   ```
   - 데이터베이스 연결 확인 필요
   - 테스트 데이터 준비 필요

### 서버 실행 후 가능
2. **API 테스트 실행**
   ```bash
   # 서버 실행
   ./scripts/start-all.sh local dev
   
   # 테스트 실행
   ./scripts/testing/test-erp-procedure-journal-entry.sh
   ```

---

## 📝 테스트 실행 로그

테스트 실행 후 다음 정보를 기록하세요:

- [ ] 실행 일시
- [ ] 테스트 방법 (통합 테스트 / API 테스트)
- [ ] 테스트 결과 (성공 / 실패)
- [ ] 생성된 분개 수
- [ ] 발견된 문제점

---

## 🔗 관련 문서

- `docs/erp-procedure-test-guide.md` - 테스트 가이드
- `docs/erp-procedure-test-execution.md` - 테스트 실행 가이드
- `docs/erp-test-status.md` - 테스트 상태 문서
- `docs/erp-procedure-integration-check.md` - 프로시저 연계 확인 보고서

