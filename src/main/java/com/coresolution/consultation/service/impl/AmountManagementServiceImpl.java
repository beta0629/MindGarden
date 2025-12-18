package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 금액 관리 중앙화 서비스 구현체
 * 모든 금액 관련 로직을 통합하여 정확성과 일관성을 보장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AmountManagementServiceImpl implements AmountManagementService {
    
    private final ConsultantClientMappingRepository mappingRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    
    @Override
    @Transactional(readOnly = true)
    public Long getAccurateTransactionAmount(ConsultantClientMapping mapping) {
        log.info("💰 정확한 거래 금액 결정: MappingID={}", mapping.getId());
        
        // 1. packagePrice 우선 (가장 정확한 패키지 가격)
        if (mapping.getPackagePrice() != null && mapping.getPackagePrice() > 0) {
            log.info("✅ PackagePrice 사용: {}원", mapping.getPackagePrice());
            return mapping.getPackagePrice();
        }
        
        // 2. paymentAmount 백업 (입금 확인 시 입력된 금액)
        if (mapping.getPaymentAmount() != null && mapping.getPaymentAmount() > 0) {
            log.warn("⚠️ PaymentAmount 사용 (PackagePrice 없음): {}원", mapping.getPaymentAmount());
            return mapping.getPaymentAmount();
        }
        
        // 3. 기본값 없음 - 오류
        log.error("❌ 유효한 금액이 없습니다: PackagePrice={}, PaymentAmount={}", 
            mapping.getPackagePrice(), mapping.getPaymentAmount());
        return null;
    }
    
    @Override
    @Transactional(readOnly = true)
    public AmountValidationResult validateAmount(ConsultantClientMapping mapping, Long inputAmount) {
        log.info("🔍 금액 검증 시작: MappingID={}, InputAmount={}", mapping.getId(), inputAmount);
        
        Map<String, Long> detectedAmounts = new HashMap<>();
        detectedAmounts.put("packagePrice", mapping.getPackagePrice());
        detectedAmounts.put("paymentAmount", mapping.getPaymentAmount());
        detectedAmounts.put("inputAmount", inputAmount);
        
        // 1. 기본 유효성 검사
        if (inputAmount == null || inputAmount <= 0) {
            return new AmountValidationResult(false, "입력 금액이 유효하지 않습니다.", null, detectedAmounts);
        }
        
        // 2. packagePrice와 비교
        if (mapping.getPackagePrice() != null) {
            if (!inputAmount.equals(mapping.getPackagePrice())) {
                long difference = Math.abs(inputAmount - mapping.getPackagePrice());
                String message = String.format("패키지 가격과 입력 금액이 다릅니다. 차이: %,d원 (패키지: %,d원, 입력: %,d원)", 
                    difference, mapping.getPackagePrice(), inputAmount);
                
                // 차이가 10% 이상이면 오류, 아니면 경고
                boolean isValid = difference <= (mapping.getPackagePrice() * 0.1);
                return new AmountValidationResult(isValid, message, mapping.getPackagePrice(), detectedAmounts);
            }
        }
        
        // 3. 기존 paymentAmount와 비교
        if (mapping.getPaymentAmount() != null && !inputAmount.equals(mapping.getPaymentAmount())) {
            long difference = Math.abs(inputAmount - mapping.getPaymentAmount());
            String message = String.format("기존 결제 금액과 다릅니다. 차이: %,d원", difference);
            log.warn("💰 " + message);
        }
        
        return new AmountValidationResult(true, "금액 검증 통과", inputAmount, detectedAmounts);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isDuplicateTransaction(Long mappingId, FinancialTransaction.TransactionType transactionType) {
        String tenantId = TenantContextHolder.getTenantId();
        boolean exists = financialTransactionRepository.existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
            tenantId, mappingId, 
            "CONSULTANT_CLIENT_MAPPING", 
            transactionType
        );
        
        if (exists) {
            log.warn("🚫 중복 거래 감지: MappingID={}, TransactionType={}", mappingId, transactionType);
        }
        
        return exists;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getIntegratedAmountInfo(Long mappingId) {
        log.info("📊 통합 금액 정보 조회: MappingID={}", mappingId);
        
        Optional<ConsultantClientMapping> mappingOpt = mappingRepository.findById(mappingId);
        if (mappingOpt.isEmpty()) {
            return Map.of("error", "매핑을 찾을 수 없습니다.");
        }
        
        ConsultantClientMapping mapping = mappingOpt.get();
        Map<String, Object> amountInfo = new HashMap<>();
        
        // 기본 금액 정보
        amountInfo.put("mappingId", mappingId);
        amountInfo.put("packagePrice", mapping.getPackagePrice());
        amountInfo.put("paymentAmount", mapping.getPaymentAmount());
        amountInfo.put("packageName", mapping.getPackageName());
        amountInfo.put("totalSessions", mapping.getTotalSessions());
        
        // 정확한 거래 금액 결정
        Long accurateAmount = getAccurateTransactionAmount(mapping);
        amountInfo.put("accurateAmount", accurateAmount);
        
        // 금액 일관성 검사
        AmountConsistencyResult consistency = checkAmountConsistency(mappingId);
        amountInfo.put("isConsistent", consistency.isConsistent());
        amountInfo.put("consistencyMessage", consistency.getInconsistencyReason());
        amountInfo.put("recommendation", consistency.getRecommendation());
        
        // 관련 ERP 거래 조회
        List<FinancialTransaction> relatedTransactions = financialTransactionRepository
            .findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(mappingId, "CONSULTANT_CLIENT_MAPPING");
        
        amountInfo.put("relatedTransactionCount", relatedTransactions.size());
        amountInfo.put("relatedTransactions", relatedTransactions.stream()
            .map((FinancialTransaction t) -> Map.of(
                "id", t.getId(),
                "amount", t.getAmount(),
                "type", t.getTransactionType(),
                "description", t.getDescription(),
                "createdAt", t.getCreatedAt()
            )).toList());
        
        // 회기당 단가 계산
        if (mapping.getTotalSessions() != null && mapping.getTotalSessions() > 0 && accurateAmount != null) {
            long pricePerSession = accurateAmount / mapping.getTotalSessions();
            amountInfo.put("pricePerSession", pricePerSession);
        }
        
        return amountInfo;
    }
    
    @Override
    public void recordAmountChange(Long mappingId, Long oldAmount, Long newAmount, String changeReason, String changedBy) {
        log.info("📝 금액 변경 이력 기록: MappingID={}, Old={}, New={}, Reason={}, By={}", 
            mappingId, oldAmount, newAmount, changeReason, changedBy);
        
        // 금액 변경 이력을 매핑의 notes에 추가
        Optional<ConsultantClientMapping> mappingOpt = mappingRepository.findById(mappingId);
        if (mappingOpt.isPresent()) {
            ConsultantClientMapping mapping = mappingOpt.get();
            String changeRecord = String.format("[%s] 금액 변경: %,d원 → %,d원 (사유: %s, 변경자: %s)", 
                LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                oldAmount != null ? oldAmount : 0, 
                newAmount != null ? newAmount : 0, 
                changeReason, 
                changedBy);
            
            String existingNotes = mapping.getNotes();
            String updatedNotes = existingNotes != null ? existingNotes + "\n" + changeRecord : changeRecord;
            mapping.setNotes(updatedNotes);
            mapping.setUpdatedAt(LocalDateTime.now());
            
            mappingRepository.save(mapping);
            log.info("✅ 금액 변경 이력 기록 완료");
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public AmountConsistencyResult checkAmountConsistency(Long mappingId) {
        log.info("🔍 금액 일관성 검사: MappingID={}", mappingId);
        
        Optional<ConsultantClientMapping> mappingOpt = mappingRepository.findById(mappingId);
        if (mappingOpt.isEmpty()) {
            return new AmountConsistencyResult(false, "매핑을 찾을 수 없습니다.", Map.of(), "매핑 ID를 확인하세요.");
        }
        
        ConsultantClientMapping mapping = mappingOpt.get();
        Map<String, Long> amountBreakdown = new HashMap<>();
        
        amountBreakdown.put("packagePrice", mapping.getPackagePrice());
        amountBreakdown.put("paymentAmount", mapping.getPaymentAmount());
        
        // 관련 ERP 거래들의 금액 합계 (표준화 2025-12-06: deprecated 메서드 대체)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<FinancialTransaction> relatedTransactions = financialTransactionRepository
            .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(tenantId, mappingId, "CONSULTANT_CLIENT_MAPPING");
        
        BigDecimal totalErpAmount = relatedTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        amountBreakdown.put("erpTotalAmount", totalErpAmount.longValue());
        
        // 일관성 검사
        Long packagePrice = mapping.getPackagePrice();
        Long paymentAmount = mapping.getPaymentAmount();
        Long erpAmount = totalErpAmount.longValue();
        
        // 1. packagePrice와 ERP 금액 비교
        if (packagePrice != null && erpAmount > 0) {
            if (!packagePrice.equals(erpAmount)) {
                String reason = String.format("패키지 가격(%,d원)과 ERP 거래 금액(%,d원)이 일치하지 않습니다.", 
                    packagePrice, erpAmount);
                return new AmountConsistencyResult(false, reason, amountBreakdown, 
                    "ERP 거래를 수정하거나 패키지 가격을 확인하세요.");
            }
        }
        
        // 2. packagePrice와 paymentAmount 비교
        if (packagePrice != null && paymentAmount != null) {
            if (!packagePrice.equals(paymentAmount)) {
                long difference = Math.abs(packagePrice - paymentAmount);
                if (difference > packagePrice * 0.1) { // 10% 이상 차이
                    String reason = String.format("패키지 가격(%,d원)과 결제 금액(%,d원)의 차이가 큽니다. 차이: %,d원", 
                        packagePrice, paymentAmount, difference);
                    return new AmountConsistencyResult(false, reason, amountBreakdown, 
                        "금액을 다시 확인하고 정정하세요.");
                }
            }
        }
        
        return new AmountConsistencyResult(true, "모든 금액이 일관성 있게 관리되고 있습니다.", 
            amountBreakdown, "정상적으로 관리되고 있습니다.");
    }
}
