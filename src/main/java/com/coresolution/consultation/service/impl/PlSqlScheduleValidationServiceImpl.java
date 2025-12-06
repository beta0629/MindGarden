package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
public class PlSqlScheduleValidationServiceImpl implements PlSqlScheduleValidationService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public Map<String, Object> validateConsultationRecordBeforeCompletion(
            Long scheduleId, Long consultantId, LocalDate sessionDate) {
        
        log.info("🔍 PL/SQL 상담일지 작성 여부 확인: 스케줄 ID={}, 상담사 ID={}, 날짜={}", 
                scheduleId, consultantId, sessionDate);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
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
        
        // 테넌트 ID 및 생성자 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String createdBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("CreateConsultationRecordReminder");
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_schedule_id", scheduleId);
            params.put("p_consultant_id", consultantId);
            params.put("p_client_id", clientId);
            params.put("p_session_date", sessionDate);
            params.put("p_session_time", "00:00:00");
            params.put("p_title", title);
            params.put("p_tenant_id", tenantId);
            params.put("p_created_by", createdBy);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("reminderId", result.get("p_reminder_id"));
            response.put("message", result.get("p_message"));
            response.put("success", true);
            
            log.info("✅ PL/SQL 상담일지 알림 생성 완료: 결과={}", response);
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 상담일지 알림 생성 실패: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("reminderId", 0L);
            errorResponse.put("message", "상담일지 알림 생성 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("success", false);
            return errorResponse;
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
                .withProcedureName("ProcessScheduleAutoCompletion");
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_schedule_id", scheduleId);
            params.put("p_consultant_id", consultantId);
            params.put("p_session_date", sessionDate);
            params.put("p_force_complete", forceComplete ? 1 : 0);
            params.put("p_tenant_id", tenantId);
            params.put("p_processed_by", processedBy);
            
            Map<String, Object> result = jdbcCall.execute(params);
            
            Map<String, Object> response = new HashMap<>();
            response.put("completed", result.get("p_completed"));
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
}
