# MindGarden PL/SQL 통계 시스템 및 ERP 연동 도입 계획서

## 📋 프로젝트 개요

**프로젝트명**: MindGarden 통계 시스템 PL/SQL 최적화 및 ERP 통합  
**목표**: Java Stream 기반 통계 처리를 PL/SQL로 이전하고 ERP 시스템과 실시간 연동  
**기간**: 총 12-14주 (5단계)  
**담당자**: 개발팀, DBA팀, ERP팀  

## 🔍 현재 상황 분석

### 현재 구현된 복잡한 통계 로직들

#### 1. **환불 통계 (AdminServiceImpl.java)**
```java
// 현재: 복잡한 Java Stream 처리
List<ConsultantClientMapping> terminatedMappings = mappingRepository.findAll().stream()
    .filter(mapping -> mapping.getStatus().name().equals(terminatedStatus))
    .filter(mapping -> mapping.getTerminatedAt() != null)
    .filter(mapping -> mapping.getTerminatedAt().isAfter(startDate) && mapping.getTerminatedAt().isBefore(endDate))
    .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
    .collect(Collectors.toList());

// 상담사별 환불 통계
Map<String, Map<String, Object>> consultantRefundStats = terminatedMappings.stream()
    .collect(Collectors.groupingBy(
        mapping -> mapping.getConsultant().getName(),
        Collectors.collectingAndThen(Collectors.toList(), mappings -> {
            // 복잡한 집계 로직...
        })
    ));
```

#### 2. **세금 통계 (TaxCalculationServiceImpl.java)**
```java
// 현재: 반복문을 통한 복잡한 계산
for (SalaryCalculation calculation : calculations) {
    BigDecimal grossAmount = calculation.getGrossAmount();
    totalGrossAmount = totalGrossAmount.add(grossAmount);
    
    BigDecimal withholdingTax = calculateWithholdingTax(grossAmount);
    BigDecimal localIncomeTax = calculateLocalIncomeTax(grossAmount);
    // ... 복잡한 세금 계산 로직
}
```

#### 3. **재무 거래 통계 (FinancialTransactionServiceImpl.java)**
```java
// 현재: 다중 Stream 처리
Map<String, BigDecimal> categoryBreakdown = transactions.stream()
    .collect(Collectors.groupingBy(
        t -> t.getCategory() != null ? t.getCategory() : "기타",
        Collectors.reducing(BigDecimal.ZERO, 
            FinancialTransaction::getAmount, 
            BigDecimal::add)
    ));
```

#### 4. **ERP 실시간 데이터 (ErpServiceImpl.java)**
```java
// 현재: 대용량 데이터 조회 후 Java에서 처리
List<FinancialTransactionResponse> transactions = 
    financialTransactionService.getTransactions(PageRequest.of(0, 10000)).getContent();

BigDecimal totalIncome = transactions.stream()
    .filter(t -> "INCOME".equals(t.getTransactionType()))
    .map(FinancialTransactionResponse::getAmount)
    .reduce(BigDecimal.ZERO, BigDecimal::add);
```

### 문제점 분석
- **성능 저하**: 대용량 데이터를 메모리에서 처리
- **복잡성 증가**: 비즈니스 로직이 Java 코드에 분산
- **ERP 연동 부족**: 실시간 데이터 동기화 어려움
- **확장성 제한**: 새로운 통계 요구사항 대응 어려움

## 🚀 단계별 구현 계획

### **Phase 1: 데이터베이스 인프라 구축 (2-3주)**

#### 1.1 성능 최적화 인덱스 생성
```sql
-- 복합 인덱스 생성
CREATE INDEX idx_schedules_consultant_date_status ON schedules(consultant_id, schedule_date, status);
CREATE INDEX idx_mappings_branch_status_terminated ON consultant_client_mappings(branch_code, status, terminated_at);
CREATE INDEX idx_ratings_consultant_status_rated ON consultant_ratings(consultant_id, status, rated_at);
CREATE INDEX idx_financial_trans_branch_date_type ON financial_transactions(branch_code, transaction_date, transaction_type);
CREATE INDEX idx_salary_calc_period_employee ON salary_calculations(calculation_period, employee_id);

-- 파티셔닝 테이블 생성 (대용량 데이터용)
CREATE TABLE schedules_partitioned (
    schedule_id NUMBER,
    consultant_id NUMBER,
    client_id NUMBER,
    schedule_date DATE,
    status VARCHAR2(20),
    branch_code VARCHAR2(20),
    session_fee NUMBER,
    -- 기타 컬럼들
) PARTITION BY RANGE (schedule_date) (
    PARTITION p_2024_q1 VALUES LESS THAN (DATE '2024-04-01'),
    PARTITION p_2024_q2 VALUES LESS THAN (DATE '2024-07-01'),
    PARTITION p_2024_q3 VALUES LESS THAN (DATE '2024-10-01'),
    PARTITION p_2024_q4 VALUES LESS THAN (DATE '2025-01-01'),
    PARTITION p_2025_q1 VALUES LESS THAN (DATE '2025-04-01')
);
```

#### 1.2 통계 테이블 설계
```sql
-- 일별 통계 테이블
CREATE TABLE daily_statistics (
    stat_date DATE,
    branch_code VARCHAR2(20),
    total_consultations NUMBER,
    completed_consultations NUMBER,
    cancelled_consultations NUMBER,
    total_revenue NUMBER,
    avg_rating NUMBER,
    total_refunds NUMBER,
    refund_amount NUMBER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (stat_date, branch_code)
);

-- 상담사별 성과 테이블
CREATE TABLE consultant_performance (
    consultant_id NUMBER,
    performance_date DATE,
    completion_rate NUMBER,
    avg_rating NUMBER,
    total_revenue NUMBER,
    client_retention_rate NUMBER,
    performance_score NUMBER,
    grade VARCHAR2(10),
    refund_rate NUMBER,
    PRIMARY KEY (consultant_id, performance_date)
);

-- ERP 연동 테이블
CREATE TABLE erp_sync_log (
    sync_id NUMBER PRIMARY KEY,
    sync_type VARCHAR2(50),
    sync_date TIMESTAMP,
    records_processed NUMBER,
    status VARCHAR2(20),
    error_message CLOB
);
```

#### 1.3 PL/SQL 패키지 구조
```sql
-- 통계 관련 패키지
CREATE OR REPLACE PACKAGE statistics_pkg AS
    -- 환불 통계
    PROCEDURE get_refund_statistics(
        p_period IN VARCHAR2,
        p_branch_code IN VARCHAR2,
        p_result OUT SYS_REFCURSOR
    );
    
    -- 상담사 성과 분석
    PROCEDURE get_consultant_performance(
        p_period IN VARCHAR2,
        p_branch_code IN VARCHAR2,
        p_result OUT SYS_REFCURSOR
    );
    
    -- 세금 통계
    PROCEDURE get_tax_statistics(
        p_period IN VARCHAR2,
        p_result OUT SYS_REFCURSOR
    );
    
    -- 재무 통계
    PROCEDURE get_financial_statistics(
        p_period IN VARCHAR2,
        p_branch_code IN VARCHAR2,
        p_result OUT SYS_REFCURSOR
    );
    
    -- 실시간 통계 업데이트
    PROCEDURE update_daily_statistics(p_date IN DATE);
    
END statistics_pkg;

-- ERP 연동 패키지
CREATE OR REPLACE PACKAGE erp_integration_pkg AS
    -- ERP 데이터 동기화
    PROCEDURE sync_erp_data(p_sync_type IN VARCHAR2);
    
    -- 실시간 재무 데이터 조회
    PROCEDURE get_realtime_financial_data(
        p_branch_code IN VARCHAR2,
        p_result OUT SYS_REFCURSOR
    );
    
    -- ERP 알림 처리
    PROCEDURE process_erp_notifications;
    
END erp_integration_pkg;
```

### **Phase 2: 핵심 통계 PL/SQL화 (3-4주)**

#### 2.1 환불 통계 고도화
```sql
-- 환불 통계 상세 분석 프로시저
CREATE OR REPLACE PROCEDURE statistics_pkg.get_refund_statistics(
    p_period IN VARCHAR2,
    p_branch_code IN VARCHAR2,
    p_result OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result FOR
    WITH refund_analysis AS (
        SELECT 
            m.mapping_id,
            m.branch_code,
            m.consultant_id,
            c.name as consultant_name,
            cl.name as client_name,
            m.package_name,
            m.package_price,
            m.total_sessions,
            m.used_sessions,
            m.terminated_at,
            m.notes,
            -- 환불 사유 추출
            CASE 
                WHEN m.notes LIKE '%고객 요청%' THEN 'CLIENT_REQUEST'
                WHEN m.notes LIKE '%서비스 문제%' THEN 'SERVICE_ISSUE'
                WHEN m.notes LIKE '%상담사 문제%' THEN 'CONSULTANT_ISSUE'
                WHEN m.notes LIKE '%강제 종료%' THEN 'FORCE_TERMINATION'
                ELSE 'OTHER'
            END as refund_reason,
            -- 환불 금액 계산
            ROUND((m.package_price * (m.total_sessions - m.used_sessions)) / m.total_sessions, 0) as refund_amount,
            -- 환불률 계산
            ROUND(((m.total_sessions - m.used_sessions) / m.total_sessions) * 100, 2) as refund_rate
        FROM consultant_client_mappings m
        JOIN users c ON m.consultant_id = c.id
        JOIN users cl ON m.client_id = cl.id
        WHERE m.status = 'TERMINATED'
        AND m.terminated_at IS NOT NULL
        AND m.terminated_at >= TO_DATE(p_period || '-01', 'YYYY-MM-DD')
        AND m.terminated_at < ADD_MONTHS(TO_DATE(p_period || '-01', 'YYYY-MM-DD'), 1)
        AND (p_branch_code IS NULL OR m.branch_code = p_branch_code)
    ),
    partial_refunds AS (
        SELECT 
            ft.transaction_id,
            ft.branch_code,
            m.consultant_id,
            c.name as consultant_name,
            cl.name as client_name,
            m.package_name,
            ft.amount as refund_amount,
            EXTRACT(REGEXP_SUBSTR(ft.description, '\d+') FROM ft.description) as refunded_sessions,
            -- 환불 사유 추출
            CASE 
                WHEN ft.description LIKE '%고객 요청%' THEN 'CLIENT_REQUEST'
                WHEN ft.description LIKE '%서비스 문제%' THEN 'SERVICE_ISSUE'
                WHEN ft.description LIKE '%상담사 문제%' THEN 'CONSULTANT_ISSUE'
                ELSE 'OTHER'
            END as refund_reason
        FROM financial_transactions ft
        JOIN consultant_client_mappings m ON ft.related_entity_id = m.mapping_id
        JOIN users c ON m.consultant_id = c.id
        JOIN users cl ON m.client_id = cl.id
        WHERE ft.transaction_type = 'EXPENSE'
        AND ft.subcategory = 'CONSULTATION_PARTIAL_REFUND'
        AND ft.transaction_date >= TO_DATE(p_period || '-01', 'YYYY-MM-DD')
        AND ft.transaction_date < ADD_MONTHS(TO_DATE(p_period || '-01', 'YYYY-MM-DD'), 1)
        AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    )
    SELECT 
        branch_code,
        COUNT(*) as total_refunds,
        SUM(refund_amount) as total_refund_amount,
        AVG(refund_amount) as avg_refund_amount,
        AVG(refund_rate) as avg_refund_rate,
        -- 사유별 분석
        COUNT(CASE WHEN refund_reason = 'CLIENT_REQUEST' THEN 1 END) as client_request_count,
        COUNT(CASE WHEN refund_reason = 'SERVICE_ISSUE' THEN 1 END) as service_issue_count,
        COUNT(CASE WHEN refund_reason = 'CONSULTANT_ISSUE' THEN 1 END) as consultant_issue_count,
        COUNT(CASE WHEN refund_reason = 'FORCE_TERMINATION' THEN 1 END) as force_termination_count,
        -- 상담사별 환불률
        consultant_id,
        consultant_name,
        COUNT(*) as consultant_refund_count,
        AVG(refund_rate) as consultant_avg_refund_rate,
        -- 패키지별 분석
        package_name,
        COUNT(*) as package_refund_count,
        AVG(refund_rate) as package_avg_refund_rate,
        -- 월별 환불 추이 (최근 6개월)
        TO_CHAR(terminated_at, 'YYYY-MM') as refund_month
    FROM (
        SELECT * FROM refund_analysis
        UNION ALL
        SELECT 
            transaction_id as mapping_id,
            branch_code,
            consultant_id,
            consultant_name,
            client_name,
            package_name,
            NULL as package_price,
            NULL as total_sessions,
            NULL as used_sessions,
            NULL as terminated_at,
            NULL as notes,
            refund_reason,
            refund_amount,
            NULL as refund_rate
        FROM partial_refunds
    )
    GROUP BY branch_code, consultant_id, consultant_name, package_name, TO_CHAR(terminated_at, 'YYYY-MM')
    ORDER BY total_refund_amount DESC;
END;
```

#### 2.2 세금 통계 최적화
```sql
-- 세금 통계 프로시저
CREATE OR REPLACE PROCEDURE statistics_pkg.get_tax_statistics(
    p_period IN VARCHAR2,
    p_result OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result FOR
    WITH salary_analysis AS (
        SELECT 
            sc.employee_id,
            u.name as employee_name,
            sc.gross_amount,
            sc.calculation_period,
            -- 소득세 계산
            CASE 
                WHEN sc.gross_amount * 12 <= 12000000 THEN ROUND(sc.gross_amount * 0.06, 0)
                WHEN sc.gross_amount * 12 <= 46000000 THEN ROUND(sc.gross_amount * 0.15, 0)
                WHEN sc.gross_amount * 12 <= 88000000 THEN ROUND(sc.gross_amount * 0.24, 0)
                WHEN sc.gross_amount * 12 <= 150000000 THEN ROUND(sc.gross_amount * 0.35, 0)
                ELSE ROUND(sc.gross_amount * 0.38, 0)
            END as withholding_tax,
            -- 지방소득세 (소득세의 10%)
            CASE 
                WHEN sc.gross_amount * 12 <= 12000000 THEN ROUND(sc.gross_amount * 0.006, 0)
                WHEN sc.gross_amount * 12 <= 46000000 THEN ROUND(sc.gross_amount * 0.015, 0)
                WHEN sc.gross_amount * 12 <= 88000000 THEN ROUND(sc.gross_amount * 0.024, 0)
                WHEN sc.gross_amount * 12 <= 150000000 THEN ROUND(sc.gross_amount * 0.035, 0)
                ELSE ROUND(sc.gross_amount * 0.038, 0)
            END as local_income_tax,
            -- 국민연금 (연간 1,200만원 이상 시 4.5%)
            CASE 
                WHEN sc.gross_amount * 12 >= 12000000 THEN ROUND(sc.gross_amount * 0.045, 0)
                ELSE 0
            END as national_pension,
            -- 건강보험 (3.545%)
            ROUND(sc.gross_amount * 0.03545, 0) as health_insurance,
            -- 장기요양보험 (건강보험의 12.27%)
            ROUND(sc.gross_amount * 0.00435, 0) as long_term_care,
            -- 고용보험 (0.9%)
            ROUND(sc.gross_amount * 0.009, 0) as employment_insurance
        FROM salary_calculations sc
        JOIN users u ON sc.employee_id = u.id
        WHERE sc.calculation_period = p_period
    )
    SELECT 
        calculation_period,
        COUNT(*) as employee_count,
        SUM(gross_amount) as total_gross_amount,
        SUM(withholding_tax) as total_withholding_tax,
        SUM(local_income_tax) as total_local_income_tax,
        SUM(national_pension) as total_national_pension,
        SUM(health_insurance) as total_health_insurance,
        SUM(long_term_care) as total_long_term_care,
        SUM(employment_insurance) as total_employment_insurance,
        SUM(withholding_tax + local_income_tax + national_pension + 
             health_insurance + long_term_care + employment_insurance) as total_tax_amount,
        -- 직원별 상세 정보
        employee_id,
        employee_name,
        gross_amount,
        withholding_tax,
        local_income_tax,
        national_pension,
        health_insurance,
        long_term_care,
        employment_insurance
    FROM salary_analysis
    GROUP BY calculation_period, employee_id, employee_name, gross_amount, 
             withholding_tax, local_income_tax, national_pension, 
             health_insurance, long_term_care, employment_insurance
    ORDER BY gross_amount DESC;
END;
```

### **Phase 3: ERP 실시간 연동 (2-3주)**

#### 3.1 ERP 데이터 동기화
```sql
-- ERP 데이터 동기화 프로시저
CREATE OR REPLACE PROCEDURE erp_integration_pkg.sync_erp_data(
    p_sync_type IN VARCHAR2
) AS
    v_sync_id NUMBER;
    v_records_processed NUMBER := 0;
    v_error_message VARCHAR2(4000);
BEGIN
    -- 동기화 로그 시작
    SELECT erp_sync_seq.NEXTVAL INTO v_sync_id FROM dual;
    
    INSERT INTO erp_sync_log (sync_id, sync_type, sync_date, status)
    VALUES (v_sync_id, p_sync_type, SYSTIMESTAMP, 'STARTED');
    
    COMMIT;
    
    BEGIN
        CASE p_sync_type
            WHEN 'FINANCIAL' THEN
                -- 재무 데이터 동기화
                MERGE INTO financial_transactions ft
                USING (
                    SELECT 
                        erp_transaction_id,
                        transaction_type,
                        amount,
                        transaction_date,
                        branch_code,
                        category,
                        description
                    FROM erp_financial_staging
                    WHERE sync_status = 'PENDING'
                ) erp_data ON (ft.erp_transaction_id = erp_data.erp_transaction_id)
                WHEN MATCHED THEN
                    UPDATE SET 
                        amount = erp_data.amount,
                        transaction_date = erp_data.transaction_date,
                        last_sync_date = SYSTIMESTAMP
                WHEN NOT MATCHED THEN
                    INSERT (transaction_id, erp_transaction_id, transaction_type, 
                           amount, transaction_date, branch_code, category, description, 
                           created_at, last_sync_date)
                    VALUES (financial_transaction_seq.NEXTVAL, erp_data.erp_transaction_id,
                           erp_data.transaction_type, erp_data.amount, erp_data.transaction_date,
                           erp_data.branch_code, erp_data.category, erp_data.description,
                           SYSTIMESTAMP, SYSTIMESTAMP);
                
                v_records_processed := SQL%ROWCOUNT;
                
            WHEN 'SALARY' THEN
                -- 급여 데이터 동기화
                MERGE INTO salary_calculations sc
                USING (
                    SELECT 
                        erp_salary_id,
                        employee_id,
                        gross_amount,
                        calculation_period,
                        basic_salary,
                        allowances,
                        deductions
                    FROM erp_salary_staging
                    WHERE sync_status = 'PENDING'
                ) erp_data ON (sc.erp_salary_id = erp_data.erp_salary_id)
                WHEN MATCHED THEN
                    UPDATE SET 
                        gross_amount = erp_data.gross_amount,
                        basic_salary = erp_data.basic_salary,
                        allowances = erp_data.allowances,
                        deductions = erp_data.deductions,
                        last_sync_date = SYSTIMESTAMP
                WHEN NOT MATCHED THEN
                    INSERT (calculation_id, erp_salary_id, employee_id, gross_amount,
                           calculation_period, basic_salary, allowances, deductions,
                           created_at, last_sync_date)
                    VALUES (salary_calculation_seq.NEXTVAL, erp_data.erp_salary_id,
                           erp_data.employee_id, erp_data.gross_amount, erp_data.calculation_period,
                           erp_data.basic_salary, erp_data.allowances, erp_data.deductions,
                           SYSTIMESTAMP, SYSTIMESTAMP);
                
                v_records_processed := SQL%ROWCOUNT;
                
            WHEN 'INVENTORY' THEN
                -- 재고 데이터 동기화
                MERGE INTO inventory_items ii
                USING (
                    SELECT 
                        erp_item_id,
                        item_name,
                        item_code,
                        current_stock,
                        unit_price,
                        branch_code
                    FROM erp_inventory_staging
                    WHERE sync_status = 'PENDING'
                ) erp_data ON (ii.erp_item_id = erp_data.erp_item_id)
                WHEN MATCHED THEN
                    UPDATE SET 
                        current_stock = erp_data.current_stock,
                        unit_price = erp_data.unit_price,
                        last_sync_date = SYSTIMESTAMP
                WHEN NOT MATCHED THEN
                    INSERT (item_id, erp_item_id, item_name, item_code,
                           current_stock, unit_price, branch_code,
                           created_at, last_sync_date)
                    VALUES (inventory_item_seq.NEXTVAL, erp_data.erp_item_id,
                           erp_data.item_name, erp_data.item_code, erp_data.current_stock,
                           erp_data.unit_price, erp_data.branch_code,
                           SYSTIMESTAMP, SYSTIMESTAMP);
                
                v_records_processed := SQL%ROWCOUNT;
        END CASE;
        
        -- 동기화 완료 로그
        UPDATE erp_sync_log 
        SET status = 'COMPLETED', 
            records_processed = v_records_processed,
            completed_at = SYSTIMESTAMP
        WHERE sync_id = v_sync_id;
        
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            v_error_message := SQLERRM;
            
            UPDATE erp_sync_log 
            SET status = 'FAILED', 
                error_message = v_error_message,
                completed_at = SYSTIMESTAMP
            WHERE sync_id = v_sync_id;
            
            COMMIT;
            RAISE;
    END;
    
END;
```

#### 3.2 실시간 재무 데이터 조회
```sql
-- 실시간 재무 데이터 조회 프로시저
CREATE OR REPLACE PROCEDURE erp_integration_pkg.get_realtime_financial_data(
    p_branch_code IN VARCHAR2,
    p_result OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result FOR
    WITH financial_summary AS (
        SELECT 
            ft.branch_code,
            ft.transaction_type,
            COUNT(*) as transaction_count,
            SUM(ft.amount) as total_amount,
            AVG(ft.amount) as avg_amount,
            MIN(ft.transaction_date) as first_transaction,
            MAX(ft.transaction_date) as last_transaction
        FROM financial_transactions ft
        WHERE ft.transaction_date >= TRUNC(SYSDATE) - 30  -- 최근 30일
        AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
        GROUP BY ft.branch_code, ft.transaction_type
    ),
    category_breakdown AS (
        SELECT 
            ft.branch_code,
            ft.category,
            ft.transaction_type,
            COUNT(*) as count,
            SUM(ft.amount) as total_amount
        FROM financial_transactions ft
        WHERE ft.transaction_date >= TRUNC(SYSDATE) - 30
        AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
        GROUP BY ft.branch_code, ft.category, ft.transaction_type
    ),
    monthly_trend AS (
        SELECT 
            ft.branch_code,
            TO_CHAR(ft.transaction_date, 'YYYY-MM') as month,
            ft.transaction_type,
            COUNT(*) as count,
            SUM(ft.amount) as total_amount
        FROM financial_transactions ft
        WHERE ft.transaction_date >= TRUNC(SYSDATE) - 180  -- 최근 6개월
        AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
        GROUP BY ft.branch_code, TO_CHAR(ft.transaction_date, 'YYYY-MM'), ft.transaction_type
    )
    SELECT 
        'SUMMARY' as data_type,
        branch_code,
        transaction_type,
        transaction_count,
        total_amount,
        avg_amount,
        first_transaction,
        last_transaction,
        NULL as category,
        NULL as month
    FROM financial_summary
    UNION ALL
    SELECT 
        'CATEGORY' as data_type,
        branch_code,
        transaction_type,
        count as transaction_count,
        total_amount,
        NULL as avg_amount,
        NULL as first_transaction,
        NULL as last_transaction,
        category,
        NULL as month
    FROM category_breakdown
    UNION ALL
    SELECT 
        'TREND' as data_type,
        branch_code,
        transaction_type,
        count as transaction_count,
        total_amount,
        NULL as avg_amount,
        NULL as first_transaction,
        NULL as last_transaction,
        NULL as category,
        month
    FROM monthly_trend
    ORDER BY data_type, branch_code, transaction_type;
END;
```

### **Phase 4: 실시간 모니터링 및 알림 (2주)**

#### 4.1 성과 모니터링 트리거
```sql
-- 성과 저하 감지 트리거
CREATE OR REPLACE TRIGGER performance_alert_trigger
AFTER INSERT OR UPDATE ON schedules
FOR EACH ROW
DECLARE
    v_completion_rate NUMBER;
    v_alert_level VARCHAR2(20);
    v_alert_message VARCHAR2(500);
    v_consultant_name VARCHAR2(100);
BEGIN
    -- 상담사 이름 조회
    SELECT name INTO v_consultant_name 
    FROM users 
    WHERE id = :NEW.consultant_id;
    
    -- 최근 7일 완료율 계산
    SELECT ROUND((completed_count / NULLIF(total_count, 0)) * 100, 2)
    INTO v_completion_rate
    FROM (
        SELECT 
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
            COUNT(*) as total_count
        FROM schedules
        WHERE consultant_id = :NEW.consultant_id
        AND schedule_date >= SYSDATE - 7
    );
    
    -- 알림 레벨 결정
    IF v_completion_rate < 70 THEN
        v_alert_level := 'CRITICAL';
        v_alert_message := '상담사 ' || v_consultant_name || '의 최근 7일 완료율이 ' || v_completion_rate || '%로 매우 낮습니다.';
    ELSIF v_completion_rate < 80 THEN
        v_alert_level := 'WARNING';
        v_alert_message := '상담사 ' || v_consultant_name || '의 최근 7일 완료율이 ' || v_completion_rate || '%로 낮습니다.';
    ELSE
        v_alert_level := 'NORMAL';
        v_alert_message := NULL;
    END IF;
    
    -- 알림 생성
    IF v_alert_level != 'NORMAL' THEN
        INSERT INTO performance_alerts (
            consultant_id, consultant_name, alert_level, completion_rate, 
            alert_message, created_at
        ) VALUES (
            :NEW.consultant_id, v_consultant_name, v_alert_level, v_completion_rate, 
            v_alert_message, SYSTIMESTAMP
        );
        
        -- ERP 시스템에 알림 전송
        INSERT INTO erp_notifications (
            notification_type, recipient_id, message, priority, created_at
        ) VALUES (
            'PERFORMANCE_ALERT', :NEW.consultant_id, v_alert_message, v_alert_level, SYSTIMESTAMP
        );
    END IF;
END;
```

#### 4.2 ERP 알림 처리
```sql
-- ERP 알림 처리 프로시저
CREATE OR REPLACE PROCEDURE erp_integration_pkg.process_erp_notifications AS
    v_notification_id NUMBER;
    v_recipient_id NUMBER;
    v_message VARCHAR2(4000);
    v_priority VARCHAR2(20);
    v_erp_response VARCHAR2(4000);
BEGIN
    -- 처리 대기 중인 알림 조회
    FOR notification IN (
        SELECT notification_id, recipient_id, message, priority
        FROM erp_notifications
        WHERE status = 'PENDING'
        AND created_at >= SYSTIMESTAMP - INTERVAL '1' HOUR
        ORDER BY priority DESC, created_at ASC
    ) LOOP
        v_notification_id := notification.notification_id;
        v_recipient_id := notification.recipient_id;
        v_message := notification.message;
        v_priority := notification.priority;
        
        BEGIN
            -- ERP 시스템으로 알림 전송 (실제 구현에서는 HTTP API 호출)
            -- 여기서는 시뮬레이션
            v_erp_response := 'SUCCESS';
            
            -- 알림 상태 업데이트
            UPDATE erp_notifications
            SET status = 'SENT',
                erp_response = v_erp_response,
                sent_at = SYSTIMESTAMP
            WHERE notification_id = v_notification_id;
            
            COMMIT;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- 전송 실패 시 재시도 로그
                UPDATE erp_notifications
                SET status = 'FAILED',
                    error_message = SQLERRM,
                    retry_count = NVL(retry_count, 0) + 1
                WHERE notification_id = v_notification_id;
                
                COMMIT;
        END;
    END LOOP;
END;
```

### **Phase 5: 고급 분석 및 예측 (2-3주)**

#### 5.1 트렌드 분석 및 예측
```sql
-- 트렌드 분석 프로시저
CREATE OR REPLACE PROCEDURE get_trend_analysis(
    p_period IN VARCHAR2,
    p_branch_code IN VARCHAR2,
    p_result OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result FOR
    WITH monthly_trends AS (
        SELECT 
            TO_CHAR(schedule_date, 'YYYY-MM') as month,
            branch_code,
            COUNT(*) as total_schedules,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_schedules,
            AVG(CASE WHEN status = 'COMPLETED' THEN session_fee ELSE 0 END) as avg_session_fee,
            AVG(r.heart_score) as avg_rating
        FROM schedules s
        LEFT JOIN consultant_ratings r ON s.consultant_id = r.consultant_id
        WHERE schedule_date >= ADD_MONTHS(TO_DATE(p_period || '-01', 'YYYY-MM-DD'), -12)
        AND schedule_date < ADD_MONTHS(TO_DATE(p_period || '-01', 'YYYY-MM-DD'), 1)
        AND (p_branch_code IS NULL OR branch_code = p_branch_code)
        GROUP BY TO_CHAR(schedule_date, 'YYYY-MM'), branch_code
    ),
    trend_calculations AS (
        SELECT 
            month,
            branch_code,
            total_schedules,
            completed_schedules,
            avg_session_fee,
            avg_rating,
            -- 전월 대비 증감률
            LAG(total_schedules) OVER (PARTITION BY branch_code ORDER BY month) as prev_total,
            LAG(completed_schedules) OVER (PARTITION BY branch_code ORDER BY month) as prev_completed,
            LAG(avg_session_fee) OVER (PARTITION BY branch_code ORDER BY month) as prev_fee,
            LAG(avg_rating) OVER (PARTITION BY branch_code ORDER BY month) as prev_rating,
            -- 이동평균 (3개월)
            AVG(total_schedules) OVER (PARTITION BY branch_code ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as ma3_total,
            AVG(completed_schedules) OVER (PARTITION BY branch_code ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as ma3_completed
        FROM monthly_trends
    )
    SELECT 
        month,
        branch_code,
        total_schedules,
        completed_schedules,
        avg_session_fee,
        avg_rating,
        -- 증감률 계산
        CASE 
            WHEN prev_total > 0 THEN ROUND(((total_schedules - prev_total) / prev_total) * 100, 2)
            ELSE NULL
        END as total_growth_rate,
        CASE 
            WHEN prev_completed > 0 THEN ROUND(((completed_schedules - prev_completed) / prev_completed) * 100, 2)
            ELSE NULL
        END as completed_growth_rate,
        -- 이동평균
        ROUND(ma3_total, 2) as ma3_total_schedules,
        ROUND(ma3_completed, 2) as ma3_completed_schedules,
        -- 예측 (단순 선형 회귀)
        ROUND(ma3_total + (ma3_total - LAG(ma3_total) OVER (PARTITION BY branch_code ORDER BY month)), 0) as predicted_total,
        ROUND(ma3_completed + (ma3_completed - LAG(ma3_completed) OVER (PARTITION BY branch_code ORDER BY month)), 0) as predicted_completed
    FROM trend_calculations
    ORDER BY branch_code, month;
END;
```

## 🔧 Java 연동 코드

### Controller 수정
```java
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @GetMapping("/refund-statistics")
    public ResponseEntity<?> getRefundStatistics(
            @RequestParam(defaultValue = "month") String period, 
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            String branchCode = currentUser != null ? currentUser.getBranchCode() : null;
            
            // PL/SQL 프로시저 호출
            Map<String, Object> result = jdbcTemplate.call(
                connection -> {
                    CallableStatement cs = connection.prepareCall(
                        "{ call statistics_pkg.get_refund_statistics(?, ?, ?) }"
                    );
                    cs.setString(1, period);
                    cs.setString(2, branchCode);
                    cs.registerOutParameter(3, OracleTypes.CURSOR);
                    return cs;
                },
                Collections.emptyList()
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result
            ));
        } catch (Exception e) {
            log.error("❌ 환불 통계 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "환불 통계 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
```

## 📊 성능 개선 예상 효과

| 항목 | 현재 (Java Stream) | PL/SQL 적용 후 | 개선율 |
|------|-------------------|----------------|--------|
| **환불 통계 조회** | 3-5초 | 0.2-0.5초 | 85% |
| **세금 통계 조회** | 2-3초 | 0.1-0.3초 | 90% |
| **재무 통계 조회** | 4-6초 | 0.3-0.8초 | 80% |
| **ERP 동기화** | 10-15초 | 1-2초 | 85% |
| **메모리 사용량** | 500MB+ | 100MB- | 80% |
| **동시 사용자** | 50명 | 200명+ | 300% |

## 🎯 구현 우선순위

### 1단계 (즉시 시작)
- [ ] 환불 통계 PL/SQL화 (가장 복잡한 로직)
- [ ] 데이터베이스 인덱스 최적화
- [ ] 기본 통계 테이블 생성

### 2단계 (1-2주 후)
- [ ] 세금 통계 PL/SQL화
- [ ] 상담사 성과 분석 고도화
- [ ] Java 연동 코드 구현

### 3단계 (3-4주 후)
- [ ] ERP 실시간 연동
- [ ] 재무 데이터 동기화
- [ ] 알림 시스템 구축

### 4단계 (5-6주 후)
- [ ] 트렌드 분석 및 예측
- [ ] 고급 비즈니스 인텔리전스
- [ ] 성능 모니터링 대시보드

## 📋 체크리스트

### Phase 1: 인프라 구축
- [ ] 복합 인덱스 생성
- [ ] 파티셔닝 테이블 생성
- [ ] 통계 테이블 설계 및 생성
- [ ] PL/SQL 패키지 구조 설계

### Phase 2: 핵심 통계 PL/SQL화
- [ ] 환불 통계 프로시저 구현
- [ ] 세금 통계 프로시저 구현
- [ ] 상담사 성과 분석 프로시저 구현
- [ ] Java 연동 코드 구현

### Phase 3: ERP 연동
- [ ] ERP 데이터 동기화 프로시저
- [ ] 실시간 재무 데이터 조회
- [ ] ERP 알림 처리 시스템
- [ ] 데이터 검증 및 오류 처리

### Phase 4: 모니터링
- [ ] 성과 모니터링 트리거
- [ ] 실시간 알림 시스템
- [ ] 관리자 대시보드 연동
- [ ] 로그 및 감사 시스템

### Phase 5: 고급 분석
- [ ] 트렌드 분석 프로시저
- [ ] 예측 모델링 시스템
- [ ] 커스텀 리포트 생성
- [ ] 데이터 시각화 연동

---

**문서 작성일**: 2025-09-24  
**작성자**: 개발팀  
**승인자**: 프로젝트 매니저  
**문서 버전**: v1.0  
**다음 검토일**: 2025-10-01
