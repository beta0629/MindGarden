package com.coresolution.consultation.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.dto.ClientEventBackfillResult;
import com.coresolution.consultation.service.ClientEventBackfillService;
import com.coresolution.consultation.service.support.ClientEventBackfillEnvironmentGuard;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code client_event} 백필 ADMIN 진입점 — {@code @Profile("dev")} 전용.
 *
 * <p>운영 프로필에서는 빈이 로드되지 않는다. 런타임에도 prod 프로파일을 거부한다.
 * loopback(SSH curl) 또는 ADMIN 역할만 허용한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Slf4j
@RestController
@Profile(ClientEventBackfillConstants.PROFILE_DEV)
@RequestMapping(ClientEventBackfillConstants.API_PATH)
@RequiredArgsConstructor
public class ClientEventBackfillController extends BaseApiController {

    private final ClientEventBackfillService clientEventBackfillService;
    private final ClientEventBackfillEnvironmentGuard environmentGuard;

    /**
     * 백필 실행(dry-run 기본).
     *
     * @param mode dry-run | apply
     * @param tenantId 선택 테넌트(없으면 활성 테넌트 전체)
     * @param request HTTP 요청(loopback 판별)
     * @return scanned/inserted/skipped/errors
     */
    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> run(
            @RequestParam(required = false, defaultValue = ClientEventBackfillConstants.MODE_DRY_RUN)
                    String mode,
            @RequestParam(required = false, name = "tenant_id") String tenantId,
            HttpServletRequest request) {

        environmentGuard.requireDevOnly();
        requireLoopbackOrAdmin(request);

        ClientEventBackfillMode backfillMode = ClientEventBackfillMode.fromCode(mode);
        String scopedTenant = StringUtils.hasText(tenantId) ? tenantId.trim() : null;

        log.info(
                "client_event backfill requested: mode={}, tenantId={}, profiles={}, remote={}",
                backfillMode,
                scopedTenant,
                environmentGuard.describeActiveProfiles(),
                request.getRemoteAddr());

        ClientEventBackfillResult result = clientEventBackfillService.run(backfillMode, scopedTenant);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mode", result.getMode() != null ? result.getMode().getCode() : null);
        data.put("tenantId", result.getTenantId());
        data.put("scanned", result.getScanned());
        data.put("inserted", result.getInserted());
        data.put("skipped", result.getSkipped());
        data.put("errors", result.getErrors());
        return success(data);
    }

    private static void requireLoopbackOrAdmin(HttpServletRequest request) {
        if (isLoopback(request) || hasAdminRole()) {
            return;
        }
        throw new IllegalStateException(
                "client_event backfill requires ADMIN role or loopback caller on .dev");
    }

    private static boolean isLoopback(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        String remote = request.getRemoteAddr();
        if (!StringUtils.hasText(remote)) {
            return false;
        }
        return "127.0.0.1".equals(remote)
                || "https://example.net/id/garnet".equals(remote)
                || "::1".equals(remote)
                || "0:0:0:0:0:0:0:1".equals(remote);
    }

    private static boolean hasAdminRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (authority == null || authority.getAuthority() == null) {
                continue;
            }
            String value = authority.getAuthority();
            if ("ROLE_ADMIN".equals(value) || "ADMIN".equals(value)) {
                return true;
            }
        }
        return false;
    }
}
