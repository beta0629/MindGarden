package com.coresolution.consultation.service.impl;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 기반 스케줄 검증 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PlSqlScheduleValidationServiceImpl implements PlSqlScheduleValidationService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * SimpleJdbcCall 카탈로그(=DB명) 명시용 SSOT.
     *
     * <p>{@code spring.datasource.url} 의 {@code ${DB_NAME}} 과 동일 SSOT 를 상속하여
     * 다중 DB(core_solution + mind_garden) 동명 프로시저 메타 충돌
     * ({@code SimpleJdbcCallOperations#metaData()} 시그니처 모호)을 차단한다.</p>
     *
     * <p>MySQL JDBC 모델에서는 catalog = DB명, schema = null. 따라서 catalog 만 명시하고
     * schema 는 명시하지 않는다. (PR-A hotfix, 2026-06-14)</p>
     *
     * @see com.coresolution.consultation.service.impl.PlSqlStatisticsServiceImpl
     */
    @Value("${spring.datasource.schema-name:${DB_NAME:core_solution}}")
    private String dbSchemaName = "core_solution";

    @Override
    public Map<String, Object> validateConsultationRecordBeforeCompletion(
            Long scheduleId, Long consultantId, LocalDate sessionDate) {
        
        log.info("🔍 PL/SQL 상담일지 작성 여부 확인: 스케줄 ID={}, 상담사 ID={}, 날짜={}", 
                scheduleId, consultantId, sessionDate);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("ValidateConsultationRecordBeforeCompletion");
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_consultant_id", consultantId);
            params.put("p_session_date", sessionDate);
            params.put("p_tenant_id", tenantId);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasRecord", result.get("p_has_record"));
            response.put("message", result.get("p_message"));
            response.put("success", true);
            
            log.info("✅ PL/SQL 상담일지 검증 완료: 결과={}", response);
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 상담일지 검증 실패: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("hasRecord", false);
            errorResponse.put("message", "상담일지 검증 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("success", false);
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> createConsultationRecordReminder(
            Long scheduleId, Long consultantId, Long clientId,
            LocalDate sessionDate, String title) {

        log.info("📤 PL/SQL 상담일지 미작성 알림 생성: 스케줄 ID={}, 상담사 ID={}, 제목={}",
                scheduleId, consultantId, title);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        String createdBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요

        if (!isRoutineDeployed("CreateConsultationRecordReminder")) {
            log.warn("CreateConsultationRecordReminder 저장 프로시저가 없어 알림 생성을 건너뜁니다.");
            return reminderSkippedResponse();
        }

        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL CreateConsultationRecordReminder(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, scheduleId);
            stmt.setLong(2, consultantId);
            if (clientId == null) {
                stmt.setNull(3, Types.BIGINT);
            } else {
                stmt.setLong(3, clientId);
            }
            stmt.setDate(4, java.sql.Date.valueOf(sessionDate));
            stmt.setTime(5, Time.valueOf(LocalTime.MIDNIGHT));
            stmt.setString(6, title);
            stmt.setString(7, tenantId);
            stmt.setString(8, createdBy != null ? createdBy : tenantId);
            stmt.registerOutParameter(9, Types.BOOLEAN);
            stmt.registerOutParameter(10, Types.VARCHAR);
            stmt.registerOutParameter(11, Types.BIGINT);
            stmt.execute();

            boolean success = readMysqlProcedureBooleanOut(stmt, 9);
            String message = stmt.getString(10);
            long reminderId = stmt.getLong(11);
            if (stmt.wasNull()) {
                reminderId = 0L;
            }

            Map<String, Object> response = new HashMap<>();
            response.put("reminderId", reminderId);
            response.put("message", message);
            response.put("success", success);

            log.info("✅ PL/SQL 상담일지 알림 생성 완료: 결과={}", response);
            return response;
        } catch (SQLException e) {
            log.warn("CreateConsultationRecordReminder 호출 실패: {}", e.getMessage());
            return reminderFailureResponse(e.getMessage());
        } catch (InvalidDataAccessApiUsageException e) {
            log.warn("CreateConsultationRecordReminder 시그니처/메타데이터 오류: {}", e.getMessage());
            return reminderSkippedResponse();
        } catch (Exception e) {
            if (isJdbcSignatureAmbiguity(e)) {
                log.warn("CreateConsultationRecordReminder 호출 생략(시그니처 불명): {}", e.getMessage());
                return reminderSkippedResponse();
            }
            log.error("❌ PL/SQL 상담일지 알림 생성 실패: {}", e.getMessage(), e);
            return reminderFailureResponse(e.getMessage());
        }
    }
    
    @Override
    public Map<String, Object> processScheduleAutoCompletion(
            Long scheduleId, Long consultantId, LocalDate sessionDate, boolean forceComplete) {
        
        log.info("🔄 PL/SQL 스케줄 자동 완료 처리: 스케줄 ID={}, 강제완료={}", 
                scheduleId, forceComplete);
        
        // 테넌트 ID 및 처리자 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String processedBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("ProcessScheduleAutoCompletion");
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_schedule_id", scheduleId);
            params.put("p_consultant_id", consultantId);
            params.put("p_session_date", sessionDate);
            params.put("p_force_complete", forceComplete ? 1 : 0);
            params.put("p_tenant_id", tenantId);
            params.put("p_processed_by", processedBy);
            
            Map<String, Object> result = jdbcCall.execute(params);
            // 표준화 프로시저는 p_success만 반환할 수 있음. p_completed가 있으면 우선 사용, 없으면 p_success를 completed 의미로 매핑
            Object completedRaw = result.get("p_completed");
            if (completedRaw == null) {
                completedRaw = result.get("p_success");
            }
            Boolean completed = toBoolean(completedRaw);
            Map<String, Object> response = new HashMap<>();
            response.put("completed", completed);
            response.put("message", result.get("p_message"));
            response.put("success", true);
            
            log.info("✅ PL/SQL 스케줄 자동 완료 처리 완료: 결과={}", response);
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 스케줄 자동 완료 처리 실패: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("completed", false);
            errorResponse.put("message", "스케줄 자동 완료 처리 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("success", false);
            return errorResponse;
        }
    }
    
    /**
     * 일괄 스케줄 완료 처리
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> processBatchScheduleCompletion(String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        // 테넌트 ID 및 처리자 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("🔄 PL/SQL 일괄 스케줄 완료 처리: tenantId={}", tenantId);
        String processedBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("ProcessBatchScheduleCompletion");
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_tenant_id", tenantId);
            params.put("p_processed_by", processedBy);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("processedCount", result.get("p_processed_count"));
            response.put("completedCount", result.get("p_completed_count"));
            response.put("reminderCount", result.get("p_reminder_count"));
            response.put("message", result.get("p_message"));
            response.put("success", true);
            
            log.info("✅ PL/SQL 일괄 스케줄 완료 처리 완료: 결과={}", response);
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 일괄 스케줄 완료 처리 실패: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("processedCount", 0);
            errorResponse.put("completedCount", 0);
            errorResponse.put("reminderCount", 0);
            errorResponse.put("message", "일괄 스케줄 완료 처리 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("success", false);
            return errorResponse;
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
     * 현재 스키마에 저장 프로시저가 존재하는지 확인한다.
     *
     * @param routineName information_schema.routines.routine_name (대소문자 무시)
     * @return 존재하면 true
     */
    private boolean isRoutineDeployed(String routineName) {
        try {
            String sql = "SELECT COUNT(*) FROM information_schema.routines "
                    + "WHERE routine_schema = DATABASE() AND routine_type = 'PROCEDURE' "
                    + "AND UPPER(routine_name) = UPPER(?)";
            Integer c = jdbcTemplate.queryForObject(sql, Integer.class, routineName);
            return c != null && c > 0;
        } catch (Exception e) {
            log.warn("프로시저 존재 여부 조회 실패 routine={}: {}", routineName, e.getMessage());
            return false;
        }
    }

    private static Map<String, Object> reminderSkippedResponse() {
        Map<String, Object> r = new HashMap<>();
        r.put("reminderId", 0L);
        r.put("message", null);
        r.put("success", false);
        return r;
    }

    private static Map<String, Object> reminderFailureResponse(String detail) {
        Map<String, Object> r = new HashMap<>();
        r.put("reminderId", 0L);
        r.put("message", detail != null ? detail : "알림 생성 실패");
        r.put("success", false);
        return r;
    }

    /**
     * MySQL BOOLEAN OUT이 TINYINT 등으로 반환될 때 {@link CallableStatement#getBoolean(int)}만으로는
     * 누락될 수 있어 {@link CallableStatement#getObject(int)}로 읽는다.
     */
    private static boolean readMysqlProcedureBooleanOut(CallableStatement stmt, int index) throws SQLException {
        Object v = stmt.getObject(index);
        if (v == null) {
            return false;
        }
        if (v instanceof Boolean) {
            return (Boolean) v;
        }
        if (v instanceof Number) {
            return ((Number) v).intValue() != 0;
        }
        String s = String.valueOf(v).trim();
        return "1".equals(s) || "true".equalsIgnoreCase(s);
    }

    private static boolean isJdbcSignatureAmbiguity(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            String m = t.getMessage();
            if (m != null && m.contains("Unable to determine the correct call signature")) {
                return true;
            }
            if (m != null && m.contains("no procedure/function/signature")) {
                return true;
            }
        }
        return false;
    }

    /**
     * 프로시저 OUT 파라미터(Boolean/Number 1|0)를 Boolean으로 변환
     */
    private static Boolean toBoolean(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue() != 0;
        }
        return false;
    }
}
