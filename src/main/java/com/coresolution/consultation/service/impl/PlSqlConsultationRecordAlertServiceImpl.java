package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.constant.ServerErrorMessages;
import com.coresolution.consultation.util.ServerErrorResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담일지 미작성 알림 PL/SQL 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Service
@Transactional
public class PlSqlConsultationRecordAlertServiceImpl implements PlSqlConsultationRecordAlertService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    /**
     * 상담일지 미작성 확인
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> checkMissingConsultationRecords(LocalDate checkDate, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = com.coresolution.core.context.TenantContextHolder.getRequiredTenantId();
        log.info("📝 상담일지 미작성 확인 시작: 날짜={}, tenantId={}", checkDate, tenantId);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("CheckMissingConsultationRecords");
            
            // 표준화 2025-12-06: branchCode 대신 tenantId 사용 (프로시저가 p_tenant_id를 받도록 수정되었다고 가정)
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_check_date", checkDate)
                .addValue("p_tenant_id", tenantId); // branchCode 대신 tenantId 사용
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", resolveProcedureMessage(result, response));
            response.put("missingCount", result.get("p_missing_count"));
            response.put("alertsCreated", result.get("p_alerts_created"));
            
            log.info("✅ 상담일지 미작성 확인 완료: 미작성={}건, 알림생성={}건", 
                    result.get("p_missing_count"), result.get("p_alerts_created"));
            
            return response;
            
        } catch (Exception e) {
            String traceId = ServerErrorResponses.newTraceId();
            log.error("❌ 상담일지 미작성 확인 실패: traceId={}", traceId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            putInternalError(errorResponse, traceId);
            errorResponse.put("missingCount", 0);
            errorResponse.put("alertsCreated", 0);
            
            return errorResponse;
        }
    }
    
    /**
     * 상담일지 미작성 알림 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> getMissingConsultationRecordAlerts(String branchCode, LocalDate startDate, LocalDate endDate) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = com.coresolution.core.context.TenantContextHolder.getRequiredTenantId();
        log.info("📝 상담일지 미작성 알림 조회: tenantId={}, 기간={}~{}", tenantId, startDate, endDate);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("GetMissingConsultationRecordAlerts");
            
            // 표준화 2025-12-06: branchCode 대신 tenantId 사용 (프로시저가 p_tenant_id를 받도록 수정되었다고 가정)
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_tenant_id", tenantId) // branchCode 대신 tenantId 사용
                .addValue("p_start_date", startDate)
                .addValue("p_end_date", endDate);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", resolveProcedureMessage(result, response));
            response.put("alerts", result.get("p_alerts"));
            response.put("totalCount", result.get("p_total_count"));
            
            log.info("✅ 상담일지 미작성 알림 조회 완료: 총 {}건", result.get("p_total_count"));
            
            return response;
            
        } catch (Exception e) {
            String traceId = ServerErrorResponses.newTraceId();
            log.error("❌ 상담일지 미작성 알림 조회 실패: traceId={}", traceId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            putInternalError(errorResponse, traceId);
            errorResponse.put("alerts", List.of());
            errorResponse.put("totalCount", 0);
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> resolveConsultationRecordAlert(Long consultationId, String resolvedBy) {
        log.info("📝 상담일지 알림 해제: 상담ID={}, 해제자={}", consultationId, resolvedBy);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("ResolveConsultationRecordAlert");
            
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_consultation_id", consultationId)
                .addValue("p_resolved_by", resolvedBy);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", resolveProcedureMessage(result, response));
            
            log.info("✅ 상담일지 알림 해제 완료: {}", result.get("p_message"));
            
            return response;
            
        } catch (Exception e) {
            String traceId = ServerErrorResponses.newTraceId();
            log.error("❌ 상담일지 알림 해제 실패: traceId={}", traceId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            putInternalError(errorResponse, traceId);
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> getConsultationRecordMissingStatistics(String branchCode, LocalDate startDate, LocalDate endDate) {
        log.info("📊 상담일지 미작성 통계 조회: 지점={}, 기간={}~{}", branchCode, startDate, endDate);
        
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("GetConsultationRecordMissingStatistics");
            
            // 표준화된 프로시저는 p_tenant_id와 p_check_date만 받음 (단일 날짜)
            // startDate와 endDate가 있으면 startDate를 사용
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_tenant_id", tenantId)
                .addValue("p_check_date", startDate != null ? startDate : endDate);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", resolveProcedureMessage(result, response));
            response.put("totalConsultations", result.get("p_total_consultations"));
            response.put("missingRecords", result.get("p_missing_records"));
            response.put("completionRate", result.get("p_completion_rate"));
            response.put("consultantBreakdown", result.get("p_consultant_breakdown"));
            
            log.info("✅ 상담일지 미작성 통계 조회 완료: 전체={}건, 미작성={}건, 완성률={}%", 
                    result.get("p_total_consultations"), result.get("p_missing_records"), result.get("p_completion_rate"));
            
            return response;
            
        } catch (Exception e) {
            String traceId = ServerErrorResponses.newTraceId();
            log.error("❌ 상담일지 미작성 통계 조회 실패: traceId={}", traceId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            putInternalError(errorResponse, traceId);
            errorResponse.put("totalConsultations", 0);
            errorResponse.put("missingRecords", 0);
            errorResponse.put("completionRate", 0.0);
            errorResponse.put("consultantBreakdown", Map.of());
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> autoCreateMissingConsultationRecordAlerts(int daysBack) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("🤖 상담일지 미작성 알림 자동 생성: tenantId={}, daysBack={}", tenantId, daysBack);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName(dbSchemaName)
                .withProcedureName("AutoCreateMissingConsultationRecordAlerts");
            
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_tenant_id", tenantId)
                .addValue("p_days_back", daysBack);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", resolveProcedureMessage(result, response));
            response.put("processedDays", result.get("p_processed_days"));
            response.put("totalAlertsCreated", result.get("p_total_alerts_created"));
            
            log.info("✅ 상담일지 미작성 알림 자동 생성 완료: 처리일수={}일, 생성알림={}건", 
                    result.get("p_processed_days"), result.get("p_total_alerts_created"));
            
            return response;
            
        } catch (Exception e) {
            String traceId = ServerErrorResponses.newTraceId();
            log.error("❌ 상담일지 미작성 알림 자동 생성 실패: traceId={}", traceId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            putInternalError(errorResponse, traceId);
            errorResponse.put("processedDays", 0);
            errorResponse.put("totalAlertsCreated", 0);
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> getConsultantMissingRecords(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("👤 상담사별 상담일지 미작성 현황 조회: 상담사ID={}, 기간={}~{}", consultantId, startDate, endDate);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            String sql = """
                SELECT 
                    c.id as consultation_id,
                    c.start_time,
                    c.end_time,
                    u.name as client_name,
                    CASE 
                        WHEN cr.id IS NULL THEN '미작성'
                        ELSE '작성완료'
                    END as record_status
                FROM consultations c
                INNER JOIN users u ON c.client_id = u.id
                LEFT JOIN consultation_records cr ON c.id = cr.consultation_id AND cr.is_deleted = FALSE
                WHERE c.consultant_id = ?
                  AND DATE(c.start_time) BETWEEN ? AND ?
                  AND c.status = 'COMPLETED'
                  AND c.is_deleted = FALSE
                  AND u.is_deleted = FALSE
                ORDER BY c.start_time DESC
                """;
            
            List<Map<String, Object>> records = jdbcTemplate.queryForList(sql, consultantId, startDate, endDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담사별 상담일지 미작성 현황 조회 완료");
            response.put("records", records);
            response.put("totalCount", records.size());
            
            long missingCount = records.stream()
                .mapToLong(record -> "미작성".equals(record.get("record_status")) ? 1 : 0)
                .sum();
            
            response.put("missingCount", missingCount);
            response.put("completionRate", records.size() > 0 ? 
                Math.round((double)(records.size() - missingCount) / records.size() * 100) : 0);
            
            log.info("✅ 상담사별 상담일지 미작성 현황 조회 완료: 총 {}건, 미작성 {}건", 
                    records.size(), missingCount);
            
            return response;
            
        } catch (Exception e) {
            String traceId = ServerErrorResponses.newTraceId();
            log.error("❌ 상담사별 상담일지 미작성 현황 조회 실패: traceId={}", traceId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            putInternalError(errorResponse, traceId);
            errorResponse.put("records", List.of());
            errorResponse.put("totalCount", 0);
            errorResponse.put("missingCount", 0);
            errorResponse.put("completionRate", 0);
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> resolveAllConsultationRecordAlerts(Long consultantId, String resolvedBy) {
        log.info("📝 상담일지 알림 일괄 해제: 상담사ID={}, 해제자={}", consultantId, resolvedBy);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            String sql = """
                UPDATE performance_alerts 
                SET is_resolved = TRUE,
                    resolved_at = NOW(),
                    resolved_by = ?,
                    updated_at = NOW()
                WHERE alert_type = 'MISSING_CONSULTATION_RECORD'
                  AND is_resolved = FALSE
                  AND is_deleted = FALSE
                  AND (? IS NULL OR consultant_id = ?)
                """;
            
            int updatedCount = jdbcTemplate.update(sql, resolvedBy, consultantId, consultantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("상담일지 알림이 성공적으로 일괄 해제되었습니다. (%d건)", updatedCount));
            response.put("updatedCount", updatedCount);
            
            log.info("✅ 상담일지 알림 일괄 해제 완료: {}건", updatedCount);
            
            return response;
            
        } catch (Exception e) {
            String traceId = ServerErrorResponses.newTraceId();
            log.error("❌ 상담일지 알림 일괄 해제 실패: traceId={}", traceId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            putInternalError(errorResponse, traceId);
            errorResponse.put("updatedCount", 0);
            
            return errorResponse;
        }
    }

    /**
     * 실패 응답에 공용 5xx 문구·오류 코드·추적 id 만 싣는다 (원시 예외 문구 비노출).
     *
     * @param errorResponse 실패 응답
     * @param traceId       추적 id
     */
    private static void putInternalError(Map<String, Object> errorResponse, String traceId) {
        errorResponse.put("message", ServerErrorMessages.INTERNAL_SERVER_ERROR);
        errorResponse.put("errorCode", ServerErrorMessages.CODE_INTERNAL_SERVER_ERROR);
        errorResponse.put(ServerErrorResponses.TRACE_ID_KEY, traceId);
    }

    /**
     * 프로시저 결과 문구. 실패({@code p_success=false})면 프로시저가 붙인 SQL 오류 문구 대신 공용 문구로 바꾼다.
     *
     * @param result   프로시저 OUT 결과
     * @param response 응답 (실패 시 오류 코드·추적 id 를 함께 싣는다)
     * @return 응답에 실을 문구
     */
    private static String resolveProcedureMessage(Map<String, Object> result, Map<String, Object> response) {
        if (!Boolean.FALSE.equals(toBoolean(result.get("p_success")))) {
            Object message = result.get("p_message");
            return message != null ? message.toString() : null;
        }
        String traceId = ServerErrorResponses.newTraceId();
        log.error("❌ 상담일지 알림 프로시저 실패(p_success=false): traceId={}", traceId);
        response.put("errorCode", ServerErrorMessages.CODE_INTERNAL_SERVER_ERROR);
        response.put(ServerErrorResponses.TRACE_ID_KEY, traceId);
        return ServerErrorMessages.INTERNAL_SERVER_ERROR;
    }

    private static Boolean toBoolean(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof Number number) {
            return number.intValue() != 0;
        }
        return Boolean.valueOf(value.toString());
    }
}
