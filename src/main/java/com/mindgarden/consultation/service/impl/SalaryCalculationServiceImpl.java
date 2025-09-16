package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindgarden.consultation.constant.ScheduleStatus;
import com.mindgarden.consultation.dto.FinancialTransactionRequest;
import com.mindgarden.consultation.dto.FinancialTransactionResponse;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.ConsultantSalaryOption;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.SalaryTaxCalculation;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantSalaryOptionRepository;
import com.mindgarden.consultation.repository.ConsultantSalaryProfileRepository;
import com.mindgarden.consultation.repository.SalaryCalculationRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.SalaryCalculationService;
import com.mindgarden.consultation.service.TaxCalculationService;
import com.mindgarden.consultation.service.UserService;
import com.mindgarden.consultation.util.TaxCalculationUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 계산 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SalaryCalculationServiceImpl implements SalaryCalculationService {
    
    private final ConsultantSalaryProfileRepository salaryProfileRepository;
    private final ConsultantSalaryOptionRepository salaryOptionRepository;
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final TaxCalculationService taxCalculationService;
    private final FinancialTransactionService financialTransactionService;
    private final CommonCodeService commonCodeService;
    private final UserService userService;
    private final ScheduleRepository scheduleRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // ==================== 급여 프로필 관리 ====================
    
    /**
     * 수퍼어드민 권한 검증
     */
    private void validateSuperAdminAccess() {
        // 개발 환경에서 임시 비활성화
        log.debug("🔓 급여 관리 권한 체크 비활성화 (개발 환경)");
        return;
        
        // 프로덕션 환경에서는 아래 코드 활성화
        /*
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_HQ_MASTER") || 
                                 auth.getAuthority().equals("HQ_MASTER"))) {
            throw new RuntimeException("급여 관리 기능은 수퍼어드민만 접근 가능합니다.");
        }
        */
    }
    
    /**
     * 급여일 계산 (매월 1일~말일 근무, 다음 달 지정일 지급)
     * 
     * @param workYearMonth 근무 년월 (예: 2025-01)
     * @param payDayCode 급여일 코드 (예: TENTH, FIFTEENTH 등)
     * @return 급여일 정보 Map (workStartDate, workEndDate, payDate)
     */
    private Map<String, LocalDate> calculatePayDates(String workYearMonth, String payDayCode) {
        Map<String, LocalDate> payDates = new HashMap<>();
        
        try {
            // 근무 년월 파싱 (예: "2025-01" -> YearMonth)
            String[] parts = workYearMonth.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            YearMonth yearMonth = YearMonth.of(year, month);
            
            // 근무 기간: 매월 1일 ~ 말일
            LocalDate workStartDate = yearMonth.atDay(1);
            LocalDate workEndDate = yearMonth.atEndOfMonth();
            
            // 급여일 코드로 지급일 계산
            LocalDate payDate = calculatePayDate(yearMonth, payDayCode);
            
            payDates.put("workStartDate", workStartDate);
            payDates.put("workEndDate", workEndDate);
            payDates.put("payDate", payDate);
            
            log.info("급여일 계산 완료: 근무기간={}~{}, 지급일={}", workStartDate, workEndDate, payDate);
            
        } catch (Exception e) {
            log.error("급여일 계산 실패: workYearMonth={}, payDayCode={}", workYearMonth, payDayCode, e);
            throw new RuntimeException("급여일 계산에 실패했습니다: " + e.getMessage());
        }
        
        return payDates;
    }
    
    /**
     * 급여일 코드에 따른 실제 지급일 계산
     * 
     * @param workYearMonth 근무 년월
     * @param payDayCode 급여일 코드
     * @return 실제 지급일
     */
    private LocalDate calculatePayDate(YearMonth workYearMonth, String payDayCode) {
        // 다음 달로 설정 (근무한 달의 다음 달에 지급)
        YearMonth payYearMonth = workYearMonth.plusMonths(1);
        
        try {
            // 급여일 코드에서 일자 정보 가져오기
            CommonCode payDayCodeInfo = commonCodeService.getCommonCodeByGroupAndValue("SALARY_PAY_DAY", payDayCode);
            if (payDayCodeInfo == null) {
                // 기본값 조회
                payDayCodeInfo = commonCodeService.getCommonCodeByGroupAndValue("SALARY_PAY_DAY", "TENTH");
            }
            
            if (payDayCodeInfo == null) {
                // 기본값: 다음 달 10일
                return payYearMonth.atDay(10);
            }
            
            // extraData JSON 파싱
            String extraDataJson = payDayCodeInfo.getExtraData();
            if (extraDataJson == null || extraDataJson.trim().isEmpty()) {
                // 기본값: 다음 달 10일
                return payYearMonth.atDay(10);
            }
            
            Map<String, Object> extraData = objectMapper.readValue(extraDataJson, new TypeReference<Map<String, Object>>() {});
            Object dayOfMonthObj = extraData.get("dayOfMonth");
            
            int dayOfMonth;
            if (dayOfMonthObj instanceof Integer) {
                dayOfMonth = (Integer) dayOfMonthObj;
            } else if (dayOfMonthObj instanceof String) {
                dayOfMonth = Integer.parseInt((String) dayOfMonthObj);
            } else {
                dayOfMonth = 10; // 기본값
            }
            
            if (dayOfMonth == 0) {
                // 말일 지급
                return payYearMonth.atEndOfMonth();
            } else {
                // 지정일 지급
                return payYearMonth.atDay(dayOfMonth);
            }
            
        } catch (Exception e) {
            log.warn("급여일 코드 처리 실패, 기본값(10일) 사용: {}", e.getMessage());
            return payYearMonth.atDay(10);
        }
    }
    
    @Override
    public ConsultantSalaryProfile createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms) {
        return createSalaryProfile(consultantId, salaryType, baseSalary, contractTerms, false);
    }
    
    @Override
    public ConsultantSalaryProfile createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms, Boolean isBusinessRegistered) {
        return createSalaryProfile(consultantId, salaryType, baseSalary, contractTerms, isBusinessRegistered, "", "");
    }
    
    @Override
    public ConsultantSalaryProfile createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms, Boolean isBusinessRegistered, String businessRegistrationNumber, String businessName) {
        validateSuperAdminAccess();
        log.info("🔧 상담사 급여 프로필 생성: 상담사ID={}, 급여유형={}, 기본급여={}, 사업자등록={}, 사업자등록번호={}, 사업자명={}", 
                consultantId, salaryType, baseSalary, isBusinessRegistered, businessRegistrationNumber, businessName);
        
        // 기존 프로필 비활성화
        deactivateSalaryProfile(consultantId);
        
        ConsultantSalaryProfile profile = new ConsultantSalaryProfile();
        profile.setConsultantId(consultantId);
        profile.setSalaryType(salaryType);
        profile.setBaseSalary(baseSalary);
        profile.setContractTerms(contractTerms);
        profile.setIsBusinessRegistered(isBusinessRegistered);
        profile.setBusinessRegistrationNumber(businessRegistrationNumber);
        profile.setBusinessName(businessName);
        profile.setIsActive(true);
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());
        
        return salaryProfileRepository.save(profile);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ConsultantSalaryProfile getSalaryProfile(Long consultantId) {
        validateSuperAdminAccess();
        log.info("🔍 상담사 급여 프로필 조회: 상담사ID={}", consultantId);
        return salaryProfileRepository.findByConsultantIdAndActive(consultantId)
                .orElse(null);
    }
    
    @Override
    public ConsultantSalaryProfile updateSalaryProfile(Long consultantId, ConsultantSalaryProfile updatedProfile) {
        validateSuperAdminAccess();
        log.info("🔧 상담사 급여 프로필 수정: 상담사ID={}", consultantId);
        
        ConsultantSalaryProfile existingProfile = getSalaryProfile(consultantId);
        if (existingProfile == null) {
            throw new RuntimeException("급여 프로필을 찾을 수 없습니다: " + consultantId);
        }
        
        existingProfile.setBaseSalary(updatedProfile.getBaseSalary());
        existingProfile.setHourlyRate(updatedProfile.getHourlyRate());
        existingProfile.setContractStartDate(updatedProfile.getContractStartDate());
        existingProfile.setContractEndDate(updatedProfile.getContractEndDate());
        existingProfile.setContractTerms(updatedProfile.getContractTerms());
        existingProfile.setPaymentCycle(updatedProfile.getPaymentCycle());
        existingProfile.setUpdatedAt(LocalDateTime.now());
        
        return salaryProfileRepository.save(existingProfile);
    }
    
    @Override
    public boolean deactivateSalaryProfile(Long consultantId) {
        validateSuperAdminAccess();
        log.info("🔧 상담사 급여 프로필 비활성화: 상담사ID={}", consultantId);
        
        ConsultantSalaryProfile profile = getSalaryProfile(consultantId);
        if (profile != null) {
            profile.setIsActive(false);
            profile.setUpdatedAt(LocalDateTime.now());
            salaryProfileRepository.save(profile);
            return true;
        }
        return false;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ConsultantSalaryProfile> getAllSalaryProfiles() {
        validateSuperAdminAccess();
        log.info("🔍 모든 급여 프로필 조회");
        return salaryProfileRepository.findByIsActiveTrue();
    }

    @Override
    @Transactional
    public ConsultantSalaryOption addSalaryOption(Long salaryProfileId, String optionType, BigDecimal optionAmount, String description) {
        validateSuperAdminAccess();
        log.info("➕ 급여 옵션 추가: 프로필ID={}, 옵션유형={}, 금액={}", salaryProfileId, optionType, optionAmount);
        
        // 급여 프로필 존재 여부 확인
        if (!salaryProfileRepository.existsById(salaryProfileId)) {
            throw new RuntimeException("급여 프로필을 찾을 수 없습니다: " + salaryProfileId);
        }
        
        ConsultantSalaryOption option = new ConsultantSalaryOption();
        option.setSalaryProfileId(salaryProfileId);
        option.setOptionType(optionType);
        option.setOptionAmount(optionAmount);
        option.setOptionDescription(description);
        option.setIsActive(true);
        option.setCreatedAt(LocalDateTime.now());
        option.setUpdatedAt(LocalDateTime.now());
        
        ConsultantSalaryOption savedOption = salaryOptionRepository.save(option);
        log.info("✅ 급여 옵션 추가 완료: 옵션ID={}", savedOption.getId());
        
        return savedOption;
    }
    
    // ==================== 급여 옵션 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<ConsultantSalaryOption> getSalaryOptions(Long salaryProfileId) {
        validateSuperAdminAccess();
        log.info("🔍 급여 옵션 조회: 프로필ID={}", salaryProfileId);
        return salaryOptionRepository.findBySalaryProfileIdAndActive(salaryProfileId);
    }
    
    @Override
    public ConsultantSalaryOption updateSalaryOption(Long optionId, BigDecimal optionAmount, String description) {
        validateSuperAdminAccess();
        log.info("🔧 급여 옵션 수정: 옵션ID={}", optionId);
        
        ConsultantSalaryOption option = salaryOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("급여 옵션을 찾을 수 없습니다: " + optionId));
        
        option.setOptionAmount(optionAmount);
        option.setOptionDescription(description);
        option.setUpdatedAt(LocalDateTime.now());
        
        return salaryOptionRepository.save(option);
    }
    
    @Override
    public boolean removeSalaryOption(Long optionId) {
        log.info("🔧 급여 옵션 삭제: 옵션ID={}", optionId);
        
        ConsultantSalaryOption option = salaryOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("급여 옵션을 찾을 수 없습니다: " + optionId));
        
        option.setIsActive(false);
        option.setUpdatedAt(LocalDateTime.now());
        salaryOptionRepository.save(option);
        
        return true;
    }
    
    // ==================== 급여 계산 ====================
    
    /**
     * 중복된 급여 계산 기록 정리 (0원 계산 제거)
     */
    @Override
    @Transactional
    public int cleanupDuplicateCalculations() {
        validateSuperAdminAccess();
        log.info("🧹 중복 급여 계산 기록 정리 시작");
        
        int cleanedCount = 0;
        
        // 모든 상담사별로 중복 계산 확인
        List<Long> consultantIds = salaryCalculationRepository.findDistinctConsultantIds();
        
        for (Long consultantId : consultantIds) {
            // 상담사별로 기간별 그룹화
            Map<String, List<SalaryCalculation>> calculationsByPeriod = 
                salaryCalculationRepository.findByConsultantId(consultantId)
                    .stream()
                    .collect(Collectors.groupingBy(SalaryCalculation::getCalculationPeriod));
            
            for (Map.Entry<String, List<SalaryCalculation>> entry : calculationsByPeriod.entrySet()) {
                String period = entry.getKey();
                List<SalaryCalculation> calculations = entry.getValue();
                
                if (calculations.size() > 1) {
                    log.info("🔍 중복 계산 발견: 상담사ID={}, 기간={}, 개수={}", 
                        consultantId, period, calculations.size());
                    
                    // 0원 계산들 제거 (실제 값이 있는 계산만 유지)
                    List<SalaryCalculation> zeroCalculations = calculations.stream()
                        .filter(calc -> calc.getTotalSalary().compareTo(BigDecimal.ZERO) == 0)
                        .collect(Collectors.toList());
                    
                    if (!zeroCalculations.isEmpty()) {
                        log.info("🗑️ 0원 계산 제거: {}개", zeroCalculations.size());
                        salaryCalculationRepository.deleteAll(zeroCalculations);
                        cleanedCount += zeroCalculations.size();
                    }
                }
            }
        }
        
        log.info("✅ 중복 급여 계산 기록 정리 완료: {}개 제거", cleanedCount);
        return cleanedCount;
    }
    
    @Override
    public SalaryCalculation calculateFreelanceSalary(Long consultantId, String period, List<Map<String, Object>> consultations) {
        return calculateFreelanceSalary(consultantId, period, consultations, "TENTH");
    }
    
    @Override
    public SalaryCalculation calculateFreelanceSalary(Long consultantId, String period, List<Map<String, Object>> consultations, String payDayCode) {
        validateSuperAdminAccess();
        
        // 기간 계산 (예: 2025-09 -> 2025-09-01 ~ 2025-09-30)
        YearMonth yearMonth = YearMonth.parse(period);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        
        // 중복 계산 확인
        List<SalaryCalculation> existingCalculations = salaryCalculationRepository
            .findByConsultantIdAndCalculationPeriod(consultantId, period);
        
        if (!existingCalculations.isEmpty()) {
            log.warn("⚠️ 중복 급여 계산 감지: 상담사ID={}, 기간={}, 기존계산수={}", 
                consultantId, period, existingCalculations.size());
            
            // 기존 계산이 있으면 업데이트 (가장 최근 것)
            SalaryCalculation existingCalculation = existingCalculations.get(0);
            log.info("🔄 기존 계산 업데이트: 계산ID={}", existingCalculation.getId());
            
            // 기존 계산 삭제 후 새로 생성
            salaryCalculationRepository.delete(existingCalculation);
        }
        
        // 실제 상담 완료 건수 조회 (스케줄 기준)
        int completedConsultations = getCompletedScheduleCount(consultantId, startDate, endDate);
        log.info("💰 프리랜서 급여 계산: 상담사ID={}, 기간={}, 실제상담건수={}", consultantId, period, completedConsultations);
        
        ConsultantSalaryProfile profile = getSalaryProfile(consultantId);
        if (profile == null || !profile.isFreelance()) {
            throw new RuntimeException("프리랜서 급여 프로필을 찾을 수 없습니다: " + consultantId);
        }
        
        // 기본 상담료 조회
        BigDecimal baseRate = profile.getBaseSalary();
        if (baseRate == null) {
            baseRate = getDefaultFreelanceRate(consultantId);
        }
        
        // 상담 유형별 옵션 금액 계산 (상담 완료 건수 기반)
        BigDecimal totalBaseSalary = baseRate.multiply(new BigDecimal(completedConsultations));
        BigDecimal totalOptionSalary = calculateOptionSalaryByConsultationType(consultantId, startDate, endDate);
        int consultationCount = completedConsultations;
        BigDecimal totalHours = BigDecimal.ZERO; // 총 상담 시간 (시간 단위)
        
        // 총 급여 계산 (세전)
        BigDecimal grossSalary = totalBaseSalary.add(totalOptionSalary);
        
        // 급여일 계산
        Map<String, LocalDate> payDates = calculatePayDates(period, payDayCode);
        
        // 급여 계산 기록 생성
        SalaryCalculation calculation = new SalaryCalculation();
        calculation.setConsultantId(consultantId);
        calculation.setSalaryProfileId(profile.getId());
        calculation.setCalculationPeriod(period);
        calculation.setWorkStartDate(payDates.get("workStartDate"));
        calculation.setWorkEndDate(payDates.get("workEndDate"));
        calculation.setPayDate(payDates.get("payDate"));
        calculation.setBaseSalary(totalBaseSalary);
        calculation.setOptionSalary(totalOptionSalary);
        calculation.setTotalSalary(grossSalary); // 세전 급여로 설정
        calculation.setConsultationCount(consultationCount);
        calculation.setTotalHours(totalHours);
        calculation.setStatus("PENDING");
        
        // 계산 상세 생성 (옵션 정보는 상담 유형별로 계산된 것 사용)
        calculation.setCalculationDetails(createCalculationDetails(consultations, List.of()));
        calculation.setCreatedAt(LocalDateTime.now());
        calculation.setUpdatedAt(LocalDateTime.now());
        
        calculation.calculateTotalSalary();
        calculation.markAsCalculated();
        
        SalaryCalculation savedCalculation = salaryCalculationRepository.save(calculation);
        
        // 급여 계산 완료 후 자동으로 지출 거래 생성
        try {
            createSalaryExpenseTransaction(savedCalculation, profile);
            log.info("💚 급여 지출 거래 자동 생성 완료: ConsultantID={}, Amount={}", 
                consultantId, savedCalculation.getTotalSalary());
        } catch (Exception e) {
            log.error("급여 지출 거래 자동 생성 실패: {}", e.getMessage(), e);
            // 거래 생성 실패해도 급여 계산은 완료
        }
        
        // 세금 계산은 TaxCalculationService에 위임
        boolean isBusinessRegistered = profile.getIsBusinessRegistered() != null ? profile.getIsBusinessRegistered() : false;
        List<SalaryTaxCalculation> taxCalculations = taxCalculationService.calculateFreelanceTax(
            savedCalculation.getId(), grossSalary, isBusinessRegistered);
        
        // 세금 금액 업데이트
        BigDecimal totalTaxAmount = taxCalculations.stream()
                .map(SalaryTaxCalculation::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        savedCalculation.setTaxAmount(totalTaxAmount);
        savedCalculation.setCalculationDetails(createCalculationDetailsWithTax(consultations, List.of(), taxCalculations, grossSalary, totalTaxAmount));
        salaryCalculationRepository.save(savedCalculation);
        
        return savedCalculation;
    }
    
    @Override
    public SalaryCalculation calculateRegularSalary(Long consultantId, String period, BigDecimal baseSalary) {
        return calculateRegularSalary(consultantId, period, baseSalary, "TENTH");
    }
    
    @Override
    public SalaryCalculation calculateRegularSalary(Long consultantId, String period, BigDecimal baseSalary, String payDayCode) {
        validateSuperAdminAccess();
        log.info("💰 정규직 급여 계산: 상담사ID={}, 기간={}, 기본급여={}", consultantId, period, baseSalary);
        
        // 중복 계산 확인
        List<SalaryCalculation> existingCalculations = salaryCalculationRepository
            .findByConsultantIdAndCalculationPeriod(consultantId, period);
        
        if (!existingCalculations.isEmpty()) {
            log.warn("⚠️ 중복 급여 계산 감지: 상담사ID={}, 기간={}, 기존계산수={}", 
                consultantId, period, existingCalculations.size());
            
            // 기존 계산이 있으면 업데이트 (가장 최근 것)
            SalaryCalculation existingCalculation = existingCalculations.get(0);
            log.info("🔄 기존 계산 업데이트: 계산ID={}", existingCalculation.getId());
            
            // 기존 계산 삭제 후 새로 생성
            salaryCalculationRepository.delete(existingCalculation);
        }
        
        ConsultantSalaryProfile profile = getSalaryProfile(consultantId);
        if (profile == null || !profile.isRegular()) {
            throw new RuntimeException("정규직 급여 프로필을 찾을 수 없습니다: " + consultantId);
        }
        
        // 정규직은 기본 급여만 지급 (세전)
        BigDecimal grossSalary = baseSalary;
        
        // 세금 계산 (정규직 소득세)
        List<SalaryTaxCalculation> taxCalculations = taxCalculationService.calculateRegularTax(0L, grossSalary);
        BigDecimal totalTaxAmount = taxCalculations.stream()
                .map(SalaryTaxCalculation::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 세후 급여 계산
        BigDecimal netSalary = grossSalary.subtract(totalTaxAmount);
        
        // 급여일 계산
        Map<String, LocalDate> payDates = calculatePayDates(period, payDayCode);
        
        // 정규직 급여 계산 기록 생성
        SalaryCalculation calculation = new SalaryCalculation();
        calculation.setConsultantId(consultantId);
        calculation.setSalaryProfileId(profile.getId());
        calculation.setCalculationPeriod(period);
        calculation.setWorkStartDate(payDates.get("workStartDate"));
        calculation.setWorkEndDate(payDates.get("workEndDate"));
        calculation.setPayDate(payDates.get("payDate"));
        calculation.setBaseSalary(baseSalary);
        calculation.setOptionSalary(BigDecimal.ZERO);
        calculation.setTotalSalary(grossSalary); // 세전 급여로 설정
        calculation.setTaxAmount(totalTaxAmount); // 세금 금액 설정
        calculation.setConsultationCount(0);
        calculation.setTotalHours(BigDecimal.ZERO);
        calculation.setStatus("PENDING");
        
        // 계산 상세에 세금 정보 추가
        StringBuilder calculationDetails = new StringBuilder(createRegularSalaryDetails(baseSalary));
        calculationDetails.append("\n=== 세금 계산 ===\n");
        calculationDetails.append("총 급여 (세전): ").append(grossSalary).append("원\n");
        calculationDetails.append("총 세금: ").append(totalTaxAmount).append("원\n");
        calculationDetails.append("실지급액 (세후): ").append(netSalary).append("원\n");
        
        for (SalaryTaxCalculation tax : taxCalculations) {
            calculationDetails.append("- ").append(tax.getTaxName())
                    .append(" (").append(tax.getTaxRate().multiply(new BigDecimal("100")).setScale(1, java.math.RoundingMode.HALF_UP))
                    .append("%): ").append(tax.getTaxAmount()).append("원\n");
        }
        
        calculation.setCalculationDetails(calculationDetails.toString());
        calculation.setCreatedAt(LocalDateTime.now());
        calculation.setUpdatedAt(LocalDateTime.now());
        
        calculation.markAsCalculated();
        
        SalaryCalculation savedCalculation = salaryCalculationRepository.save(calculation);
        
        // 급여 계산 완료 후 자동으로 지출 거래 생성
        try {
            createSalaryExpenseTransaction(savedCalculation, profile);
            log.info("💚 급여 지출 거래 자동 생성 완료: ConsultantID={}, Amount={}", 
                consultantId, savedCalculation.getTotalSalary());
        } catch (Exception e) {
            log.error("급여 지출 거래 자동 생성 실패: {}", e.getMessage(), e);
            // 거래 생성 실패해도 급여 계산은 완료
        }
        
        // 세금 계산에 실제 계산 ID 설정하고 DB에 저장
        for (SalaryTaxCalculation tax : taxCalculations) {
            tax.setCalculationId(savedCalculation.getId());
            taxCalculationService.saveTaxCalculation(tax);
        }
        
        return savedCalculation;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SalaryCalculation> getSalaryCalculations(Long consultantId) {
        validateSuperAdminAccess();
        log.info("🔍 급여 계산 내역 조회: 상담사ID={}", consultantId);
        return salaryCalculationRepository.findByConsultantIdOrderByCreatedAtDesc(consultantId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SalaryCalculation getSalaryCalculationByPeriod(Long consultantId, String period) {
        validateSuperAdminAccess();
        log.info("🔍 기간별 급여 계산 조회: 상담사ID={}, 기간={}", consultantId, period);
        return salaryCalculationRepository.findByConsultantIdAndPeriod(consultantId, period)
                .orElse(null);
    }
    
    @Override
    public boolean approveSalaryCalculation(Long calculationId) {
        validateSuperAdminAccess();
        log.info("✅ 급여 계산 승인: 계산ID={}", calculationId);
        
        SalaryCalculation calculation = salaryCalculationRepository.findById(calculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + calculationId));
        
        calculation.markAsApproved();
        salaryCalculationRepository.save(calculation);
        
        return true;
    }
    
    @Override
    public boolean markSalaryAsPaid(Long calculationId) {
        validateSuperAdminAccess();
        log.info("💰 급여 지급 완료: 계산ID={}", calculationId);
        
        SalaryCalculation calculation = salaryCalculationRepository.findById(calculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + calculationId));
        
        if (!calculation.isPayable()) {
            throw new RuntimeException("지급 가능한 상태가 아닙니다: " + calculationId);
        }
        
        calculation.markAsPaid();
        salaryCalculationRepository.save(calculation);
        
        return true;
    }
    
    // ==================== 급여 통계 ====================
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalSalaryByConsultant(Long consultantId) {
        validateSuperAdminAccess();
        log.info("🔍 상담사별 총 급여 조회: 상담사ID={}", consultantId);
        return salaryCalculationRepository.getTotalPaidSalaryByConsultantId(consultantId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlySalaryStatistics(String period) {
        validateSuperAdminAccess();
        log.info("📊 월별 급여 통계 조회: 기간={}", period);
        
        List<SalaryCalculation> calculations = salaryCalculationRepository.findByCalculationPeriodOrderByCreatedAtDesc(period);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("period", period);
        statistics.put("totalCalculations", calculations.size());
        statistics.put("totalAmount", calculations.stream()
                .map(SalaryCalculation::getTotalSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        statistics.put("averageAmount", calculations.stream()
                .map(SalaryCalculation::getTotalSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(calculations.size()), 2, java.math.RoundingMode.HALF_UP));
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSalaryTypeStatistics() {
        log.info("📊 급여 유형별 통계 조회");
        
        List<ConsultantSalaryProfile> profiles = salaryProfileRepository.findByIsActiveTrue();
        
        Map<String, Long> typeCount = profiles.stream()
                .collect(Collectors.groupingBy(ConsultantSalaryProfile::getSalaryType, Collectors.counting()));
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("typeCount", typeCount);
        statistics.put("totalProfiles", profiles.size());
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SalaryCalculation> getPendingApprovalSalaries() {
        log.info("🔍 승인 대기 중인 급여 목록 조회");
        return salaryCalculationRepository.findPendingApproval();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SalaryCalculation> getPendingPaymentSalaries() {
        log.info("🔍 지급 대기 중인 급여 목록 조회");
        return salaryCalculationRepository.findPendingPayment();
    }
    
    // ==================== 헬퍼 메서드 ====================
    
    /**
     * 상담사 등급 조회
     */
    private String getConsultantGrade(Long consultantId) {
        try {
            // 상담사 정보 조회
            User consultant = userService.findById(consultantId).orElse(null);
            if (consultant != null && consultant.getGrade() != null) {
                return consultant.getGrade();
            }
            
            // 기본값 반환
            return "CONSULTANT_JUNIOR";
        } catch (Exception e) {
            log.warn("상담사 등급 조회 실패, 기본값 사용: consultantId={}, error={}", consultantId, e.getMessage());
            return "CONSULTANT_JUNIOR";
        }
    }
    
    /**
     * 기본 프리랜서 상담료 조회 (공통 코드에서)
     */
    private BigDecimal getDefaultFreelanceRate(Long consultantId) {
        try {
            // 상담사 등급 조회
            String consultantGrade = getConsultantGrade(consultantId);
            
            // 등급에 따른 프리랜서 기본 상담료 조회
            CommonCode freelanceRate = commonCodeService.getCommonCodeByGroupAndValue("FREELANCE_BASE_RATE", 
                consultantGrade.replace("CONSULTANT_", "") + "_RATE");
            
            if (freelanceRate != null && freelanceRate.getExtraData() != null) {
                Map<String, Object> extraData = objectMapper.readValue(freelanceRate.getExtraData(), 
                    new TypeReference<Map<String, Object>>() {});
                Object rateObj = extraData.get("rate");
                if (rateObj instanceof Integer) {
                    return new BigDecimal((Integer) rateObj);
                } else if (rateObj instanceof String) {
                    return new BigDecimal((String) rateObj);
                }
            }
            
            return new BigDecimal("30000"); // 기본값
        } catch (Exception e) {
            log.warn("프리랜서 기본 상담료 조회 실패, 기본값 사용: {}", e.getMessage());
            return new BigDecimal("30000");
        }
    }
    
    
    /**
     * 계산 상세 내역 생성
     */
    private String createCalculationDetails(List<Map<String, Object>> consultations, List<ConsultantSalaryOption> options) {
        Map<String, Object> details = new HashMap<>();
        details.put("consultations", consultations);
        details.put("options", options.stream()
                .map(option -> Map.of(
                    "type", option.getOptionType(),
                    "amount", option.getOptionAmount(),
                    "description", option.getOptionDescription()
                ))
                .collect(Collectors.toList()));
        details.put("calculatedAt", LocalDateTime.now().toString());
        
        return details.toString();
    }
    
    /**
     * 세금 포함 계산 상세 내역 생성
     */
    private String createCalculationDetailsWithTax(List<Map<String, Object>> consultations, List<ConsultantSalaryOption> options, 
                                                List<SalaryTaxCalculation> taxCalculations, BigDecimal grossSalary, BigDecimal totalTaxAmount) {
        StringBuilder details = new StringBuilder(createCalculationDetails(consultations, options));
        details.append("\n=== 세금 계산 ===\n");
        details.append("총 급여 (세전): ").append(grossSalary).append("원\n");
        details.append("총 세금: ").append(totalTaxAmount).append("원\n");
        details.append("실지급액 (세후): ").append(grossSalary.subtract(totalTaxAmount)).append("원\n");
        
        for (SalaryTaxCalculation tax : taxCalculations) {
            details.append("- ").append(tax.getTaxName())
                    .append(" (").append(tax.getTaxRate().multiply(new BigDecimal("100")).setScale(1, java.math.RoundingMode.HALF_UP))
                    .append("%): ").append(tax.getTaxAmount()).append("원\n");
        }
        
        return details.toString();
    }
    
    /**
     * 정규직 급여 상세 내역 생성
     */
    private String createRegularSalaryDetails(BigDecimal baseSalary) {
        Map<String, Object> details = new HashMap<>();
        details.put("baseSalary", baseSalary);
        details.put("salaryType", "REGULAR");
        details.put("calculatedAt", LocalDateTime.now().toString());
        
        return details.toString();
    }
    
    /**
     * 상담사별 완료된 스케줄 건수 조회 (기간별)
     */
    private int getCompletedScheduleCount(Long consultantId, LocalDate startDate, LocalDate endDate) {
        try {
            // 먼저 해당 상담사의 모든 스케줄 조회 (디버깅용)
            List<Schedule> allSchedules = scheduleRepository.findByConsultantIdAndDateBetween(consultantId, startDate, endDate);
            log.info("🔍 상담사 {} 전체 스케줄 조회: {}건 (기간: {} ~ {})", 
                consultantId, allSchedules.size(), startDate, endDate);
            
            // 각 스케줄의 상태 로그
            for (Schedule schedule : allSchedules) {
                log.info("📅 스케줄 ID: {}, 상태: {}, 날짜: {}, 상담사: {}", 
                    schedule.getId(), schedule.getStatus(), schedule.getDate(), schedule.getConsultantId());
            }
            
            // 완료된 스케줄만 필터링
            List<Schedule> completedSchedules = scheduleRepository.findByConsultantIdAndStatusAndDateBetween(
                consultantId, ScheduleStatus.COMPLETED, startDate, endDate);
            log.info("📊 상담사 {} 완료 스케줄 건수: {}건 (기간: {} ~ {})", 
                consultantId, completedSchedules.size(), startDate, endDate);
            return completedSchedules.size();
        } catch (Exception e) {
            log.warn("⚠️ 상담사 {} 완료 스케줄 건수 조회 실패: {}", consultantId, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 상담 유형별 옵션 급여 계산
     */
    private BigDecimal calculateOptionSalaryByConsultationType(Long consultantId, LocalDate startDate, LocalDate endDate) {
        BigDecimal totalOptionSalary = BigDecimal.ZERO;
        
        try {
            // 완료된 상담 스케줄 조회
            List<Schedule> completedSchedules = scheduleRepository.findByConsultantIdAndStatusAndDateBetween(
                consultantId, ScheduleStatus.COMPLETED, startDate, endDate);
            
            // 상담 유형별 옵션 금액 조회
            Map<String, BigDecimal> optionRates = getConsultationTypeOptionRates();
            
            for (Schedule schedule : completedSchedules) {
                String consultationType = schedule.getConsultationType();
                if (consultationType != null && optionRates.containsKey(consultationType)) {
                    totalOptionSalary = totalOptionSalary.add(optionRates.get(consultationType));
                }
            }
            
            log.info("💰 상담 유형별 옵션 급여 계산: 상담사ID={}, 옵션급여={}", consultantId, totalOptionSalary);
            
        } catch (Exception e) {
            log.error("❌ 상담 유형별 옵션 급여 계산 실패", e);
        }
        
        return totalOptionSalary;
    }
    
    /**
     * 상담 유형별 옵션 금액 조회
     */
    private Map<String, BigDecimal> getConsultationTypeOptionRates() {
        Map<String, BigDecimal> rates = new HashMap<>();
        
        try {
            // 공통코드에서 상담 유형별 옵션 금액 조회
            List<CommonCode> optionTypes = commonCodeService.getCommonCodesByGroup("SALARY_OPTION_TYPE");
            
            for (CommonCode optionType : optionTypes) {
                if (optionType.getExtraData() != null) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        @SuppressWarnings("unchecked")
                        Map<String, Object> extraData = mapper.readValue(optionType.getExtraData(), Map.class);
                        BigDecimal amount = new BigDecimal(extraData.get("baseAmount").toString());
                        rates.put(optionType.getCodeValue(), amount);
                    } catch (Exception e) {
                        log.warn("⚠️ 옵션 유형 데이터 파싱 실패: {}", optionType.getCodeValue(), e);
                    }
                }
            }
            
            // 기본값 설정 (공통코드에 없는 경우)
            if (rates.isEmpty()) {
                rates.put("INITIAL_CONSULTATION", new BigDecimal("5000"));
                rates.put("FAMILY_CONSULTATION", new BigDecimal("3000"));
            }
            
        } catch (Exception e) {
            log.error("❌ 상담 유형별 옵션 금액 조회 실패", e);
            // 기본값 설정
            rates.put("INITIAL_CONSULTATION", new BigDecimal("5000"));
            rates.put("FAMILY_CONSULTATION", new BigDecimal("3000"));
        }
        
        return rates;
    }
    
    /**
     * 급여 계산 완료 후 자동으로 지출 거래 생성
     */
    private void createSalaryExpenseTransaction(SalaryCalculation salaryCalculation, ConsultantSalaryProfile profile) {
        log.info("급여 지출 거래 생성 시작: ConsultantID={}, Amount={}", 
            salaryCalculation.getConsultantId(), salaryCalculation.getTotalSalary());
        
        // 급여는 부가세 없음
        TaxCalculationUtil.TaxCalculationResult taxResult = new TaxCalculationUtil.TaxCalculationResult(
            salaryCalculation.getTotalSalary(), salaryCalculation.getTotalSalary(), BigDecimal.ZERO);
        
        // 상담사 정보 조회
        User consultant = userService.findById(salaryCalculation.getConsultantId())
            .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + salaryCalculation.getConsultantId()));
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category("급여")
                .subcategory(getSalarySubcategory(profile))
                .amount(taxResult.getAmountIncludingTax()) // 부가세 포함 금액 (급여는 부가세 없음)
                .amountBeforeTax(taxResult.getAmountExcludingTax()) // 부가세 제외 금액 (급여는 부가세 없음)
                .taxAmount(taxResult.getVatAmount()) // 부가세 금액 (0)
                .description(String.format("%s 급여 지급 - %s (%s)", 
                    consultant.getName(), 
                    salaryCalculation.getCalculationPeriod(),
                    profile.getSalaryType()))
                .transactionDate(salaryCalculation.getPayDate() != null ? salaryCalculation.getPayDate() : LocalDate.now())
                .relatedEntityId(salaryCalculation.getId())
                .relatedEntityType("SALARY_CALCULATION")
                .taxIncluded(false) // 급여는 부가세 없음
                .build();
        
        FinancialTransactionResponse response = financialTransactionService.createTransaction(request, null); // 시스템 자동 생성
        
        log.info("✅ 급여 지출 거래 생성 완료: TransactionID={}, ConsultantID={}, Amount={}", 
            response.getId(), salaryCalculation.getConsultantId(), salaryCalculation.getTotalSalary());
    }
    
    /**
     * 급여 유형에 따른 세부 카테고리 반환
     */
    private String getSalarySubcategory(ConsultantSalaryProfile profile) {
        if (profile.getSalaryType() == null) {
            return "기타급여";
        }
        
        switch (profile.getSalaryType().toUpperCase()) {
            case "FREELANCE":
                return "프리랜서급여";
            case "REGULAR":
                return "정규직급여";
            case "PART_TIME":
                return "시간제급여";
            case "CONTRACT":
                return "계약직급여";
            default:
                return "기타급여";
        }
    }
}
