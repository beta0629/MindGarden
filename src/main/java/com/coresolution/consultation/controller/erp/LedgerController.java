package com.coresolution.consultation.controller.erp;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.entity.Ledger;
import com.coresolution.consultation.service.LedgerService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
    
    /**
     * 계정별 원장 조회
     * GET /api/v1/erp/accounting/ledgers/account/{accountId}
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/account/{accountId}")
    public ResponseEntity<ApiResponse<List<Ledger>>> getLedgersByAccount(@PathVariable Long accountId) {
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
    public ResponseEntity<ApiResponse<List<Ledger>>> getLedgersByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
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
    public ResponseEntity<ApiResponse<BigDecimal>> getAccountBalance(
            @PathVariable Long accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
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

