package com.coresolution.consultation.controller.erp;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.entity.erp.accounting.JournalEntryLine;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.core.context.TenantContextHolder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Map;

/**
 * 회계 분개 Controller
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * API 설계 표준: docs/standards/API_DESIGN_STANDARD.md
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/erp/accounting/entries")
@RequiredArgsConstructor
public class AccountingController extends BaseApiController {
    
    private final AccountingService accountingService;
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
     * 분개 생성
     * POST /api/v1/erp/accounting/entries
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PostMapping
    public ResponseEntity<?> createJournalEntry(
            @RequestBody JournalEntryCreateRequest request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("분개 생성 요청: tenantId={}", tenantId);
        
        AccountingEntry entry = request.toAccountingEntry();
        List<JournalEntryLine> lines = request.getLines().stream()
            .map(JournalEntryLineRequest::toJournalEntryLine)
            .toList();
        
        AccountingEntry created = accountingService.createJournalEntry(tenantId, entry, lines);
        return created(created);
    }
    
    /**
     * 분개 목록 조회
     * GET /api/v1/erp/accounting/entries
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping
    public ResponseEntity<?> getJournalEntries(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("분개 목록 조회: tenantId={}", tenantId);
        
        List<AccountingEntry> entries = accountingService.getJournalEntries(tenantId);
        return success(entries);
    }
    
    /**
     * 분개 상세 조회
     * GET /api/v1/erp/accounting/entries/{id}
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getJournalEntry(@PathVariable Long id, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("분개 상세 조회: tenantId={}, entryId={}", tenantId, id);
        
        AccountingEntry entry = accountingService.getJournalEntry(tenantId, id);
        return success(entry);
    }
    
    /**
     * 분개 승인
     * POST /api/v1/erp/accounting/entries/{id}/approve
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveJournalEntry(
            @PathVariable Long id,
            @RequestBody JournalEntryApproveRequest request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("분개 승인 요청: tenantId={}, entryId={}", tenantId, id);
        
        AccountingEntry approved = accountingService.approveJournalEntry(
            tenantId, id, request.getApproverId(), request.getComment()
        );
        return success("분개가 승인되었습니다.", approved);
    }
    
    /**
     * 분개 전기
     * POST /api/v1/erp/accounting/entries/{id}/post
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PostMapping("/{id}/post")
    public ResponseEntity<?> postJournalEntry(@PathVariable Long id, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("분개 전기 요청: tenantId={}, entryId={}", tenantId, id);
        
        AccountingEntry posted = accountingService.postJournalEntry(tenantId, id);
        return success("분개가 전기되었습니다. 원장이 자동으로 업데이트되었습니다.", posted);
    }
    
    /**
     * 분개 수정 (DRAFT 상태에서만 가능)
     * PUT /api/v1/erp/accounting/entries/{id}
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJournalEntry(
            @PathVariable Long id,
            @RequestBody JournalEntryCreateRequest request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("분개 수정 요청: tenantId={}, entryId={}", tenantId, id);
        
        AccountingEntry entry = request.toAccountingEntry();
        List<JournalEntryLine> lines = request.getLines().stream()
            .map(JournalEntryLineRequest::toJournalEntryLine)
            .toList();
        
        AccountingEntry updated = accountingService.updateJournalEntry(tenantId, id, entry, lines);
        return success("분개가 수정되었습니다.", updated);
    }
    
    /**
     * 분개 생성 요청 DTO
     */
    @Data
    public static class JournalEntryCreateRequest {
        private String entryNumber;
        private java.time.LocalDate entryDate;
        private String description;
        private List<JournalEntryLineRequest> lines;
        
        public AccountingEntry toAccountingEntry() {
            return AccountingEntry.builder()
                .entryNumber(entryNumber)
                .entryDate(entryDate)
                .description(description)
                .build();
        }
    }
    
    /**
     * 분개 상세 라인 요청 DTO
     */
    @Data
    public static class JournalEntryLineRequest {
        private Long accountId;
        private java.math.BigDecimal debitAmount;
        private java.math.BigDecimal creditAmount;
        private String description;
        
        public JournalEntryLine toJournalEntryLine() {
            return JournalEntryLine.builder()
                .accountId(accountId)
                .debitAmount(debitAmount != null ? debitAmount : java.math.BigDecimal.ZERO)
                .creditAmount(creditAmount != null ? creditAmount : java.math.BigDecimal.ZERO)
                .description(description)
                .build();
        }
    }
    
    /**
     * 분개 승인 요청 DTO
     */
    @Data
    public static class JournalEntryApproveRequest {
        private Long approverId;
        private String comment;
    }
}

