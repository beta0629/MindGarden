package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.ConsultantSalaryOptionItemRequest;
import com.coresolution.consultation.dto.ConsultantSalaryProfileResponse;
import com.coresolution.consultation.dto.TaxCalculateRequest;
import com.coresolution.consultation.entity.ConsultantSalaryOption;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryTaxCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantSalaryOptionRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.SalaryTaxCalculationRepository;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.util.FreelanceWithholdingTaxUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final ConsultantSalaryOptionRepository consultantSalaryOptionRepository;
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultantSalaryProfileRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("급여 프로필을 찾을 수 없습니다: " + id));
    }
    
    @Override
    public ConsultantSalaryProfile createSalaryProfile(ConsultantSalaryProfile salaryProfile,
            List<ConsultantSalaryOptionItemRequest> optionRequests) {
        String ctxTenantId = TenantContextHolder.getTenantId();
        String profileTenantId = salaryProfile.getTenantId();
        log.info("➕ 급여 프로필 생성: ConsultantID={}, SalaryType={}, tenantId(context)={}, tenantId(entity)={}",
                salaryProfile.getConsultantId(), salaryProfile.getSalaryType(), ctxTenantId,
                profileTenantId);
        try {
            ConsultantSalaryProfile saved = consultantSalaryProfileRepository.save(salaryProfile);
            syncConsultantSalaryOptions(profileTenantId, saved.getId(), optionRequests);
            return saved;
        } catch (DataIntegrityViolationException e) {
            log.error(
                    "급여 프로필 저장 실패(DataIntegrity): consultantId={}, tenantId(context)={}, tenantId(entity)={}, 원인={}",
                    salaryProfile.getConsultantId(), ctxTenantId, profileTenantId,
                    e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : e.getMessage());
            throw e;
        }
    }
    
    @Override
    public ConsultantSalaryProfile updateSalaryProfile(ConsultantSalaryProfile salaryProfile,
            List<ConsultantSalaryOptionItemRequest> optionRequests) {
        log.info("✏️ 급여 프로필 수정: ID={}, ConsultantID={}", 
                salaryProfile.getId(), salaryProfile.getConsultantId());
        
        ConsultantSalaryProfile saved = consultantSalaryProfileRepository.save(salaryProfile);
        syncConsultantSalaryOptions(saved.getTenantId(), saved.getId(), optionRequests);
        return saved;
    }

    /**
     * 요청에 options 필드가 있으면 consultant_salary_options를 삭제 후 재삽입한다.
     * null이면 기존 옵션을 유지한다(레거시 API 호환).
     *
     * @param tenantId 테넌트 ID
     * @param salaryProfileId 급여 프로필 ID
     * @param optionRequests 옵션 행 목록 (null = 미동기화)
     */
    private void syncConsultantSalaryOptions(String tenantId, Long salaryProfileId,
            List<ConsultantSalaryOptionItemRequest> optionRequests) {
        if (optionRequests == null) {
            return;
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
        if (salaryProfileId == null) {
            throw new IllegalStateException("salaryProfileId는 필수입니다.");
        }
        consultantSalaryOptionRepository.deleteByTenantIdAndSalaryProfileId(tenantId, salaryProfileId);
        for (ConsultantSalaryOptionItemRequest row : optionRequests) {
            if (row == null) {
                continue;
            }
            String optionType = row.resolveOptionType();
            if (optionType == null) {
                continue;
            }
            BigDecimal amount = row.getAmount() != null ? row.getAmount() : BigDecimal.ZERO;
            ConsultantSalaryOption entity = new ConsultantSalaryOption();
            entity.setTenantId(tenantId);
            entity.setSalaryProfileId(salaryProfileId);
            entity.setOptionType(optionType);
            entity.setOptionAmount(amount);
            entity.setOptionDescription(row.getName());
            entity.setIsActive(true);
            consultantSalaryOptionRepository.save(entity);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultantSalaryProfileResponse getSalaryProfileDetailForConsultant(Long consultantId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<ConsultantSalaryProfile> profileOpt = consultantSalaryProfileRepository
                .findByTenantIdAndConsultantIdAndActive(tenantId, consultantId);
        if (profileOpt.isEmpty()) {
            return null;
        }
        ConsultantSalaryProfile profile = profileOpt.get();
        List<ConsultantSalaryOption> options = consultantSalaryOptionRepository
                .findByTenantIdAndSalaryProfileIdAndActive(tenantId, profile.getId());
        return ConsultantSalaryProfileResponse.fromEntity(profile, options);
    }
    
    @Override
    public void deleteSalaryProfile(Long id) {
        log.info("🗑️ 급여 프로필 삭제: ID={}", id);
        
        ConsultantSalaryProfile profile = getSalaryProfileById(id);
        profile.setIsActive(false);
        consultantSalaryProfileRepository.save(profile);
    }
    
    @Override
    public List<Map<String, Object>> getConsultantSalarySummary(Long consultantId, String period) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 상담사 급여 요약 조회: ConsultantID={}, Period={}, tenantId={}", consultantId, period, tenantId);
        
        User consultant = userRepository.findByTenantIdAndId(tenantId, consultantId).orElse(null);
        if (consultant == null) {
            return List.of();
        }
        
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
                .findByTenantIdAndConsultantAndCalculationPeriodStartBetween(
                        tenantId, consultant, startDate, endDate);
        
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
        
        return salaryCalculationRepository.findByTenantIdAndStatusAndCalculationPeriodStartBetween(
                tenantId, SalaryCalculation.SalaryStatus.CALCULATED, startDate, endDate);
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
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        SalaryCalculation calculation = salaryCalculationRepository.findByTenantIdAndId(tenantId, calculationId)
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
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        SalaryCalculation calculation = salaryCalculationRepository.findByTenantIdAndId(tenantId, calculationId)
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
                .map(calc -> Optional.ofNullable(calc.getGrossSalary()).orElse(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalNetSalary = calculations.stream()
                .map(calc -> Optional.ofNullable(calc.getNetSalary()).orElse(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalTaxAmount = calculations.stream()
                .map(calc -> Optional.ofNullable(calc.getDeductions()).orElse(BigDecimal.ZERO))
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
        
        List<SalaryCalculation> calculations = salaryCalculationRepository
                .findByTenantIdAndStatusAndCalculationPeriodStartBetweenWithConsultant(
                        tenantId, SalaryCalculation.SalaryStatus.CALCULATED, startDate, endDate);
        
        return calculations.stream()
                .filter(calc -> calc.getConsultant() != null)
                .sorted((a, b) -> Optional.ofNullable(b.getNetSalary()).orElse(BigDecimal.ZERO)
                        .compareTo(Optional.ofNullable(a.getNetSalary()).orElse(BigDecimal.ZERO)))
                .limit(limit)
                .map(calc -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("consultantId", calc.getConsultant().getId());
                    result.put("consultantName", calc.getConsultant().getName());
                    result.put("netSalary", Optional.ofNullable(calc.getNetSalary()).orElse(BigDecimal.ZERO));
                    result.put("completedConsultations", calc.getCompletedConsultations() != null ? calc.getCompletedConsultations() : 0);
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
     * 상담사별 급여 계산 내역 조회 (테넌트 격리 적용)
     */
    @Override
    public List<SalaryCalculation> getSalaryCalculations(Long consultantId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 상담사별 급여 계산 조회: ConsultantId={}, tenantId={}", consultantId, tenantId);
        
        return salaryCalculationRepository.findByTenantIdAndConsultant_IdOrderByCalculatedAtDesc(
                tenantId, consultantId);
    }
    
    /**
     * 세금 상세 내역 조회 (테넌트 소유 검증 적용)
     */
    @Override
    public Map<String, Object> getTaxDetails(Long calculationId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 세금 상세 조회: CalculationId={}, tenantId={}", calculationId, tenantId);
        
        SalaryCalculation calculation = salaryCalculationRepository.findByIdWithConsultant(calculationId)
                .orElseThrow(() -> new EntityNotFoundException("급여 계산 정보를 찾을 수 없습니다: " + calculationId));
        if (calculation.getTenantId() == null || !calculation.getTenantId().equals(tenantId)) {
            throw new EntityNotFoundException("급여 계산 정보를 찾을 수 없습니다: " + calculationId);
        }
        
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
        
        String consultantName = calculation.getConsultant() != null ? calculation.getConsultant().getName() : "";
        Map<String, Object> result = new HashMap<>();
        result.put("calculationId", calculationId);
        result.put("consultantName", consultantName);
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
    public Map<String, Object> getTaxStatistics(String period, Long consultantId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("💰 세금 통계 조회: Period={}, consultantId={}, tenantId={}", period, consultantId, tenantId);
        
        if (period == null || period.isBlank()) {
            throw new ValidationException("기간(period)은 필수이며 YYYY-MM 형식이어야 합니다.");
        }
        String[] periodParts = period.trim().split("-");
        if (periodParts.length != 2) {
            throw new ValidationException("기간 형식이 올바르지 않습니다. YYYY-MM 형식으로 입력해 주세요. (예: 2025-01)");
        }
        int year;
        int month;
        try {
            year = Integer.parseInt(periodParts[0].trim());
            month = Integer.parseInt(periodParts[1].trim());
        } catch (NumberFormatException e) {
            throw new ValidationException("기간 형식이 올바르지 않습니다. YYYY-MM 형식으로 입력해 주세요. (예: 2025-01)");
        }
        if (month < 1 || month > 12) {
            throw new ValidationException("월은 1~12 사이여야 합니다. (입력값: " + month + ")");
        }
        if (year < 1900 || year > 2100) {
            throw new ValidationException("연도는 1900~2100 사이여야 합니다. (입력값: " + year + ")");
        }
        
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        List<SalaryCalculation> calculations = salaryCalculationRepository
                .findByTenantIdAndStatusAndCalculationPeriodStartBetweenWithConsultant(
                        tenantId, SalaryCalculation.SalaryStatus.CALCULATED, startDate, endDate);
        if (consultantId != null) {
            calculations = calculations.stream()
                    .filter(c -> c.getConsultant() != null && consultantId.equals(c.getConsultant().getId()))
                    .collect(Collectors.toList());
        }
        List<Long> calculationIds = calculations.stream()
            .map(SalaryCalculation::getId)
            .collect(Collectors.toList());
        
        BigDecimal totalGrossSalary = calculations.stream()
            .map(calc -> Optional.ofNullable(calc.getGrossSalary()).orElse(BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalNetSalary = calculations.stream()
            .map(calc -> Optional.ofNullable(calc.getNetSalary()).orElse(BigDecimal.ZERO))
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
                    case "NATIONAL_PENSION":
                        breakdown.put("nationalPension", sum);
                        break;
                    default:
                        breakdown.put(taxType, sum);
                        break;
                }
            }
        }

        /*
         * salary_tax_calculations에 WITHHOLDING_TAX 행이 없는 경우(구버전 계산·프로시저 미배포 등):
         * 활성 ConsultantSalaryProfile이 FREEL인 급여 건에 대해 총급여 기준 3.3%를 표시용으로 보강한다.
         */
        BigDecimal dbWithholding = Optional.ofNullable(breakdown.get("withholdingTax")).orElse(BigDecimal.ZERO);
        if (dbWithholding.compareTo(BigDecimal.ZERO) == 0 && !calculations.isEmpty()) {
            BigDecimal fallbackWh = BigDecimal.ZERO;
            for (SalaryCalculation sc : calculations) {
                if (sc.getConsultant() == null || sc.getGrossSalary() == null
                        || sc.getGrossSalary().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                Long cid = sc.getConsultant().getId();
                Optional<ConsultantSalaryProfile> profileOpt =
                        consultantSalaryProfileRepository.findByTenantIdAndConsultantIdAndActive(tenantId, cid);
                if (profileOpt.isPresent()
                        && FreelanceWithholdingTaxUtil.CONSULTANT_SALARY_TYPE_FREELANCE.equals(
                                profileOpt.get().getSalaryType())) {
                    fallbackWh = fallbackWh.add(
                            FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(sc.getGrossSalary()));
                }
            }
            if (fallbackWh.compareTo(BigDecimal.ZERO) > 0) {
                breakdown.put("withholdingTax", fallbackWh);
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
        
        SalaryCalculation calculation = salaryCalculationRepository.findByTenantIdAndId(tenantId, request.getCalculationId())
                .orElseThrow(() -> new EntityNotFoundException("급여 계산 정보를 찾을 수 없습니다: " + request.getCalculationId()));
        
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
