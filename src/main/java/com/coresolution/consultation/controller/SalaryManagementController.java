package com.coresolution.consultation.controller;

// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)
// Phase 2 2026-03-16: BaseApiController 상속, success/created 응답, 예외 공통 핸들러 위임

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.CommonCodeDto;
import com.coresolution.consultation.dto.TaxCalculateRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryTaxCalculation;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/salary") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class SalaryManagementController extends BaseApiController {
    
    private final SalaryManagementService salaryManagementService;
    private final PlSqlSalaryManagementService plSqlSalaryManagementService;
    private final SalaryScheduleService salaryScheduleService;
    private final CommonCodeService commonCodeService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 개별 급여 프로필 조회
     */
    @GetMapping("/profiles/{consultantId}")
    public ResponseEntity<?> getSalaryProfile(@PathVariable Long consultantId, HttpSession session) {
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session, "SALARY_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new ForbiddenException("급여 관리 권한이 없습니다.");
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser != null && currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        log.info("개별 급여 프로필 조회: 상담사 ID {}", consultantId);
        List<ConsultantSalaryProfile> profiles = salaryManagementService.getAllSalaryProfiles();
        ConsultantSalaryProfile consultantProfile = profiles.stream()
            .filter(profile -> profile.getConsultantId().equals(consultantId))
            .findFirst()
            .orElse(null);
        String message = consultantProfile != null ? "급여 프로필을 조회했습니다." : "해당 상담사의 급여 프로필이 없습니다.";
        return success(message, consultantProfile);
    }
    
    /**
     * 급여 프로필 목록 조회
     */
    @GetMapping("/profiles")
    public ResponseEntity<?> getSalaryProfiles(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다. 세션을 확인해 주세요.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        log.info("급여 프로필 조회: 사용자 {}, 지점 {}", currentUser.getName(), currentUser.getBranchCode());
        List<ConsultantSalaryProfile> profiles = salaryManagementService.getAllSalaryProfiles();
        return success("급여 프로필 목록을 조회했습니다.", profiles);
    }
    
    /**
     * 상담사별 급여 계산 내역 조회
     */
    @GetMapping("/calculations/{consultantId}")
    public ResponseEntity<?> getSalaryCalculations(@PathVariable Long consultantId, HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다. 세션을 확인해 주세요.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        log.info("급여 계산 조회: 사용자 {}, 상담사 ID {}", currentUser.getName(), consultantId);
        List<SalaryCalculation> calculations = salaryManagementService.getSalaryCalculations(consultantId);
        List<Map<String, Object>> calculationDtos = calculations.stream()
            .map(this::toCalculationDto)
            .collect(Collectors.toList());
        return success("급여 계산 내역을 조회했습니다.", calculationDtos);
    }

    private Map<String, Object> toCalculationDto(SalaryCalculation calc) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", calc.getId());
        dto.put("calculationPeriod", calc.getCalculationPeriod());
        dto.put("calculationPeriodStart", calc.getCalculationPeriodStart());
        dto.put("calculationPeriodEnd", calc.getCalculationPeriodEnd());
        dto.put("baseSalary", calc.getBaseSalary() != null ? calc.getBaseSalary() : BigDecimal.ZERO);
        dto.put("totalHoursWorked", calc.getTotalHoursWorked());
        dto.put("hourlyEarnings", calc.getHourlyEarnings() != null ? calc.getHourlyEarnings() : BigDecimal.ZERO);
        dto.put("totalConsultations", calc.getTotalConsultations());
        dto.put("completedConsultations", calc.getCompletedConsultations());
        dto.put("consultationCount", calc.getCompletedConsultations());
        dto.put("commissionEarnings", calc.getCommissionEarnings() != null ? calc.getCommissionEarnings() : BigDecimal.ZERO);
        dto.put("bonusEarnings", calc.getBonusEarnings() != null ? calc.getBonusEarnings() : BigDecimal.ZERO);
        dto.put("deductions", calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO);
        dto.put("grossSalary", calc.getGrossSalary() != null ? calc.getGrossSalary() : BigDecimal.ZERO);
        dto.put("netSalary", calc.getNetSalary() != null ? calc.getNetSalary() : BigDecimal.ZERO);
        dto.put("totalSalary", calc.getTotalSalary() != null ? calc.getTotalSalary() : BigDecimal.ZERO);
        dto.put("status", calc.getStatus());
        dto.put("calculatedAt", calc.getCalculatedAt());
        dto.put("approvedAt", calc.getApprovedAt());
        dto.put("paidAt", calc.getPaidAt());
        dto.put("branchCode", calc.getBranchCode());
        BigDecimal optionSalary = BigDecimal.ZERO;
        if (calc.getCommissionEarnings() != null && calc.getCommissionEarnings().compareTo(BigDecimal.ZERO) > 0) {
            optionSalary = calc.getCommissionEarnings();
        } else if (calc.getHourlyEarnings() != null && calc.getHourlyEarnings().compareTo(BigDecimal.ZERO) > 0) {
            optionSalary = calc.getHourlyEarnings();
        }
        dto.put("optionSalary", optionSalary);
        dto.put("taxAmount", calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO);
        if (calc.getConsultant() != null) {
            dto.put("consultantId", calc.getConsultant().getId());
            dto.put("consultantName", calc.getConsultant().getName());
        }
        return dto;
    }
    
    /**
     * 기산일 기준 실제 계산 기간 조회 (선택 월에 대한 적용 기간)
     *
     * @param year  년도 (예: 2025)
     * @param month 월 (1~12)
     * @return periodStart, periodEnd (기산일 기준)
     */
    @GetMapping("/calculation-period")
    public ResponseEntity<?> getCalculationPeriod(
            @RequestParam int year,
            @RequestParam int month,
            HttpSession session) {
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session, "SALARY_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new ForbiddenException("급여 관리 권한이 없습니다.");
        }
        if (month < 1 || month > 12) {
            throw new ValidationException("월은 1~12 사이여야 합니다.");
        }
        LocalDate[] period = salaryScheduleService.getCalculationPeriod(year, month);
        Map<String, Object> data = Map.of(
            "periodStart", period[0].toString(),
            "periodEnd", period[1].toString(),
            "year", year,
            "month", month
        );
        return success("계산 기간을 조회했습니다.", data);
    }

    /**
     * 급여 계산별 세금 상세 조회
     */
    @GetMapping("/tax/{calculationId}")
    public ResponseEntity<?> getTaxDetails(@PathVariable Long calculationId, HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다. 세션을 확인해 주세요.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        if (!isAdminOrStaffRoleFromCommonCode(currentUser.getRole())) {
            throw new ForbiddenException("급여/세금 관리 권한이 없습니다.");
        }
        log.info("세금 상세 조회: 사용자 {}, 계산 ID {}", currentUser.getName(), calculationId);
        Map<String, Object> taxDetails = salaryManagementService.getTaxDetails(calculationId);
        return success("세금 상세 내역을 조회했습니다.", taxDetails);
    }
    
    /**
     * 추가 세금 계산 (POST /api/v1/admin/salary/tax/calculate). SalaryTaxCalculation 생성·저장 및 deductions 반영.
     */
    @PostMapping("/tax/calculate")
    public ResponseEntity<?> calculateTax(
            @RequestBody @Valid TaxCalculateRequest request,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        if (!isAdminOrStaffRoleFromCommonCode(currentUser.getRole())) {
            throw new ForbiddenException("급여/세금 관리 권한이 없습니다.");
        }
        SalaryTaxCalculation created = salaryManagementService.calculateAdditionalTax(request);
        Map<String, Object> data = Map.of(
            "id", created.getId(),
            "calculationId", created.getCalculationId(),
            "taxType", created.getTaxType(),
            "taxAmount", created.getTaxAmount(),
            "taxRate", created.getTaxRate()
        );
        return created("추가 세금이 계산·반영되었습니다.", data);
    }
    
    /**
     * 세금 통계 조회
     */
    @GetMapping("/tax/statistics")
    public ResponseEntity<?> getTaxStatistics(
            @RequestParam String period,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다. 세션을 확인해 주세요.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        if (!isAdminOrStaffRoleFromCommonCode(currentUser.getRole())) {
            throw new ForbiddenException("급여/세금 관리 권한이 없습니다.");
        }
        log.info("세금 통계 조회: 사용자 {}, 기간 {}", currentUser.getName(), period);
        Map<String, Object> statistics = salaryManagementService.getTaxStatistics(period);
        return success("세금 통계를 조회했습니다.", statistics);
    }
    
    /**
     * 급여 계산 미리보기 (저장하지 않음)
     */
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateSalaryPreview(
            @RequestParam Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        Map<String, Object> result = plSqlSalaryManagementService.calculateSalaryPreview(
            consultantId, periodStart, periodEnd
        );
        if (!Boolean.TRUE.equals(result.get("success"))) {
            throw new ValidationException((String) result.getOrDefault("message", "급여 계산 미리보기에 실패했습니다."));
        }
        return success("급여 계산 미리보기가 완료되었습니다.", result);
    }

    /**
     * 급여 계산 확정 (실제 저장)
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmSalaryCalculation(
            @RequestParam Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session, "SALARY_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new ForbiddenException("급여 관리 권한이 없습니다.");
        }
        Map<String, Object> result = plSqlSalaryManagementService.processIntegratedSalaryCalculation(
            consultantId, periodStart, periodEnd, currentUser.getName()
        );
        if (!Boolean.TRUE.equals(result.get("success"))) {
            throw new ValidationException((String) result.getOrDefault("message", "급여 계산 확정에 실패했습니다."));
        }
        return success("급여 계산이 확정되었습니다.", result);
    }

    /**
     * 급여 승인 (PL/SQL 통합)
     */
    @PostMapping("/approve/{calculationId}")
    public ResponseEntity<?> approveSalary(
            @PathVariable Long calculationId,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        Map<String, Object> result = plSqlSalaryManagementService.approveSalaryWithErpSync(
            calculationId, currentUser.getName()
        );
        if (!Boolean.TRUE.equals(result.get("success"))) {
            throw new ValidationException(String.valueOf(result.getOrDefault("message", "급여 승인에 실패했습니다.")));
        }
        return success("급여 승인이 완료되었습니다.", result);
    }
    
    /**
     * 급여 지급 완료 (PL/SQL 통합)
     */
    @PostMapping("/pay/{calculationId}")
    public ResponseEntity<?> processSalaryPayment(
            @PathVariable Long calculationId,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        Map<String, Object> result = plSqlSalaryManagementService.processSalaryPaymentWithErpSync(
            calculationId, currentUser.getName()
        );
        if (!Boolean.TRUE.equals(result.get("success"))) {
            throw new ValidationException(String.valueOf(result.getOrDefault("message", "급여 지급에 실패했습니다.")));
        }
        return success("급여 지급이 완료되었습니다.", result);
    }
    
    /**
     * 급여 통계 조회 (PL/SQL 통합)
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getSalaryStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        String branchCode = currentUser.getBranchCode();
        Map<String, Object> statistics = plSqlSalaryManagementService.getIntegratedSalaryStatistics(
            branchCode, startDate, endDate
        );
        return success("급여 통계를 조회했습니다.", statistics);
    }
    
    /**
     * 급여 계산 목록 조회
     */
    @GetMapping("/calculations")
    public ResponseEntity<?> getSalaryCalculations(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        List<SalaryCalculation> calculations = salaryManagementService.getSalaryCalculations(startDate, endDate);
        return success("급여 계산 목록을 조회했습니다.", calculations);
    }
    
    /**
     * 급여 옵션 유형 조회 (공통코드 SALARY_OPTION_TYPE)
     */
    @GetMapping("/option-types")
    public ResponseEntity<?> getOptionTypes(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        List<Map<String, Object>> optionTypes = toValueLabelList(
            commonCodeService.getActiveCodesByGroup("SALARY_OPTION_TYPE"));
        return success("급여 옵션 유형을 조회했습니다.", optionTypes);
    }

    /**
     * 상담사 등급 조회 (공통코드 CONSULTANT_GRADE)
     */
    @GetMapping("/grades")
    public ResponseEntity<?> getGrades(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        List<Map<String, Object>> grades = toValueLabelList(
            commonCodeService.getActiveCodesByGroup("CONSULTANT_GRADE"));
        return success("상담사 등급을 조회했습니다.", grades);
    }

    /**
     * 급여 유형 코드 조회 (공통코드 SALARY_TYPE)
     */
    @GetMapping("/codes")
    public ResponseEntity<?> getSalaryCodes(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        List<Map<String, Object>> salaryTypes = toValueLabelList(
            commonCodeService.getActiveCodesByGroup("SALARY_TYPE"));
        return success("급여 유형 코드를 조회했습니다.", salaryTypes);
    }

    /**
     * 급여 설정 조회 (공통코드 SALARY_CONFIG)
     */
    @GetMapping("/configs")
    public ResponseEntity<?> getSalaryConfigs(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        List<Map<String, Object>> codeMaps = commonCodeService.getActiveCodesByGroup("SALARY_CONFIG");
        Map<String, Object> configs = new HashMap<>();
        for (Map<String, Object> m : codeMaps) {
            String codeValue = (String) m.get("codeValue");
            Object codeDesc = m.get("codeDescription");
            Object codeLabel = m.get("codeLabel");
            if (codeValue != null) {
                configs.put(codeValue, codeDesc != null ? codeDesc : codeLabel);
            }
        }
        return success("급여 설정을 조회했습니다.", configs);
    }

    private List<Map<String, Object>> toValueLabelList(List<Map<String, Object>> codeMaps) {
        return codeMaps.stream()
            .map(m -> Map.<String, Object>of(
                "value", m.getOrDefault("codeValue", ""),
                "label", m.getOrDefault("codeLabel", "")
            ))
            .collect(Collectors.toList());
    }
    
    /**
     * 급여 기산일 옵션 조회 (공통코드 그룹 없으면 고정 옵션 반환)
     */
    @GetMapping("/config-options")
    public ResponseEntity<?> getSalaryConfigOptions(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        Map<String, Object> options = Map.of(
            "monthlyBaseDays", List.of(
                Map.of("value", "LAST_DAY", "label", "매월 말일"),
                Map.of("value", "25", "label", "25일"),
                Map.of("value", "30", "label", "30일"),
                Map.of("value", "31", "label", "31일")
            ),
            "paymentDays", List.of(
                Map.of("value", "1", "label", "익월 1일"),
                Map.of("value", "5", "label", "익월 5일"),
                Map.of("value", "10", "label", "익월 10일"),
                Map.of("value", "15", "label", "익월 15일"),
                Map.of("value", "20", "label", "익월 20일"),
                Map.of("value", "25", "label", "익월 25일"),
                Map.of("value", "30", "label", "익월 30일")
            ),
            "cutoffDays", List.of(
                Map.of("value", "LAST_DAY", "label", "매월 말일"),
                Map.of("value", "25", "label", "25일"),
                Map.of("value", "30", "label", "30일"),
                Map.of("value", "31", "label", "31일")
            ),
            "batchCycles", List.of(
                Map.of("value", "MONTHLY", "label", "월별 배치"),
                Map.of("value", "SEMI_MONTHLY", "label", "반월별 배치"),
                Map.of("value", "WEEKLY", "label", "주별 배치")
            ),
            "calculationMethods", List.of(
                Map.of("value", "CONSULTATION_COUNT", "label", "상담건수 기준"),
                Map.of("value", "HOURLY_RATE", "label", "시간당 기준"),
                Map.of("value", "FIXED_SALARY", "label", "고정급여")
            )
        );
        return success("급여 설정 옵션을 조회했습니다.", options);
    }

    /**
     * 급여 설정 저장 (공통코드 SALARY_CONFIG)
     */
    @PostMapping("/config")
    public ResponseEntity<?> saveSalaryConfig(
            @RequestBody Map<String, Object> configRequest,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        String configType = (String) configRequest.get("configType");
        String configValue = (String) configRequest.get("configValue");
        String description = (String) configRequest.get("description");
        log.info("급여 설정 저장: Type={}, Value={}, Description={}", configType, configValue, description);
        try {
            CommonCode existingCode = commonCodeService.getCommonCodeByGroupAndValue("SALARY_CONFIG", configType);
            commonCodeService.updateCommonCode(existingCode.getId(),
                CommonCodeDto.builder()
                    .codeGroup("SALARY_CONFIG")
                    .codeValue(configType)
                    .codeLabel(description != null ? description : existingCode.getCodeLabel())
                    .codeDescription(configValue != null ? configValue : existingCode.getCodeDescription())
                    .isActive(true)
                    .sortOrder(existingCode.getSortOrder())
                    .build());
            log.info("급여 설정 업데이트 완료: {}", configType);
        } catch (Exception e) {
            log.debug("급여 설정 기존 코드 없음, 신규 생성: configType={}", configType, e);
            CommonCodeDto newCodeDto = CommonCodeDto.builder()
                .codeGroup("SALARY_CONFIG")
                .codeValue(configType)
                .codeLabel(description != null ? description : configType)
                .codeDescription(configValue != null ? configValue : "")
                .isActive(true)
                .sortOrder(0)
                .build();
            commonCodeService.createCommonCode(newCodeDto);
            log.info("급여 설정 생성 완료: {}", configType);
        }
        return success("급여 설정이 저장되었습니다.");
    }
    
    /**
     * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
     * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
     * 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음
     * @param role 사용자 역할
     * @return 관리자 역할 여부
     */
    private boolean isAdminRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
            if (roleCodes == null || roleCodes.isEmpty()) {
                // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)
                return role == UserRole.ADMIN || 
                       role.isAdmin();
            }
            // 공통코드에서 관리자 역할인지 확인
            String roleName = role.name();
            return roleCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(roleName) && 
                              (code.getExtraData() != null && 
                               (code.getExtraData().contains("\"isAdmin\":true") || 
                                code.getExtraData().contains("\"roleType\":\"ADMIN\""))));
        } catch (Exception e) {
            log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);
            // 폴백: 표준 관리자 역할만 체크
            return role == UserRole.ADMIN || 
                       role.isAdmin();
        }
    }

    /**
     * 공통코드에서 사무원 역할인지 확인 (STAFF)
     *
     * @param role 사용자 역할
     * @return 사무원 역할 여부
     */
    private boolean isStaffRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
            if (roleCodes == null || roleCodes.isEmpty()) {
                return role == UserRole.STAFF;
            }
            String roleName = role.name();
            return roleCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(roleName) && (code.getExtraData() != null
                    && (code.getExtraData().contains("\"isStaff\":true")
                        || code.getExtraData().contains("\"roleType\":\"STAFF\""))));
        } catch (Exception e) {
            log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);
            return role == UserRole.STAFF;
        }
    }

    /**
     * 공통코드에서 관리자 또는 스태프 역할인지 확인 (ERP 제외 동일 접근용)
     *
     * @param role 사용자 역할
     * @return ADMIN 또는 STAFF(공통코드 기준)이면 true
     */
    private boolean isAdminOrStaffRoleFromCommonCode(UserRole role) {
        return isAdminRoleFromCommonCode(role) || isStaffRoleFromCommonCode(role);
    }
}
