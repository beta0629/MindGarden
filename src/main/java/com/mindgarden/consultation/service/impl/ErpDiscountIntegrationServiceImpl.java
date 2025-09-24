package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.FinancialTransaction;
import com.mindgarden.consultation.entity.PackageDiscount;
import com.mindgarden.consultation.repository.FinancialTransactionRepository;
import com.mindgarden.consultation.service.DiscountAccountingService;
import com.mindgarden.consultation.service.ErpDiscountIntegrationService;
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
        log.info("📊 할인 회계 요약 조회: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        try {
            // 1. 할인 거래 조회
            var discountTransactions = financialTransactionRepository
                .findAll()
                .stream()
                .filter(ft -> "DISCOUNT".equals(ft.getTransactionType()) && 
                             branchCode.equals(ft.getBranchCode()) &&
                             ft.getTransactionDate().isAfter(LocalDateTime.parse(startDate + "T00:00:00").toLocalDate()) &&
                             ft.getTransactionDate().isBefore(LocalDateTime.parse(endDate + "T23:59:59").toLocalDate()))
                .collect(Collectors.toList());
            
            // 2. 매출 거래 조회
            var revenueTransactions = financialTransactionRepository
                .findAll()
                .stream()
                .filter(ft -> "INCOME".equals(ft.getTransactionType()) && 
                             branchCode.equals(ft.getBranchCode()) &&
                             ft.getTransactionDate().isAfter(LocalDateTime.parse(startDate + "T00:00:00").toLocalDate()) &&
                             ft.getTransactionDate().isBefore(LocalDateTime.parse(endDate + "T23:59:59").toLocalDate()))
                .collect(Collectors.toList());
            
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
            summary.put("branchCode", branchCode);
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
                     branchCode, netRevenue, discountRate);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 요약 조회 실패: BranchCode={}, 오류={}", branchCode, e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "할인 회계 요약 조회 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> validateDiscountAccountingIntegrity(String branchCode) {
        log.info("🔍 할인 회계 무결성 검증: BranchCode={}", branchCode);
        
        try {
            // 1. 매출 거래와 할인 거래 매칭 검증
            var revenueTransactions = financialTransactionRepository
                .findAll()
                .stream()
                .filter(ft -> "INCOME".equals(ft.getTransactionType()) && branchCode.equals(ft.getBranchCode()))
                .collect(Collectors.toList());
            
            var discountTransactions = financialTransactionRepository
                .findAll()
                .stream()
                .filter(ft -> "DISCOUNT".equals(ft.getTransactionType()) && branchCode.equals(ft.getBranchCode()))
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
            
            log.info("✅ 할인 회계 무결성 검증 완료: BranchCode={}, MatchedPairs={}/{}", 
                     branchCode, matchedPairs, revenueTransactions.size());
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 무결성 검증 실패: BranchCode={}, 오류={}", branchCode, e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "할인 회계 무결성 검증 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    // ==================== Private Helper Methods ====================
    
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
