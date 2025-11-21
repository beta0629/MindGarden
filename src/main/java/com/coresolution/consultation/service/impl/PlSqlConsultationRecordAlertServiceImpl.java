package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import org.springframework.beans.factory.annotation.Autowired;
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
    
    @Override
    public Map<String, Object> checkMissingConsultationRecords(LocalDate checkDate, String branchCode) {
        log.info("📝 상담일지 미작성 확인 시작: 날짜={}, 지점={}", checkDate, branchCode);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("CheckMissingConsultationRecords");
            
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_check_date", checkDate)
                .addValue("p_branch_code", branchCode);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", result.get("p_message"));
            response.put("missingCount", result.get("p_missing_count"));
            response.put("alertsCreated", result.get("p_alerts_created"));
            
            log.info("✅ 상담일지 미작성 확인 완료: 미작성={}건, 알림생성={}건", 
                    result.get("p_missing_count"), result.get("p_alerts_created"));
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ 상담일지 미작성 확인 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상담일지 미작성 확인 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("missingCount", 0);
            errorResponse.put("alertsCreated", 0);
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> getMissingConsultationRecordAlerts(String branchCode, LocalDate startDate, LocalDate endDate) {
        log.info("📝 상담일지 미작성 알림 조회: 지점={}, 기간={}~{}", branchCode, startDate, endDate);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("GetMissingConsultationRecordAlerts");
            
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_branch_code", branchCode)
                .addValue("p_start_date", startDate)
                .addValue("p_end_date", endDate);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", result.get("p_message"));
            response.put("alerts", result.get("p_alerts"));
            response.put("totalCount", result.get("p_total_count"));
            
            log.info("✅ 상담일지 미작성 알림 조회 완료: 총 {}건", result.get("p_total_count"));
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ 상담일지 미작성 알림 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상담일지 미작성 알림 조회 중 오류가 발생했습니다: " + e.getMessage());
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
                .withProcedureName("ResolveConsultationRecordAlert");
            
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_consultation_id", consultationId)
                .addValue("p_resolved_by", resolvedBy);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", result.get("p_message"));
            
            log.info("✅ 상담일지 알림 해제 완료: {}", result.get("p_message"));
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ 상담일지 알림 해제 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상담일지 알림 해제 중 오류가 발생했습니다: " + e.getMessage());
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> getConsultationRecordMissingStatistics(String branchCode, LocalDate startDate, LocalDate endDate) {
        log.info("📊 상담일지 미작성 통계 조회: 지점={}, 기간={}~{}", branchCode, startDate, endDate);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("GetConsultationRecordMissingStatistics");
            
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_branch_code", branchCode)
                .addValue("p_start_date", startDate)
                .addValue("p_end_date", endDate);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", result.get("p_message"));
            response.put("totalConsultations", result.get("p_total_consultations"));
            response.put("missingRecords", result.get("p_missing_records"));
            response.put("completionRate", result.get("p_completion_rate"));
            response.put("consultantBreakdown", result.get("p_consultant_breakdown"));
            
            log.info("✅ 상담일지 미작성 통계 조회 완료: 전체={}건, 미작성={}건, 완성률={}%", 
                    result.get("p_total_consultations"), result.get("p_missing_records"), result.get("p_completion_rate"));
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ 상담일지 미작성 통계 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상담일지 미작성 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("totalConsultations", 0);
            errorResponse.put("missingRecords", 0);
            errorResponse.put("completionRate", 0.0);
            errorResponse.put("consultantBreakdown", Map.of());
            
            return errorResponse;
        }
    }
    
    @Override
    public Map<String, Object> autoCreateMissingConsultationRecordAlerts(int daysBack) {
        log.info("🤖 상담일지 미작성 알림 자동 생성: {}일 전까지", daysBack);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("AutoCreateMissingConsultationRecordAlerts");
            
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("p_days_back", daysBack);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.get("p_success"));
            response.put("message", result.get("p_message"));
            response.put("processedDays", result.get("p_processed_days"));
            response.put("totalAlertsCreated", result.get("p_total_alerts_created"));
            
            log.info("✅ 상담일지 미작성 알림 자동 생성 완료: 처리일수={}일, 생성알림={}건", 
                    result.get("p_processed_days"), result.get("p_total_alerts_created"));
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ 상담일지 미작성 알림 자동 생성 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상담일지 미작성 알림 자동 생성 중 오류가 발생했습니다: " + e.getMessage());
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
            log.error("❌ 상담사별 상담일지 미작성 현황 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상담사별 상담일지 미작성 현황 조회 중 오류가 발생했습니다: " + e.getMessage());
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
            log.error("❌ 상담일지 알림 일괄 해제 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상담일지 알림 일괄 해제 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("updatedCount", 0);
            
            return errorResponse;
        }
    }
}
