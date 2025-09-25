package com.mindgarden.consultation.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.PlSqlSalaryManagementService;
import com.mindgarden.consultation.service.SalaryManagementService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
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
@RequestMapping("/api/admin/salary")
@RequiredArgsConstructor
public class SalaryManagementController {
    
    private final SalaryManagementService salaryManagementService;
    private final PlSqlSalaryManagementService plSqlSalaryManagementService;
    
    /**
     * 개별 급여 프로필 조회
     */
    @GetMapping("/profiles/{consultantId}")
    public ResponseEntity<Map<String, Object>> getSalaryProfile(@PathVariable Long consultantId, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("개별 급여 프로필 조회: 상담사 ID {}", consultantId);
            String branchCode = currentUser.getBranchCode();
            List<ConsultantSalaryProfile> profiles = salaryManagementService.getAllSalaryProfiles(branchCode);
            
            // 해당 상담사의 프로필 찾기
            ConsultantSalaryProfile consultantProfile = profiles.stream()
                .filter(profile -> profile.getConsultantId().equals(consultantId))
                .findFirst()
                .orElse(null);
            
            if (consultantProfile != null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", consultantProfile,
                    "message", "급여 프로필을 조회했습니다."
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", null,
                    "message", "해당 상담사의 급여 프로필이 없습니다."
                ));
            }
            
        } catch (Exception e) {
            log.error("개별 급여 프로필 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 프로필 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 프로필 목록 조회
     */
    @GetMapping("/profiles")
    public ResponseEntity<Map<String, Object>> getSalaryProfiles(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("급여 프로필 조회: 세션에 currentUser가 없음, 세션 ID: {}", session.getId());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다. 세션을 확인해주세요."
                ));
            }
            
            log.info("급여 프로필 조회: 사용자 {}, 지점 {}", currentUser.getName(), currentUser.getBranchCode());
            String branchCode = currentUser.getBranchCode();
            List<ConsultantSalaryProfile> profiles = salaryManagementService.getAllSalaryProfiles(branchCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", profiles,
                "message", "급여 프로필 목록을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 프로필 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 프로필 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 상담사 목록 조회 (급여용)
     */
    @GetMapping("/consultants")
    public ResponseEntity<Map<String, Object>> getConsultants(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("상담사 목록 조회: 세션에 currentUser가 없음, 세션 ID: {}", session.getId());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다. 세션을 확인해주세요."
                ));
            }
            
            log.info("상담사 목록 조회: 사용자 {}, 지점 {}", currentUser.getName(), currentUser.getBranchCode());
            String branchCode = currentUser.getBranchCode();
            List<User> consultants = salaryManagementService.getConsultantsForSalary(branchCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consultants,
                "message", "상담사 목록을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("상담사 목록 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담사 목록 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 상담사별 급여 계산 내역 조회
     */
    @GetMapping("/calculations/{consultantId}")
    public ResponseEntity<Map<String, Object>> getSalaryCalculations(@PathVariable Long consultantId, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("급여 계산 조회: 세션에 currentUser가 없음, 세션 ID: {}", session.getId());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다. 세션을 확인해주세요."
                ));
            }
            
            log.info("급여 계산 조회: 사용자 {}, 상담사 ID {}", currentUser.getName(), consultantId);
            String branchCode = currentUser.getBranchCode();
            List<SalaryCalculation> calculations = salaryManagementService.getSalaryCalculations(consultantId, branchCode);
            
            // 엔티티를 DTO로 변환하여 JSON 직렬화 문제 해결
            List<Map<String, Object>> calculationDtos = calculations.stream()
                .map(calc -> {
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
                    // 프론트엔드 호환성을 위한 consultationCount 필드 추가
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
                    
                    // 프론트엔드 호환성을 위한 추가 필드
                    BigDecimal optionSalary = BigDecimal.ZERO;
                    if (calc.getCommissionEarnings() != null && calc.getCommissionEarnings().compareTo(BigDecimal.ZERO) > 0) {
                        optionSalary = calc.getCommissionEarnings(); // FREELANCE: 상담 수당
                    } else if (calc.getHourlyEarnings() != null && calc.getHourlyEarnings().compareTo(BigDecimal.ZERO) > 0) {
                        optionSalary = calc.getHourlyEarnings(); // REGULAR: 시간당 급여
                    }
                    dto.put("optionSalary", optionSalary);
                    
                    // 세금 계산
                    BigDecimal taxAmount = calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO;
                    dto.put("taxAmount", taxAmount);
                    
                    // 연관 엔티티는 ID만 포함
                    if (calc.getConsultant() != null) {
                        dto.put("consultantId", calc.getConsultant().getId());
                        dto.put("consultantName", calc.getConsultant().getName());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", calculationDtos,
                "message", "급여 계산 내역을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 계산 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 계산 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산별 세금 상세 조회
     */
    @GetMapping("/tax/{calculationId}")
    public ResponseEntity<Map<String, Object>> getTaxDetails(@PathVariable Long calculationId, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("세금 상세 조회: 세션에 currentUser가 없음, 세션 ID: {}", session.getId());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다. 세션을 확인해주세요."
                ));
            }
            
            log.info("세금 상세 조회: 사용자 {}, 계산 ID {}", currentUser.getName(), calculationId);
            String branchCode = currentUser.getBranchCode();
            Map<String, Object> taxDetails = salaryManagementService.getTaxDetails(calculationId, branchCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", taxDetails,
                "message", "세금 상세 내역을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("세금 상세 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "세금 상세 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 세금 통계 조회
     */
    @GetMapping("/tax/statistics")
    public ResponseEntity<Map<String, Object>> getTaxStatistics(
            @RequestParam String period, 
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("세금 통계 조회: 세션에 currentUser가 없음, 세션 ID: {}", session.getId());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다. 세션을 확인해주세요."
                ));
            }
            
            log.info("세금 통계 조회: 사용자 {}, 기간 {}", currentUser.getName(), period);
            String branchCode = currentUser.getBranchCode();
            Map<String, Object> statistics = salaryManagementService.getTaxStatistics(period, branchCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics,
                "message", "세금 통계를 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("세금 통계 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "세금 통계 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산 미리보기 (저장하지 않음)
     */
    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateSalaryPreview(
            @RequestParam Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // PL/SQL 급여 미리보기 계산 호출 (저장 안 함)
            Map<String, Object> result = plSqlSalaryManagementService.calculateSalaryPreview(
                consultantId, periodStart, periodEnd
            );
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result,
                    "message", "급여 계산 미리보기가 완료되었습니다.",
                    "note", "실제 급여는 매월 기산일에 배치로 처리됩니다."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", (String) result.get("message")
                ));
            }
            
        } catch (Exception e) {
            log.error("급여 계산 미리보기 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 계산 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 승인 (PL/SQL 통합)
     */
    @PostMapping("/approve/{calculationId}")
    public ResponseEntity<Map<String, Object>> approveSalary(
            @PathVariable Long calculationId,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // PL/SQL 통합 급여 승인 호출
            Map<String, Object> result = plSqlSalaryManagementService.approveSalaryWithErpSync(
                calculationId, currentUser.getName()
            );
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result,
                    "message", "급여 승인이 완료되었습니다."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", result.get("message")
                ));
            }
            
        } catch (Exception e) {
            log.error("급여 승인 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 승인 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 지급 완료 (PL/SQL 통합)
     */
    @PostMapping("/pay/{calculationId}")
    public ResponseEntity<Map<String, Object>> processSalaryPayment(
            @PathVariable Long calculationId,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // PL/SQL 통합 급여 지급 호출
            Map<String, Object> result = plSqlSalaryManagementService.processSalaryPaymentWithErpSync(
                calculationId, currentUser.getName()
            );
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result,
                    "message", "급여 지급이 완료되었습니다."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", result.get("message")
                ));
            }
            
        } catch (Exception e) {
            log.error("급여 지급 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 지급 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 통계 조회 (PL/SQL 통합)
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getSalaryStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            String branchCode = currentUser.getBranchCode();
            
            // PL/SQL 통합 급여 통계 조회
            Map<String, Object> statistics = plSqlSalaryManagementService.getIntegratedSalaryStatistics(
                branchCode, startDate, endDate
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics,
                "message", "급여 통계를 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 통계 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 통계 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산 목록 조회
     */
    @GetMapping("/calculations")
    public ResponseEntity<Map<String, Object>> getSalaryCalculations(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            String branchCode = currentUser.getBranchCode();
            List<SalaryCalculation> calculations = salaryManagementService.getSalaryCalculations(
                branchCode, startDate, endDate
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", calculations,
                "message", "급여 계산 목록을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 계산 목록 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 계산 목록 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 옵션 유형 조회
     */
    @GetMapping("/option-types")
    public ResponseEntity<Map<String, Object>> getOptionTypes(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 기본 옵션 유형 반환
            List<Map<String, Object>> optionTypes = List.of(
                Map.of("value", "CONSULTATION", "label", "상담 수당"),
                Map.of("value", "BONUS", "label", "보너스"),
                Map.of("value", "OVERTIME", "label", "초과 근무"),
                Map.of("value", "HOLIDAY", "label", "휴일 근무")
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", optionTypes,
                "message", "급여 옵션 유형을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 옵션 유형 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 옵션 유형 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 상담사 등급 조회
     */
    @GetMapping("/grades")
    public ResponseEntity<Map<String, Object>> getGrades(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 기본 등급 반환
            List<Map<String, Object>> grades = List.of(
                Map.of("value", "S", "label", "S급"),
                Map.of("value", "A", "label", "A급"),
                Map.of("value", "B", "label", "B급"),
                Map.of("value", "C", "label", "C급"),
                Map.of("value", "D", "label", "D급")
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", grades,
                "message", "상담사 등급을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("상담사 등급 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담사 등급 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 유형 코드 조회
     */
    @GetMapping("/codes")
    public ResponseEntity<Map<String, Object>> getSalaryCodes(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 기본 급여 유형 반환
            List<Map<String, Object>> salaryTypes = List.of(
                Map.of("value", "FREELANCE", "label", "프리랜서"),
                Map.of("value", "REGULAR", "label", "정규직"),
                Map.of("value", "PART_TIME", "label", "파트타임")
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", salaryTypes,
                "message", "급여 유형 코드를 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 유형 코드 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 유형 코드 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}
