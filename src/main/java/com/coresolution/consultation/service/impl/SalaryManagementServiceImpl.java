package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.TaxCalculateRequest;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryTaxCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.SalaryTaxCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SalaryManagementServiceImpl implements SalaryManagementService {
    
    private final ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final SalaryTaxCalculationRepository salaryTaxCalculationRepository;
    private final UserRepository userRepository;
    
    @Override
    public List<ConsultantSalaryProfile> getAllSalaryProfiles() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📋 급여 프로필 목록 조회: tenantId={}", tenantId);
        
        // 표준화 2025-12-06: deprecated 메서드 대체
        List<ConsultantSalaryProfile> allProfiles = consultantSalaryProfileRepository.findByTenantIdAndIsActiveTrue(tenantId);
        return allProfiles;
    }
    
    @Override
    public ConsultantSalaryProfile getSalaryProfileById(Long id) {
        return consultantSalaryProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("급여 프로필을 찾을 수 없습니다: " + id));
    }
    
    @Override
    public ConsultantSalaryProfile createSalaryProfile(ConsultantSalaryProfile salaryProfile) {
        log.info("➕ 급여 프로필 생성: ConsultantID={}, SalaryType={}", 
                salaryProfile.getConsultantId(), salaryProfile.getSalaryType());
        
        return consultantSalaryProfileRepository.save(salaryProfile);
    }
    
    @Override
    public ConsultantSalaryProfile updateSalaryProfile(ConsultantSalaryProfile salaryProfile) {
        log.info("✏️ 급여 프로필 수정: ID={}, ConsultantID={}", 
                salaryProfile.getId(), salaryProfile.getConsultantId());
        
        return consultantSalaryProfileRepository.save(salaryProfile);
    }
    
    @Override
    public void deleteSalaryProfile(Long id) {
        log.info("🗑️ 급여 프로필 삭제: ID={}", id);
        
        ConsultantSalaryProfile profile = getSalaryProfileById(id);
        profile.setIsActive(false);
        consultantSalaryProfileRepository.save(profile);
    }
    
    @Override
    public List<User> getConsultantsForSalary() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("👥 급여용 상담사 목록 조회: tenantId={}", tenantId);
        
        // 표준화 2025-12-05: UserRole enum 사용 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)
        // CONSULTANT 역할의 활성 사용자만 조회
        return userRepository.findByTenantId(tenantId).stream()
            .filter(user -> {
                if (user.getRole() == null) return false;
                // UserRole.isConsultant() 메서드 사용
                return user.getRole().isConsultant();
            })
            .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Map<String, Object>> getConsultantSalarySummary(Long consultantId, String period) {
        log.info("📊 상담사 급여 요약 조회: ConsultantID={}, Period={}", consultantId, period);
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        
        switch (period.toUpperCase()) {
            case "MONTHLY":
                startDate = endDate.minusMonths(1);
                break;
            case "QUARTERLY":
                startDate = endDate.minusMonths(3);
                break;
            case "YEARLY":
                startDate = endDate.minusYears(1);
                break;
            default:
                startDate = endDate.minusMonths(1);
        }
        
        List<SalaryCalculation> calculations = salaryCalculationRepository
                .findByConsultantAndCalculationPeriodStartBetween(
                        userRepository.findById(consultantId).orElse(null), startDate, endDate);
        
        return calculations.stream()
                .map(calc -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("calculationId", calc.getId());
                    result.put("periodStart", calc.getCalculationPeriodStart());
                    result.put("periodEnd", calc.getCalculationPeriodEnd());
                    result.put("grossSalary", calc.getGrossSalary());
                    result.put("netSalary", calc.getNetSalary());
                    result.put("status", calc.getStatus());
                    result.put("calculatedAt", calc.getCalculatedAt());
                    return result;
                })
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SalaryCalculation> getSalaryCalculations(LocalDate startDate, LocalDate endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📋 급여 계산 목록 조회: tenantId={}, Period={} ~ {}", tenantId, startDate, endDate);
        
        return salaryCalculationRepository.findByStatusAndCalculationPeriodStartBetween(
                SalaryCalculation.SalaryStatus.CALCULATED, startDate, endDate);
    }
    
    @Override
    public SalaryCalculation calculateSalary(Long consultantId, Long profileId, LocalDate periodStart, LocalDate periodEnd) {
        log.info("🧮 급여 계산: ConsultantID={}, ProfileID={}, Period={} ~ {}", 
                consultantId, profileId, periodStart, periodEnd);
        
        
        throw new UnsupportedOperationException("급여 계산은 PL/SQL 서비스를 통해 처리됩니다.");
    }
    
    @Override
    public SalaryCalculation approveSalaryCalculation(Long calculationId, String approvedBy) {
        log.info("✅ 급여 승인: CalculationID={}, ApprovedBy={}", calculationId, approvedBy);
        
        SalaryCalculation calculation = salaryCalculationRepository.findById(calculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + calculationId));
        
        if (calculation.getStatus() != SalaryCalculation.SalaryStatus.CALCULATED) {
            throw new RuntimeException("승인 가능한 상태가 아닙니다: " + calculation.getStatus());
        }
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        calculation.setStatus(SalaryCalculation.SalaryStatus.APPROVED);
        return salaryCalculationRepository.save(calculation);
    }
    
    @Override
    public SalaryCalculation markAsPaid(Long calculationId, String paidBy) {
        log.info("💳 급여 지급 완료: CalculationID={}, PaidBy={}", calculationId, paidBy);
        
        SalaryCalculation calculation = salaryCalculationRepository.findById(calculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + calculationId));
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        if (calculation.getStatus() != SalaryCalculation.SalaryStatus.APPROVED) {
            throw new RuntimeException("지급 가능한 상태가 아닙니다: " + calculation.getStatus());
        }
        
        calculation.setStatus(SalaryCalculation.SalaryStatus.PAID);
        return salaryCalculationRepository.save(calculation);
    }
    
    @Override
    public Map<String, Object> getSalaryStatistics(LocalDate startDate, LocalDate endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 급여 통계 조회: tenantId={}, Period={} ~ {}", tenantId, startDate, endDate);
        
        List<SalaryCalculation> calculations = getSalaryCalculations(startDate, endDate);
        
        BigDecimal totalGrossSalary = calculations.stream()
                .map(SalaryCalculation::getGrossSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalNetSalary = calculations.stream()
                .map(SalaryCalculation::getNetSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalTaxAmount = calculations.stream()
                .map(SalaryCalculation::getDeductions)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal averageSalary = calculations.isEmpty() ? BigDecimal.ZERO :
                totalNetSalary.divide(BigDecimal.valueOf(calculations.size()), 2, java.math.RoundingMode.HALF_UP);
        
        return Map.of(
            "totalCalculations", calculations.size(),
            "totalGrossSalary", totalGrossSalary,
            "totalNetSalary", totalNetSalary,
            "totalTaxAmount", totalTaxAmount,
            "averageSalary", averageSalary,
            "calculations", calculations
        );
    }
    
    @Override
    public List<Map<String, Object>> getTopPerformers(LocalDate startDate, LocalDate endDate, int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("🏆 상위 성과자 조회: tenantId={}, Period={} ~ {}, Limit={}", 
                tenantId, startDate, endDate, limit);
        
        List<SalaryCalculation> calculations = getSalaryCalculations(startDate, endDate);
        
        return calculations.stream()
                .sorted((a, b) -> b.getNetSalary().compareTo(a.getNetSalary()))
                .limit(limit)
                .map(calc -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("consultantId", calc.getConsultant().getId());
                    result.put("consultantName", calc.getConsultant().getName());
                    result.put("netSalary", calc.getNetSalary());
                    result.put("completedConsultations", calc.getCompletedConsultations());
                    result.put("status", calc.getStatus());
                    return result;
                })
                .collect(Collectors.toList());
    }
    
    @Override
    public BigDecimal calculateTotalSalaryCost(LocalDate startDate, LocalDate endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 총 급여 비용 계산: tenantId={}, Period={} ~ {}", tenantId, startDate, endDate);
        
        List<SalaryCalculation> calculations = getSalaryCalculations(startDate, endDate);
        
        return calculations.stream()
                .map(SalaryCalculation::getNetSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * 상담사별 급여 계산 내역 조회 (프론트엔드 호환성)
     */
    @Override
    public List<SalaryCalculation> getSalaryCalculations(Long consultantId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 상담사별 급여 계산 조회: ConsultantId={}, tenantId={}", consultantId, tenantId);
        
        return salaryCalculationRepository.findAll().stream()
            .filter(calc -> calc.getConsultant().getId().equals(consultantId))
            .collect(Collectors.toList());
    }
    
    /**
     * 세금 상세 내역 조회 (프론트엔드 호환성)
     */
    @Override
    public Map<String, Object> getTaxDetails(Long calculationId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 세금 상세 조회: CalculationId={}, tenantId={}", calculationId, tenantId);
        
        SalaryCalculation calculation = salaryCalculationRepository.findById(calculationId)
            .orElseThrow(() -> new RuntimeException("급여 계산 정보를 찾을 수 없습니다: " + calculationId));
        
        List<Map<String, Object>> taxCalculations = salaryTaxCalculationRepository
            .findByCalculationIdOrderByCreatedAtDesc(calculationId).stream()
            .map(tax -> {
                Map<String, Object> taxMap = new HashMap<>();
                taxMap.put("taxType", tax.getTaxType());
                taxMap.put("taxAmount", tax.getTaxAmount());
                taxMap.put("taxRate", tax.getTaxRate());
                return taxMap;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("calculationId", calculationId);
        result.put("consultantName", calculation.getConsultant().getName());
        result.put("calculationPeriod", calculation.getCalculationPeriodStart() + " ~ " + calculation.getCalculationPeriodEnd());
        result.put("grossSalary", calculation.getGrossSalary());
        result.put("netSalary", calculation.getNetSalary());
        result.put("taxDetails", taxCalculations);
        
        return result;
    }
    
    /**
     * 세금 통계 조회 (프론트엔드 호환성). 2차: 세목별 breakdown 포함.
     */
    @Override
    public Map<String, Object> getTaxStatistics(String period) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 세금 통계 조회: Period={}, tenantId={}", period, tenantId);
        
        String[] periodParts = period.split("-");
        if (periodParts.length != 2) {
            throw new RuntimeException("잘못된 기간 형식입니다: " + period);
        }
        
        int year = Integer.parseInt(periodParts[0]);
        int month = Integer.parseInt(periodParts[1]);
        
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        List<SalaryCalculation> calculations = getSalaryCalculations(startDate, endDate);
        List<Long> calculationIds = calculations.stream()
            .map(SalaryCalculation::getId)
            .collect(Collectors.toList());
        
        BigDecimal totalGrossSalary = calculations.stream()
            .map(SalaryCalculation::getGrossSalary)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalNetSalary = calculations.stream()
            .map(SalaryCalculation::getNetSalary)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalTaxAmount = totalGrossSalary.subtract(totalNetSalary);
        
        Map<String, BigDecimal> breakdown = new HashMap<>();
        breakdown.put("withholdingTax", BigDecimal.ZERO);
        breakdown.put("localIncomeTax", BigDecimal.ZERO);
        breakdown.put("vat", BigDecimal.ZERO);
        breakdown.put("incomeTax", BigDecimal.ZERO);
        breakdown.put("nationalPension", BigDecimal.ZERO);
        breakdown.put("fourInsurance", BigDecimal.ZERO);
        Map<String, BigDecimal> taxByType = new HashMap<>();
        
        if (!calculationIds.isEmpty()) {
            List<Object[]> taxSums = salaryTaxCalculationRepository.findTaxAmountSumsByCalculationIds(calculationIds);
            for (Object[] row : taxSums) {
                String taxType = (String) row[0];
                BigDecimal sum = (BigDecimal) row[1];
                if (sum == null) {
                    sum = BigDecimal.ZERO;
                }
                taxByType.put(taxType, sum);
                switch (taxType) {
                    case "WITHHOLDING_TAX":
                        breakdown.put("withholdingTax", sum);
                        break;
                    case "LOCAL_INCOME_TAX":
                        breakdown.put("localIncomeTax", sum);
                        break;
                    case "VAT":
                        breakdown.put("vat", sum);
                        break;
                    case "INCOME_TAX":
                        breakdown.put("incomeTax", sum);
                        break;
                    case "FOUR_INSURANCE":
                        breakdown.put("fourInsurance", sum);
                        break;
                    default:
                        breakdown.put(taxType, sum);
                        break;
                }
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("period", period);
        result.put("totalCalculations", calculations.size());
        result.put("totalGrossSalary", totalGrossSalary);
        result.put("totalNetSalary", totalNetSalary);
        result.put("totalTaxAmount", totalTaxAmount);
        result.put("taxCount", calculations.size());
        result.put("averageGrossSalary", calculations.isEmpty() ? BigDecimal.ZERO :
            totalGrossSalary.divide(BigDecimal.valueOf(calculations.size()), 2, java.math.RoundingMode.HALF_UP));
        result.put("averageNetSalary", calculations.isEmpty() ? BigDecimal.ZERO :
            totalNetSalary.divide(BigDecimal.valueOf(calculations.size()), 2, java.math.RoundingMode.HALF_UP));
        result.put("breakdown", breakdown);
        result.put("taxByType", taxByType);
        
        return result;
    }
    
    @Override
    public SalaryTaxCalculation calculateAdditionalTax(TaxCalculateRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 추가 세금 계산: calculationId={}, taxType={}, tenantId={}",
                request.getCalculationId(), request.getTaxType(), tenantId);
        
        SalaryCalculation calculation = salaryCalculationRepository.findById(request.getCalculationId())
                .orElseThrow(() -> new RuntimeException("급여 계산 정보를 찾을 수 없습니다: " + request.getCalculationId()));
        
        BigDecimal baseAmount = request.getGrossAmount() != null ? request.getGrossAmount() : BigDecimal.ZERO;
        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO;
        BigDecimal taxAmount = baseAmount.multiply(taxRate).setScale(0, java.math.RoundingMode.HALF_UP);
        
        String taxName = request.getTaxName() != null && !request.getTaxName().isBlank()
                ? request.getTaxName() : request.getTaxType();
        String description = request.getDescription() != null ? request.getDescription() : "";
        
        SalaryTaxCalculation taxCalc = new SalaryTaxCalculation();
        taxCalc.setTenantId(tenantId);
        taxCalc.setCalculationId(request.getCalculationId());
        taxCalc.setTaxType(request.getTaxType());
        taxCalc.setTaxName(taxName);
        taxCalc.setTaxRate(taxRate);
        taxCalc.setBaseAmount(baseAmount);
        taxCalc.setTaxableAmount(baseAmount);
        taxCalc.setTaxAmount(taxAmount);
        taxCalc.setDescription(description);
        taxCalc.setIsActive(true);
        
        SalaryTaxCalculation saved = salaryTaxCalculationRepository.save(taxCalc);
        
        BigDecimal currentDeductions = calculation.getDeductions() != null ? calculation.getDeductions() : BigDecimal.ZERO;
        calculation.setDeductions(currentDeductions.add(taxAmount));
        BigDecimal gross = calculation.getGrossSalary() != null ? calculation.getGrossSalary() : BigDecimal.ZERO;
        calculation.setNetSalary(gross.subtract(calculation.getDeductions()));
        salaryCalculationRepository.save(calculation);
        
        log.info("✅ 추가 세금 저장 완료: id={}, taxAmount={}", saved.getId(), taxAmount);
        return saved;
    }
}
