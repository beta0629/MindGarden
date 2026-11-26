package com.coresolution.consultation.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.dto.ClientEventBackfillResult;
import com.coresolution.consultation.service.ClientEventBackfillService;
import com.coresolution.consultation.service.support.ClientEventBackfillEnvironmentGuard;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.util.OpsPermissionUtils;

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
 * {@code client_event} 백필 OPS 진입점 — {@code @Profile("dev")} 전용.
 *
 * <p><b>dev HTTP 유지, 운영은 CLI만.</b> 본 컨트롤러·토큰 필터·dev workflow 는 .dev 전용으로 유지하고
 * 운영 노출은 0이다. 운영 백필은 {@code ClientEventBackfillCliApplication}(Web NONE) 만 사용한다.</p>
 *
 * <p>운영 프로필에서는 빈이 로드되지 않는다. 런타임에도 prod 프로파일을 거부한다.
 * 인가는 {@code ROLE_OPS} 만 허용한다(세션·JWT 또는 공유 시크릿 필터의 ops 우회).
 * 센터 {@code ROLE_ADMIN} 단독으로는 403 — 교차 테넌트 백필 차단.</p>
 *
 * <p>{@code tenant_id} 는 필수이다(전체 테넌트 순회 없음).</p>
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
     * 백필 실행(dry-run 기본). .dev HTTP 전용 — 운영은 CLI.
     *
     * @param mode dry-run | apply
     * @param tenantId 테넌트(필수)
     * @param request HTTP 요청(로그용 remoteAddr — 인가에 사용하지 않음)
     * @return scanned/inserted/skipped/errors/clientCount/byEventType
     */
    @PostMapping
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_OPS + "')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> run(
            @RequestParam(required = false, defaultValue = ClientEventBackfillConstants.MODE_DRY_RUN)
                    String mode,
            @RequestParam(required = true, name = "tenant_id") String tenantId,
            HttpServletRequest request) {

        // SecurityConfig·@PreAuthorize 이중 방어 + TenantOps와 동일 수동 가드
        OpsPermissionUtils.requireOps();
        // HTTP/dev 전용 가드 — CLI 서비스 경로에는 적용하지 않음
        environmentGuard.requireDevOnly();

        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenant_id는 필수입니다.");
        }

        ClientEventBackfillMode backfillMode = ClientEventBackfillMode.fromCode(mode);
        if (backfillMode == ClientEventBackfillMode.ROLLBACK) {
            throw new IllegalArgumentException("rollback 은 서버 로컬 CLI 만 지원합니다.");
        }
        String scopedTenant = tenantId.trim();

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
        data.put("clientCount", result.getClientCount());
        data.put("byEventType", result.getByEventType());
        return success(data);
    }
}
