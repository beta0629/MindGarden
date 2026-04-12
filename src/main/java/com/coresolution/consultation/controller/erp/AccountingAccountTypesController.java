package com.coresolution.consultation.controller.erp;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.AccountTypeForJournalDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 분개용 계정과목 목록 API. 기획: docs/project-management/ERP_ACCOUNT_TYPES_FOR_JOURNAL_PLAN.md
 *
 * @author MindGarden
 * @since 2025-03-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/erp/accounting")
@RequiredArgsConstructor
public class AccountingAccountTypesController extends BaseApiController {

    private final AccountingService accountingService;
    private final DynamicPermissionService dynamicPermissionService;

    /**
     * ERP 접근 권한 체크 (기존 분개 API와 동일)
     */
    private ResponseEntity<?> checkErpAccess(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }
        if (currentUser.getRole() != null && currentUser.getRole().isAdmin()) {
            return null;
        }
        if (!dynamicPermissionService.hasPermission(currentUser, "ERP_ACCESS")) {
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message",
                            "ERP 접근 권한이 없습니다. 테넌트 관리자(ADMIN)에게 문의하세요."));
        }
        return null;
    }

    /**
     * 분개용 계정과목 목록 조회 GET /api/v1/erp/accounting/account-types
     */
    @GetMapping("/account-types")
    public ResponseEntity<?> getAccountTypes(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<AccountTypeForJournalDto> list = accountingService.getAccountTypesForJournal(tenantId);
        return success(list);
    }
}
