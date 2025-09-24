package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.SalaryManagementService;
import com.mindgarden.consultation.service.PlSqlSalaryManagementService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
     * 급여 프로필 목록 조회
     */
    @GetMapping("/profiles")
    public ResponseEntity<Map<String, Object>> getSalaryProfiles(HttpSession session) {
        try {
            User currentUser = (User) session.getAttribute("currentUser");
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
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
            User currentUser = (User) session.getAttribute("currentUser");
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
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
     * 급여 계산 (PL/SQL 통합)
     */
    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateSalary(
            @RequestParam Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            HttpSession session) {
        try {
            User currentUser = (User) session.getAttribute("currentUser");
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // PL/SQL 통합 급여 계산 호출
            Map<String, Object> result = plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                consultantId, periodStart, periodEnd, currentUser.getName()
            );
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result,
                    "message", "급여 계산이 완료되었습니다."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", result.get("message")
                ));
            }
            
        } catch (Exception e) {
            log.error("급여 계산 오류", e);
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
            User currentUser = (User) session.getAttribute("currentUser");
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
            User currentUser = (User) session.getAttribute("currentUser");
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
            User currentUser = (User) session.getAttribute("currentUser");
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
            User currentUser = (User) session.getAttribute("currentUser");
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
}
