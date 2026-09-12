package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.community.UserEulaConsentRequest;
import com.coresolution.consultation.dto.community.UserEulaConsentResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserEulaConsentService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Apple G1.2 UGC (P2-C) — 현재 사용자의 EULA 동의 API.
 *
 * <ul>
 *   <li>{@code GET  /api/v1/users/me/eula-consent} — 동의 상태 조회 (부팅 게이트용)</li>
 *   <li>{@code POST /api/v1/users/me/eula-consent} — 동의 저장 (약관/개인정보 필수)</li>
 * </ul>
 *
 * <p>모든 엔드포인트는 세션 사용자 + 테넌트 격리 검증을 거친다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@RestController
@RequestMapping("/api/v1/users/me/eula-consent")
@RequiredArgsConstructor
public class UserEulaConsentController extends BaseApiController {

    private final UserEulaConsentService userEulaConsentService;

    /**
     * 현재 사용자의 EULA 동의 상태 조회.
     *
     * @param session HTTP 세션
     * @return {@link UserEulaConsentResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserEulaConsentResponse>> getStatus(HttpSession session) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            return success(userEulaConsentService.getConsentStatus(user));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * EULA 동의 저장.
     *
     * @param session 세션
     * @param request 동의 본문
     * @param http    HTTP 요청 (감사 로그용 IP/UA)
     * @return 동의 후 상태
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserEulaConsentResponse>> accept(
            HttpSession session,
            @Valid @RequestBody UserEulaConsentRequest request,
            HttpServletRequest http) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            String ipAddress = resolveClientIpAddress(http);
            String userAgent = http.getHeader("User-Agent");
            UserEulaConsentResponse response =
                    userEulaConsentService.acceptConsent(user, request, ipAddress, userAgent);
            return created("EULA 동의가 저장되었습니다.", response);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static User requireTenantUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return user;
    }

    private static String resolveClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
