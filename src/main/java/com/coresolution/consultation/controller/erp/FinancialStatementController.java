package com.coresolution.consultation.controller.erp;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 재무제표 Controller 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md API 설계 표준:
 * docs/standards/API_DESIGN_STANDARD.md
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/erp/accounting/statements")
@RequiredArgsConstructor
public class FinancialStatementController extends BaseApiController {

    private final FinancialStatementService financialStatementService;
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
            log.debug("관리자 역할로 ERP 접근 허용, 사용자={}, 역할={}", currentUser.getEmail(),
                    currentUser.getRole());
            return null; // 권한 있음
        }

        // 동적 권한 체크 (ERP_ACCESS 권한 필요)
        if (!dynamicPermissionService.hasPermission(currentUser, "ERP_ACCESS")) {
            log.warn("❌ ERP 접근 권한 없음: 사용자={}, 역할={}", currentUser.getEmail(),
                    currentUser.getRole());
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message", "ERP 접근 권한이 없습니다. 관리자만 접근 가능합니다."));
        }

        return null; // 권한 있음
    }

    /**
     * 분기(1~4) → 해당 분기 startDate/endDate 계산. Q1: 1/1~3/31, Q2: 4/1~6/30, Q3: 7/1~9/30, Q4: 10/1~12/31.
     */
    private static LocalDate[] quarterToDateRange(int year, int quarter) {
        int startMonth = (quarter - 1) * 3 + 1;
        LocalDate startDate = LocalDate.of(year, startMonth, 1);
        LocalDate endDate = startDate.plusMonths(3).minusDays(1);
        return new LocalDate[] { startDate, endDate };
    }

    /**
     * 손익계산서 생성
     * - 기간 조회: GET .../income?startDate=2025-01-01&endDate=2025-12-31
     * - 분기 조회: GET .../income?year=2025&quarter=1 (periodType, year, quarter, startDate, endDate 응답 포함)
     */
    @GetMapping("/income")
    public ResponseEntity<?> getIncomeStatement(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        boolean useQuarter = (year != null && quarter != null && quarter >= 1 && quarter <= 4);
        if (useQuarter) {
            LocalDate[] range = quarterToDateRange(year.intValue(), quarter.intValue());
            startDate = range[0];
            endDate = range[1];
        }
        if (startDate == null || endDate == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message",
                    "startDate/endDate 또는 year(1~4)/quarter 를 지정해야 합니다."));
        }

        log.info("손익계산서 조회: tenantId={}, startDate={}, endDate={}, quarterly={}", tenantId, startDate, endDate, useQuarter);

        Map<String, Object> statement =
                financialStatementService.generateIncomeStatement(tenantId, startDate, endDate);
        if (useQuarter && year != null && quarter != null) {
            statement = new HashMap<>(statement);
            statement.put("periodType", "QUARTERLY");
            statement.put("year", year);
            statement.put("quarter", quarter);
            statement.put("startDate", startDate);
            statement.put("endDate", endDate);
        }
        return success(statement);
    }

    /**
     * 재무상태표 생성
     * - 기준일 조회: GET .../balance?asOfDate=2025-12-31
     * - 분기 말일 조회: GET .../balance?year=2025&quarter=1&asOfEndOfQuarter=true (periodType, year, quarter, startDate, endDate 응답 포함)
     */
    @GetMapping("/balance")
    public ResponseEntity<?> getBalanceSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Boolean asOfEndOfQuarter,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        boolean useQuarter = Boolean.TRUE.equals(asOfEndOfQuarter) && year != null && quarter != null && quarter >= 1 && quarter <= 4;
        if (useQuarter && year != null && quarter != null) {
            LocalDate[] range = quarterToDateRange(year.intValue(), quarter.intValue());
            asOfDate = range[1]; // 분기 말일
        }
        if (asOfDate == null) {
            asOfDate = LocalDate.now();
        }

        log.info("재무상태표 조회: tenantId={}, asOfDate={}, quarterly={}", tenantId, asOfDate, useQuarter);

        Map<String, Object> statement =
                financialStatementService.generateBalanceSheet(tenantId, asOfDate);
        if (useQuarter && year != null && quarter != null) {
            LocalDate[] range = quarterToDateRange(year.intValue(), quarter.intValue());
            statement = new HashMap<>(statement);
            statement.put("periodType", "QUARTERLY");
            statement.put("year", year);
            statement.put("quarter", quarter);
            statement.put("startDate", range[0]);
            statement.put("endDate", range[1]);
        }
        return success(statement);
    }

    /**
     * 현금흐름표 생성
     * - 기간 조회: GET .../cash-flow?startDate=2025-01-01&endDate=2025-12-31
     * - 분기 조회: GET .../cash-flow?year=2025&quarter=1 (periodType, year, quarter, startDate, endDate 응답 포함)
     */
    @GetMapping("/cash-flow")
    public ResponseEntity<?> getCashFlowStatement(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        boolean useQuarter = (year != null && quarter != null && quarter >= 1 && quarter <= 4);
        if (useQuarter && year != null && quarter != null) {
            LocalDate[] range = quarterToDateRange(year.intValue(), quarter.intValue());
            startDate = range[0];
            endDate = range[1];
        }
        if (startDate == null || endDate == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message",
                    "startDate/endDate 또는 year(1~4)/quarter 를 지정해야 합니다."));
        }

        log.info("현금흐름표 조회: tenantId={}, startDate={}, endDate={}, quarterly={}", tenantId, startDate, endDate, useQuarter);

        Map<String, Object> statement =
                financialStatementService.generateCashFlowStatement(tenantId, startDate, endDate);
        if (useQuarter && year != null && quarter != null) {
            statement = new HashMap<>(statement);
            statement.put("periodType", "QUARTERLY");
            statement.put("year", year);
            statement.put("quarter", quarter);
            statement.put("startDate", startDate);
            statement.put("endDate", endDate);
        }
        return success(statement);
    }
}

