package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.SalaryTaxCalculation;
import com.mindgarden.consultation.repository.ConsultantSalaryProfileRepository;
import com.mindgarden.consultation.repository.SalaryCalculationRepository;
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
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
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
        
        // 해당 기간의 급여 계산 내역 조회
        List<SalaryCalculation> calculations = salaryCalculationRepository.findByCalculationPeriodOrderByCreatedAtDesc(period);
        log.info("📊 조회된 급여 계산 건수: {} 건", calculations.size());
        
        if (calculations.isEmpty()) {
            log.warn("⚠️ 해당 기간({})의 급여 계산 데이터가 없습니다.", period);
        }
        
        BigDecimal totalGrossAmount = BigDecimal.ZERO;
        BigDecimal totalWithholdingTax = BigDecimal.ZERO;
        BigDecimal totalLocalIncomeTax = BigDecimal.ZERO;
        BigDecimal totalVAT = BigDecimal.ZERO; // 부가가치세
        BigDecimal totalNationalPension = BigDecimal.ZERO;
        BigDecimal totalHealthInsurance = BigDecimal.ZERO;
        BigDecimal totalLongTermCare = BigDecimal.ZERO;
        BigDecimal totalEmploymentInsurance = BigDecimal.ZERO;
        BigDecimal totalAdditionalDeduction = BigDecimal.ZERO;
        BigDecimal totalOtherDeductions = BigDecimal.ZERO;
        
        for (SalaryCalculation calculation : calculations) {
            BigDecimal grossAmount = calculation.getTotalSalary();
            totalGrossAmount = totalGrossAmount.add(grossAmount);
            
            // 상담사의 급여 프로필 조회하여 세금 방식 결정
            Optional<ConsultantSalaryProfile> profileOpt = consultantSalaryProfileRepository
                .findByConsultantIdAndActive(calculation.getConsultantId());
            
            boolean isBusinessRegistered = profileOpt
                .map(ConsultantSalaryProfile::getIsBusinessRegistered)
                .orElse(false);
            
            if (isBusinessRegistered) {
                // 사업자 등록 시: 부가가치세 (10%) + 원천징수세 (3.3% + 0.33%)
                BigDecimal vat = grossAmount.multiply(new BigDecimal("0.10"));
                BigDecimal withholdingTax = grossAmount.multiply(new BigDecimal("0.033"));
                BigDecimal localIncomeTax = grossAmount.multiply(new BigDecimal("0.0033"));
                
                totalVAT = totalVAT.add(vat);
                totalWithholdingTax = totalWithholdingTax.add(withholdingTax);
                totalLocalIncomeTax = totalLocalIncomeTax.add(localIncomeTax);
            } else {
                // 일반 프리랜서: 원천징수세만 (3.3% + 0.33%)
                BigDecimal withholdingTax = grossAmount.multiply(new BigDecimal("0.033"));
                BigDecimal localIncomeTax = grossAmount.multiply(new BigDecimal("0.0033"));
                
                totalWithholdingTax = totalWithholdingTax.add(withholdingTax);
                totalLocalIncomeTax = totalLocalIncomeTax.add(localIncomeTax);
            }
            
            // 4대보험 (연간 1,200만원 이상 시)
            BigDecimal nationalPension = calculateNationalPension(grossAmount);
            BigDecimal healthInsurance = calculateHealthInsurance(grossAmount);
            BigDecimal longTermCare = calculateLongTermCare(grossAmount);
            BigDecimal employmentInsurance = calculateEmploymentInsurance(grossAmount);
            
            totalNationalPension = totalNationalPension.add(nationalPension);
            totalHealthInsurance = totalHealthInsurance.add(healthInsurance);
            totalLongTermCare = totalLongTermCare.add(longTermCare);
            totalEmploymentInsurance = totalEmploymentInsurance.add(employmentInsurance);
        }
        
        // 총 세금액 계산
        BigDecimal totalTaxAmount = totalWithholdingTax
            .add(totalLocalIncomeTax)
            .add(totalVAT)
            .add(totalNationalPension)
            .add(totalHealthInsurance)
            .add(totalLongTermCare)
            .add(totalEmploymentInsurance)
            .add(totalAdditionalDeduction)
            .add(totalOtherDeductions);
        
        statistics.put("totalGrossAmount", totalGrossAmount);
        statistics.put("withholdingTax", totalWithholdingTax);
        statistics.put("localIncomeTax", totalLocalIncomeTax);
        statistics.put("vat", totalVAT); // 부가가치세
        statistics.put("nationalPension", totalNationalPension);
        statistics.put("healthInsurance", totalHealthInsurance);
        statistics.put("longTermCare", totalLongTermCare);
        statistics.put("employmentInsurance", totalEmploymentInsurance);
        statistics.put("additionalDeduction", totalAdditionalDeduction);
        statistics.put("otherDeductions", totalOtherDeductions);
        statistics.put("totalTaxAmount", totalTaxAmount);
        statistics.put("taxCount", calculations.size());
        
        return statistics;
    }
    
    /**
     * 국민연금 계산 (연간 1,200만원 이상 시 4.5%)
     */
    private BigDecimal calculateNationalPension(BigDecimal annualIncome) {
        if (annualIncome.compareTo(new BigDecimal("12000000")) < 0) {
            return BigDecimal.ZERO; // 1,200만원 미만은 국민연금 면제
        }
        return annualIncome.multiply(new BigDecimal("0.045"));
    }
    
    /**
     * 건강보험료 계산 (연간 1,200만원 이상 시 3.545%)
     */
    private BigDecimal calculateHealthInsurance(BigDecimal annualIncome) {
        if (annualIncome.compareTo(new BigDecimal("12000000")) < 0) {
            return BigDecimal.ZERO; // 1,200만원 미만은 건강보험료 면제
        }
        return annualIncome.multiply(new BigDecimal("0.03545"));
    }
    
    /**
     * 장기요양보험료 계산 (연간 1,200만원 이상 시 0.545%)
     */
    private BigDecimal calculateLongTermCare(BigDecimal annualIncome) {
        if (annualIncome.compareTo(new BigDecimal("12000000")) < 0) {
            return BigDecimal.ZERO; // 1,200만원 미만은 장기요양보험료 면제
        }
        return annualIncome.multiply(new BigDecimal("0.00545"));
    }
    
    /**
     * 고용보험료 계산 (연간 1,200만원 이상 시 0.9%)
     */
    private BigDecimal calculateEmploymentInsurance(BigDecimal annualIncome) {
        if (annualIncome.compareTo(new BigDecimal("12000000")) < 0) {
            return BigDecimal.ZERO; // 1,200만원 미만은 고용보험료 면제
        }
        return annualIncome.multiply(new BigDecimal("0.009"));
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
