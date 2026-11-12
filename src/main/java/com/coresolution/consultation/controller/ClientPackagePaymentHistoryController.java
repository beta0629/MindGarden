package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.ClientPackagePaymentHistoryResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.service.ClientPackagePaymentHistoryService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 내담자 본인 패키지 결제 이력 (TERMINATED·회기추가 포함).
 *
 * <p>GET /api/v1/clients/me/package-payment-history — clientId 는 세션만 사용(쿼리/경로 금지).</p>
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clients/me")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientPackagePaymentHistoryController extends BaseApiController {

    private final ClientPackagePaymentHistoryService clientPackagePaymentHistoryService;

    /**
     * 로그인한 내담자 본인의 패키지·회기추가 결제 이력을 조회한다.
     *
     * @param session HTTP 세션
     * @return 합산 요약 + 타임라인
     * @throws UnauthorizedException 미로그인
     * @throws ForbiddenException 비내담자·tenantId 없음
     */
    @GetMapping("/package-payment-history")
    public ResponseEntity<ApiResponse<ClientPackagePaymentHistoryResponse>> getMyPackagePaymentHistory(
            HttpSession session) {
        User user = requireClient(session);
        String tenantId = requireTenant(user);
        try {
            TenantContextHolder.setTenantId(tenantId);
            log.info("내담자 본인 패키지 결제 이력 조회: tenantId={}, clientId={}", tenantId, user.getId());
            // clientId 는 세션만 — path/query 의 clientId 는 절대 받지 않는다.
            ClientPackagePaymentHistoryResponse data =
                    clientPackagePaymentHistoryService.getPackagePaymentHistory(user.getId(), null);
            return success("내담자 패키지 결제 이력 조회 성공", data);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static User requireClient(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isClient()) {
            throw new ForbiddenException("내담자 전용 API 입니다.");
        }
        return currentUser;
    }

    private static String requireTenant(User user) {
        String tenantId = user.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new ForbiddenException("테넌트 정보가 없습니다.");
        }
        return tenantId.trim();
    }
}
