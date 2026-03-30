package com.coresolution.consultation.controller.erp;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.entity.erp.accounting.Ledger;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 원장 Controller
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * API 설계 표준: docs/standards/API_DESIGN_STANDARD.md
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/erp/accounting/ledgers")
@RequiredArgsConstructor
public class LedgerController extends BaseApiController {
    
    private final LedgerService ledgerService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * ERP 접근 권한 체크 (동적 권한 시스템)
     */
    private ResponseEntity<?> checkErpAccess(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }

        // 관리자 역할이면 항상 허용 (모든 환경)
        if (currentUser.getRole() != null && currentUser.getRole().isAdmin()) {
            log.debug("관리자 역할로 ERP 접근 허용, 사용자={}, 역할={}", 
                    currentUser.getEmail(), currentUser.getRole());
            return null; // 권한 있음
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
     * 계정별 원장 조회
     * GET /api/v1/erp/accounting/ledgers/account/{accountId}
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/account/{accountId}")
    public ResponseEntity<?> getLedgersByAccount(@PathVariable Long accountId, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("계정별 원장 조회: tenantId={}, accountId={}", tenantId, accountId);
        
        List<Ledger> ledgers = ledgerService.getLedgersByAccount(tenantId, accountId);
        return success(ledgers);
    }
    
    /**
     * 기간별 원장 조회
     * GET /api/v1/erp/accounting/ledgers/period?startDate=2025-01-01&endDate=2025-12-31
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/period")
    public ResponseEntity<?> getLedgersByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("기간별 원장 조회: tenantId={}, startDate={}, endDate={}", tenantId, startDate, endDate);
        
        List<Ledger> ledgers = ledgerService.getLedgersByPeriod(tenantId, startDate, endDate);
        return success(ledgers);
    }
    
    /**
     * 계정 잔액 조회
     * GET /api/v1/erp/accounting/ledgers/balance/{accountId}?asOfDate=2025-12-31
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/balance/{accountId}")
    public ResponseEntity<?> getAccountBalance(
            @PathVariable Long accountId,
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
        
        log.info("계정 잔액 조회: tenantId={}, accountId={}, asOfDate={}", tenantId, accountId, asOfDate);
        
        BigDecimal balance = ledgerService.getAccountBalance(tenantId, accountId, asOfDate);
        return success(balance);
    }
}

