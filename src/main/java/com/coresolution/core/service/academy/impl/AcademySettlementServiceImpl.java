package com.coresolution.core.service.academy.impl;
import com.coresolution.core.context.TenantContextHolder;

import com.coresolution.core.domain.academy.*;
import com.coresolution.core.dto.academy.*;
import com.coresolution.core.repository.academy.*;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.AcademySettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

 * 학원 정산 서비스 구현체
 * 학원 시스템의 수강료/강사/본사 정산 관리 비즈니스 로직 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AcademySettlementServiceImpl implements AcademySettlementService {
    
    private final AcademySettlementRepository settlementRepository;
    private final AcademySettlementItemRepository settlementItemRepository;
    private final AcademyTuitionPaymentRepository paymentRepository;
    private final AcademyInvoiceRepository invoiceRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final TenantAccessControlService accessControlService;
    
    private static final BigDecimal DEFAULT_COMMISSION_RATE = new BigDecimal("10.0"); // 10%
    private static final BigDecimal DEFAULT_ROYALTY_RATE = new BigDecimal("5.0"); // 5%
    
    
    @Override
    @Transactional(readOnly = true)
    public List<SettlementResponse> getSettlements(String tenantId, Long branchId, String settlementPeriod, SettlementResponse.SettlementStatus status) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<AcademySettlement> settlements;
        
        if (branchId != null) {
            settlements = settlementRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else {
            settlements = settlementRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        if (settlementPeriod != null && !settlementPeriod.isEmpty()) {
            settlements = settlements.stream()
                .filter(s -> settlementPeriod.equals(s.getSettlementPeriod()))
                .collect(Collectors.toList());
        }
        
        if (status != null) {
            settlements = settlements.stream()
                .filter(s -> convertSettlementStatus(s.getStatus()) == status)
                .collect(Collectors.toList());
        }
        
        return settlements.stream()
            .map(this::toSettlementResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public SettlementResponse getSettlement(String tenantId, String settlementId) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademySettlement settlement = settlementRepository.findBySettlementIdAndIsDeletedFalse(settlementId)
            .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + settlementId));
        
        if (!tenantId.equals(settlement.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toSettlementResponse(settlement);
    }
    
    @Override
    public SettlementResponse calculateSettlement(String tenantId, SettlementCalculateRequest request, String calculatedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        Optional<AcademySettlement> existing = settlementRepository.findByTenantIdAndBranchIdAndSettlementPeriodAndIsDeletedFalse(
            tenantId, request.getBranchId(), request.getSettlementPeriod());
        
        if (existing.isPresent()) {
            throw new RuntimeException("이미 존재하는 정산입니다: " + request.getSettlementPeriod());
        }
        
        log.info("정산 계산 시작: tenantId={}, branchId={}, period={}", 
            tenantId, request.getBranchId(), request.getSettlementPeriod());
        
        SettlementCalculationResult calculationResult = calculateRevenue(
            tenantId, request.getBranchId(), request.getPeriodStart(), request.getPeriodEnd());
        
        BigDecimal teacherSettlement = calculateTeacherSettlement(
            tenantId, request.getBranchId(), request.getPeriodStart(), request.getPeriodEnd(), 
            calculationResult.getTotalRevenue());
        
        BigDecimal royaltyRate = request.getRoyaltyRate() != null ? 
            request.getRoyaltyRate() : DEFAULT_ROYALTY_RATE;
        BigDecimal hqRoyalty = calculationResult.getNetRevenue()
            .multiply(royaltyRate)
            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        
        BigDecimal netSettlement = calculationResult.getNetRevenue()
            .subtract(teacherSettlement)
            .subtract(hqRoyalty);
        
        AcademySettlement settlement = AcademySettlement.builder()
            .settlementId(UUID.randomUUID().toString())
            .branchId(request.getBranchId())
            .settlementPeriod(request.getSettlementPeriod())
            .settlementDate(LocalDate.now())
            .periodStart(request.getPeriodStart())
            .periodEnd(request.getPeriodEnd())
            .totalRevenue(calculationResult.getTotalRevenue())
            .totalPayments(calculationResult.getTotalPayments())
            .refundAmount(calculationResult.getRefundAmount())
            .netRevenue(calculationResult.getNetRevenue())
            .teacherSettlement(teacherSettlement)
            .hqRoyalty(hqRoyalty)
            .commissionRate(request.getCommissionRate() != null ? request.getCommissionRate() : DEFAULT_COMMISSION_RATE)
            .royaltyRate(royaltyRate)
            .netSettlement(netSettlement)
            .status(AcademySettlement.SettlementStatus.CALCULATED)
            .calculatedAt(LocalDateTime.now())
            .build();
        
        settlement.setTenantId(tenantId);
        settlement.setIsDeleted(false);
        
        AcademySettlement saved = settlementRepository.save(settlement);
        
        createSettlementItems(saved, calculationResult);
        
        log.info("정산 계산 완료: settlementId={}, netSettlement={}", saved.getSettlementId(), saved.getNetSettlement());
        
        return toSettlementResponse(saved);
    }
    
    @Override
    public SettlementResponse approveSettlement(String tenantId, String settlementId, String approvedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademySettlement settlement = settlementRepository.findBySettlementIdAndIsDeletedFalse(settlementId)
            .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + settlementId));
        
        if (!tenantId.equals(settlement.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (settlement.getStatus() != AcademySettlement.SettlementStatus.CALCULATED) {
            throw new RuntimeException("계산 완료된 정산만 승인할 수 있습니다.");
        }
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        settlement.setStatus(AcademySettlement.SettlementStatus.APPROVED);
        settlement.setApprovedAt(LocalDateTime.now());
        settlement.setApprovedBy(approvedBy);
        settlement.setUpdatedAt(LocalDateTime.now());
        
        AcademySettlement saved = settlementRepository.save(settlement);
        log.info("정산 승인 완료: settlementId={}", saved.getSettlementId());
        
        return toSettlementResponse(saved);
    }
    
    @Override
    public SettlementResponse markSettlementAsPaid(String tenantId, String settlementId, String paidBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademySettlement settlement = settlementRepository.findBySettlementIdAndIsDeletedFalse(settlementId)
            .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + settlementId));
        
        if (!tenantId.equals(settlement.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        if (settlement.getStatus() != AcademySettlement.SettlementStatus.APPROVED) {
            throw new RuntimeException("승인된 정산만 지급 완료 처리할 수 있습니다.");
        }
        
        settlement.setStatus(AcademySettlement.SettlementStatus.PAID);
        settlement.setPaidAt(LocalDateTime.now());
        settlement.setPaidBy(paidBy);
        settlement.setUpdatedAt(LocalDateTime.now());
        
        AcademySettlement saved = settlementRepository.save(settlement);
        log.info("정산 지급 완료 처리: settlementId={}", saved.getSettlementId());
        
        return toSettlementResponse(saved);
    }
    
    @Override
    public SettlementResponse cancelSettlement(String tenantId, String settlementId, String cancelledBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademySettlement settlement = settlementRepository.findBySettlementIdAndIsDeletedFalse(settlementId)
            .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + settlementId));
        
        if (!tenantId.equals(settlement.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        if (settlement.getStatus() == AcademySettlement.SettlementStatus.PAID) {
            throw new RuntimeException("이미 지급 완료된 정산은 취소할 수 없습니다.");
        }
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        settlement.setStatus(AcademySettlement.SettlementStatus.CANCELLED);
        settlement.setUpdatedAt(LocalDateTime.now());
        
        AcademySettlement saved = settlementRepository.save(settlement);
        log.info("정산 취소 완료: settlementId={}", saved.getSettlementId());
        
        return toSettlementResponse(saved);
    }
    
    
    @Override
    @Transactional(readOnly = true)
    public List<SettlementItemResponse> getSettlementItems(String tenantId, String settlementId) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademySettlement settlement = settlementRepository.findBySettlementIdAndIsDeletedFalse(settlementId)
            .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + settlementId));
        
        if (!tenantId.equals(settlement.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        List<AcademySettlementItem> items = settlementItemRepository.findBySettlementIdAndIsDeletedFalse(settlementId);
        
        return items.stream()
            .map(this::toSettlementItemResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public SettlementItemResponse getSettlementItem(String tenantId, String settlementItemId) {
        accessControlService.validateTenantAccess(tenantId);
        
        AcademySettlementItem item = settlementItemRepository.findBySettlementItemIdAndIsDeletedFalse(settlementItemId)
            .orElseThrow(() -> new RuntimeException("정산 항목을 찾을 수 없습니다: " + settlementItemId));
        
        if (!tenantId.equals(item.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toSettlementItemResponse(item);
    }
    
    
    @Override
    public int calculateMonthlySettlements(String tenantId, String settlementPeriod) {
        accessControlService.validateTenantAccess(tenantId);
        
        log.info("월별 정산 자동 계산 시작: tenantId={}, period={}", tenantId, settlementPeriod);
        
        LocalDate periodStart = LocalDate.parse(settlementPeriod + "01", DateTimeFormatter.ofPattern("yyyyMMdd"));
        LocalDate periodEnd = periodStart.withDayOfMonth(periodStart.lengthOfMonth());
        
        List<ClassEnrollment> enrollments = enrollmentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<Long> branchIds = enrollments.stream()
            .map(ClassEnrollment::getBranchId)
            .distinct()
            .collect(Collectors.toList());
        
        int totalCalculated = 0;
        
        for (Long branchId : branchIds) {
            try {
                Optional<AcademySettlement> existing = settlementRepository.findByTenantIdAndBranchIdAndSettlementPeriodAndIsDeletedFalse(
                    tenantId, branchId, settlementPeriod);
                
                if (existing.isPresent()) {
                    log.debug("이미 존재하는 정산: branchId={}, period={}", branchId, settlementPeriod);
                    continue;
                }
                
                SettlementCalculateRequest request = SettlementCalculateRequest.builder()
                    .branchId(branchId)
                    .settlementPeriod(settlementPeriod)
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .build();
                
                calculateSettlement(tenantId, request, "SYSTEM");
                totalCalculated++;
                
            } catch (Exception e) {
                log.error("정산 계산 실패: branchId={}, period={}", branchId, settlementPeriod, e);
            }
        }
        
        log.info("월별 정산 자동 계산 완료: tenantId={}, totalCalculated={}", tenantId, totalCalculated);
        return totalCalculated;
    }
    
    
     * 매출 계산
     */
    private SettlementCalculationResult calculateRevenue(String tenantId, Long branchId, LocalDate periodStart, LocalDate periodEnd) {
        List<AcademyTuitionPayment> payments = paymentRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            .filter(p -> p.getStatus() == AcademyTuitionPayment.PaymentStatus.COMPLETED)
            .filter(p -> branchId == null || branchId.equals(p.getBranchId()))
            .filter(p -> p.getPaidAt() != null && 
                        !p.getPaidAt().toLocalDate().isBefore(periodStart) && 
                        !p.getPaidAt().toLocalDate().isAfter(periodEnd))
            .collect(Collectors.toList());
        
        BigDecimal totalPayments = payments.stream()
            .map(p -> p.getAmount().subtract(p.getRefundAmount() != null ? p.getRefundAmount() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal refundAmount = payments.stream()
            .map(p -> p.getRefundAmount() != null ? p.getRefundAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal netRevenue = totalPayments.subtract(refundAmount);
        
        return SettlementCalculationResult.builder()
            .totalRevenue(totalPayments)
            .totalPayments(totalPayments)
            .refundAmount(refundAmount)
            .netRevenue(netRevenue)
            .paymentCount(payments.size())
            .build();
    }
    
     * 강사 정산 계산
     */
    private BigDecimal calculateTeacherSettlement(String tenantId, Long branchId, LocalDate periodStart, LocalDate periodEnd, BigDecimal totalRevenue) {
        return totalRevenue.multiply(new BigDecimal("0.5")).setScale(2, RoundingMode.HALF_UP);
    }
    
     * 정산 항목 생성
     */
    private void createSettlementItems(AcademySettlement settlement, SettlementCalculationResult calculationResult) {
    }
    
     * AcademySettlement를 SettlementResponse로 변환
     */
    private SettlementResponse toSettlementResponse(AcademySettlement settlement) {
        return SettlementResponse.builder()
            .settlementId(settlement.getSettlementId())
            .tenantId(settlement.getTenantId())
            .branchId(settlement.getBranchId())
            .settlementPeriod(settlement.getSettlementPeriod())
            .settlementDate(settlement.getSettlementDate())
            .periodStart(settlement.getPeriodStart())
            .periodEnd(settlement.getPeriodEnd())
            .totalRevenue(settlement.getTotalRevenue())
            .totalPayments(settlement.getTotalPayments())
            .refundAmount(settlement.getRefundAmount())
            .netRevenue(settlement.getNetRevenue())
            .teacherSettlement(settlement.getTeacherSettlement())
            .hqRoyalty(settlement.getHqRoyalty())
            .commissionRate(settlement.getCommissionRate())
            .royaltyRate(settlement.getRoyaltyRate())
            .netSettlement(settlement.getNetSettlement())
            .status(convertSettlementStatus(settlement.getStatus()))
            .calculatedAt(settlement.getCalculatedAt())
            .approvedAt(settlement.getApprovedAt())
            .paidAt(settlement.getPaidAt())
            .approvedBy(settlement.getApprovedBy())
            .paidBy(settlement.getPaidBy())
            .notes(settlement.getNotes())
            .calculationDetailsJson(settlement.getCalculationDetailsJson())
            .createdAt(settlement.getCreatedAt())
            .updatedAt(settlement.getUpdatedAt())
            .build();
    }
    
     * AcademySettlementItem을 SettlementItemResponse로 변환
     */
    private SettlementItemResponse toSettlementItemResponse(AcademySettlementItem item) {
        return SettlementItemResponse.builder()
            .settlementItemId(item.getSettlementItemId())
            .settlementId(item.getSettlementId())
            .tenantId(item.getTenantId())
            .branchId(item.getBranchId())
            .itemType(convertItemType(item.getItemType()))
            .itemId(item.getItemId())
            .itemName(item.getItemName())
            .revenueAmount(item.getRevenueAmount())
            .settlementAmount(item.getSettlementAmount())
            .commissionRate(item.getCommissionRate())
            .commissionAmount(item.getCommissionAmount())
            .enrollmentCount(item.getEnrollmentCount())
            .paymentCount(item.getPaymentCount())
            .totalSessions(item.getTotalSessions())
            .completedSessions(item.getCompletedSessions())
            .detailsJson(item.getDetailsJson())
            .createdAt(item.getCreatedAt())
            .updatedAt(item.getUpdatedAt())
            .build();
    }
    
     * SettlementStatus 변환
     */
    private SettlementResponse.SettlementStatus convertSettlementStatus(AcademySettlement.SettlementStatus status) {
        if (status == null) {
            return null;
        }
        return SettlementResponse.SettlementStatus.valueOf(status.name());
    }
    
     * ItemType 변환
     */
    private SettlementItemResponse.ItemType convertItemType(AcademySettlementItem.ItemType itemType) {
        if (itemType == null) {
            return null;
        }
        return SettlementItemResponse.ItemType.valueOf(itemType.name());
    }
    
     * 정산 계산 결과 내부 클래스
     */
    @lombok.Data
    @lombok.Builder
    private static class SettlementCalculationResult {
        private BigDecimal totalRevenue;
        private BigDecimal totalPayments;
        private BigDecimal refundAmount;
        private BigDecimal netRevenue;
        private Integer paymentCount;
    }
}

