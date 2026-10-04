package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.util.ServerErrorResponses;
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
    private final ResourceOwnerAccessGuard resourceOwnerAccessGuard;

    /** 대상 월 형식 오류 문구 (입력값·내부 예외 비노출) */
    static final String INVALID_TARGET_MONTH = "대상 월(YYYY-MM)을 확인해 주세요.";
    
    /**
     * 급여 배치 실행.
     *
     * <p>권한(같은 테넌트 관리자 + {@code SALARY_MANAGE})을 본문 검증보다 먼저 본다. 비관리자는 본문이 비었거나
     * 형식이 틀려도 400 이 아니라 403 을 받고 서비스는 호출되지 않는다.</p>
     */
    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeBatch(
            @RequestBody(required = false) Map<String, Object> request,
            HttpSession session) {
        resourceOwnerAccessGuard.requireTenantAdminAccess(session);
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session, "SALARY_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) permissionResponse;
            return denied;
        }
        YearMonth target = parseTargetMonth(request);
        if (target == null) {
            Map<String, Object> invalid = new HashMap<>();
            invalid.put("success", false);
            invalid.put("message", INVALID_TARGET_MONTH);
            return ResponseEntity.badRequest().body(invalid);
        }
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            String branchCode = currentUser.getBranchCode();
            
            log.info("🚀 급여 배치 수동 실행: userId={}, 대상월={}, 지점={}", 
                currentUser.getId(), target, branchCode);
            
            // 배치 실행
            SalaryBatchService.BatchResult result = salaryBatchService.executeMonthlySalaryBatch(
                target.getYear(), target.getMonthValue(), branchCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            response.put("processedCount", result.getProcessedCount());
            response.put("successCount", result.getSuccessCount());
            response.put("errorCount", result.getErrorCount());
            response.put("executedAt", result.getExecutedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ServerErrorResponses.internalError("급여 배치 실행 오류", e);
        }
    }

    /** 본문 {@code targetMonth}("YYYY-MM")를 읽는다. 없거나 형식이 틀리면 null. */
    private static YearMonth parseTargetMonth(Map<String, Object> request) {
        Object raw = request != null ? request.get("targetMonth") : null;
        if (!(raw instanceof String text)) {
            return null;
        }
        try {
            return YearMonth.parse(text.trim());
        } catch (DateTimeParseException e) {
            return null;
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
            
            // 관리자 권한 확인 (표준화 2025-12-05: 표준 관리자 역할만 체크)
            UserRole userRole = currentUser.getRole();
            if (!userRole.isAdmin()) {
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
            return ServerErrorResponses.internalError("현재 달 급여 배치 실행 오류", e);
        }
    }
    
    /**
     * 급여 배치 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getBatchStatus(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            HttpSession session) {
        resourceOwnerAccessGuard.requireTenantAdminAccess(session);
        try {
            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(
                targetDate.getYear(), targetDate.getMonthValue());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("status", status.getStatus());
            data.put("lastExecuted", status.getLastExecuted());
            data.put("totalConsultants", status.getTotalConsultants());
            data.put("processedConsultants", status.getProcessedConsultants());
            data.put("message", status.getMessage());
            response.put("data", data);
            response.put("message", "급여 배치 상태를 조회했습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ServerErrorResponses.internalError("급여 배치 상태 조회 오류", e);
        }
    }
    
    /**
     * 급여 배치 실행 가능 여부 확인
     */
    @GetMapping("/can-execute")
    public ResponseEntity<Map<String, Object>> canExecuteBatch(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            HttpSession session) {
        resourceOwnerAccessGuard.requireTenantAdminAccess(session);
        try {
            boolean canExecute = salaryBatchService.canExecuteBatch(targetDate);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("canExecute", canExecute),
                "message", canExecute ? "배치 실행 가능" : "배치 실행 불가능"
            ));
            
        } catch (Exception e) {
            return ServerErrorResponses.internalError("급여 배치 실행 가능 여부 확인 오류", e);
        }
    }
}
