package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.SalaryTaxCalculation;
import com.mindgarden.consultation.repository.SalaryTaxCalculationRepository;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.TaxCalculationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 세금 계산 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TaxCalculationServiceImpl implements TaxCalculationService {
    
    private final SalaryTaxCalculationRepository taxCalculationRepository;
    private final CommonCodeService commonCodeService;
    
    // ==================== 세금 계산 ====================
    
    /**
     * 수퍼어드민 권한 검증
     */
    private void validateSuperAdminAccess() {
        // 개발 환경에서 임시 비활성화
        log.debug("🔓 세금 계산 권한 체크 비활성화 (개발 환경)");
        return;
        
        // 프로덕션 환경에서는 아래 코드 활성화
        /*
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_HQ_MASTER"))) {
            throw new RuntimeException("세금 계산 기능은 수퍼어드민만 접근 가능합니다.");
        }
        */
    }
    
    @Override
    public List<SalaryTaxCalculation> calculateFreelanceTax(Long calculationId, BigDecimal grossAmount) {
        return calculateFreelanceTax(calculationId, grossAmount, false);
    }
    
    /**
     * 프리랜서 세금 계산 (사업자 등록 여부에 따라)
     */
    public List<SalaryTaxCalculation> calculateFreelanceTax(Long calculationId, BigDecimal grossAmount, boolean isBusinessRegistered) {
        validateSuperAdminAccess();
        log.info("💰 프리랜서 세금 계산: 계산ID={}, 총액={}, 사업자등록={}", calculationId, grossAmount, isBusinessRegistered);
        
        List<SalaryTaxCalculation> taxCalculations = new ArrayList<>();
        
        // 1. 원천징수 3.3% 계산 (모든 프리랜서)
        SalaryTaxCalculation withholdingTax = createTaxCalculation(
            calculationId,
            "WITHHOLDING_TAX",
            "원천징수",
            new BigDecimal("0.033"),
            grossAmount,
            "프리랜서 원천징수 3.3%"
        );
        taxCalculations.add(withholdingTax);
        
        // 2. 부가세 계산 (사업자 등록한 프리랜서만)
        if (isBusinessRegistered) {
            SalaryTaxCalculation vat = createTaxCalculation(
                calculationId,
                "VAT",
                "부가세",
                new BigDecimal("0.10"),
                grossAmount,
                "사업자 등록 프리랜서 부가세 10%"
            );
            taxCalculations.add(vat);
        }
        
        return taxCalculations;
    }
    
    @Override
    public List<SalaryTaxCalculation> calculateRegularTax(Long calculationId, BigDecimal grossAmount) {
        validateSuperAdminAccess();
        log.info("💰 정규직 세금 계산: 계산ID={}, 총액={}", calculationId, grossAmount);
        
        List<SalaryTaxCalculation> taxCalculations = new ArrayList<>();
        
        // 소득세 누진세율 적용
        BigDecimal incomeTax = calculateProgressiveIncomeTax(grossAmount);
        
        SalaryTaxCalculation incomeTaxCalculation = createTaxCalculationObject(
            calculationId,
            "INCOME_TAX",
            "소득세",
            incomeTax.divide(grossAmount, 4, java.math.RoundingMode.HALF_UP),
            grossAmount,
            "정규직 소득세 (누진세율 적용)"
        );
        taxCalculations.add(incomeTaxCalculation);
        
        return taxCalculations;
    }
    
    @Override
    public List<SalaryTaxCalculation> calculateCenterVAT(Long calculationId, BigDecimal grossAmount) {
        validateSuperAdminAccess();
        log.info("💰 센터 부가세 계산: 계산ID={}, 총액={}", calculationId, grossAmount);
        
        List<SalaryTaxCalculation> taxCalculations = new ArrayList<>();
        
        SalaryTaxCalculation vat = createTaxCalculation(
            calculationId,
            "VAT",
            "부가세",
            new BigDecimal("0.10"),
            grossAmount,
            "센터 부가세 10%"
        );
        taxCalculations.add(vat);
        
        return taxCalculations;
    }
    
    @Override
    public List<SalaryTaxCalculation> calculateAdditionalTax(Long calculationId, BigDecimal grossAmount, 
                                                           String taxType, BigDecimal taxRate) {
        validateSuperAdminAccess();
        log.info("💰 추가 세금 계산: 계산ID={}, 총액={}, 세금유형={}, 세율={}", 
                calculationId, grossAmount, taxType, taxRate);
        
        List<SalaryTaxCalculation> taxCalculations = new ArrayList<>();
        
        // 공통코드에서 세금명 조회
        String taxName = commonCodeService.getCodeName("TAX_TYPE", taxType);
        
        SalaryTaxCalculation additionalTax = createTaxCalculation(
            calculationId,
            taxType,
            taxName,
            taxRate,
            grossAmount,
            "추가 세금: " + taxName
        );
        taxCalculations.add(additionalTax);
        
        return taxCalculations;
    }
    
    // ==================== 세금 조회 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<SalaryTaxCalculation> getTaxCalculationsByCalculationId(Long calculationId) {
        validateSuperAdminAccess();
        log.info("🔍 세금 계산 내역 조회: 계산ID={}", calculationId);
        return taxCalculationRepository.findByCalculationIdAndIsActiveTrueOrderByCreatedAtDesc(calculationId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SalaryTaxCalculation> getTaxCalculationsByType(String taxType) {
        validateSuperAdminAccess();
        log.info("🔍 세금 유형별 내역 조회: 세금유형={}", taxType);
        return taxCalculationRepository.findByTaxTypeAndIsActiveTrueOrderByCreatedAtDesc(taxType);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalTaxAmountByPeriod(String period) {
        validateSuperAdminAccess();
        log.info("🔍 기간별 세금 총액 조회: 기간={}", period);
        BigDecimal total = taxCalculationRepository.getTotalTaxAmountByPeriod(period);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalTaxAmountByConsultantId(Long consultantId) {
        validateSuperAdminAccess();
        log.info("🔍 상담사별 세금 총액 조회: 상담사ID={}", consultantId);
        BigDecimal total = taxCalculationRepository.getTotalTaxAmountByConsultantId(consultantId);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTaxStatistics(String period) {
        validateSuperAdminAccess();
        log.info("📊 세금 통계 조회: 기간={}", period);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("period", period);
        
        // 세금 유형별 총액 조회
        List<Object[]> taxTypeTotals = taxCalculationRepository.getTotalTaxAmountByTaxType();
        Map<String, BigDecimal> taxTypeMap = new HashMap<>();
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        
        for (Object[] result : taxTypeTotals) {
            String taxType = (String) result[0];
            BigDecimal amount = (BigDecimal) result[1];
            taxTypeMap.put(taxType, amount);
            totalTaxAmount = totalTaxAmount.add(amount);
        }
        
        statistics.put("taxByType", taxTypeMap);
        statistics.put("totalTaxAmount", totalTaxAmount);
        statistics.put("taxCount", taxTypeTotals.size());
        
        return statistics;
    }
    
    // ==================== 세금 관리 ====================
    
    @Override
    public SalaryTaxCalculation createTaxCalculation(Long calculationId, String taxType, String taxName, 
                                                   BigDecimal taxRate, BigDecimal taxableAmount, String description) {
        validateSuperAdminAccess();
        log.info("🔧 세금 계산 생성: 계산ID={}, 세금유형={}, 세율={}, 과세표준={}", 
                calculationId, taxType, taxRate, taxableAmount);
        
        SalaryTaxCalculation taxCalculation = new SalaryTaxCalculation();
        taxCalculation.setCalculationId(calculationId);
        taxCalculation.setTaxType(taxType);
        taxCalculation.setTaxName(taxName);
        taxCalculation.setTaxRate(taxRate);
        taxCalculation.setTaxableAmount(taxableAmount);
        taxCalculation.setTaxDescription(description);
        taxCalculation.setIsActive(true);
        
        // 세금 계산
        taxCalculation.calculateTax();
        
        return taxCalculationRepository.save(taxCalculation);
    }
    
    @Override
    public SalaryTaxCalculation updateTaxCalculation(Long taxCalculationId, BigDecimal taxRate, 
                                                   BigDecimal taxableAmount, String description) {
        validateSuperAdminAccess();
        log.info("🔧 세금 계산 수정: 세금계산ID={}, 세율={}, 과세표준={}", 
                taxCalculationId, taxRate, taxableAmount);
        
        SalaryTaxCalculation taxCalculation = taxCalculationRepository.findById(taxCalculationId)
                .orElseThrow(() -> new RuntimeException("세금 계산을 찾을 수 없습니다: " + taxCalculationId));
        
        taxCalculation.setTaxRate(taxRate);
        taxCalculation.setTaxableAmount(taxableAmount);
        taxCalculation.setTaxDescription(description);
        
        // 세금 재계산
        taxCalculation.calculateTax();
        
        return taxCalculationRepository.save(taxCalculation);
    }
    
    @Override
    public boolean deactivateTaxCalculation(Long taxCalculationId) {
        validateSuperAdminAccess();
        log.info("🔧 세금 계산 비활성화: 세금계산ID={}", taxCalculationId);
        
        SalaryTaxCalculation taxCalculation = taxCalculationRepository.findById(taxCalculationId)
                .orElseThrow(() -> new RuntimeException("세금 계산을 찾을 수 없습니다: " + taxCalculationId));
        
        taxCalculation.setIsActive(false);
        taxCalculationRepository.save(taxCalculation);
        
        return true;
    }
    
    // ==================== 내부 메서드 ====================
    
    /**
     * 세금 계산 객체 생성 (DB 저장 없음)
     */
    private SalaryTaxCalculation createTaxCalculationObject(Long calculationId, String taxType, String taxName, 
                                                          BigDecimal taxRate, BigDecimal taxableAmount, String description) {
        SalaryTaxCalculation taxCalculation = new SalaryTaxCalculation();
        taxCalculation.setCalculationId(calculationId);
        taxCalculation.setTaxType(taxType);
        taxCalculation.setTaxName(taxName);
        taxCalculation.setTaxRate(taxRate);
        taxCalculation.setTaxableAmount(taxableAmount);
        taxCalculation.setTaxDescription(description);
        taxCalculation.setIsActive(true);
        
        // 세금 계산
        taxCalculation.calculateTax();
        
        return taxCalculation;
    }
    
    /**
     * 소득세 누진세율 계산
     */
    private BigDecimal calculateProgressiveIncomeTax(BigDecimal grossAmount) {
        // 소득세 누진세율 적용
        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal remainingAmount = grossAmount;
        
        // 1,200만원 이하: 6%
        if (remainingAmount.compareTo(new BigDecimal("12000000")) <= 0) {
            tax = remainingAmount.multiply(new BigDecimal("0.06"));
            return tax;
        } else {
            tax = new BigDecimal("12000000").multiply(new BigDecimal("0.06"));
            remainingAmount = remainingAmount.subtract(new BigDecimal("12000000"));
        }
        
        // 1,200만원 초과 4,600만원 이하: 15%
        if (remainingAmount.compareTo(new BigDecimal("34000000")) <= 0) {
            tax = tax.add(remainingAmount.multiply(new BigDecimal("0.15")));
            return tax;
        } else {
            tax = tax.add(new BigDecimal("34000000").multiply(new BigDecimal("0.15")));
            remainingAmount = remainingAmount.subtract(new BigDecimal("34000000"));
        }
        
        // 4,600만원 초과 8,800만원 이하: 24%
        if (remainingAmount.compareTo(new BigDecimal("42000000")) <= 0) {
            tax = tax.add(remainingAmount.multiply(new BigDecimal("0.24")));
            return tax;
        } else {
            tax = tax.add(new BigDecimal("42000000").multiply(new BigDecimal("0.24")));
            remainingAmount = remainingAmount.subtract(new BigDecimal("42000000"));
        }
        
        // 8,800만원 초과 1억 5천만원 이하: 35%
        if (remainingAmount.compareTo(new BigDecimal("62000000")) <= 0) {
            tax = tax.add(remainingAmount.multiply(new BigDecimal("0.35")));
            return tax;
        } else {
            tax = tax.add(new BigDecimal("62000000").multiply(new BigDecimal("0.35")));
            remainingAmount = remainingAmount.subtract(new BigDecimal("62000000"));
        }
        
        // 1억 5천만원 초과 3억원 이하: 38%
        if (remainingAmount.compareTo(new BigDecimal("150000000")) <= 0) {
            tax = tax.add(remainingAmount.multiply(new BigDecimal("0.38")));
            return tax;
        } else {
            tax = tax.add(new BigDecimal("150000000").multiply(new BigDecimal("0.38")));
            remainingAmount = remainingAmount.subtract(new BigDecimal("150000000"));
        }
        
        // 3억원 초과 5억원 이하: 40%
        if (remainingAmount.compareTo(new BigDecimal("200000000")) <= 0) {
            tax = tax.add(remainingAmount.multiply(new BigDecimal("0.40")));
            return tax;
        } else {
            tax = tax.add(new BigDecimal("200000000").multiply(new BigDecimal("0.40")));
            remainingAmount = remainingAmount.subtract(new BigDecimal("200000000"));
        }
        
        // 5억원 초과: 42%
        tax = tax.add(remainingAmount.multiply(new BigDecimal("0.42")));
        
        return tax.setScale(0, java.math.RoundingMode.HALF_UP);
    }
    
    @Override
    public SalaryTaxCalculation saveTaxCalculation(SalaryTaxCalculation taxCalculation) {
        validateSuperAdminAccess();
        log.info("💾 세금 계산 저장: 계산ID={}, 세금유형={}", 
                taxCalculation.getCalculationId(), taxCalculation.getTaxType());
        
        // 세금 계산
        taxCalculation.calculateTax();
        
        return taxCalculationRepository.save(taxCalculation);
    }
}
