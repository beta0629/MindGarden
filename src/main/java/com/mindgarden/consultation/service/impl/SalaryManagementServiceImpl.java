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
        
        // TODO: 실제 급여 계산 로직 구현
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
}
