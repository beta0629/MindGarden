package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.AccountRequest;
import com.coresolution.consultation.dto.AccountResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AccountService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 계좌 관리 컨트롤러.
 *
 * <p>운영재무(계좌 CRUD) — ADMIN 단락 허용, STAFF fail-closed, 그 외 ERP_ACCESS.</p>
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@RestController
@RequestMapping("/api/v1/accounts") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class AccountController {

    private final AccountService accountService;
    private final DynamicPermissionService dynamicPermissionService;

    /**
     * ERP 접근 권한 체크 ({@code ErpController.checkErpAccess} 와 동일 패턴).
     *
     * @param session HTTP 세션
     * @return 거부 시 401/403, 허용 시 null
     */
    private ResponseEntity<?> checkErpAccess(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }

        if (currentUser.getRole() != null && currentUser.getRole().isAdmin()) {
            log.debug("관리자 역할로 계좌 API 접근 허용, 사용자={}, 역할={}",
                    EmailLogMasking.maskForLog(currentUser.getEmail()), currentUser.getRole());
            return null;
        }

        if (currentUser.getRole() != null && currentUser.getRole().isStaff()) {
            log.warn("❌ STAFF 계좌 API 접근 차단: 사용자={}, 역할={}",
                    EmailLogMasking.maskForLog(currentUser.getEmail()), currentUser.getRole());
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message",
                            "ERP 접근 권한이 없습니다. 테넌트 관리자(ADMIN)에게 문의하세요."));
        }

        if (!dynamicPermissionService.hasPermission(currentUser, "ERP_ACCESS")) {
            log.warn("❌ 계좌 API ERP 접근 권한 없음: 사용자={}, 역할={}",
                    EmailLogMasking.maskForLog(currentUser.getEmail()), currentUser.getRole());
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message",
                            "ERP 접근 권한이 없습니다. 테넌트 관리자(ADMIN)에게 문의하세요."));
        }

        return null;
    }

    @PostMapping
    public ResponseEntity<?> createAccount(
            @Valid @RequestBody AccountRequest request, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        log.info("계좌 등록 요청: {}", request);
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAccount(@PathVariable Long id, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        AccountResponse response = accountService.getAccount(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody AccountRequest request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        AccountResponse response = accountService.updateAccount(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        accountService.deleteAccount(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleAccountStatus(@PathVariable Long id, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        AccountResponse response = accountService.toggleAccountStatus(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/set-primary")
    public ResponseEntity<?> setPrimaryAccount(@PathVariable Long id, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        AccountResponse response = accountService.setPrimaryAccount(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getAllAccounts(Pageable pageable, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        Page<AccountResponse> response = accountService.getAllAccounts(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveAccounts(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        List<AccountResponse> response = accountService.getActiveAccounts();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<?> getAccountsByBranch(@PathVariable Long branchId, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        List<AccountResponse> response = accountService.getAccountsByBranch(branchId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchAccounts(
            @RequestParam String keyword,
            Pageable pageable,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        Page<AccountResponse> response = accountService.searchAccounts(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getAccountStatistics(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        Map<String, Object> response = accountService.getAccountStatistics();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateAccount(
            @RequestParam String bankCode,
            @RequestParam String accountNumber,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        boolean isValid = accountService.validateAccount(bankCode, accountNumber);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @GetMapping("/primary")
    public ResponseEntity<?> getPrimaryAccount(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        AccountResponse response = accountService.getPrimaryAccount();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/primary/branch/{branchId}")
    public ResponseEntity<?> getPrimaryAccountByBranch(
            @PathVariable Long branchId, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        AccountResponse response = accountService.getPrimaryAccountByBranch(branchId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/banks")
    public ResponseEntity<?> getBankList(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }
        List<Map<String, String>> banks = List.of(
            Map.of("code", "001", "name", "국민은행"),
            Map.of("code", "088", "name", "신한은행"),
            Map.of("code", "020", "name", "우리은행"),
            Map.of("code", "081", "name", "하나은행"),
            Map.of("code", "011", "name", "농협은행"),
            Map.of("code", "003", "name", "기업은행"),
            Map.of("code", "004", "name", "외환은행"),
            Map.of("code", "002", "name", "산업은행"),
            Map.of("code", "007", "name", "수협은행"),
            Map.of("code", "071", "name", "우체국"),
            Map.of("code", "090", "name", "카카오뱅크"),
            Map.of("code", "092", "name", "토스뱅크")
        );
        return ResponseEntity.ok(banks);
    }
}
