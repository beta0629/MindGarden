# 표준화 작업 후 테스트 실행 가이드

**작성일**: 2025-12-05  
**최종 업데이트**: 2025-12-05  
**상태**: 실행 가이드 작성 완료

---

## 📋 개요

표준화 작업 후 테스트를 실행하기 위한 단계별 가이드입니다.

---

## 🔧 테스트 환경 준비

### 1. 개발 서버 접속 정보 확인

**SSH 접속**:
```bash
ssh root@beta0629.cafe24.com
```

**MySQL 접속**:
```bash
mysql -h beta0629.cafe24.com -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution
```

### 2. 로컬 환경 변수 설정

```bash
# Windows (PowerShell)
$env:DB_HOST="beta0629.cafe24.com"
$env:DB_PORT="3306"
$env:DB_NAME="core_solution"
$env:DB_USERNAME="mindgarden_dev"
$env:DB_PASSWORD="MindGardenDev2025!@#"

# Linux/Mac
export DB_HOST=beta0629.cafe24.com
export DB_PORT=3306
export DB_NAME=core_solution
export DB_USERNAME=mindgarden_dev
export DB_PASSWORD="MindGardenDev2025!@#"
```

---

## 🧪 Phase 1: 프로시저 표준화 테스트

### Step 1-1: SQL 스크립트 테스트 (프로시저 정의 검증)

**목적**: 프로시저가 표준을 준수하는지 SQL 레벨에서 검증

**실행 방법**:

#### 방법 1: 개발 서버에서 직접 실행
```bash
# SSH 접속
ssh root@beta0629.cafe24.com

# MySQL 접속 후 스크립트 실행
mysql -h beta0629.cafe24.com -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution < /path/to/test_procedures_comprehensive.sql
```

#### 방법 2: 로컬에서 원격 실행
```bash
# MySQL 클라이언트가 설치되어 있어야 함
mysql -h beta0629.cafe24.com -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution < scripts/testing/test_procedures_comprehensive.sql
```

**검증 항목**:
- [ ] 프로시저 목록 확인 (예상: 46개 이상)
- [ ] `p_tenant_id` 파라미터 존재 확인
- [ ] `branch_code` 파라미터 없음 확인
- [ ] 프로시저 정의에서 `branch_code` 사용 없음 확인
- [ ] 필수 프로시저 존재 확인

**결과 기록**: `TEST_EXECUTION_LOG.md`에 기록

---

### Step 1-2: Java 통합 테스트 실행

**목적**: 프로시저가 실제로 올바르게 동작하는지 검증

**실행 방법**:

#### 방법 1: Maven으로 실행
```bash
cd MindGarden
mvn test -Dtest=StoredProcedureStandardizationIntegrationTest -Dspring.profiles.active=test
```

#### 방법 2: IDE에서 실행
- IntelliJ IDEA: `StoredProcedureStandardizationIntegrationTest` 클래스 우클릭 → Run
- Eclipse: `StoredProcedureStandardizationIntegrationTest` 클래스 우클릭 → Run As → JUnit Test

**테스트 케이스** (12개):
1. [ ] `testCheckTimeConflictWithTenantId()` - CheckTimeConflict 프로시저 테스트
2. [ ] `testUpdateDailyStatisticsWithTenantId()` - UpdateDailyStatistics 프로시저 테스트
3. [ ] `testValidateConsultationRecordBeforeCompletionWithTenantId()` - ValidateConsultationRecordBeforeCompletion 프로시저 테스트
4. [ ] `testCreateConsultationRecordReminderWithTenantId()` - CreateConsultationRecordReminder 프로시저 테스트
5. [ ] `testGetRefundableSessionsWithTenantId()` - GetRefundableSessions 프로시저 테스트
6. [ ] `testGetRefundStatisticsWithTenantId()` - GetRefundStatistics 프로시저 테스트
7. [ ] `testValidateIntegratedAmountWithTenantId()` - ValidateIntegratedAmount 프로시저 테스트
8. [ ] `testGetConsolidatedFinancialDataWithTenantId()` - GetConsolidatedFinancialData 프로시저 테스트
9. [ ] `testTenantIsolation()` - 테넌트 격리 검증
10. [ ] `testStandardizedOutParameters()` - 표준화된 OUT 파라미터 검증
11. [ ] `testSoftDeleteCondition()` - Soft Delete 조건 검증
12. [ ] `testStandardizedErrorHandler()` - 에러 핸들러 표준화 검증

**결과 기록**: `TEST_EXECUTION_LOG.md`에 기록

---

### Step 1-3: 수동 프로시저 검증

**목적**: 프로시저별 상세 검증

**실행 방법**:
```bash
# 개발 서버에 SSH 접속
ssh root@beta0629.cafe24.com

# MySQL 접속
mysql -h beta0629.cafe24.com -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution

# 수동 검증 스크립트 실행
source database/schema/manual_procedure_check.sql
```

**검증 항목**:
- [ ] 현재 등록된 프로시저 목록 확인
- [ ] 필요한 프로시저 존재 여부 확인
- [ ] 총 프로시저 개수 확인

---

## 🧪 Phase 2: Service 계층 테스트

### Step 2-1: Service 메서드 검증

**실행 방법**:
```bash
# Maven으로 실행
mvn test -Dtest=ServiceStandardizationTest -Dspring.profiles.active=test
```

**검증 항목**:
- [ ] Service 메서드에서 `branchCode` 파라미터 없음 확인
- [ ] Repository 쿼리에서 `branchCode` 조건 없음 확인
- [ ] `tenantId` 기반으로만 데이터 조회 확인

---

## 🧪 Phase 3: API 경로 표준화 테스트

### Step 3-1: API 경로 검증 (완료 ✅)

**실행 방법**:
```bash
cd MindGarden
node scripts/testing/test_api_standardization.js
```

**결과**: ✅ 220개 통과, 0개 실패

---

## 🧪 Phase 4: 역할 시스템 테스트

### Step 4-1: 역할 하드코딩 제거 검증

**실행 방법**:
```bash
# 코드 스캔
grep -r "\"ADMIN\"" src/main/java/com/coresolution/consultation/service --exclude-dir=target
grep -r "\"CONSULTANT\"" src/main/java/com/coresolution/consultation/service --exclude-dir=target
grep -r "\"CLIENT\"" src/main/java/com/coresolution/consultation/service --exclude-dir=target
```

**검증 항목**:
- [ ] 하드코딩된 역할 문자열 없음 확인
- [ ] `UserRole` enum 사용 확인
- [ ] `UserRole.isAdmin()` 메서드 사용 확인

---

## 🧪 Phase 5: 프론트엔드 테스트

### Step 5-1: 브랜치 코드 제거 검증

**실행 방법**:
```bash
cd MindGarden/frontend
npm test -- --testPathPattern="standardization"
```

**검증 항목**:
- [ ] API 호출에서 `branchCode` 파라미터 없음 확인
- [ ] 컴포넌트에서 `branchCode` prop 없음 확인

---

## 📊 테스트 결과 기록

### 테스트 실행 후 결과 기록

1. **SQL 스크립트 테스트 결과**
   - `TEST_EXECUTION_LOG.md`에 결과 기록
   - 통과/실패 개수 기록
   - 발견된 오류 기록

2. **Java 통합 테스트 결과**
   - 테스트 실행 로그 확인
   - 실패한 테스트 케이스 기록
   - 오류 메시지 기록

3. **발견된 오류 정리**
   - Critical 오류 우선 수정
   - High 우선순위 오류 수정
   - Medium/Low 우선순위 오류 점진적 수정

---

## 🚨 예상 오류 및 대응

### 1. 프로시저 배포되지 않음

**증상**: 
- Java 테스트에서 프로시저 호출 실패
- "Procedure does not exist" 오류

**대응**:
1. 표준화된 프로시저를 DB에 배포
2. 배포 스크립트 실행: `database/schema/procedures_standardized/deployment/`
3. 재테스트 실행

---

### 2. 프로시저 파라미터 불일치

**증상**:
- "Parameter index out of range" 오류
- 프로시저 호출 실패

**대응**:
1. 프로시저 파라미터 확인
2. Java 코드의 프로시저 호출 부분 수정
3. 재테스트 실행

---

### 3. 테넌트 격리 실패

**증상**:
- 다른 테넌트의 데이터 조회 가능
- 테스트 실패

**대응**:
1. 프로시저 WHERE 절에 `tenant_id` 조건 추가 확인
2. 프로시저 재표준화
3. 재테스트 실행

---

## 📝 체크리스트

### 테스트 준비
- [ ] 개발 서버 접속 정보 확인
- [ ] 로컬 환경 변수 설정
- [ ] 테스트 스크립트 확인

### 테스트 실행
- [ ] Phase 1: 프로시저 표준화 테스트
  - [ ] SQL 스크립트 테스트
  - [ ] Java 통합 테스트
  - [ ] 수동 프로시저 검증
- [ ] Phase 2: Service 계층 테스트
- [ ] Phase 3: API 경로 표준화 테스트 (완료 ✅)
- [ ] Phase 4: 역할 시스템 테스트
- [ ] Phase 5: 프론트엔드 테스트

### 결과 기록
- [ ] 테스트 결과 `TEST_EXECUTION_LOG.md`에 기록
- [ ] 발견된 오류 정리
- [ ] 오류 수정 및 재테스트

---

## 🔗 참조 문서

- [테스트 계획](./TESTING_PLAN.md)
- [프로시저 테스트 계획](./PROCEDURE_TEST_PLAN.md)
- [테스트 실행 로그](./TEST_EXECUTION_LOG.md)
- [테스트 실행 보고서](./TEST_EXECUTION_REPORT.md)

---

**최종 업데이트**: 2025-12-05

