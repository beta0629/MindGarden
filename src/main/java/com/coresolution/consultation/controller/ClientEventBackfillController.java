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
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code client_event} 백필 ADMIN 진입점 — {@code @Profile("dev")} 전용.
 *
 * <p>운영 프로필에서는 빈이 로드되지 않는다. 런타임에도 prod 프로파일을 거부한다.
 * 인가는 {@code ROLE_ADMIN} 만 허용한다(세션·JWT 또는 공유 시크릿 필터).</p>
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
     * @param request HTTP 요청(로그용 remoteAddr — 인가에 사용하지 않음)
     * @return scanned/inserted/skipped/errors
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> run(
            @RequestParam(required = false, defaultValue = ClientEventBackfillConstants.MODE_DRY_RUN)
                    String mode,
            @RequestParam(required = false, name = "tenant_id") String tenantId,
            HttpServletRequest request) {

        environmentGuard.requireDevOnly();

        ClientEventBackfillMode backfillMode = ClientEventBackfillMode.fromCode(mode);
        String scopedTenant = StringUtils.hasText(tenantId) ? tenantId.trim() : null;

        log.info(
                "client_event backfill requested: mode={}, tenantId={}, profiles={}, remote={}",
                backfillMode,
                scopedTenant,
                environmentGuard.describeActiveProfiles(),
                request != null ? request.getRemoteAddr() : null);

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
}
