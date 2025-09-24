package com.mindgarden.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.service.PlSqlMappingSyncService;
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
    
    @Override
    public Map<String, Object> useSessionForMapping(Long consultantId, Long clientId, Long scheduleId, String sessionType) {
        log.info("🔄 PL/SQL 회기 사용 처리: ConsultantID={}, ClientID={}, ScheduleID={}, Type={}", 
                 consultantId, clientId, scheduleId, sessionType);
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL UseSessionForMapping(?, ?, ?, ?, @result_code, @result_message)",
                consultantId, clientId, scheduleId, sessionType
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("consultantId", consultantId);
            result.put("clientId", clientId);
            result.put("scheduleId", scheduleId);
            result.put("sessionType", sessionType);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 회기 사용 처리 완료: {}", resultMessage);
            } else {
                log.warn("⚠️ PL/SQL 회기 사용 처리 실패: Code={}, Message={}", resultCode, resultMessage);
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
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL AddSessionsToMapping(?, ?, ?, ?, ?, @result_code, @result_message)",
                mappingId, additionalSessions, packageName, packagePrice, extensionReason
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("mappingId", mappingId);
            result.put("additionalSessions", additionalSessions);
            result.put("packageName", packageName);
            result.put("packagePrice", packagePrice);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 회기 추가 처리 완료: {}", resultMessage);
            } else {
                log.warn("⚠️ PL/SQL 회기 추가 처리 실패: Code={}, Message={}", resultCode, resultMessage);
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
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL ValidateMappingIntegrity(?, @result_code, @result_message, @validation_results)",
                mappingId
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            String validationResultsJson = jdbcTemplate.queryForObject("SELECT @validation_results", String.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("mappingId", mappingId);
            result.put("validationResults", validationResultsJson);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 매핑 무결성 검증 완료: {}", resultMessage);
            } else {
                log.warn("⚠️ PL/SQL 매핑 무결성 검증 실패: Code={}, Message={}", resultCode, resultMessage);
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
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL SyncAllMappings(@result_code, @result_message, @sync_results)"
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            String syncResultsJson = jdbcTemplate.queryForObject("SELECT @sync_results", String.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("syncResults", syncResultsJson);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 전체 매핑 동기화 완료: {}", resultMessage);
            } else {
                log.warn("⚠️ PL/SQL 전체 매핑 동기화 실패: Code={}, Message={}", resultCode, resultMessage);
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
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL ProcessRefundWithSessionAdjustment(?, ?, ?, ?, ?, @result_code, @result_message)",
                mappingId, refundAmount, refundSessions, refundReason, processedBy
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("mappingId", mappingId);
            result.put("refundAmount", refundAmount);
            result.put("refundSessions", refundSessions);
            result.put("refundReason", refundReason);
            result.put("processedBy", processedBy);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 환불 처리 완료: {}", resultMessage);
            } else {
                log.warn("⚠️ PL/SQL 환불 처리 실패: Code={}, Message={}", resultCode, resultMessage);
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
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL ProcessPartialRefund(?, ?, ?, ?, ?, @result_code, @result_message)",
                mappingId, refundAmount, refundSessions, refundReason, processedBy
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("mappingId", mappingId);
            result.put("refundAmount", refundAmount);
            result.put("refundSessions", refundSessions);
            result.put("refundReason", refundReason);
            result.put("processedBy", processedBy);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 부분 환불 처리 완료: {}", resultMessage);
            } else {
                log.warn("⚠️ PL/SQL 부분 환불 처리 실패: Code={}, Message={}", resultCode, resultMessage);
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
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL GetRefundableSessions(?, @result_code, @result_message, @refundable_sessions, @max_refund_amount)",
                mappingId
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            Integer refundableSessions = jdbcTemplate.queryForObject("SELECT @refundable_sessions", Integer.class);
            Long maxRefundAmount = jdbcTemplate.queryForObject("SELECT @max_refund_amount", Long.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("mappingId", mappingId);
            result.put("refundableSessions", refundableSessions);
            result.put("maxRefundAmount", maxRefundAmount);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 환불 가능 회기 조회 완료: {}회기, 최대 환불 금액: {}", refundableSessions, maxRefundAmount);
            } else {
                log.warn("⚠️ PL/SQL 환불 가능 회기 조회 실패: Code={}, Message={}", resultCode, resultMessage);
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
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // PL/SQL 프로시저 호출
            jdbcTemplate.update(
                "CALL GetRefundStatistics(?, ?, ?, @result_code, @result_message, @statistics)",
                branchCode, startDate, endDate
            );
            
            // 결과 조회
            Integer resultCode = jdbcTemplate.queryForObject("SELECT @result_code", Integer.class);
            String resultMessage = jdbcTemplate.queryForObject("SELECT @result_message", String.class);
            String statisticsJson = jdbcTemplate.queryForObject("SELECT @statistics", String.class);
            
            result.put("success", resultCode == 0);
            result.put("resultCode", resultCode);
            result.put("message", resultMessage);
            result.put("branchCode", branchCode);
            result.put("startDate", startDate);
            result.put("endDate", endDate);
            result.put("statistics", statisticsJson);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 환불 통계 조회 완료: {}", resultMessage);
            } else {
                log.warn("⚠️ PL/SQL 환불 통계 조회 실패: Code={}, Message={}", resultCode, resultMessage);
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
