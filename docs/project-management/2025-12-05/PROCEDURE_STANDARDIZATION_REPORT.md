# 프로시저 표준화 작업 보고서

**작성일**: 2025-12-05  
**작업 범위**: 모든 Stored Procedure 표준화  
**상태**: 진행 중

---

## 📋 개요

프로시저 표준화 작업이 누락되어 있었음을 확인하고, 표준화 원칙에 따라 모든 프로시저를 표준화하는 작업을 진행합니다.

### 참조 문서
- [Stored Procedure 표준](../../standards/STORED_PROCEDURE_STANDARD.md)
- [데이터베이스 스키마 표준](../../standards/DATABASE_SCHEMA_STANDARD.md)

---

## 🔍 발견된 표준 위반 사항

### 1. 테넌트 ID 검증 누락 ⚠️ **최우선**
- **문제**: 대부분의 프로시저에 `p_tenant_id` 파라미터 없음
- **위험도**: 🔴 **높음** (테넌트 격리 보안 이슈)
- **영향**: 테넌트 간 데이터 접근 가능성

**예시**:
```sql
-- ❌ 표준 위반
WHERE id = p_mapping_id;

-- ✅ 표준 준수
WHERE id = p_mapping_id 
  AND tenant_id = p_tenant_id 
  AND is_deleted = FALSE;
```

### 2. 브랜치 코드 사용 (표준 위반) ⚠️
- **문제**: 여러 프로시저에서 `branch_code` 파라미터/변수 사용
- **위험도**: 🟡 **중간** (레거시 코드)
- **영향**: 테넌트 기반 시스템과 불일치

**발견된 위치**:
- `UpdateMappingInfo`: `v_branch_code` 변수 사용
- `UpdateMappingStatistics`: `p_branch_code` 파라미터 사용
- `ApplyDiscountAccounting`: `p_branch_code` 파라미터 사용
- `tmp_local_procedures.sql`: 19곳에서 `branch_code` 사용

### 3. Soft Delete 조건 누락 ⚠️
- **문제**: 일부 프로시저에서 `is_deleted = FALSE` 조건 없음
- **위험도**: 🟡 **중간**
- **영향**: 삭제된 데이터 조회 가능

### 4. 에러 핸들러 형식 불일치
- **문제**: 일부 프로시저의 에러 핸들러가 표준 형식과 다름
- **위험도**: 🟢 **낮음**
- **영향**: 에러 메시지 일관성 부족

### 5. OUT 파라미터 표준화 필요
- **문제**: 일부 프로시저가 `p_result_code`, `p_result_message` 사용 (표준: `p_success`, `p_message`)
- **위험도**: 🟢 **낮음**
- **영향**: API 응답 형식 불일치

---

## ✅ 완료된 표준화 작업

### 1. UpdateMappingInfo 프로시저 표준화 ✅
**파일**: `database/schema/mapping_update_procedures_mysql.sql`

**수정 내용**:
- ✅ `p_tenant_id` 파라미터 추가
- ✅ `v_branch_code` 변수 제거
- ✅ 모든 WHERE 절에 `tenant_id` 조건 추가
- ✅ Soft Delete 조건 추가 (`is_deleted = FALSE`)
- ✅ 입력값 검증 추가
- ✅ 에러 핸들러 표준화
- ✅ `financial_transactions` INSERT 시 `tenant_id` 추가
- ✅ `UpdateMappingStatistics` 호출 시 `p_tenant_id` 전달

**수정 전**:
```sql
CREATE PROCEDURE UpdateMappingInfo(
    IN p_mapping_id BIGINT,
    ...
    IN p_branch_code VARCHAR(50)  -- ❌ 제거됨
)
```

**수정 후**:
```sql
CREATE PROCEDURE UpdateMappingInfo(
    IN p_mapping_id BIGINT,
    ...
    IN p_tenant_id VARCHAR(100),  -- ✅ 추가됨
    ...
)
```

### 2. UpdateMappingStatistics 프로시저 표준화 ✅
**파일**: `database/schema/mapping_update_procedures_mysql.sql`

**수정 내용**:
- ✅ `p_branch_code` 파라미터 → `p_tenant_id`로 변경
- ✅ 모든 WHERE 절에 `tenant_id` 조건 추가
- ✅ Soft Delete 조건 추가
- ✅ `branch_statistics` 테이블 사용 제거 (주석 처리)
- ✅ `consultant_statistics`에 `tenant_id` 추가
- ✅ 에러 핸들러 추가

### 3. CheckMappingUpdatePermission 프로시저 표준화 ✅
**파일**: `database/schema/mapping_update_procedures_mysql.sql`

**수정 내용**:
- ✅ `p_tenant_id` 파라미터 추가
- ✅ 모든 WHERE 절에 `tenant_id` 조건 추가
- ✅ Soft Delete 조건 추가
- ✅ 입력값 검증 추가
- ✅ 에러 핸들러 추가

### 4. AddSessionsToMapping 프로시저 표준화 ✅
**파일**: `database/schema/procedures_standardized/AddSessionsToMapping_standardized.sql`

**수정 내용**:
- ✅ `p_tenant_id` 파라미터 추가
- ✅ `p_created_by` 파라미터 추가
- ✅ OUT 파라미터 표준화 (`p_success`, `p_message`)
- ✅ 모든 WHERE 절에 `tenant_id` 조건 추가
- ✅ Soft Delete 조건 추가
- ✅ 입력값 검증 추가
- ✅ 에러 핸들러 표준화
- ✅ `session_usage_logs` INSERT 시 `tenant_id`, `created_by` 추가

---

## 📊 프로시저 현황

### 총 프로시저 수
- **확인된 프로시저**: 약 46개 (`local_only_routines.sql`)
- **표준화 완료**: 4개
- **표준화 필요**: 약 42개

### 프로시저 카테고리별 현황

| 카테고리 | 프로시저 수 | 표준화 완료 | 표준화 필요 |
|---------|-----------|-----------|-----------|
| 매핑 관리 | 3 | 3 | 0 |
| 회기 관리 | 1 | 1 | 0 |
| 할인 관리 | 1 | 0 | 1 |
| 급여 관리 | 10 | 0 | 10 |
| 회계 관리 | 12 | 0 | 12 |
| 구매 관리 | 8 | 0 | 8 |
| 예산 관리 | 6 | 0 | 6 |
| 환불 관리 | 6 | 0 | 6 |
| 통계/리포트 | 10+ | 0 | 10+ |
| 기타 | 5+ | 0 | 5+ |

---

## 🎯 표준화 작업 계획

### Phase 1: 핵심 프로시저 표준화 (완료 ✅)
- ✅ `UpdateMappingInfo`
- ✅ `UpdateMappingStatistics`
- ✅ `CheckMappingUpdatePermission`
- ✅ `AddSessionsToMapping`

### Phase 2: 재무/회계 프로시저 표준화 (진행 예정)
**우선순위**: 🔴 **높음** (보안 및 데이터 무결성)

**대상 프로시저**:
1. `ApplyDiscountAccounting` - 할인 회계 처리
2. `ProcessRefundWithSessionAdjustment` - 환불 처리
3. `ProcessIntegratedSalaryCalculation` - 급여 계산
4. `ProcessSalaryPaymentWithErpSync` - 급여 지급
5. `ValidateIntegratedAmount` - 금액 검증

**작업 내용**:
- `p_tenant_id` 파라미터 추가
- `branch_code` 제거
- 모든 WHERE 절에 `tenant_id` 조건 추가
- Soft Delete 조건 추가

### Phase 3: 통계/리포트 프로시저 표준화 (진행 예정)
**우선순위**: 🟡 **중간**

**대상 프로시저**:
1. `GetConsolidatedFinancialData` - 통합 재무 데이터
2. `GenerateFinancialReport` - 재무 리포트 생성
3. `GetRefundableSessions` - 환불 가능 세션 조회
4. `GetRefundStatistics` - 환불 통계
5. `GetIntegratedSalaryStatistics` - 급여 통계

**작업 내용**:
- `p_tenant_id` 파라미터 추가
- `branch_code` 제거
- 모든 WHERE 절에 `tenant_id` 조건 추가
- Soft Delete 조건 추가

### Phase 4: 기타 프로시저 표준화 (진행 예정)
**우선순위**: 🟢 **낮음**

**대상 프로시저**:
- 나머지 모든 프로시저

---

## 📝 표준화 체크리스트

각 프로시저 표준화 시 확인 사항:

### 필수 사항
- [ ] `p_tenant_id` 파라미터 추가
- [ ] 모든 WHERE 절에 `tenant_id` 조건 추가
- [ ] Soft Delete 조건 추가 (`is_deleted = FALSE`)
- [ ] `branch_code` 파라미터/변수 제거
- [ ] 에러 핸들러 구현
- [ ] 트랜잭션 관리 (START TRANSACTION, COMMIT, ROLLBACK)
- [ ] 입력값 검증
- [ ] OUT 파라미터 표준화 (`p_success`, `p_message`)

### 권장 사항
- [ ] 주석 작성
- [ ] 변수 네이밍 규칙 준수 (`v_` 접두사)
- [ ] 파라미터 네이밍 규칙 준수 (`p_` 접두사)

---

## 🔄 다음 단계

1. **Phase 2 시작**: 재무/회계 프로시저 표준화
2. **Java 코드 수정**: 프로시저 호출 시 `tenant_id` 전달하도록 수정
3. **테스트**: 표준화된 프로시저 테스트
4. **문서화**: 프로시저 사용 가이드 업데이트

---

## 📊 진행률

**전체 진행률**: 8.7% (4/46)

- Phase 1: ✅ 100% (4/4)
- Phase 2: ⏳ 0% (0/5)
- Phase 3: ⏳ 0% (0/5)
- Phase 4: ⏳ 0% (0/32)

---

**작성자**: CoreSolution  
**최종 업데이트**: 2025-12-05

