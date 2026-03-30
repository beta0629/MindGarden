package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.PackageDiscount;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PackageDiscountRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.PackageDiscountService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 패키지 상품 할인 계산 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PackageDiscountServiceImpl implements PackageDiscountService {
    
    private final PackageDiscountRepository packageDiscountRepository;
    private final UserRepository userRepository;
    
    @Override
    public DiscountCalculationResult calculateDiscount(ConsultantClientMapping mapping) {
        log.info("💰 할인 계산 시작: MappingID={}, PackagePrice={}", 
                 mapping.getId(), mapping.getPackagePrice());
        
        try {
            BigDecimal originalAmount = BigDecimal.valueOf(mapping.getPackagePrice());
            
            // 1. 자동 할인 적용 (신규 고객, VIP 등)
            PackageDiscount autoDiscount = findAutoApplicableDiscount(mapping);
            
            // 2. 수동 할인 코드가 있다면 적용
            PackageDiscount manualDiscount = null;
            if (mapping.getDiscountCode() != null && !mapping.getDiscountCode().isEmpty()) {
                manualDiscount = packageDiscountRepository.findByCodeAndIsActive(mapping.getDiscountCode(), true);
            }
            
            // 3. 더 유리한 할인 선택
            PackageDiscount bestDiscount = selectBestDiscount(autoDiscount, manualDiscount, originalAmount);
            
            if (bestDiscount == null) {
                return createNoDiscountResult(originalAmount);
            }
            
            // 4. 할인 적용 계산
            return calculateDiscountResult(originalAmount, bestDiscount);
            
        } catch (Exception e) {
            log.error("❌ 할인 계산 실패: MappingID={}, 오류={}", mapping.getId(), e.getMessage(), e);
            return createErrorResult("할인 계산 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public DiscountCalculationResult calculateDiscountWithCode(ConsultantClientMapping mapping, String discountCode) {
        log.info("💰 특정 할인 코드로 할인 계산: MappingID={}, DiscountCode={}", 
                 mapping.getId(), discountCode);
        
        try {
            BigDecimal originalAmount = BigDecimal.valueOf(mapping.getPackagePrice());
            
            // 할인 코드로 할인 조회
            PackageDiscount discount = packageDiscountRepository.findByCodeAndIsActive(discountCode, true);
            
            if (discount == null) {
                return createErrorResult("할인 코드를 찾을 수 없습니다: " + discountCode);
            }
            
            // 할인 유효성 검증
            DiscountValidationResult validation = validateDiscount(mapping, discountCode);
            if (!validation.isValid()) {
                return createErrorResult(validation.getMessage());
            }
            
            // 할인 적용 계산
            return calculateDiscountResult(originalAmount, discount);
            
        } catch (Exception e) {
            log.error("❌ 할인 코드 계산 실패: MappingID={}, DiscountCode={}, 오류={}", 
                     mapping.getId(), discountCode, e.getMessage(), e);
            return createErrorResult("할인 계산 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public List<DiscountOption> getAvailableDiscounts(ConsultantClientMapping mapping) {
        log.info("💰 적용 가능한 할인 옵션 조회: MappingID={}", mapping.getId());
        
        List<DiscountOption> options = new ArrayList<>();
        
        try {
            // 1. 자동 적용 가능한 할인들
            List<PackageDiscount> autoDiscounts = findAutoApplicableDiscounts(mapping);
            for (PackageDiscount discount : autoDiscounts) {
                options.add(createDiscountOption(discount, true, "자동 적용 가능"));
            }
            
            // 2. 수동 적용 가능한 할인들
            List<PackageDiscount> manualDiscounts = findManualApplicableDiscounts(mapping);
            for (PackageDiscount discount : manualDiscounts) {
                options.add(createDiscountOption(discount, true, "수동 적용 가능"));
            }
            
            // 3. 적용 불가능한 할인들 (참고용)
            List<PackageDiscount> unavailableDiscounts = findUnavailableDiscounts(mapping);
            for (PackageDiscount discount : unavailableDiscounts) {
                options.add(createDiscountOption(discount, false, "적용 불가"));
            }
            
            log.info("✅ 적용 가능한 할인 옵션 조회 완료: {}개", options.size());
            
        } catch (Exception e) {
            log.error("❌ 할인 옵션 조회 실패: MappingID={}, 오류={}", mapping.getId(), e.getMessage(), e);
        }
        
        return options;
    }
    
    @Override
    public BigDecimal calculateFinalAmount(BigDecimal originalAmount, PackageDiscount discount) {
        if (discount == null || originalAmount == null) {
            return originalAmount;
        }
        
        BigDecimal discountAmount = calculateDiscountAmount(originalAmount, discount);
        return originalAmount.subtract(discountAmount);
    }
    
    @Override
    public DiscountValidationResult validateDiscount(ConsultantClientMapping mapping, String discountCode) {
        log.info("🔍 할인 유효성 검증: MappingID={}, DiscountCode={}", mapping.getId(), discountCode);
        
        try {
            PackageDiscount discount = packageDiscountRepository.findByCodeAndIsActive(discountCode, true);
            
            if (discount == null) {
                return new DiscountValidationResult(false, "할인 코드를 찾을 수 없습니다", null, null);
            }
            
            // 1. 할인 기간 검증
            if (!isDiscountValidPeriod(discount)) {
                return new DiscountValidationResult(false, "할인 기간이 만료되었습니다", discount, null);
            }
            
            // 2. 사용 횟수 제한 검증
            if (!isDiscountUsageLimitValid(discount, mapping)) {
                return new DiscountValidationResult(false, "할인 사용 횟수를 초과했습니다", discount, null);
            }
            
            // 3. 최소 주문 금액 검증
            if (!isMinimumAmountValid(discount, mapping)) {
                return new DiscountValidationResult(false, "최소 주문 금액을 충족하지 않습니다", discount, null);
            }
            
            // 4. 사용자 제한 검증
            if (!isUserEligible(discount, mapping)) {
                return new DiscountValidationResult(false, "할인 적용 대상이 아닙니다", discount, null);
            }
            
            // 5. 최종 금액 계산
            BigDecimal finalAmount = calculateFinalAmount(BigDecimal.valueOf(mapping.getPackagePrice()), discount);
            
            return new DiscountValidationResult(true, "할인이 적용되었습니다", discount, finalAmount);
            
        } catch (Exception e) {
            log.error("❌ 할인 유효성 검증 실패: MappingID={}, DiscountCode={}, 오류={}", 
                     mapping.getId(), discountCode, e.getMessage(), e);
            return new DiscountValidationResult(false, "할인 검증 중 오류가 발생했습니다", null, null);
        }
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * 자동 적용 가능한 할인 찾기
     */
    private PackageDiscount findAutoApplicableDiscount(ConsultantClientMapping mapping) {
        List<PackageDiscount> autoDiscounts = findAutoApplicableDiscounts(mapping);
        return autoDiscounts.isEmpty() ? null : autoDiscounts.get(0);
    }
    
    /**
     * 자동 적용 가능한 할인 목록 조회
     */
    private List<PackageDiscount> findAutoApplicableDiscounts(ConsultantClientMapping mapping) {
        return packageDiscountRepository.findByIsActiveAndIsAutoApplicable(true, true)
            .stream()
            .filter(discount -> isDiscountApplicable(discount, mapping))
            .collect(Collectors.toList());
    }
    
    /**
     * 수동 적용 가능한 할인 목록 조회
     */
    private List<PackageDiscount> findManualApplicableDiscounts(ConsultantClientMapping mapping) {
        return packageDiscountRepository.findByIsActiveAndIsAutoApplicable(true, false)
            .stream()
            .filter(discount -> isDiscountApplicable(discount, mapping))
            .collect(Collectors.toList());
    }
    
    /**
     * 적용 불가능한 할인 목록 조회
     */
    private List<PackageDiscount> findUnavailableDiscounts(ConsultantClientMapping mapping) {
        return packageDiscountRepository.findByIsActive(true)
            .stream()
            .filter(discount -> !isDiscountApplicable(discount, mapping))
            .collect(Collectors.toList());
    }
    
    /**
     * 할인 적용 가능 여부 확인
     */
    private boolean isDiscountApplicable(PackageDiscount discount, ConsultantClientMapping mapping) {
        return isDiscountValidPeriod(discount) &&
               isDiscountUsageLimitValid(discount, mapping) &&
               isMinimumAmountValid(discount, mapping) &&
               isUserEligible(discount, mapping);
    }
    
    /**
     * 할인 기간 유효성 검증
     */
    private boolean isDiscountValidPeriod(PackageDiscount discount) {
        LocalDate now = LocalDate.now();
        return (discount.getStartDate() == null || !discount.getStartDate().isAfter(now)) &&
               (discount.getEndDate() == null || !discount.getEndDate().isBefore(now));
    }
    
    /**
     * 할인 사용 횟수 제한 검증
     */
    private boolean isDiscountUsageLimitValid(PackageDiscount discount, ConsultantClientMapping mapping) {
        if (discount.getUsageLimit() == null || discount.getUsageLimit() <= 0) {
            return true; // 제한 없음
        }
        
        // 실제 사용 횟수 조회 (구현 필요)
        long usedCount = getDiscountUsageCount(discount.getCode());
        return usedCount < discount.getUsageLimit();
    }
    
    /**
     * 최소 주문 금액 검증
     */
    private boolean isMinimumAmountValid(PackageDiscount discount, ConsultantClientMapping mapping) {
        if (discount.getMinimumAmount() == null || discount.getMinimumAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return true; // 제한 없음
        }
        
        BigDecimal packagePrice = BigDecimal.valueOf(mapping.getPackagePrice());
        return packagePrice.compareTo(discount.getMinimumAmount()) >= 0;
    }
    
    /**
     * 사용자 할인 적용 대상 여부 확인
     */
    private boolean isUserEligible(PackageDiscount discount, ConsultantClientMapping mapping) {
        // 사용자 정보 조회
        User client = mapping.getClient();
        if (client == null) {
            return false;
        }
        
        // 할인 적용 대상 사용자 타입 확인
        if (discount.getApplicableUserTypes() != null && !discount.getApplicableUserTypes().isEmpty()) {
            return discount.getApplicableUserTypes().contains(client.getRole().toString());
        }
        
        return true; // 제한 없음
    }
    
    /**
     * 더 유리한 할인 선택
     */
    private PackageDiscount selectBestDiscount(PackageDiscount autoDiscount, PackageDiscount manualDiscount, BigDecimal originalAmount) {
        if (autoDiscount == null && manualDiscount == null) {
            return null;
        }
        
        if (autoDiscount == null) {
            return manualDiscount;
        }
        
        if (manualDiscount == null) {
            return autoDiscount;
        }
        
        // 더 큰 할인 금액을 선택
        BigDecimal autoDiscountAmount = calculateDiscountAmount(originalAmount, autoDiscount);
        BigDecimal manualDiscountAmount = calculateDiscountAmount(originalAmount, manualDiscount);
        
        return autoDiscountAmount.compareTo(manualDiscountAmount) >= 0 ? autoDiscount : manualDiscount;
    }
    
    /**
     * 할인 금액 계산
     */
    private BigDecimal calculateDiscountAmount(BigDecimal originalAmount, PackageDiscount discount) {
        if (discount.getDiscountType() == PackageDiscount.DiscountType.PERCENTAGE) {
            return originalAmount.multiply(discount.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            return discount.getDiscountValue();
        }
    }
    
    /**
     * 할인 계산 결과 생성
     */
    private DiscountCalculationResult calculateDiscountResult(BigDecimal originalAmount, PackageDiscount discount) {
        BigDecimal discountAmount = calculateDiscountAmount(originalAmount, discount);
        BigDecimal finalAmount = originalAmount.subtract(discountAmount);
        BigDecimal discountRate = originalAmount.compareTo(BigDecimal.ZERO) > 0 ? 
            discountAmount.divide(originalAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : 
            BigDecimal.ZERO;
        
        DiscountCalculationResult result = new DiscountCalculationResult();
        result.setOriginalAmount(originalAmount);
        result.setDiscountAmount(discountAmount);
        result.setFinalAmount(finalAmount);
        result.setDiscountRate(discountRate);
        result.setDiscountType(discount.getDiscountType().toString());
        result.setDiscountCode(discount.getCode());
        result.setDiscountName(discount.getName());
        result.setValid(true);
        result.setMessage("할인이 적용되었습니다");
        
        return result;
    }
    
    /**
     * 할인 없음 결과 생성
     */
    private DiscountCalculationResult createNoDiscountResult(BigDecimal originalAmount) {
        DiscountCalculationResult result = new DiscountCalculationResult();
        result.setOriginalAmount(originalAmount);
        result.setDiscountAmount(BigDecimal.ZERO);
        result.setFinalAmount(originalAmount);
        result.setDiscountRate(BigDecimal.ZERO);
        result.setValid(true);
        result.setMessage("적용 가능한 할인이 없습니다");
        
        return result;
    }
    
    /**
     * 오류 결과 생성
     */
    private DiscountCalculationResult createErrorResult(String message) {
        DiscountCalculationResult result = new DiscountCalculationResult();
        result.setValid(false);
        result.setMessage(message);
        
        return result;
    }
    
    /**
     * 할인 옵션 생성
     */
    private DiscountOption createDiscountOption(PackageDiscount discount, boolean isApplicable, String reason) {
        DiscountOption option = new DiscountOption();
        option.setCode(discount.getCode());
        option.setName(discount.getName());
        option.setDescription(discount.getDescription());
        option.setType(discount.getDiscountType().toString());
        option.setApplicable(isApplicable);
        option.setReason(reason);
        
        return option;
    }
    
    /**
     * 할인 사용 횟수 조회 (구현 필요)
     */
    private long getDiscountUsageCount(String discountCode) {
        // 실제 구현에서는 매핑 테이블에서 할인 코드 사용 횟수를 조회
        return 0;
    }
}
