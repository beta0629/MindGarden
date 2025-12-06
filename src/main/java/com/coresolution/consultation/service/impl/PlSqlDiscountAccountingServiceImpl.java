package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlDiscountAccountingService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.object.StoredProcedure;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 할인 회계 처리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlSqlDiscountAccountingServiceImpl implements PlSqlDiscountAccountingService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    public Map<String, Object> applyDiscountAccounting(
            Long mappingId, 
            String discountCode, 
            BigDecimal originalAmount, 
            BigDecimal discountAmount, 
            BigDecimal finalAmount, 
            String branchCode, 
            String appliedBy) {
        
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 PL/SQL 할인 적용: MappingID={}, DiscountCode={}, OriginalAmount={}, FinalAmount={}, tenantId={}", 
                 mappingId, discountCode, originalAmount, finalAmount, tenantId);
        
        try {
            ApplyDiscountAccountingProcedure procedure = new ApplyDiscountAccountingProcedure(jdbcTemplate);
            
            Map<String, Object> result = procedure.execute(
                mappingId, discountCode, originalAmount, discountAmount, 
                finalAmount, tenantId, appliedBy
            );
            
            Boolean success = (Boolean) result.get("p_success");
            String message = (String) result.get("p_message");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success != null && success);
            response.put("message", message);
            response.put("mappingId", mappingId);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 할인 적용 완료: MappingID={}, Message={}", mappingId, message);
            } else {
                log.warn("⚠️ PL/SQL 할인 적용 실패: MappingID={}, Message={}", mappingId, message);
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 적용 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "PL/SQL 할인 적용 실패: " + e.getMessage());
            response.put("mappingId", mappingId);
            
            return response;
        }
    }
    
    @Override
    public Map<String, Object> processDiscountRefund(
            Long mappingId, 
            BigDecimal refundAmount, 
            String refundReason, 
            String processedBy) {
        
        log.info("💰 PL/SQL 할인 환불 처리: MappingID={}, RefundAmount={}, Reason={}", 
                 mappingId, refundAmount, refundReason);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            ProcessDiscountRefundProcedure procedure = new ProcessDiscountRefundProcedure(jdbcTemplate);
            
            Map<String, Object> result = procedure.execute(
                mappingId, refundAmount, refundReason, tenantId, processedBy
            );
            
            Boolean success = (Boolean) result.get("p_success");
            String message = (String) result.get("p_message");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success != null && success);
            response.put("message", message);
            response.put("mappingId", mappingId);
            response.put("refundAmount", refundAmount);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 할인 환불 처리 완료: MappingID={}, Message={}", mappingId, message);
            } else {
                log.warn("⚠️ PL/SQL 할인 환불 처리 실패: MappingID={}, Message={}", mappingId, message);
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 환불 처리 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "PL/SQL 할인 환불 처리 실패: " + e.getMessage());
            response.put("mappingId", mappingId);
            
            return response;
        }
    }
    
    @Override
    public Map<String, Object> updateDiscountStatus(
            Long mappingId, 
            String newStatus, 
            String updatedBy, 
            String reason) {
        
        log.info("🔄 PL/SQL 할인 상태 업데이트: MappingID={}, NewStatus={}, UpdatedBy={}", 
                 mappingId, newStatus, updatedBy);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            UpdateDiscountStatusProcedure procedure = new UpdateDiscountStatusProcedure(jdbcTemplate);
            
            Map<String, Object> result = procedure.execute(
                mappingId, newStatus, tenantId, updatedBy, reason
            );
            
            Boolean success = (Boolean) result.get("p_success");
            String message = (String) result.get("p_message");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success != null && success);
            response.put("message", message);
            response.put("mappingId", mappingId);
            response.put("newStatus", newStatus);
            
            if (success != null && success) {
                log.info("✅ PL/SQL 할인 상태 업데이트 완료: MappingID={}, Message={}", mappingId, message);
            } else {
                log.warn("⚠️ PL/SQL 할인 상태 업데이트 실패: MappingID={}, Message={}", mappingId, message);
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 상태 업데이트 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "PL/SQL 할인 상태 업데이트 실패: " + e.getMessage());
            response.put("mappingId", mappingId);
            
            return response;
        }
    }
    
    /**
     * 할인 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> getDiscountStatistics(
            String branchCode, 
            String startDate, 
            String endDate) {
        
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 PL/SQL 할인 통계 조회: tenantId={}, Period={} ~ {}", tenantId, startDate, endDate);
        
        try {
            GetDiscountStatisticsProcedure procedure = new GetDiscountStatisticsProcedure(jdbcTemplate);
            
            Map<String, Object> result = procedure.execute(tenantId, startDate, endDate);
            
            Map<String, Object> response = new HashMap<>();
            Boolean success = (Boolean) result.get("p_success");
            String message = (String) result.get("p_message");
            
            response.put("success", success != null && success);
            response.put("message", message);
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("totalDiscounts", result.get("p_total_discounts"));
            response.put("totalRefunds", result.get("p_total_refunds"));
            response.put("netDiscounts", result.get("p_net_discounts"));
            response.put("discountCount", result.get("p_discount_count"));
            response.put("refundCount", result.get("p_refund_count"));
            
            log.info("✅ PL/SQL 할인 통계 조회 완료: NetDiscounts={}", result.get("p_net_discounts"));
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 통계 조회 실패: 오류={}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "PL/SQL 할인 통계 조회 실패: " + e.getMessage());
            
            return response;
        }
    }
    
    @Override
    public Map<String, Object> validateDiscountIntegrity(String branchCode) {
        log.info("🔍 PL/SQL 할인 무결성 검증: BranchCode={}", branchCode);
        
        try {
            ValidateDiscountIntegrityProcedure procedure = new ValidateDiscountIntegrityProcedure(jdbcTemplate);
            
            Map<String, Object> result = procedure.execute(branchCode);
            
            Integer resultCode = (Integer) result.get("result_code");
            String resultMessage = (String) result.get("result_message");
            Integer errorCount = (Integer) result.get("error_count");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", resultCode == 0);
            response.put("resultCode", resultCode);
            response.put("message", resultMessage);
            response.put("branchCode", branchCode);
            response.put("errorCount", errorCount);
            response.put("isIntegrityValid", resultCode == 0);
            
            if (resultCode == 0) {
                log.info("✅ PL/SQL 할인 무결성 검증 통과: BranchCode={}", branchCode);
            } else {
                log.warn("⚠️ PL/SQL 할인 무결성 검증 실패: BranchCode={}, ErrorCount={}, Message={}", 
                         branchCode, errorCount, resultMessage);
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 무결성 검증 실패: BranchCode={}, 오류={}", branchCode, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "PL/SQL 할인 무결성 검증 실패: " + e.getMessage());
            response.put("branchCode", branchCode);
            
            return response;
        }
    }
    
    @Override
    public boolean isProcedureAvailable() {
        try {
            // 프로시저 존재 여부 확인
            String sql = "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'ApplyDiscountAccounting' AND routine_schema = DATABASE()";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 사용 가능 여부 확인 실패: {}", e.getMessage());
            return false;
        }
    }
    
    // ==================== Stored Procedure Classes ====================
    
    /**
     * 할인 적용 프로시저 클래스
     */
    private static class ApplyDiscountAccountingProcedure extends StoredProcedure {
        public ApplyDiscountAccountingProcedure(JdbcTemplate jdbcTemplate) {
            super(jdbcTemplate, "ApplyDiscountAccounting");
            declareParameter(new SqlParameter("p_mapping_id", java.sql.Types.BIGINT));
            declareParameter(new SqlParameter("p_discount_code", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_original_amount", java.sql.Types.DECIMAL));
            declareParameter(new SqlParameter("p_discount_amount", java.sql.Types.DECIMAL));
            declareParameter(new SqlParameter("p_final_amount", java.sql.Types.DECIMAL));
            declareParameter(new SqlParameter("p_tenant_id", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_applied_by", java.sql.Types.VARCHAR));
            declareParameter(new SqlOutParameter("p_success", java.sql.Types.BOOLEAN));
            declareParameter(new SqlOutParameter("p_message", java.sql.Types.VARCHAR));
            compile();
        }
        
        public Map<String, Object> execute(Long mappingId, String discountCode, BigDecimal originalAmount, 
                                         BigDecimal discountAmount, BigDecimal finalAmount, String tenantId, String appliedBy) {
            Map<String, Object> params = new HashMap<>();
            params.put("p_mapping_id", mappingId);
            params.put("p_discount_code", discountCode);
            params.put("p_original_amount", originalAmount);
            params.put("p_discount_amount", discountAmount);
            params.put("p_final_amount", finalAmount);
            params.put("p_tenant_id", tenantId);
            params.put("p_applied_by", appliedBy);
            return execute(params);
        }
    }
    
    /**
     * 할인 환불 처리 프로시저 클래스
     */
    private static class ProcessDiscountRefundProcedure extends StoredProcedure {
        public ProcessDiscountRefundProcedure(JdbcTemplate jdbcTemplate) {
            super(jdbcTemplate, "ProcessDiscountRefund");
            declareParameter(new SqlParameter("p_mapping_id", java.sql.Types.BIGINT));
            declareParameter(new SqlParameter("p_refund_amount", java.sql.Types.DECIMAL));
            declareParameter(new SqlParameter("p_refund_reason", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_tenant_id", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_processed_by", java.sql.Types.VARCHAR));
            declareParameter(new SqlOutParameter("p_success", java.sql.Types.BOOLEAN));
            declareParameter(new SqlOutParameter("p_message", java.sql.Types.VARCHAR));
            compile();
        }
        
        public Map<String, Object> execute(Long mappingId, BigDecimal refundAmount, String refundReason, String tenantId, String processedBy) {
            Map<String, Object> params = new HashMap<>();
            params.put("p_mapping_id", mappingId);
            params.put("p_refund_amount", refundAmount);
            params.put("p_refund_reason", refundReason);
            params.put("p_tenant_id", tenantId);
            params.put("p_processed_by", processedBy);
            return execute(params);
        }
    }
    
    /**
     * 할인 상태 업데이트 프로시저 클래스
     */
    private static class UpdateDiscountStatusProcedure extends StoredProcedure {
        public UpdateDiscountStatusProcedure(JdbcTemplate jdbcTemplate) {
            super(jdbcTemplate, "UpdateDiscountStatus");
            declareParameter(new SqlParameter("p_mapping_id", java.sql.Types.BIGINT));
            declareParameter(new SqlParameter("p_new_status", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_tenant_id", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_updated_by", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_reason", java.sql.Types.VARCHAR));
            declareParameter(new SqlOutParameter("p_success", java.sql.Types.BOOLEAN));
            declareParameter(new SqlOutParameter("p_message", java.sql.Types.VARCHAR));
            compile();
        }
        
        public Map<String, Object> execute(Long mappingId, String newStatus, String tenantId, String updatedBy, String reason) {
            Map<String, Object> params = new HashMap<>();
            params.put("p_mapping_id", mappingId);
            params.put("p_new_status", newStatus);
            params.put("p_tenant_id", tenantId);
            params.put("p_updated_by", updatedBy);
            params.put("p_reason", reason);
            return execute(params);
        }
    }
    
    /**
     * 할인 통계 조회 프로시저 클래스
     */
    private static class GetDiscountStatisticsProcedure extends StoredProcedure {
        public GetDiscountStatisticsProcedure(JdbcTemplate jdbcTemplate) {
            super(jdbcTemplate, "GetDiscountStatistics");
            declareParameter(new SqlParameter("p_tenant_id", java.sql.Types.VARCHAR));
            declareParameter(new SqlParameter("p_start_date", java.sql.Types.DATE));
            declareParameter(new SqlParameter("p_end_date", java.sql.Types.DATE));
            declareParameter(new SqlOutParameter("p_success", java.sql.Types.BOOLEAN));
            declareParameter(new SqlOutParameter("p_message", java.sql.Types.VARCHAR));
            declareParameter(new SqlOutParameter("p_total_discounts", java.sql.Types.DECIMAL));
            declareParameter(new SqlOutParameter("p_total_refunds", java.sql.Types.DECIMAL));
            declareParameter(new SqlOutParameter("p_net_discounts", java.sql.Types.DECIMAL));
            declareParameter(new SqlOutParameter("p_discount_count", java.sql.Types.INTEGER));
            declareParameter(new SqlOutParameter("p_refund_count", java.sql.Types.INTEGER));
            compile();
        }
        
        public Map<String, Object> execute(String tenantId, String startDate, String endDate) {
            Map<String, Object> params = new HashMap<>();
            params.put("p_tenant_id", tenantId);
            params.put("p_start_date", java.sql.Date.valueOf(LocalDate.parse(startDate)));
            params.put("p_end_date", java.sql.Date.valueOf(LocalDate.parse(endDate)));
            return execute(params);
        }
    }
    
    /**
     * 할인 무결성 검증 프로시저 클래스
     */
    private static class ValidateDiscountIntegrityProcedure extends StoredProcedure {
        public ValidateDiscountIntegrityProcedure(JdbcTemplate jdbcTemplate) {
            super(jdbcTemplate, "ValidateDiscountIntegrity");
            declareParameter(new SqlParameter("p_branch_code", java.sql.Types.VARCHAR));
            declareParameter(new SqlOutParameter("p_result_code", java.sql.Types.INTEGER));
            declareParameter(new SqlOutParameter("p_result_message", java.sql.Types.VARCHAR));
            declareParameter(new SqlOutParameter("p_error_count", java.sql.Types.INTEGER));
            compile();
        }
        
        public Map<String, Object> execute(String branchCode) {
            Map<String, Object> params = new HashMap<>();
            params.put("p_branch_code", branchCode);
            return execute(params);
        }
    }
}
