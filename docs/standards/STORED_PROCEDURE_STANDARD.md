# Stored Procedure 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 Stored Procedure (저장 프로시저) 작성 및 관리 표준입니다.

### 참조 문서
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
- [로깅 표준](./LOGGING_STANDARD.md)

### 구현 위치
- **프로시저 파일**: `src/main/resources/sql/procedures/`
- **마이그레이션**: `src/main/resources/db/migration/`

---

## 🎯 프로시저 작성 원칙

### 1. 모든 핵심 비즈니스 로직은 프로시저로 구현
```
복잡한 비즈니스 로직 → Stored Procedure
단순 CRUD → JPA Repository
```

**장점**:
- ✅ 트랜잭션 일관성 보장
- ✅ 성능 최적화 (네트워크 왕복 최소화)
- ✅ 데이터 무결성 보장
- ✅ 재사용성 향상

---

### 2. 네이밍 규칙

#### 프로시저 이름
```
형식: {Action}{Entity}[WithContext]
```

**예시**:
```sql
-- 생성
CreateUser
CreateItem
CreateApprovalRequest

-- 조회
GetUserById
GetConsolidatedFinancialData
GetRefundableSessions

-- 수정
UpdateUserStatus
UpdateItemStock
UpdateDailyStatistics

-- 삭제
DeleteUser
DeleteItem

-- 처리
ProcessOnboardingApproval
ProcessRefundWithSessionAdjustment
ProcessSalaryPaymentWithErpSync

-- 검증
ValidateIntegratedAmount
CheckLowStock
CheckBudgetOverrun
```

#### 파라미터 이름
```
형식:
- IN: p_{name}
- OUT: p_{name}
- INOUT: p_{name}
```

**예시**:
```sql
IN p_user_id BIGINT
IN p_email VARCHAR(255)
IN p_tenant_id VARCHAR(100)
OUT p_success BOOLEAN
OUT p_message TEXT
OUT p_result_id BIGINT
```

---

## 📋 프로시저 구조

### 1. 기본 템플릿

```sql
-- =====================================================
-- {프로시저 설명}
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS {ProcedureName}//
CREATE PROCEDURE {ProcedureName}(
    IN p_param1 VARCHAR(255),
    IN p_param2 BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_result_id BIGINT
)
BEGIN
    -- 변수 선언
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_existing_count INT DEFAULT 0;
    
    -- 에러 핸들러
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('처리 중 오류 발생: ', v_error_message);
    END;
    
    -- 트랜잭션 시작
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_param1 IS NULL OR p_param1 = '' THEN
        SET p_success = FALSE;
        SET p_message = 'param1은 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 비즈니스 로직 실행
    -- ... 로직 구현 ...
    
    -- 3. 결과 반환
    SET p_success = TRUE;
    SET p_message = '처리가 완료되었습니다.';
    SET p_result_id = LAST_INSERT_ID();
    
    COMMIT;
    
END//

DELIMITER ;
```

---

### 2. 에러 처리

#### 표준 에러 핸들러
```sql
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    GET DIAGNOSTICS CONDITION 1
        v_error_message = MESSAGE_TEXT;
    SET p_success = FALSE;
    SET p_message = CONCAT('처리 중 오류 발생: ', v_error_message);
END;
```

#### 비즈니스 예외 처리
```sql
-- 중복 체크
SELECT COUNT(*) INTO v_existing_count
FROM users
WHERE email = p_email AND tenant_id = p_tenant_id;

IF v_existing_count > 0 THEN
    SET p_success = FALSE;
    SET p_message = '이미 존재하는 이메일입니다.';
    ROLLBACK;
    LEAVE;
END IF;
```

---

### 3. 트랜잭션 관리

```sql
-- 트랜잭션 시작
START TRANSACTION;

-- 비즈니스 로직
INSERT INTO users (...) VALUES (...);
INSERT INTO user_profiles (...) VALUES (...);

-- 성공 시 커밋
COMMIT;

-- 실패 시 롤백 (에러 핸들러에서 자동 처리)
```

---

## 💻 프로시저 유형별 예시

### 1. 생성 프로시저

```sql
-- =====================================================
-- 사용자 생성 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS CreateUser//
CREATE PROCEDURE CreateUser(
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(50),
    IN p_role VARCHAR(50),
    IN p_tenant_id VARCHAR(100),
    IN p_created_by VARCHAR(100),
    OUT p_user_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_existing_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('사용자 생성 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_email IS NULL OR p_email = '' THEN
        SET p_success = FALSE;
        SET p_message = '이메일은 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 중복 체크
    SELECT COUNT(*) INTO v_existing_count
    FROM users
    WHERE email = p_email AND tenant_id = p_tenant_id AND is_deleted = FALSE;
    
    IF v_existing_count > 0 THEN
        SET p_success = FALSE;
        SET p_message = '이미 존재하는 이메일입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 3. 사용자 생성
    INSERT INTO users (
        email, password, name, phone, role, tenant_id,
        is_active, is_deleted, created_by, created_at, updated_at
    ) VALUES (
        p_email, p_password, p_name, p_phone, p_role, p_tenant_id,
        TRUE, FALSE, p_created_by, NOW(), NOW()
    );
    
    SET p_user_id = LAST_INSERT_ID();
    SET p_success = TRUE;
    SET p_message = '사용자가 생성되었습니다.';
    
    COMMIT;
    
END//
```

---

### 2. 조회 프로시저

```sql
-- =====================================================
-- 사용자 상세 조회 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS GetUserById//
CREATE PROCEDURE GetUserById(
    IN p_user_id BIGINT,
    IN p_tenant_id VARCHAR(100)
)
BEGIN
    SELECT 
        id, email, name, phone, role, tenant_id,
        is_active, created_at, updated_at
    FROM users
    WHERE id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
END//
```

---

### 3. 수정 프로시저

```sql
-- =====================================================
-- 사용자 정보 수정 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS UpdateUser//
CREATE PROCEDURE UpdateUser(
    IN p_user_id BIGINT,
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(50),
    IN p_tenant_id VARCHAR(100),
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_user_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('사용자 수정 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 사용자 존재 여부 확인
    SELECT COUNT(*) INTO v_user_count
    FROM users
    WHERE id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    IF v_user_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '사용자를 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 사용자 정보 수정
    UPDATE users
    SET name = p_name,
        phone = p_phone,
        updated_by = p_updated_by,
        updated_at = NOW()
    WHERE id = p_user_id 
      AND tenant_id = p_tenant_id;
    
    SET p_success = TRUE;
    SET p_message = '사용자 정보가 수정되었습니다.';
    
    COMMIT;
    
END//
```

---

### 4. 삭제 프로시저 (Soft Delete)

```sql
-- =====================================================
-- 사용자 삭제 프로시저 (Soft Delete)
-- =====================================================
DROP PROCEDURE IF EXISTS DeleteUser//
CREATE PROCEDURE DeleteUser(
    IN p_user_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    IN p_deleted_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_user_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('사용자 삭제 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 사용자 존재 여부 확인
    SELECT COUNT(*) INTO v_user_count
    FROM users
    WHERE id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    IF v_user_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '사용자를 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. Soft Delete
    UPDATE users
    SET is_deleted = TRUE,
        deleted_by = p_deleted_by,
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id 
      AND tenant_id = p_tenant_id;
    
    SET p_success = TRUE;
    SET p_message = '사용자가 삭제되었습니다.';
    
    COMMIT;
    
END//
```

---

### 5. 복합 처리 프로시저

```sql
-- =====================================================
-- 환불 처리 및 세션 조정 프로시저
-- =====================================================
DROP PROCEDURE IF EXISTS ProcessRefundWithSessionAdjustment//
CREATE PROCEDURE ProcessRefundWithSessionAdjustment(
    IN p_mapping_id BIGINT,
    IN p_refund_amount DECIMAL(10,2),
    IN p_refund_sessions INT,
    IN p_reason TEXT,
    IN p_tenant_id VARCHAR(100),
    IN p_processed_by VARCHAR(100),
    OUT p_refund_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_remaining_sessions INT;
    DECLARE v_total_amount DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('환불 처리 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 매핑 정보 조회
    SELECT remaining_sessions, total_amount
    INTO v_remaining_sessions, v_total_amount
    FROM consultant_client_mappings
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    -- 2. 환불 가능 여부 확인
    IF v_remaining_sessions < p_refund_sessions THEN
        SET p_success = FALSE;
        SET p_message = '환불 가능한 세션 수를 초과했습니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 3. 환불 기록 생성
    INSERT INTO refunds (
        mapping_id, refund_amount, refund_sessions, reason,
        tenant_id, processed_by, processed_at, created_at, updated_at
    ) VALUES (
        p_mapping_id, p_refund_amount, p_refund_sessions, p_reason,
        p_tenant_id, p_processed_by, NOW(), NOW(), NOW()
    );
    
    SET p_refund_id = LAST_INSERT_ID();
    
    -- 4. 매핑 세션 수 조정
    UPDATE consultant_client_mappings
    SET remaining_sessions = remaining_sessions - p_refund_sessions,
        updated_at = NOW()
    WHERE id = p_mapping_id;
    
    -- 5. 회계 처리 (별도 프로시저 호출)
    CALL ProcessRefundAccounting(
        p_refund_id, p_refund_amount, p_tenant_id, p_processed_by,
        @accounting_success, @accounting_message
    );
    
    IF @accounting_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('회계 처리 실패: ', @accounting_message);
        ROLLBACK;
        LEAVE;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = '환불 처리가 완료되었습니다.';
    
    COMMIT;
    
END//
```

---

## ✅ 프로시저 작성 체크리스트

### 필수 사항
- [ ] 프로시저 이름은 PascalCase
- [ ] 파라미터는 p_ 접두사 사용
- [ ] 변수는 v_ 접두사 사용
- [ ] OUT 파라미터로 p_success, p_message 반환
- [ ] 에러 핸들러 구현
- [ ] 트랜잭션 관리 (START TRANSACTION, COMMIT, ROLLBACK)
- [ ] 입력값 검증
- [ ] 테넌트 ID 검증
- [ ] Soft Delete 사용
- [ ] 주석 작성

### 권장 사항
- [ ] 복잡한 로직은 여러 프로시저로 분리
- [ ] 공통 로직은 재사용 가능한 프로시저로 작성
- [ ] 성능 최적화 (인덱스 활용)
- [ ] 테스트 케이스 작성

---

## 🚫 금지 사항

### 1. Hard Delete
```sql
-- ❌ 금지
DELETE FROM users WHERE id = p_user_id;

-- ✅ 권장 (Soft Delete)
UPDATE users
SET is_deleted = TRUE,
    deleted_by = p_deleted_by,
    deleted_at = NOW()
WHERE id = p_user_id;
```

### 2. 테넌트 ID 검증 누락
```sql
-- ❌ 금지
SELECT * FROM users WHERE id = p_user_id;

-- ✅ 권장
SELECT * FROM users 
WHERE id = p_user_id 
  AND tenant_id = p_tenant_id 
  AND is_deleted = FALSE;
```

### 3. 에러 핸들러 누락
```sql
-- ❌ 금지
CREATE PROCEDURE CreateUser(...)
BEGIN
    INSERT INTO users (...) VALUES (...);
END//

-- ✅ 권장
CREATE PROCEDURE CreateUser(...)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = '오류 발생';
    END;
    
    START TRANSACTION;
    INSERT INTO users (...) VALUES (...);
    COMMIT;
END//
```

---

## 📊 프로시저 현황

### 구현된 프로시저 (50+)
| 카테고리 | 프로시저 수 | 예시 |
|---------|-----------|------|
| 사용자 관리 | 8 | CreateUser, UpdateUser |
| 급여 관리 | 10 | ProcessIntegratedSalaryCalculation |
| 회계 관리 | 12 | ValidateIntegratedAmount |
| 구매 관리 | 8 | CreateItem, UpdateItemStock |
| 예산 관리 | 6 | CreateBudget, TrackBudgetUsage |
| 환불 관리 | 6 | ProcessRefundWithSessionAdjustment |

---

## 💡 베스트 프랙티스

### 1. 명확한 OUT 파라미터
```sql
OUT p_success BOOLEAN,
OUT p_message TEXT,
OUT p_result_id BIGINT
```

### 2. 상세한 에러 메시지
```sql
SET p_message = CONCAT('사용자 생성 중 오류 발생: ', v_error_message);
```

### 3. 트랜잭션 일관성
```sql
START TRANSACTION;
-- 모든 비즈니스 로직
COMMIT;
```

---

## 📞 문의

Stored Procedure 표준 관련 문의:
- 백엔드 팀
- 데이터베이스 팀

**최종 업데이트**: 2025-12-02

