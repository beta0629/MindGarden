package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 배치 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/salary-batch") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class SalaryBatchController {
    
    private final SalaryBatchService salaryBatchService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 급여 배치 실행
     */
    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeBatch(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            // 동적 권한 체크
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session, "SALARY_MANAGE", dynamicPermissionService);
            if (permissionResponse != null) {
                return (ResponseEntity<Map<String, Object>>) permissionResponse;
            }
            
            User currentUser = SessionUtils.getCurrentUser(session);
            
            String targetMonth = (String) request.get("targetMonth"); // "YYYY-MM"
            String branchCode = currentUser.getBranchCode();
            
            // 대상 월 파싱
            String[] parts = targetMonth.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            
            log.info("🚀 급여 배치 수동 실행: 사용자={}, 대상월={}, 지점={}", 
                currentUser.getName(), targetMonth, branchCode);
            
            // 배치 실행
            SalaryBatchService.BatchResult result = salaryBatchService.executeMonthlySalaryBatch(
                year, month, branchCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            response.put("processedCount", result.getProcessedCount());
            response.put("successCount", result.getSuccessCount());
            response.put("errorCount", result.getErrorCount());
            response.put("executedAt", result.getExecutedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("급여 배치 실행 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 배치 실행 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 현재 달 급여 배치 실행
     */
    @PostMapping("/execute-current")
    public ResponseEntity<Map<String, Object>> executeCurrentMonthBatch(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인 (표준화 2025-12-05: enum 활용)
            UserRole userRole = currentUser.getRole();
            if (userRole != UserRole.HQ_MASTER && userRole != UserRole.BRANCH_SUPER_ADMIN) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "급여 배치 실행 권한이 없습니다."
                ));
            }
            
            log.info("🚀 현재 달 급여 배치 실행: 사용자={}", currentUser.getName());
            
            // 현재 달 배치 실행
            SalaryBatchService.BatchResult result = salaryBatchService.executeCurrentMonthBatch();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            response.put("processedCount", result.getProcessedCount());
            response.put("successCount", result.getSuccessCount());
            response.put("errorCount", result.getErrorCount());
            response.put("executedAt", result.getExecutedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("현재 달 급여 배치 실행 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 배치 실행 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 배치 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getBatchStatus(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(
                targetDate.getYear(), targetDate.getMonthValue());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", Map.of(
                "status", status.getStatus(),
                "lastExecuted", status.getLastExecuted(),
                "totalConsultants", status.getTotalConsultants(),
                "processedConsultants", status.getProcessedConsultants(),
                "message", status.getMessage()
            ));
            response.put("message", "급여 배치 상태를 조회했습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("급여 배치 상태 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 배치 상태 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 배치 실행 가능 여부 확인
     */
    @GetMapping("/can-execute")
    public ResponseEntity<Map<String, Object>> canExecuteBatch(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            boolean canExecute = salaryBatchService.canExecuteBatch(targetDate);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("canExecute", canExecute),
                "message", canExecute ? "배치 실행 가능" : "배치 실행 불가능"
            ));
            
        } catch (Exception e) {
            log.error("급여 배치 실행 가능 여부 확인 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "배치 실행 가능 여부 확인 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}
