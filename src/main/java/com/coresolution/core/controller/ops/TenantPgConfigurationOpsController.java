package com.coresolution.core.controller.ops;

import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationDecryptionService;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.core.util.LogSanitizer;
import com.coresolution.core.util.OpsPermissionUtils;
import com.coresolution.consultation.exception.EntityNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 운영 포털 PG 설정 승인 API 컨트롤러.
 *
 * <p>크로스 센터 PG 설정 조회·승인·거부는 유지하되, 호출자는 OPS + HQ(또는 tenant 미설정 HQ JWT)만 허용한다.
 * 센터 ROLE_ADMIN 은 fail-closed (403).</p>
 *
 * <h3>권한 가드 — 옵션 3+1 하이브리드 (Defense in Depth)</h3>
 * <ol>
 *   <li>클래스 레벨 {@code @PreAuthorize("hasRole('OPS')")} + 메서드
 *       {@link OpsPermissionUtils#requireOps()} — Ops Portal 운영자만.</li>
 *   <li>메서드별 HQ 가드 — tenant 미설정(Ops HQ JWT)은 허용, 외부 테넌트 컨텍스트는 차단.</li>
 * </ol>
 *
 * <p>표준 정합: {@code docs/standards/ROLE_STANDARD.md} §3.3,
 * {@code docs/standards/OPS_PORTAL_STANDARD.md}.</p>
 *
 * @author CoreSolution
 * @version 2.1.1
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/pg-configurations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OPS')")
@Tag(name = "운영 포털 PG 설정", description = "운영 포털 PG 설정 승인/관리 API (OPS + HQ 전용)")
public class TenantPgConfigurationOpsController extends BaseApiController {

    private static final String HQ_GUARD_DENY_MESSAGE =
            "PG 승인은 본사(Ops) 테넌트만 호출 가능 — 외부 테넌트 차단";

    private final TenantPgConfigurationService pgConfigurationService;
    private final TenantPgConfigurationDecryptionService decryptionService;
    private final OpsTenantConstants opsTenantConstants;

    /**
     * 승인 대기 중인 PG 설정 목록 조회.
     *
     * @param tenantId 센터(테넌트) ID 필터 (선택)
     * @param pgProvider PG Provider 필터 (선택)
     * @return 승인 대기 목록
     */
    @Operation(
            summary = "승인 대기 목록 조회",
            description = "승인 대기 중인 PG 설정 목록을 조회합니다. 센터 ID 또는 PG Provider로 필터링 가능합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음 (OPS + HQ 필요)")
    })
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<TenantPgConfigurationResponse>>> getPendingApprovals(
            @Parameter(description = "센터 ID (필터)") @RequestParam(required = false) String tenantId,
            @Parameter(description = "PG Provider (필터)") @RequestParam(required = false) PgProvider pgProvider) {
        requireOpsAndHq();
        log.debug("승인 대기 목록 조회 요청: tenantId={}, pgProvider={}", tenantId, pgProvider);

        List<TenantPgConfigurationResponse> configurations =
                pgConfigurationService.getPendingApprovals(tenantId, pgProvider);

        return success(configurations);
    }

    /**
     * PG 설정 승인.
     *
     * @param configId PG 설정 ID
     * @param request 승인 요청
     * @return 승인된 PG 설정
     */
    @Operation(
            summary = "PG 설정 승인",
            description = "PG 설정을 승인합니다. 승인 시 연결 테스트를 수행할 수 있습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "승인 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (이미 승인됨 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/approve")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> approveConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody PgConfigurationApproveRequest request) {
        requireOpsAndHq();
        log.info("PG 설정 승인 요청: configId={}, approvedBy={}", configId, request.getApprovedBy());

        TenantPgConfigurationResponse response =
                pgConfigurationService.approveConfiguration(configId, request);

        return updated("PG 설정이 승인되었습니다.", response);
    }

    /**
     * PG 설정 거부.
     *
     * @param configId PG 설정 ID
     * @param request 거부 요청
     * @return 거부된 PG 설정
     */
    @Operation(
            summary = "PG 설정 거부",
            description = "PG 설정을 거부합니다. 거부 사유는 필수입니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "거부 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (거부 사유 누락 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/reject")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> rejectConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody PgConfigurationRejectRequest request) {
        requireOpsAndHq();
        log.info("PG 설정 거부 요청: configId={}, rejectedBy={}", configId, request.getRejectedBy());

        TenantPgConfigurationResponse response =
                pgConfigurationService.rejectConfiguration(configId, request);

        return updated("PG 설정이 거부되었습니다.", response);
    }

    /**
     * PG 설정 활성화.
     *
     * @param configId PG 설정 ID
     * @return 활성화된 PG 설정
     */
    @Operation(
            summary = "PG 설정 활성화",
            description = "승인된 PG 설정을 활성화합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "활성화 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (아직 승인되지 않음 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/activate")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> activateConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        requireOpsAndHq();
        log.info("PG 설정 활성화 요청: configId={}", configId);

        String activatedBy = getCurrentUserId();

        TenantPgConfigurationResponse response =
                pgConfigurationService.activateConfiguration(configId, activatedBy);

        return updated("PG 설정이 활성화되었습니다.", response);
    }

    /**
     * PG 설정 비활성화.
     *
     * @param configId PG 설정 ID
     * @return 비활성화된 PG 설정
     */
    @Operation(
            summary = "PG 설정 비활성화",
            description = "활성화된 PG 설정을 비활성화합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "비활성화 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/deactivate")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> deactivateConfiguration(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        requireOpsAndHq();
        log.info("PG 설정 비활성화 요청: configId={}", configId);

        String deactivatedBy = getCurrentUserId();

        TenantPgConfigurationResponse response =
                pgConfigurationService.deactivateConfiguration(configId, deactivatedBy);

        return updated("PG 설정이 비활성화되었습니다.", response);
    }

    /**
     * PG 설정 변경 이력 조회.
     *
     * @param configId PG 설정 ID
     * @return 설정 상세·이력
     */
    @Operation(
            summary = "PG 설정 변경 이력 조회",
            description = "PG 설정의 변경 이력을 조회합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationDetailResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @GetMapping("/{configId}/history")
    public ResponseEntity<ApiResponse<TenantPgConfigurationDetailResponse>> getConfigurationHistory(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        requireOpsAndHq();
        log.debug("PG 설정 변경 이력 조회 요청: configId={}", configId);

        TenantPgConfigurationDetailResponse response =
                pgConfigurationService.getConfigurationDetail(null, configId);

        if (response == null) {
            throw new EntityNotFoundException("PG 설정을 찾을 수 없습니다: " + configId);
        }

        return success(response);
    }

    /**
     * PG 연결 테스트 (운영 포털).
     *
     * @param configId PG 설정 ID
     * @return 연결 테스트 결과
     */
    @Operation(
            summary = "PG 연결 테스트",
            description = "PG 설정의 연결을 테스트합니다. 운영 포털에서 모든 센터의 PG 설정을 테스트할 수 있습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "테스트 완료",
                    content = @Content(schema = @Schema(implementation = ConnectionTestResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음 (OPS + HQ 필요)")
    })
    @PostMapping("/{configId}/test-connection")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        requireOpsAndHq();
        log.info("PG 연결 테스트 요청 (운영 포털): configId={}", configId);

        ConnectionTestResponse response =
                pgConfigurationService.testConnectionBeforeApproval(configId);

        return success(response);
    }

    /**
     * PG 설정 API Key / Secret Key 복호화 (운영 포털).
     *
     * <p>민감 키 값을 로그에 남기지 않는다. configId/requestedBy 만 기록한다.</p>
     *
     * @param configId PG 설정 ID
     * @return 복호화된 키 응답
     */
    @Operation(
            summary = "PG 설정 키 복호화",
            description = "운영 포털에서 PG API Key와 Secret Key를 복호화하여 반환합니다. OPS + HQ 권한이 필요합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "복호화 성공",
                    content = @Content(schema = @Schema(implementation = PgConfigurationKeysResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음 (OPS + HQ 필요)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/decrypt-keys")
    public ResponseEntity<ApiResponse<PgConfigurationKeysResponse>> decryptKeys(
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        requireOpsAndHq();

        String requestedBy = getCurrentUserId();
        log.info("PG 설정 키 복호화 요청 (운영 포털): configId={}, requestedBy={}", configId, requestedBy);

        PgConfigurationKeysResponse response =
                decryptionService.decryptKeysForOps(configId, requestedBy);

        return success(response);
    }

    /**
     * OPS Authority + HQ 테넌트 가드.
     *
     * @throws AccessDeniedException OPS 권한 없거나 HQ 테넌트가 아닌 경우
     */
    private void requireOpsAndHq() {
        OpsPermissionUtils.requireOps();
        assertHqTenant();
    }

    /**
     * 본사(HQ) 테넌트 컨텍스트인지 검증한다.
     *
     * <p>Ops HQ JWT 는 tenantId claim 이 없을 수 있다. tenant 미설정(null/blank)은
     * {@link OpsPermissionUtils#requireOps()} 통과 후 HQ Ops 경로로 허용한다.
     * tenant 가 있으면 HQ 만 허용하고 외부 테넌트는 차단한다.</p>
     *
     * @throws AccessDeniedException 외부(비-HQ) 테넌트 컨텍스트인 경우
     */
    private void assertHqTenant() {
        String currentTenant = TenantContextHolder.getTenantId();
        if (currentTenant == null || currentTenant.isBlank()) {
            return;
        }
        if (!opsTenantConstants.isHqTenant(currentTenant)) {
            log.warn("[OPS] PG 승인 외부 테넌트 차단 — currentTenant={} (HQ 가드)",
                    LogSanitizer.forLog(currentTenant));
            throw new AccessDeniedException(HQ_GUARD_DENY_MESSAGE);
        }
    }

    /**
     * 현재 사용자 ID 가져오기.
     * SecurityContext에서 인증된 사용자 정보를 가져옵니다.
     *
     * @return 사용자 ID 또는 system
     */
    private String getCurrentUserId() {
        try {
            org.springframework.security.core.context.SecurityContext context =
                    org.springframework.security.core.context.SecurityContextHolder.getContext();
            if (context != null && context.getAuthentication() != null) {
                String userId = context.getAuthentication().getName();
                if (userId != null && !userId.equals("anonymousUser")) {
                    return userId;
                }
            }
        } catch (Exception e) {
            log.warn("현재 사용자 정보를 가져오는 중 오류 발생: {}", e.getMessage());
        }
        return "system";
    }
}
