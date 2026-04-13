package com.coresolution.consultation.service.impl;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 급여관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlSqlSalaryManagementServiceImpl implements PlSqlSalaryManagementService {

    /**
     * 시그니처 불일치로 판별될 때 API 응답에 포함할 안내(내부 경로·비밀 미포함).
     */
    private static final String CALCULATE_SALARY_PREVIEW_SIGNATURE_MISMATCH_HINT =
            "DB 저장 프로시저 CalculateSalaryPreview의 파라미터 구성이 애플리케이션 기대와 다를 수 있습니다. "
                    + "표준 CalculateSalaryPreview 프로시저 배포로 시그니처를 맞춰 주세요.";

    private final JdbcTemplate jdbcTemplate;
    
    @Override
    public Map<String, Object> processIntegratedSalaryCalculation(
            Long consultantId, 
            LocalDate periodStart, 
            LocalDate periodEnd, 
            String triggeredBy) {
        
        log.info("💰 PL/SQL 통합 급여 계산 시작: ConsultantID={}, Period={} ~ {}", 
                consultantId, periodStart, periodEnd);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ProcessIntegratedSalaryCalculation(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            connection.createStatement().execute("SET character_set_client = utf8mb4");
            connection.createStatement().execute("SET character_set_connection = utf8mb4");
            connection.createStatement().execute("SET character_set_results = utf8mb4");
            
            // IN 파라미터 설정
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId); // p_tenant_id 추가
            stmt.setString(5, triggeredBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(6, java.sql.Types.BIGINT);    // calculation_id
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);   // gross_salary
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);   // net_salary
            stmt.registerOutParameter(9, java.sql.Types.DECIMAL);   // tax_amount
            stmt.registerOutParameter(10, java.sql.Types.BIGINT);    // erp_sync_id
            stmt.registerOutParameter(11, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(12, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("calculationId", stmt.getLong(6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("erpSyncId", stmt.getLong(10));
            result.put("success", stmt.getBoolean(11));
            result.put("message", stmt.getString(12));
            
            log.info("✅ PL/SQL 통합 급여 계산 완료: CalculationID={}, GrossSalary={}, NetSalary={}", 
                    result.get("calculationId"), result.get("grossSalary"), result.get("netSalary"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 통합 급여 계산 오류", e);
            result.put("success", false);
            result.put("message", "급여 계산 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> approveSalaryWithErpSync(Long calculationId, String approvedBy) {
        
        log.info("✅ PL/SQL 급여 승인 시작: CalculationID={}, ApprovedBy={}", calculationId, approvedBy);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ApproveSalaryWithErpSync(?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setLong(1, calculationId);
            stmt.setString(2, approvedBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(3, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(4, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(3));
            result.put("message", stmt.getString(4));
            
            log.info("✅ PL/SQL 급여 승인 완료: Success={}", result.get("success"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 급여 승인 오류", e);
            result.put("success", false);
            result.put("message", "급여 승인 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> processSalaryPaymentWithErpSync(Long calculationId, String paidBy) {
        
        log.info("💳 PL/SQL 급여 지급 시작: CalculationID={}, PaidBy={}", calculationId, paidBy);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ProcessSalaryPaymentWithErpSync(?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setLong(1, calculationId);
            stmt.setString(2, paidBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(3, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(4, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(3));
            result.put("message", stmt.getString(4));
            
            log.info("✅ PL/SQL 급여 지급 완료: Success={}", result.get("success"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 급여 지급 오류", e);
            result.put("success", false);
            result.put("message", "급여 지급 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 통합 급여 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> getIntegratedSalaryStatistics(
            String branchCode, 
            LocalDate startDate, 
            LocalDate endDate) {
        
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 PL/SQL 통합 급여 통계 조회: tenantId={}, Period={} ~ {}", 
                tenantId, startDate, endDate);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL GetIntegratedSalaryStatistics(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setString(1, tenantId); // p_tenant_id (첫 번째 파라미터)
            stmt.setDate(2, java.sql.Date.valueOf(startDate));
            stmt.setDate(3, java.sql.Date.valueOf(endDate));
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(4, java.sql.Types.BOOLEAN);   // success
            stmt.registerOutParameter(5, java.sql.Types.VARCHAR);   // message
            stmt.registerOutParameter(6, java.sql.Types.INTEGER);   // total_calculations
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);   // total_gross_salary
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);   // total_net_salary
            stmt.registerOutParameter(9, java.sql.Types.DECIMAL);   // total_tax_amount
            stmt.registerOutParameter(10, java.sql.Types.DECIMAL);   // average_salary
            stmt.registerOutParameter(11, java.sql.Types.DECIMAL);   // erp_sync_success_rate
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(4));
            result.put("message", stmt.getString(5));
            result.put("totalCalculations", stmt.getInt(6));
            result.put("totalGrossSalary", stmt.getBigDecimal(7));
            result.put("totalNetSalary", stmt.getBigDecimal(8));
            result.put("totalTaxAmount", stmt.getBigDecimal(9));
            result.put("averageSalary", stmt.getBigDecimal(10));
            result.put("erpSyncSuccessRate", stmt.getBigDecimal(11));
            
            log.info("✅ PL/SQL 통합 급여 통계 조회 완료: TotalCalculations={}, TotalNetSalary={}", 
                    result.get("totalCalculations"), result.get("totalNetSalary"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 통합 급여 통계 조회 오류", e);
            result.put("success", false);
            result.put("message", "급여 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public boolean isProcedureAvailable() {
        try {
            // 프로시저 존재 여부 확인
            String sql = "SELECT COUNT(*) FROM information_schema.routines " +
                        "WHERE routine_schema = DATABASE() " +
                        "AND routine_name = 'CalculateSalaryPreview' " +
                        "AND routine_type = 'PROCEDURE'";
            
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null && count > 0;
            
        } catch (Exception e) {
            log.error("PL/SQL 프로시저 사용 가능 여부 확인 오류", e);
            return false;
        }
    }
    
    /**
     * 급여 미리보기. 표준 시그니처는 {@code CalculateSalaryPreview_standardized.sql} 과 동일(10파라미터).
     * 운영에 구버전(3 IN + 6 OUT, 총 9파라미터·OUT 순서 상이)이 남은 경우 JDBC 단에서 분기한다.
     * 배포 시 GitHub {@code PRODUCTION_DB_NAME} 과 앱 JDBC 스키마가 다르면 프로시저만 갱신되지 않을 수 있다.
     *
     * @param consultantId 상담사 ID
     * @param periodStart  기간 시작
     * @param periodEnd    기간 종료
     * @return success, message, grossSalary, netSalary, taxAmount, consultationCount
     */
    @Override
    public Map<String, Object> calculateSalaryPreview(Long consultantId, LocalDate periodStart, LocalDate periodEnd) {
        log.info("💰 PL/SQL 급여 미리보기 계산: ConsultantID={}, Period={} ~ {}",
                consultantId, periodStart, periodEnd);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        Map<String, Object> result = new HashMap<>();

        try {
            int paramCount = countCalculateSalaryPreviewParameters();
            if (paramCount == 9) {
                log.warn("⚠️ CalculateSalaryPreview 구버전(9파라미터) 사용 중. tenant_id IN 없음. "
                        + "표준 프로시저 배포 시 CI PRODUCTION_DB_NAME 과 앱 DB 스키마가 동일한지 확인하세요.");
                result.putAll(executeCalculateSalaryPreviewLegacy9(consultantId, periodStart, periodEnd));
            } else if (paramCount == 10) {
                result.putAll(executeCalculateSalaryPreviewStandard(consultantId, periodStart, periodEnd, tenantId));
            } else if (paramCount < 0) {
                try {
                    result.putAll(executeCalculateSalaryPreviewStandard(consultantId, periodStart, periodEnd, tenantId));
                } catch (SQLException ex) {
                    if (shouldLogCalculateSalaryPreviewSignatureMismatch(ex)) {
                        log.warn("파라미터 개수 미확인 상태에서 표준 호출 실패, 구버전(9) 재시도: {}", ex.getMessage());
                        result.putAll(executeCalculateSalaryPreviewLegacy9(consultantId, periodStart, periodEnd));
                    } else {
                        throw ex;
                    }
                }
            } else {
                log.error("❌ CalculateSalaryPreview 파라미터 개수 비정상: count={}", paramCount);
                result.put("success", false);
                result.put("message",
                        "CalculateSalaryPreview 프로시저 정의를 확인할 수 없습니다(parameters=" + paramCount + ").");
                return result;
            }
            log.info("✅ PL/SQL 급여 미리보기 완료: ConsultantID={}, GrossSalary={}, NetSalary={}, ConsultationCount={}",
                    consultantId, result.get("grossSalary"), result.get("netSalary"), result.get("consultationCount"));
        } catch (Exception e) {
            log.error("PL/SQL 급여 미리보기 실패: error={}", e.getMessage(), e);
            logCalculateSalaryPreviewParameterDiagnostics(e);
            result.put("success", false);
            if (shouldLogCalculateSalaryPreviewSignatureMismatch(e)) {
                result.put("message",
                        "급여 미리보기 중 오류가 발생했습니다. " + CALCULATE_SALARY_PREVIEW_SIGNATURE_MISMATCH_HINT
                                + " 상세: " + e.getMessage());
            } else {
                result.put("message", "급여 미리보기 중 오류가 발생했습니다: " + e.getMessage());
            }
        }
        return result;
    }

    /**
     * 현재 스키마의 CalculateSalaryPreview 파라미터 행 수 (information_schema).
     *
     * @return 9·10 등, 조회 실패 시 -1
     */
    private int countCalculateSalaryPreviewParameters() {
        try {
            String sql = "SELECT COUNT(*) FROM information_schema.PARAMETERS "
                    + "WHERE SPECIFIC_SCHEMA = DATABASE() AND SPECIFIC_NAME = 'CalculateSalaryPreview'";
            Integer c = jdbcTemplate.queryForObject(sql, Integer.class);
            return c != null ? c : -1;
        } catch (Exception e) {
            log.warn("CalculateSalaryPreview 파라미터 개수 조회 실패: {}", e.getMessage());
            return -1;
        }
    }

    private void setConnectionUtf8mb4(Connection connection) throws SQLException {
        try (java.sql.Statement st = connection.createStatement()) {
            st.execute("SET character_set_client = utf8mb4");
            st.execute("SET character_set_connection = utf8mb4");
            st.execute("SET character_set_results = utf8mb4");
        }
    }

    /**
     * 표준 10파라미터: 4 IN(마지막 tenant_id) + 6 OUT(success, message, gross, net, tax, count).
     */
    private Map<String, Object> executeCalculateSalaryPreviewStandard(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd, String tenantId) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL CalculateSalaryPreview(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId);
            stmt.registerOutParameter(5, Types.BOOLEAN);
            stmt.registerOutParameter(6, Types.VARCHAR);
            stmt.registerOutParameter(7, Types.DECIMAL);
            stmt.registerOutParameter(8, Types.DECIMAL);
            stmt.registerOutParameter(9, Types.DECIMAL);
            stmt.registerOutParameter(10, Types.INTEGER);
            stmt.execute();
            result.put("success", stmt.getBoolean(5));
            result.put("message", stmt.getString(6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("consultationCount", stmt.getInt(10));
        }
        return result;
    }

    /**
     * 구버전 9파라미터(운영 로그 기준): 3 IN + 6 OUT.
     * OUT 순서: gross_salary, net_salary, tax_amount, consultation_count, success, message.
     */
    private Map<String, Object> executeCalculateSalaryPreviewLegacy9(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL CalculateSalaryPreview(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.registerOutParameter(4, Types.DECIMAL);
            stmt.registerOutParameter(5, Types.DECIMAL);
            stmt.registerOutParameter(6, Types.DECIMAL);
            stmt.registerOutParameter(7, Types.INTEGER);
            stmt.registerOutParameter(8, Types.BOOLEAN);
            stmt.registerOutParameter(9, Types.VARCHAR);
            stmt.execute();
            result.put("grossSalary", stmt.getBigDecimal(4));
            result.put("netSalary", stmt.getBigDecimal(5));
            result.put("taxAmount", stmt.getBigDecimal(6));
            result.put("consultationCount", stmt.getInt(7));
            result.put("success", stmt.getBoolean(8));
            result.put("message", stmt.getString(9));
        }
        return result;
    }

    /**
     * CalculateSalaryPreview 호출 실패가 JDBC 시그니처 불일치로 의심될 때 true.
     * 운영에서는 {@code database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql} 과
     * 동일한 시그니처로 배포하는 것이 본조치이며, {@code scripts/automation/deployment/deploy-standardized-procedures.sh} 로
     * 표준 프로시저를 반영할 수 있다.
     *
     * @param cause 호출 실패 원인(원인 체인 포함 검사)
     * @return information_schema 진단 로그 및 사용자 메시지 분기 여부
     */
    private boolean shouldLogCalculateSalaryPreviewSignatureMismatch(Throwable cause) {
        for (Throwable t = cause; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg == null || msg.isEmpty()) {
                continue;
            }
            if (msg.contains("OUT parameter")) {
                return true;
            }
            if (msg.contains("Parameter index of") && msg.contains("out of range")) {
                return true;
            }
        }
        return false;
    }

    /**
     * 시그니처 불일치로 추정될 때 DB에 적용된 파라미터 목록을 로그로 남겨 배포 불일치 진단을 돕는다.
     * 본조치는 표준 프로시저 배포이며, {@link #shouldLogCalculateSalaryPreviewSignatureMismatch(Throwable)} 참고.
     *
     * @param cause 호출 실패 원인
     */
    private void logCalculateSalaryPreviewParameterDiagnostics(Throwable cause) {
        if (!shouldLogCalculateSalaryPreviewSignatureMismatch(cause)) {
            return;
        }
        try {
            String sql = "SELECT ORDINAL_POSITION, PARAMETER_MODE, PARAMETER_NAME "
                    + "FROM information_schema.PARAMETERS "
                    + "WHERE SPECIFIC_SCHEMA = DATABASE() AND SPECIFIC_NAME = 'CalculateSalaryPreview' "
                    + "ORDER BY ORDINAL_POSITION";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            log.error(
                    "CalculateSalaryPreview 시그니처 진단: information_schema.PARAMETERS (기대 1-4 IN, 5-10 OUT): rows={}",
                    rows);
        } catch (Exception ex) {
            log.warn("프로시저 파라미터 진단 조회 실패: error={}", ex.getMessage(), ex);
        }
    }
}
