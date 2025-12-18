package com.coresolution.consultation.controller.erp;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDate;
import java.util.Map;

/**
 * 재무제표 Controller
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * API 설계 표준: docs/standards/API_DESIGN_STANDARD.md
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/erp/accounting/statements")
@RequiredArgsConstructor
public class FinancialStatementController extends BaseApiController {
    
    private final FinancialStatementService financialStatementService;
    private final DynamicPermissionService dynamicPermissionService;
    private final Environment environment;
    
    /**
     * ERP 접근 권한 체크 (동적 권한 시스템)
     */
    private ResponseEntity<?> checkErpAccess(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }

        // 로컬/개발 환경에서는 관리자 역할이면 허용
        if (environment != null && (environment.acceptsProfiles(org.springframework.core.env.Profiles.of("local"))
                || environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev")))) {
            if (currentUser.getRole() != null && (currentUser.getRole().isAdmin()
                    || currentUser.getRole() == UserRole.ADMIN
                    || currentUser.getRole() == UserRole.TENANT_ADMIN
                    || currentUser.getRole() == UserRole.PRINCIPAL
                    || currentUser.getRole() == UserRole.OWNER)) {
                log.debug("로컬/개발 모드: 관리자 역할로 ERP 접근 허용, 사용자={}, 역할={}", 
                        currentUser.getEmail(), currentUser.getRole());
                return null; // 권한 있음
            }
        }

        // 동적 권한 체크 (ERP_ACCESS 권한 필요)
        if (!dynamicPermissionService.hasPermission(currentUser, "ERP_ACCESS")) {
            log.warn("❌ ERP 접근 권한 없음: 사용자={}, 역할={}", currentUser.getEmail(), currentUser.getRole());
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message", "ERP 접근 권한이 없습니다. 관리자만 접근 가능합니다."));
        }

        return null; // 권한 있음
    }
    
    /**
     * 손익계산서 생성
     * GET /api/v1/erp/accounting/statements/income?startDate=2025-01-01&endDate=2025-12-31
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/income")
    public ResponseEntity<?> getIncomeStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("손익계산서 조회: tenantId={}, startDate={}, endDate={}", tenantId, startDate, endDate);
        
        Map<String, Object> statement = financialStatementService.generateIncomeStatement(tenantId, startDate, endDate);
        return success(statement);
    }
    
    /**
     * 재무상태표 생성
     * GET /api/v1/erp/accounting/statements/balance?asOfDate=2025-12-31
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/balance")
    public ResponseEntity<?> getBalanceSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        // asOfDate가 없으면 오늘 날짜 사용
        if (asOfDate == null) {
            asOfDate = LocalDate.now();
        }
        
        log.info("재무상태표 조회: tenantId={}, asOfDate={}", tenantId, asOfDate);
        
        Map<String, Object> statement = financialStatementService.generateBalanceSheet(tenantId, asOfDate);
        return success(statement);
    }
    
    /**
     * 현금흐름표 생성
     * GET /api/v1/erp/accounting/statements/cash-flow?startDate=2025-01-01&endDate=2025-12-31
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/cash-flow")
    public ResponseEntity<?> getCashFlowStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("현금흐름표 조회: tenantId={}, startDate={}, endDate={}", tenantId, startDate, endDate);
        
        Map<String, Object> statement = financialStatementService.generateCashFlowStatement(tenantId, startDate, endDate);
        return success(statement);
    }
}

