# ERP 프로시저 자동 분개 생성 테스트 상태

**작성일**: 2025-12-18  
**상태**: 테스트 준비 완료

---

## ✅ 완료된 작업

### 1. 테스트 코드 작성
- ✅ `ErpProcedureJournalEntryIntegrationTest.java` - 통합 테스트 코드
- ✅ 모든 프로시저의 자동 분개 생성 검증 로직 포함

### 2. 테스트 실행 도구
- ✅ `scripts/testing/test-erp-procedure-journal-entry.sh` - 자동화 테스트 스크립트
- ✅ 실행 권한 부여 완료

### 3. 테스트 문서
- ✅ `docs/erp-procedure-test-guide.md` - 테스트 가이드
- ✅ `docs/erp-procedure-test-execution.md` - 테스트 실행 가이드

---

## 🧪 테스트 실행 방법

### 방법 1: 통합 테스트 (JUnit)

**필수 조건**:
- Maven 또는 Maven wrapper
- 테스트 데이터베이스 연결
- 테스트용 tenantId와 mappingId

**실행 명령**:
```bash
# Maven wrapper 사용
./mvnw test -Dtest=ErpProcedureJournalEntryIntegrationTest -Dspring.profiles.active=test

# 또는 시스템 Maven 사용
mvn test -Dtest=ErpProcedureJournalEntryIntegrationTest -Dspring.profiles.active=test
```

**주의사항**:
- 실제 데이터베이스에 테스트 데이터가 있어야 함
- `test-tenant-001` 테넌트와 `mappingId=1`이 존재해야 함
- 테스트 전에 테스트 데이터를 준비해야 할 수 있음

### 방법 2: API 테스트 (실제 서버)

**필수 조건**:
- 백엔드 서버 실행 중 (`http://localhost:8080`)
- 실제 tenantId와 mappingId
- 프로시저가 데이터베이스에 배포되어 있어야 함

**실행 명령**:
```bash
# 기본 실행
./scripts/testing/test-erp-procedure-journal-entry.sh

# 커스텀 파라미터
./scripts/testing/test-erp-procedure-journal-entry.sh "실제-tenant-id" 실제-mapping-id
```

**API 엔드포인트**:
- 할인 적용: `POST /api/v1/admin/plsql-discount-accounting/apply`
- 분개 조회: `GET /api/v1/erp/accounting/entries`
- 거래 조회: `GET /api/v1/erp/financial/transactions`

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
AND tenant_id = 'test-tenant-001' OR tenant_id IS NULL;
```

### 2. 서버 상태 확인

```bash
# 서버 헬스 체크
curl http://localhost:8080/actuator/health

# 프로시저 사용 가능 여부 확인
curl -X GET "http://localhost:8080/api/v1/admin/plsql-discount-accounting/status" \
  -H "X-Tenant-Id: test-tenant-001"
```

### 3. 테스트 데이터 준비

테스트를 실행하기 전에 다음이 필요합니다:

1. **테넌트 생성** (또는 기존 테넌트 사용)
2. **매핑 데이터 생성** (`consultant_client_mappings`)
3. **계정 설정** (공통코드에 `ERP_ACCOUNT_TYPE` 설정)
   - REVENUE (수익 계정)
   - EXPENSE (비용 계정)
   - CASH (현금 계정)

---

## 🔍 테스트 검증 항목

### ✅ 프로시저 실행 검증
- [ ] 프로시저가 성공적으로 실행되었는지 (`success: true`)
- [ ] 에러 메시지가 없는지

### ✅ FinancialTransaction 생성 검증
- [ ] 매출 거래 (INCOME) 생성 확인
- [ ] 할인 거래 (EXPENSE) 생성 확인

### ✅ 자동 분개 생성 검증
- [ ] 매출 거래에 대한 분개 자동 생성 확인
- [ ] 할인 거래에 대한 분개 자동 생성 확인
- [ ] 분개 라인이 2개인지 (차변 + 대변)
- [ ] 분개 균형 확인 (차변 = 대변)

---

## ⚠️ 주의사항

1. **테스트 데이터**: 실제 데이터베이스에 테스트 데이터가 있어야 합니다
2. **테넌트 격리**: 테스트는 특정 테넌트의 데이터만 사용합니다
3. **프로시저 배포**: 프로시저가 데이터베이스에 배포되어 있어야 합니다
4. **계정 설정**: 공통코드에 계정 타입이 설정되어 있어야 분개가 생성됩니다

---

## 📝 테스트 실행 로그

테스트 실행 후 다음 정보를 기록하세요:

- 실행 일시
- 테스트 방법 (통합 테스트 / API 테스트)
- 테스트 결과 (성공 / 실패)
- 생성된 분개 수
- 발견된 문제점

---

## 🔗 관련 문서

- `docs/erp-procedure-test-guide.md` - 테스트 가이드
- `docs/erp-procedure-test-execution.md` - 테스트 실행 가이드
- `docs/erp-procedure-integration-check.md` - 프로시저 연계 확인 보고서

