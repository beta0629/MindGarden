package com.coresolution.consultation.controller.erp;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    
    /**
     * 손익계산서 생성
     * GET /api/v1/erp/accounting/statements/income?startDate=2025-01-01&endDate=2025-12-31
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/income")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIncomeStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBalanceSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCashFlowStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("현금흐름표 조회: tenantId={}, startDate={}, endDate={}", tenantId, startDate, endDate);
        
        Map<String, Object> statement = financialStatementService.generateCashFlowStatement(tenantId, startDate, endDate);
        return success(statement);
    }
}

