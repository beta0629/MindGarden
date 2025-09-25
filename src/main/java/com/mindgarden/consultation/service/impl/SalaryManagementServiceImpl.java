package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantSalaryProfileRepository;
import com.mindgarden.consultation.repository.SalaryCalculationRepository;
import com.mindgarden.consultation.repository.SalaryTaxCalculationRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.SalaryManagementService;
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
    public List<ConsultantSalaryProfile> getAllSalaryProfiles(String branchCode) {
        log.info("📋 급여 프로필 목록 조회: BranchCode={}", branchCode);
        
        List<ConsultantSalaryProfile> allProfiles = consultantSalaryProfileRepository.findByIsActiveTrue();
        
        if (branchCode == null) {
            return allProfiles;
        } else {
            // Java 코드로 지점 필터링
            return allProfiles.stream()
                    .filter(profile -> {
                        User consultant = userRepository.findById(profile.getConsultantId()).orElse(null);
                        return consultant != null && branchCode.equals(consultant.getBranchCode());
                    })
                    .collect(Collectors.toList());
        }
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
    public List<User> getConsultantsForSalary(String branchCode) {
        log.info("👥 급여용 상담사 목록 조회: BranchCode={}", branchCode);
        
        if (branchCode == null) {
            return userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
        } else {
            return userRepository.findByRoleAndIsActiveTrueAndBranchCode(UserRole.CONSULTANT, branchCode);
        }
    }
    
    @Override
    public List<Map<String, Object>> getConsultantSalarySummary(Long consultantId, String period) {
        log.info("📊 상담사 급여 요약 조회: ConsultantID={}, Period={}", consultantId, period);
        
        // 기간 계산
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
    public List<SalaryCalculation> getSalaryCalculations(String branchCode, LocalDate startDate, LocalDate endDate) {
        log.info("📋 급여 계산 목록 조회: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        if (branchCode == null) {
            return salaryCalculationRepository.findByStatusAndCalculationPeriodStartBetween(
                    SalaryCalculation.SalaryStatus.CALCULATED, startDate, endDate);
        } else {
            return salaryCalculationRepository.findByBranchCodeAndCalculationPeriodStartBetween(
                    branchCode, startDate, endDate);
        }
    }
    
    @Override
    public SalaryCalculation calculateSalary(Long consultantId, Long profileId, LocalDate periodStart, LocalDate periodEnd) {
        log.info("🧮 급여 계산: ConsultantID={}, ProfileID={}, Period={} ~ {}", 
                consultantId, profileId, periodStart, periodEnd);
        
        // 급여 계산 로직은 PL/SQL 프로시저로 처리됨
        // 현재는 PL/SQL 서비스를 통해 처리됨
        
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
        
        calculation.setStatus(SalaryCalculation.SalaryStatus.APPROVED);
        return salaryCalculationRepository.save(calculation);
    }
    
    @Override
    public SalaryCalculation markAsPaid(Long calculationId, String paidBy) {
        log.info("💳 급여 지급 완료: CalculationID={}, PaidBy={}", calculationId, paidBy);
        
        SalaryCalculation calculation = salaryCalculationRepository.findById(calculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + calculationId));
        
        if (calculation.getStatus() != SalaryCalculation.SalaryStatus.APPROVED) {
            throw new RuntimeException("지급 가능한 상태가 아닙니다: " + calculation.getStatus());
        }
        
        calculation.setStatus(SalaryCalculation.SalaryStatus.PAID);
        return salaryCalculationRepository.save(calculation);
    }
    
    @Override
    public Map<String, Object> getSalaryStatistics(String branchCode, LocalDate startDate, LocalDate endDate) {
        log.info("📊 급여 통계 조회: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        List<SalaryCalculation> calculations = getSalaryCalculations(branchCode, startDate, endDate);
        
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
    public List<Map<String, Object>> getTopPerformers(String branchCode, LocalDate startDate, LocalDate endDate, int limit) {
        log.info("🏆 상위 성과자 조회: BranchCode={}, Period={} ~ {}, Limit={}", 
                branchCode, startDate, endDate, limit);
        
        List<SalaryCalculation> calculations = getSalaryCalculations(branchCode, startDate, endDate);
        
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
    public BigDecimal calculateTotalSalaryCost(String branchCode, LocalDate startDate, LocalDate endDate) {
        log.info("💰 총 급여 비용 계산: BranchCode={}, Period={} ~ {}", branchCode, startDate, endDate);
        
        List<SalaryCalculation> calculations = getSalaryCalculations(branchCode, startDate, endDate);
        
        return calculations.stream()
                .map(SalaryCalculation::getNetSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * 상담사별 급여 계산 내역 조회 (프론트엔드 호환성)
     */
    @Override
    public List<SalaryCalculation> getSalaryCalculations(Long consultantId, String branchCode) {
        log.info("💰 상담사별 급여 계산 조회: ConsultantId={}, BranchCode={}", consultantId, branchCode);
        
        return salaryCalculationRepository.findByConsultantIdAndConsultantBranchCode(
            consultantId, branchCode
        );
    }
    
    /**
     * 세금 상세 내역 조회 (프론트엔드 호환성)
     */
    @Override
    public Map<String, Object> getTaxDetails(Long calculationId, String branchCode) {
        log.info("💰 세금 상세 조회: CalculationId={}, BranchCode={}", calculationId, branchCode);
        
        // 급여 계산 정보 조회
        SalaryCalculation calculation = salaryCalculationRepository.findById(calculationId)
            .orElseThrow(() -> new RuntimeException("급여 계산 정보를 찾을 수 없습니다: " + calculationId));
        
        // 지점 코드 확인
        if (!branchCode.equals(calculation.getConsultant().getBranchCode())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 세금 계산 조회
        List<Map<String, Object>> taxCalculations = salaryTaxCalculationRepository
            .findByCalculationIdAndBranchCode(calculationId, branchCode);
        
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
     * 세금 통계 조회 (프론트엔드 호환성)
     */
    @Override
    public Map<String, Object> getTaxStatistics(String period, String branchCode) {
        log.info("💰 세금 통계 조회: Period={}, BranchCode={}", period, branchCode);
        
        // 기간 파싱 (예: "2025-01")
        String[] periodParts = period.split("-");
        if (periodParts.length != 2) {
            throw new RuntimeException("잘못된 기간 형식입니다: " + period);
        }
        
        int year = Integer.parseInt(periodParts[0]);
        int month = Integer.parseInt(periodParts[1]);
        
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        // 해당 기간의 급여 계산 조회
        List<SalaryCalculation> calculations = getSalaryCalculations(branchCode, startDate, endDate);
        
        // 통계 계산
        BigDecimal totalGrossSalary = calculations.stream()
            .map(SalaryCalculation::getGrossSalary)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalNetSalary = calculations.stream()
            .map(SalaryCalculation::getNetSalary)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal totalTaxAmount = totalGrossSalary.subtract(totalNetSalary);
        
        Map<String, Object> result = new HashMap<>();
        result.put("period", period);
        result.put("totalCalculations", calculations.size());
        result.put("totalGrossSalary", totalGrossSalary);
        result.put("totalNetSalary", totalNetSalary);
        result.put("totalTaxAmount", totalTaxAmount);
        result.put("averageGrossSalary", calculations.isEmpty() ? BigDecimal.ZERO : 
            totalGrossSalary.divide(BigDecimal.valueOf(calculations.size()), 2, java.math.RoundingMode.HALF_UP));
        result.put("averageNetSalary", calculations.isEmpty() ? BigDecimal.ZERO : 
            totalNetSalary.divide(BigDecimal.valueOf(calculations.size()), 2, java.math.RoundingMode.HALF_UP));
        
        return result;
    }
}
