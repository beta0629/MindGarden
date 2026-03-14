package com.coresolution.consultation.controller.erp;

import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 분개 백필 API (관리자 전용)
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/erp/accounting")
@RequiredArgsConstructor
public class AccountingBackfillController extends BaseApiController {

    private final AccountingService accountingService;

    /**
     * INCOME 거래 백필: financial_transactions(INCOME, 미삭제) 중 분개가 없는 건에 대해 분개 생성.
     * 관리자 전용.
     */
    @PostMapping("backfill-journal-entries")
    public ResponseEntity<?> backfillJournalEntries(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isAdmin()) {
            return ResponseEntity.status(403).body(
                    Map.of("success", false, "message", "관리자만 실행할 수 있습니다."));
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("분개 백필 요청: tenantId={}, userId={}", tenantId, currentUser.getId());

        Map<String, Long> result = accountingService.backfillJournalEntriesFromIncomeTransactions(tenantId);
        return success(result);
    }

    /**
     * 테넌트 ERP 계정 매핑 초기화 (관리자 전용).
     * 해당 테넌트의 ERP_ACCOUNT_TYPE(REVENUE, EXPENSE, CASH) 계정·공통코드가 없으면 생성.
     * 이미 있으면 스킵.
     */
    @PostMapping("init-tenant-erp")
    public ResponseEntity<?> initTenantErp(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isAdmin()) {
            return ResponseEntity.status(403).body(
                    Map.of("success", false, "message", "관리자만 실행할 수 있습니다."));
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("ERP 계정 매핑 초기화 요청: tenantId={}, userId={}", tenantId, currentUser.getId());

        try {
            accountingService.ensureErpAccountMappingForTenant(tenantId);
            return success(Map.of(
                    "success", true,
                    "message", "ERP 계정 매핑 초기화 완료 (이미 존재 시 스킵됨)",
                    "tenantId", tenantId));
        } catch (Exception e) {
            log.error("ERP 계정 매핑 초기화 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "ERP 계정 매핑 초기화 실패: " + (e.getMessage() != null ? e.getMessage() : "알 수 없는 오류"),
                    "tenantId", tenantId));
        }
    }
}
