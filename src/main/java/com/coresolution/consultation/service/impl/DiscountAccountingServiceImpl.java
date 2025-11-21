package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.FinancialTransaction;
import com.coresolution.consultation.entity.PackageDiscount;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.FinancialTransactionRepository;
import com.coresolution.consultation.service.DiscountAccountingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 할인 회계 처리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DiscountAccountingServiceImpl implements DiscountAccountingService {
    
    private final FinancialTransactionRepository financialTransactionRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    
    @Override
    public DiscountAccountingResult createDiscountAccounting(
            ConsultantClientMapping mapping, 
            PackageDiscount discount, 
            BigDecimal originalAmount, 
            BigDecimal finalAmount) {
        
        log.info("💰 할인 회계 거래 생성: MappingID={}, OriginalAmount={}, FinalAmount={}", 
                 mapping.getId(), originalAmount, finalAmount);
        
        try {
            BigDecimal discountAmount = originalAmount.subtract(finalAmount);
            
            // 1. 매출 거래 생성 (원래 금액)
            FinancialTransaction revenueTransaction = createRevenueTransaction(
                mapping, originalAmount, discount
            );
            
            // 2. 할인 거래 생성 (할인 금액)
            FinancialTransaction discountTransaction = createDiscountTransaction(
                mapping, discountAmount, discount
            );
            
            // 3. 매핑에 할인 정보 저장
            mapping.setDiscountCode(discount.getCode());
            mapping.setDiscountAmount(discountAmount.longValue());
            mapping.setOriginalAmount(originalAmount.longValue());
            mapping.setFinalAmount(finalAmount.longValue());
            mapping.setDiscountAppliedAt(LocalDateTime.now());
            
            mappingRepository.save(mapping);
            
            // 4. 결과 생성
            DiscountAccountingResult result = new DiscountAccountingResult();
            result.setMappingId(mapping.getId());
            result.setOriginalAmount(originalAmount);
            result.setDiscountAmount(discountAmount);
            result.setFinalAmount(finalAmount);
            result.setDiscountCode(discount.getCode());
            result.setDiscountName(discount.getName());
            result.setRevenueTransactionId(revenueTransaction.getId());
            result.setDiscountTransactionId(discountTransaction.getId());
            result.setAccountingStatus("COMPLETED");
            result.setMessage("할인 회계 거래가 성공적으로 생성되었습니다");
            result.setSuccess(true);
            
            log.info("✅ 할인 회계 거래 생성 완료: MappingID={}, RevenueID={}, DiscountID={}", 
                     mapping.getId(), revenueTransaction.getId(), discountTransaction.getId());
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 생성 실패: MappingID={}, 오류={}", mapping.getId(), e.getMessage(), e);
            
            DiscountAccountingResult result = new DiscountAccountingResult();
            result.setMappingId(mapping.getId());
            result.setSuccess(false);
            result.setMessage("할인 회계 거래 생성 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> cancelDiscountAccounting(Long mappingId, String reason) {
        log.info("💰 할인 회계 거래 취소: MappingID={}, Reason={}", mappingId, reason);
        
        try {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            // 1. 매출 거래 취소
            List<FinancialTransaction> revenueTransactions = financialTransactionRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                    mappingId, "CONSULTANT_CLIENT_MAPPING"
                );
            FinancialTransaction revenueTransaction = revenueTransactions.stream()
                .filter(ft -> ft.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .findFirst()
                .orElse(null);
            
            if (revenueTransaction != null) {
                revenueTransaction.setStatus(FinancialTransaction.TransactionStatus.CANCELLED);
                // revenueTransaction.setCancelledAt(LocalDateTime.now());
                // revenueTransaction.setCancellationReason(reason);
                financialTransactionRepository.save(revenueTransaction);
            }
            
            // 2. 할인 거래 취소
            List<FinancialTransaction> discountTransactions = financialTransactionRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                    mappingId, "CONSULTANT_CLIENT_MAPPING"
                );
            FinancialTransaction discountTransaction = discountTransactions.stream()
                .filter(ft -> ft.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .findFirst()
                .orElse(null);
            
            if (discountTransaction != null) {
                discountTransaction.setStatus(FinancialTransaction.TransactionStatus.CANCELLED);
                // discountTransaction.setCancelledAt(LocalDateTime.now());
                // discountTransaction.setCancellationReason(reason);
                financialTransactionRepository.save(discountTransaction);
            }
            
            // 3. 매핑 할인 정보 초기화
            mapping.setDiscountCode(null);
            mapping.setDiscountAmount(null);
            mapping.setOriginalAmount(null);
            mapping.setFinalAmount(null);
            mapping.setDiscountAppliedAt(null);
            mappingRepository.save(mapping);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "할인 회계 거래가 취소되었습니다");
            result.put("mappingId", mappingId);
            result.put("reason", reason);
            
            log.info("✅ 할인 회계 거래 취소 완료: MappingID={}", mappingId);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 취소 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "할인 회계 거래 취소 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    @Override
    public Map<String, Object> updateDiscountAccounting(
            Long mappingId, 
            PackageDiscount newDiscount, 
            BigDecimal newFinalAmount) {
        
        log.info("💰 할인 회계 거래 수정: MappingID={}, NewFinalAmount={}", mappingId, newFinalAmount);
        
        try {
            // 1. 기존 할인 회계 거래 취소
            Map<String, Object> cancelResult = cancelDiscountAccounting(mappingId, "할인 수정으로 인한 취소");
            
            if (!(Boolean) cancelResult.get("success")) {
                return cancelResult;
            }
            
            // 2. 새로운 할인 회계 거래 생성
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            BigDecimal originalAmount = BigDecimal.valueOf(mapping.getPackagePrice());
            DiscountAccountingResult newResult = createDiscountAccounting(
                mapping, newDiscount, originalAmount, newFinalAmount
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", newResult.isSuccess());
            result.put("message", newResult.getMessage());
            result.put("data", newResult);
            
            log.info("✅ 할인 회계 거래 수정 완료: MappingID={}", mappingId);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 수정 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "할인 회계 거래 수정 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public DiscountAccountingResult getDiscountAccounting(Long mappingId) {
        log.info("💰 할인 회계 거래 조회: MappingID={}", mappingId);
        
        try {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            // 매출 거래 조회
            List<FinancialTransaction> revenueTransactions = financialTransactionRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                    mappingId, "CONSULTANT_CLIENT_MAPPING"
                );
            FinancialTransaction revenueTransaction = revenueTransactions.stream()
                .filter(ft -> ft.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .findFirst()
                .orElse(null);
            
            // 할인 거래 조회
            List<FinancialTransaction> discountTransactions = financialTransactionRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                    mappingId, "CONSULTANT_CLIENT_MAPPING"
                );
            FinancialTransaction discountTransaction = discountTransactions.stream()
                .filter(ft -> ft.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .findFirst()
                .orElse(null);
            
            DiscountAccountingResult result = new DiscountAccountingResult();
            result.setMappingId(mappingId);
            result.setOriginalAmount(BigDecimal.valueOf(mapping.getOriginalAmount() != null ? mapping.getOriginalAmount() : 0));
            result.setDiscountAmount(BigDecimal.valueOf(mapping.getDiscountAmount() != null ? mapping.getDiscountAmount() : 0));
            result.setFinalAmount(BigDecimal.valueOf(mapping.getFinalAmount() != null ? mapping.getFinalAmount() : 0));
            result.setDiscountCode(mapping.getDiscountCode());
            result.setRevenueTransactionId(revenueTransaction != null ? revenueTransaction.getId() : null);
            result.setDiscountTransactionId(discountTransaction != null ? discountTransaction.getId() : null);
            result.setAccountingStatus(revenueTransaction != null ? revenueTransaction.getStatus().toString() : "NOT_CREATED");
            result.setSuccess(true);
            result.setMessage("할인 회계 거래 조회 완료");
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 조회 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            DiscountAccountingResult result = new DiscountAccountingResult();
            result.setMappingId(mappingId);
            result.setSuccess(false);
            result.setMessage("할인 회계 거래 조회 실패: " + e.getMessage());
            
            return result;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> validateDiscountAccounting(Long mappingId) {
        log.info("🔍 할인 회계 거래 검증: MappingID={}", mappingId);
        
        try {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            // 매출 거래 검증
            List<FinancialTransaction> revenueTransactions = financialTransactionRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                    mappingId, "CONSULTANT_CLIENT_MAPPING"
                );
            FinancialTransaction revenueTransaction = revenueTransactions.stream()
                .filter(ft -> ft.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .findFirst()
                .orElse(null);
            
            // 할인 거래 검증
            List<FinancialTransaction> discountTransactions = financialTransactionRepository
                .findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                    mappingId, "CONSULTANT_CLIENT_MAPPING"
                );
            FinancialTransaction discountTransaction = discountTransactions.stream()
                .filter(ft -> ft.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .findFirst()
                .orElse(null);
            
            Map<String, Object> validation = new HashMap<>();
            validation.put("mappingId", mappingId);
            validation.put("hasRevenueTransaction", revenueTransaction != null);
            validation.put("hasDiscountTransaction", discountTransaction != null);
            validation.put("revenueStatus", revenueTransaction != null ? revenueTransaction.getStatus() : "NOT_FOUND");
            validation.put("discountStatus", discountTransaction != null ? discountTransaction.getStatus() : "NOT_FOUND");
            validation.put("isValid", revenueTransaction != null && discountTransaction != null);
            validation.put("message", "할인 회계 거래 검증 완료");
            
            return validation;
            
        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 검증 실패: MappingID={}, 오류={}", mappingId, e.getMessage(), e);
            
            Map<String, Object> validation = new HashMap<>();
            validation.put("mappingId", mappingId);
            validation.put("isValid", false);
            validation.put("message", "할인 회계 거래 검증 실패: " + e.getMessage());
            
            return validation;
        }
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * 매출 거래 생성
     */
    private FinancialTransaction createRevenueTransaction(
            ConsultantClientMapping mapping, 
            BigDecimal amount, 
            PackageDiscount discount) {
        
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setTransactionType(FinancialTransaction.TransactionType.INCOME);
        transaction.setCategory("CONSULTATION");
        transaction.setSubcategory("PACKAGE_SALE");
        transaction.setAmount(amount);
        transaction.setDescription(String.format("패키지 판매 - %s (원래 금액)", mapping.getPackageName()));
        transaction.setRelatedEntityId(mapping.getId());
        transaction.setRelatedEntityType("CONSULTANT_CLIENT_MAPPING");
        transaction.setBranchCode(mapping.getBranchCode());
        transaction.setTransactionDate(LocalDateTime.now().toLocalDate());
        transaction.setStatus(FinancialTransaction.TransactionStatus.COMPLETED);
        transaction.setCreatedAt(LocalDateTime.now());
        
        // 할인 정보는 description에 포함됨
        
        return financialTransactionRepository.save(transaction);
    }
    
    /**
     * 할인 거래 생성
     */
    private FinancialTransaction createDiscountTransaction(
            ConsultantClientMapping mapping, 
            BigDecimal discountAmount, 
            PackageDiscount discount) {
        
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        transaction.setCategory("SALES_DISCOUNT");
        transaction.setSubcategory("PACKAGE_DISCOUNT");
        transaction.setAmount(discountAmount.negate()); // 할인은 음수로 처리
        transaction.setDescription(String.format("패키지 할인 - %s (%s)", mapping.getPackageName(), discount.getName()));
        transaction.setRelatedEntityId(mapping.getId());
        transaction.setRelatedEntityType("CONSULTANT_CLIENT_MAPPING");
        transaction.setBranchCode(mapping.getBranchCode());
        transaction.setTransactionDate(LocalDateTime.now().toLocalDate());
        transaction.setStatus(FinancialTransaction.TransactionStatus.COMPLETED);
        transaction.setCreatedAt(LocalDateTime.now());
        
        // 할인 정보는 description에 포함됨
        
        return financialTransactionRepository.save(transaction);
    }
    
    // ==================== Additional Required Methods ====================
    
    @Override
    public Map<String, Object> processDiscountRefund(Long mappingId, BigDecimal refundAmount, String refundReason, String processedBy) {
        log.info("💰 할인 환불 처리: MappingID={}, RefundAmount={}", mappingId, refundAmount);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "할인 환불 처리는 PL/SQL을 통해 구현됩니다");
        result.put("mappingId", mappingId);
        
        return result;
    }
    
    @Override
    public Map<String, Object> processPartialRefund(Long mappingId, BigDecimal refundAmount, String refundReason, String processedBy) {
        log.info("💰 할인 부분 환불 처리: MappingID={}, RefundAmount={}", mappingId, refundAmount);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "할인 부분 환불 처리는 PL/SQL을 통해 구현됩니다");
        result.put("mappingId", mappingId);
        
        return result;
    }
    
    @Override
    public Map<String, Object> processFullRefund(Long mappingId, String refundReason, String processedBy) {
        log.info("💰 할인 전액 환불 처리: MappingID={}", mappingId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "할인 전액 환불 처리는 PL/SQL을 통해 구현됩니다");
        result.put("mappingId", mappingId);
        
        return result;
    }
    
    @Override
    public Map<String, Object> getRefundableDiscounts(String branchCode) {
        log.info("💰 환불 가능한 할인 조회: BranchCode={}", branchCode);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "환불 가능한 할인 조회는 PL/SQL을 통해 구현됩니다");
        result.put("branchCode", branchCode);
        
        return result;
    }
    
    @Override
    public Map<String, Object> getDiscountRefundStatistics(String branchCode, String startDate, String endDate) {
        log.info("📊 할인 환불 통계 조회: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "할인 환불 통계 조회는 PL/SQL을 통해 구현됩니다");
        result.put("branchCode", branchCode);
        
        return result;
    }
}
