package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.PackageDiscount;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.DiscountAccountingService;
import com.coresolution.consultation.service.ErpDiscountIntegrationService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ERP 할인 통합 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ErpDiscountIntegrationServiceImpl implements ErpDiscountIntegrationService {
    
    private final DiscountAccountingService discountAccountingService;
    private final FinancialTransactionRepository financialTransactionRepository;
    
    @Override
    public Map<String, Object> processDiscountPayment(
            ConsultantClientMapping mapping, 
            PackageDiscount discount, 
            BigDecimal originalAmount, 
            BigDecimal finalAmount) {
        
        log.info("💰 ERP 할인 결제 처리: MappingID={}, OriginalAmount={}, FinalAmount={}", 
                 mapping.getId(), originalAmount, finalAmount);
        
        try {
            // 1. 할인 회계 거래 생성
            DiscountAccountingService.DiscountAccountingResult accountingResult = 
                discountAccountingService.createDiscountAccounting(mapping, discount, originalAmount, finalAmount);
            
            if (!accountingResult.isSuccess()) {
                throw new RuntimeException("할인 회계 거래 생성 실패: " + accountingResult.getMessage());
            }
            
            // 2. ERP 동기화 데이터 생성
            Map<String, Object> erpSyncData = createErpSyncData(accountingResult);
            
            // 3. ERP 시스템으로 전송 (실제 구현에서는 ERP API 호출)
            boolean erpSyncSuccess = sendToErpSystem(erpSyncData);
            
            // 4. 결과 반환
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "할인 결제 처리가 완료되었습니다");
            result.put("accountingResult", accountingResult);
            result.put("erpSyncSuccess", erpSyncSuccess);
            result.put("erpSyncData", erpSyncData);
            
            log.info("✅ ERP 할인 결제 처리 완료: MappingID={}, ERP동기화={}", 
                     mapping.getId(), erpSyncSuccess);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ ERP 할인 결제 처리 실패: MappingID={}, 오류={}", 
                     mapping.getId(), e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "할인 결제 처리 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> getDiscountAccountingSummary(String branchCode, String startDate, String endDate) {
        // 브랜치 개념 제거: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음 (표준화 2025-12-05)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 할인 회계 요약 조회: tenantId={}, Period={} ~ {}", tenantId, startDate, endDate);
        
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            
            // 1. 할인 거래 조회 (테넌트 기반, branchCode 필터링 제거)
            // 할인은 EXPENSE 타입으로 저장되며, 카테고리로 구분됨
            List<FinancialTransaction> discountTransactions = financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndTransactionDateBetweenAndIsDeletedFalse(
                    tenantId, FinancialTransaction.TransactionType.EXPENSE, start, end)
                .stream()
                .filter(t -> t.getCategory() != null && t.getCategory().contains("할인"))
                .collect(Collectors.toList());
            
            // 2. 매출 거래 조회 (테넌트 기반, branchCode 필터링 제거)
            List<FinancialTransaction> revenueTransactions = financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndTransactionDateBetweenAndIsDeletedFalse(
                    tenantId, FinancialTransaction.TransactionType.INCOME, start, end);
            
            // 3. 통계 계산
            BigDecimal totalRevenue = revenueTransactions.stream()
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalDiscount = discountTransactions.stream()
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .abs(); // 할인은 음수로 저장되므로 절댓값 사용
            
            BigDecimal netRevenue = totalRevenue.subtract(totalDiscount);
            BigDecimal discountRate = totalRevenue.compareTo(BigDecimal.ZERO) > 0 ? 
                totalDiscount.divide(totalRevenue, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO;
            
            // 4. 결과 생성
            Map<String, Object> summary = new HashMap<>();
            summary.put("tenantId", tenantId);
            summary.put("startDate", startDate);
            summary.put("endDate", endDate);
            summary.put("totalRevenue", totalRevenue);
            summary.put("totalDiscount", totalDiscount);
            summary.put("netRevenue", netRevenue);
            summary.put("discountRate", discountRate);
            summary.put("discountTransactionCount", discountTransactions.size());
            summary.put("revenueTransactionCount", revenueTransactions.size());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", summary);
            result.put("message", "할인 회계 요약 조회 완료");
            
            log.info("✅ 할인 회계 요약 조회 완료: BranchCode={}, NetRevenue={}, DiscountRate={}%", 
                     tenantId, netRevenue, discountRate);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 요약 조회 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "할인 회계 요약 조회 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> validateDiscountAccountingIntegrity(String branchCode) {
        // 브랜치 개념 제거: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음 (표준화 2025-12-05)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("🔍 할인 회계 무결성 검증: tenantId={}", tenantId);
        
        try {
            // 1. 매출 거래와 할인 거래 매칭 검증 (테넌트 기반, branchCode 필터링 제거)
            List<FinancialTransaction> revenueTransactions = financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndIsDeletedFalse(tenantId, FinancialTransaction.TransactionType.INCOME);
            
            // 할인은 EXPENSE 타입으로 저장되며, 카테고리로 구분됨
            List<FinancialTransaction> discountTransactions = financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndIsDeletedFalse(tenantId, FinancialTransaction.TransactionType.EXPENSE)
                .stream()
                .filter(t -> t.getCategory() != null && t.getCategory().contains("할인"))
                .collect(Collectors.toList());
            
            // 2. 무결성 검증
            Map<String, Object> integrityCheck = new HashMap<>();
            integrityCheck.put("totalRevenueTransactions", revenueTransactions.size());
            integrityCheck.put("totalDiscountTransactions", discountTransactions.size());
            
            // 매칭 검증 (간단한 예시)
            long matchedPairs = 0;
            for (var revenue : revenueTransactions) {
                boolean hasMatchingDiscount = discountTransactions.stream()
                    .anyMatch(discount -> 
                        discount.getRelatedEntityId().equals(revenue.getRelatedEntityId()) &&
                        discount.getRelatedEntityType().equals(revenue.getRelatedEntityType())
                    );
                if (hasMatchingDiscount) {
                    matchedPairs++;
                }
            }
            
            integrityCheck.put("matchedPairs", matchedPairs);
            integrityCheck.put("isIntegrityValid", matchedPairs == revenueTransactions.size());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", integrityCheck);
            result.put("message", "할인 회계 무결성 검증 완료");
            
            log.info("✅ 할인 회계 무결성 검증 완료: tenantId={}, MatchedPairs={}/{}", 
                     tenantId, matchedPairs, revenueTransactions.size());
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 무결성 검증 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "할인 회계 무결성 검증 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     /**
     * ERP 동기화 데이터 생성
     */
    private Map<String, Object> createErpSyncData(DiscountAccountingService.DiscountAccountingResult accountingResult) {
        Map<String, Object> erpData = new HashMap<>();
        erpData.put("mappingId", accountingResult.getMappingId());
        erpData.put("originalAmount", accountingResult.getOriginalAmount());
        erpData.put("discountAmount", accountingResult.getDiscountAmount());
        erpData.put("finalAmount", accountingResult.getFinalAmount());
        erpData.put("discountCode", accountingResult.getDiscountCode());
        erpData.put("discountName", accountingResult.getDiscountName());
        erpData.put("revenueTransactionId", accountingResult.getRevenueTransactionId());
        erpData.put("discountTransactionId", accountingResult.getDiscountTransactionId());
        erpData.put("syncTimestamp", LocalDateTime.now());
        erpData.put("syncType", "DISCOUNT_PAYMENT");
        
        return erpData;
    }
    
    /**
     /**
     * ERP 시스템으로 전송 (실제 구현에서는 ERP API 호출)
     */
    private boolean sendToErpSystem(Map<String, Object> erpData) {
        try {
            // 실제 구현에서는 ERP API 호출
            // 예: ERP REST API, SOAP API, 또는 메시지 큐 전송
            
            log.info("📤 ERP 시스템으로 전송: MappingID={}, Type={}", 
                     erpData.get("mappingId"), erpData.get("syncType"));
            
            // 임시로 성공 반환
            return true;
            
        } catch (Exception e) {
            log.error("❌ ERP 시스템 전송 실패: 오류={}", e.getMessage(), e);
            return false;
        }
    }
}
