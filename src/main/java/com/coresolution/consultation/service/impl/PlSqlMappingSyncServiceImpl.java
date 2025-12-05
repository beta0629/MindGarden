package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlMappingSyncService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 매핑-회기 동기화 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlSqlMappingSyncServiceImpl implements PlSqlMappingSyncService {
    
    private final JdbcTemplate jdbcTemplate;
    
    /**
     * UTF-8 인코딩 설정
     */
    private void setUtf8Encoding() {
        try {
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            jdbcTemplate.execute("SET character_set_client = utf8mb4");
            jdbcTemplate.execute("SET character_set_connection = utf8mb4");
            jdbcTemplate.execute("SET character_set_results = utf8mb4");
        } catch (Exception e) {
            log.warn("UTF-8 인코딩 설정 중 오류 (무시됨): {}", e.getMessage());
        }
    }
    
    @Override
    public Map<String, Object> useSessionForMapping(Long consultantId, Long clientId, Long scheduleId, String sessionType) {
        log.info("🔄 PL/SQL 회기 사용 처리: ConsultantID={}, ClientID={}, ScheduleID={}, Type={}", 
                 consultantId, clientId, scheduleId, sessionType);
        
        // 테넌트 ID 및 사용자 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String usedBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요
        
        try {
            // UTF-8 인코딩 설정
            setUtf8Encoding();
            
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL UseSessionForMapping(?, ?, ?, ?, ?, ?, @p_success, @p_message)",
                consultantId, clientId, scheduleId, sessionType, tenantId, usedBy
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("consultantId", consultantId);
            result.put("clientId", clientId);
            result.put("scheduleId", scheduleId);
            result.put("sessionType", sessionType);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 회기 사용 처리 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 회기 사용 처리 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 회기 사용 처리 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 회기 사용 처리 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> addSessionsToMapping(Long mappingId, Integer additionalSessions, 
                                                   String packageName, Long packagePrice, String extensionReason) {
        log.info("🔄 PL/SQL 회기 추가 처리: MappingID={}, AdditionalSessions={}, PackageName={}", 
                 mappingId, additionalSessions, packageName);
        
        // 테넌트 ID 및 생성자 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String createdBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL AddSessionsToMapping(?, ?, ?, ?, ?, ?, ?, @p_success, @p_message)",
                mappingId, additionalSessions, packageName, packagePrice, extensionReason, tenantId, createdBy
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("mappingId", mappingId);
            result.put("additionalSessions", additionalSessions);
            result.put("packageName", packageName);
            result.put("packagePrice", packagePrice);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 회기 추가 처리 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 회기 추가 처리 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 회기 추가 처리 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 회기 추가 처리 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    @Transactional
    public Map<String, Object> validateMappingIntegrity(Long mappingId) {
        log.info("🔍 PL/SQL 매핑 무결성 검증: MappingID={}", mappingId);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL ValidateMappingIntegrity(?, ?, @p_success, @p_message, @p_validation_results)",
                mappingId, tenantId
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            String validationResultsJson = jdbcTemplate.queryForObject("SELECT @p_validation_results", String.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("mappingId", mappingId);
            result.put("validationResults", validationResultsJson);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 매핑 무결성 검증 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 매핑 무결성 검증 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 매핑 무결성 검증 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 매핑 무결성 검증 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> syncAllMappings() {
        log.info("🔄 PL/SQL 전체 매핑 동기화 시작");
        
        // 테넌트 ID 및 동기화자 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String syncedBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL SyncAllMappings(?, ?, @p_success, @p_message, @p_sync_results)",
                tenantId, syncedBy
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            String syncResultsJson = jdbcTemplate.queryForObject("SELECT @p_sync_results", String.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("syncResults", syncResultsJson);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 전체 매핑 동기화 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 전체 매핑 동기화 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 전체 매핑 동기화 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 전체 매핑 동기화 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> processRefundWithSessionAdjustment(Long mappingId, Long refundAmount, 
                                                                Integer refundSessions, String refundReason, String processedBy) {
        log.info("💰 PL/SQL 환불 처리: MappingID={}, RefundAmount={}, RefundSessions={}", 
                 mappingId, refundAmount, refundSessions);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL ProcessRefundWithSessionAdjustment(?, ?, ?, ?, ?, ?, @p_success, @p_message)",
                mappingId, refundAmount, refundSessions, refundReason, tenantId, processedBy
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("mappingId", mappingId);
            result.put("refundAmount", refundAmount);
            result.put("refundSessions", refundSessions);
            result.put("refundReason", refundReason);
            result.put("processedBy", processedBy);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 환불 처리 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 환불 처리 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 환불 처리 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 환불 처리 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> processPartialRefund(Long mappingId, Long refundAmount, 
                                                   Integer refundSessions, String refundReason, String processedBy) {
        log.info("💰 PL/SQL 부분 환불 처리: MappingID={}, RefundAmount={}, RefundSessions={}", 
                 mappingId, refundAmount, refundSessions);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL ProcessPartialRefund(?, ?, ?, ?, ?, ?, @p_success, @p_message)",
                mappingId, refundAmount, refundSessions, refundReason, tenantId, processedBy
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("mappingId", mappingId);
            result.put("refundAmount", refundAmount);
            result.put("refundSessions", refundSessions);
            result.put("refundReason", refundReason);
            result.put("processedBy", processedBy);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 부분 환불 처리 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 부분 환불 처리 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 부분 환불 처리 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 부분 환불 처리 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    @Transactional
    public Map<String, Object> getRefundableSessions(Long mappingId) {
        log.info("🔍 PL/SQL 환불 가능 회기 조회: MappingID={}", mappingId);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL GetRefundableSessions(?, ?, @p_success, @p_message, @p_refundable_sessions, @p_max_refund_amount)",
                mappingId, tenantId
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            Integer refundableSessions = jdbcTemplate.queryForObject("SELECT @p_refundable_sessions", Integer.class);
            Long maxRefundAmount = jdbcTemplate.queryForObject("SELECT @p_max_refund_amount", Long.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("mappingId", mappingId);
            result.put("refundableSessions", refundableSessions);
            result.put("maxRefundAmount", maxRefundAmount);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 환불 가능 회기 조회 완료: {}회기, 최대 환불 금액: {}", refundableSessions, maxRefundAmount);
            } else {
                log.warn("⚠️ PL/SQL 환불 가능 회기 조회 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 환불 가능 회기 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 환불 가능 회기 조회 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    @Transactional
    public Map<String, Object> getRefundStatistics(String branchCode, String startDate, String endDate) {
        log.info("📊 PL/SQL 환불 통계 조회: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 날짜 문자열을 LocalDate로 변환
            java.time.LocalDate startLocalDate = java.time.LocalDate.parse(startDate);
            java.time.LocalDate endLocalDate = java.time.LocalDate.parse(endDate);
            
            // PL/SQL 프로시저 호출 (표준화된 파라미터 순서)
            jdbcTemplate.update(
                "CALL GetRefundStatistics(?, ?, ?, @p_success, @p_message, @p_statistics)",
                tenantId, startLocalDate, endLocalDate
            );
            
            // 결과 조회
            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            String statisticsJson = jdbcTemplate.queryForObject("SELECT @p_statistics", String.class);
            
            result.put("success", success != null && success);
            result.put("message", message);
            result.put("startDate", startDate);
            result.put("endDate", endDate);
            result.put("statistics", statisticsJson);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 환불 통계 조회 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 환불 통계 조회 실패: Message={}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 환불 통계 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 환불 통계 조회 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public boolean isProcedureAvailable() {
        try {
            // 프로시저 존재 여부 확인
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.routines " +
                "WHERE routine_schema = DATABASE() " +
                "AND routine_name IN ('UseSessionForMapping', 'AddSessionsToMapping', 'ValidateMappingIntegrity', 'SyncAllMappings', " +
                "'ProcessRefundWithSessionAdjustment', 'ProcessPartialRefund', 'GetRefundableSessions', 'GetRefundStatistics')",
                Integer.class
            );
            
            return count != null && count >= 8;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 사용 가능 여부 확인 실패: {}", e.getMessage());
            return false;
        }
    }
}
