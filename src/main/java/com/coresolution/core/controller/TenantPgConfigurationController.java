package com.coresolution.core.controller;

import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.core.security.TenantAccessControlService;
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
 * 테넌트 PG 설정 API 컨트롤러
 * 테넌트 포털에서 사용하는 PG 설정 관리 API
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 *
 * <p>P0 보안(2026-10-03):
 * <ul>
 *   <li>목록·상세 조회가 {@code isAuthenticated()} 뿐이어서 내담자·상담사·사무원도 PG 설정을
 *       읽을 수 있었다 → ADMIN 전용으로 제한.</li>
 *   <li>{@code POST /{configId}/decrypt-keys} (복호화 평문 반환) 를 테넌트 경로에서 제거.
 *       복호화는 운영자 전용 {@code /api/v1/ops/...} 경로에만 남는다.</li>
 *   <li>{@code PATCH /{configId}/test-mode}, {@code PATCH /{configId}/webhook-secret} 는
 *       운영자 전용으로 차단 (항상 403).</li>
 * </ul>
 * 브라우저 결제에 필요한 {@code GET /active/portone-client-config} 는 시크릿을 포함하지 않으므로
 * 인증 사용자 전체에 그대로 허용한다.
 * 
 * @author CoreSolution
 * @version 3.0.0
 * @since 2025-01-XX
 * @updated 2026-10-03 - 조회 ADMIN 제한 + 복호화 엔드포인트 제거 + 전역/시크릿 변경 차단
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/pg-configurations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "테넌트 PG 설정", description = "테넌트 포털 PG 설정 관리 API")
public class TenantPgConfigurationController extends BaseApiController {

    /** P0 보안(2026-10-03): testMode 변경 차단 메시지. */
    static final String MSG_PG_TEST_MODE_OPS_ONLY =
            "PG 테스트 모드는 운영자 전용입니다. 테넌트 관리자 경로에서는 변경할 수 없습니다.";

    /** P0 보안(2026-10-03): 웹훅 시크릿 변경 차단 메시지. */
    static final String MSG_PG_WEBHOOK_SECRET_OPS_ONLY =
            "PG 웹훅 시크릿은 운영자 전용입니다. 테넌트 관리자 경로에서는 변경할 수 없습니다.";

    private final TenantPgConfigurationService pgConfigurationService;
    private final TenantAccessControlService accessControlService;
    
    /**
     * 테넌트 PG 설정 목록 조회
     */
    @Operation(
            summary = "PG 설정 목록 조회",
            description = "테넌트의 PG 설정 목록을 조회합니다. 상태 및 승인 상태로 필터링 가능합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<List<TenantPgConfigurationResponse>>> getConfigurations(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 상태 (필터)") @RequestParam(required = false) PgConfigurationStatus status,
            @Parameter(description = "승인 상태 (필터)") @RequestParam(required = false) ApprovalStatus approvalStatus) {
        
        log.debug("PG 설정 목록 조회 요청: tenantId={}, status={}, approvalStatus={}", 
                tenantId, status, approvalStatus);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        List<TenantPgConfigurationResponse> configurations = 
                pgConfigurationService.getConfigurations(tenantId, status, approvalStatus);
        
        return success(configurations);
    }
    
    /**
     * 테넌트 PG 설정 상세 조회
     */
    @Operation(
            summary = "PG 설정 상세 조회",
            description = "특정 PG 설정의 상세 정보와 변경 이력을 조회합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationDetailResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @GetMapping("/{configId}")
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<TenantPgConfigurationDetailResponse>> getConfigurationDetail(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.debug("PG 설정 상세 조회 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        TenantPgConfigurationDetailResponse response = 
                pgConfigurationService.getConfigurationDetail(tenantId, configId);
        
        if (response == null) {
            throw new EntityNotFoundException("PG 설정을 찾을 수 없습니다: " + configId);
        }
        
        return success(response);
    }
    
    /**
     * 테넌트 PG 설정 생성 (입력)
     */
    @Operation(
            summary = "PG 설정 생성",
            description = "새로운 PG 설정을 생성합니다. 생성 후 승인 대기 상태가 됩니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "생성 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (필수 필드 누락 등)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "이미 활성화된 PG 설정 존재")
    })
    @PostMapping
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> createConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Valid @RequestBody TenantPgConfigurationRequest request) {
        
        log.info("PG 설정 생성 요청: tenantId={}, pgProvider={}", tenantId, request.getPgProvider());
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        // 현재 사용자 정보 가져오기
        String requestedBy = accessControlService.getCurrentUserId();
        if (requestedBy == null) {
            requestedBy = "anonymous";
        }
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.createConfiguration(tenantId, request, requestedBy);
        
        return created("PG 설정이 생성되었습니다.", response);
    }
    
    /**
     * 테넌트 PG 설정 수정
     */
    @Operation(
            summary = "PG 설정 수정",
            description = "기존 PG 설정을 수정합니다. 수정 시 재승인이 필요합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = TenantPgConfigurationResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PutMapping("/{configId}")
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> updateConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody TenantPgConfigurationRequest request) {
        
        log.info("PG 설정 수정 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        TenantPgConfigurationResponse response = 
                pgConfigurationService.updateConfiguration(tenantId, configId, request);
        
        return updated("PG 설정이 수정되었습니다.", response);
    }

    /**
     * PG 설정 테스트 모드 변경 — P0 보안(2026-10-03) 이후 테넌트 경로에서는 차단된다.
     *
     * <p>testMode 는 실결제/테스트 결제를 가르는 스위치이므로 테넌트 관리자 경로에서 즉시 변경할 수
     * 없게 한다. 변경은 운영자 전용 경로에서만 수행한다.
     *
     * @param tenantId 테넌트 ID
     * @param configId PG 설정 ID
     * @param request  testMode 요청 (사용하지 않음)
     * @return 403 (운영자 전용)
     */
    @Operation(
            summary = "PG 테스트 모드 변경 (차단)",
            description = "P0 보안: 테넌트 관리자 경로에서는 testMode 를 변경할 수 없습니다 (운영자 전용). 항상 403."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "운영자 전용")
    })
    @PatchMapping("/{configId}/test-mode")
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> patchTestMode(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody PgConfigurationTestModePatchRequest request) {

        accessControlService.validateTenantAccess(tenantId);

        log.warn("PG 테스트 모드 변경 차단(운영자 전용): tenantId={}, configId={}", tenantId, configId);
        throw new AccessDeniedException(MSG_PG_TEST_MODE_OPS_ONLY);
    }

    /**
     * PG 설정 포트원 웹훅 시크릿 변경 — P0 보안(2026-10-03) 이후 테넌트 경로에서는 차단된다.
     *
     * <p>웹훅 시크릿은 결제 통지 위조를 막는 공유 비밀이므로 테넌트 관리자 경로에서 교체할 수 없게
     * 한다. 교체는 운영자 전용 경로에서만 수행한다.
     *
     * @param tenantId 테넌트 ID
     * @param configId PG 설정 ID
     * @param request  시크릿 요청 (사용하지 않음)
     * @return 403 (운영자 전용)
     */
    @Operation(
            summary = "PG 웹훅 시크릿 변경 (차단)",
            description = "P0 보안: 테넌트 관리자 경로에서는 웹훅 시크릿을 변경할 수 없습니다 (운영자 전용). 항상 403."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "운영자 전용")
    })
    @PatchMapping("/{configId}/webhook-secret")
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<TenantPgConfigurationResponse>> patchWebhookSecret(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId,
            @Valid @RequestBody PgConfigurationWebhookSecretPatchRequest request) {

        accessControlService.validateTenantAccess(tenantId);

        log.warn("PG 웹훅 시크릿 변경 차단(운영자 전용): tenantId={}, configId={}", tenantId, configId);
        throw new AccessDeniedException(MSG_PG_WEBHOOK_SECRET_OPS_ONLY);
    }
    
    /**
     * 테넌트 PG 설정 삭제
     */
    @Operation(
            summary = "PG 설정 삭제",
            description = "PG 설정을 삭제합니다. (소프트 삭제)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "삭제 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @DeleteMapping("/{configId}")
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<Void>> deleteConfiguration(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 설정 삭제 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        pgConfigurationService.deleteConfiguration(tenantId, configId);
        
        return deleted("PG 설정이 삭제되었습니다.");
    }
    
    /**
     * PG 연결 테스트
     */
    @Operation(
            summary = "PG 연결 테스트",
            description = "PG 설정의 연결을 테스트합니다. API Key와 Secret Key를 사용하여 실제 PG 서버와의 연결을 확인합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "테스트 완료",
                    content = @Content(schema = @Schema(implementation = ConnectionTestResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PG 설정을 찾을 수 없음")
    })
    @PostMapping("/{configId}/test-connection")
    @PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "PG 설정 ID", required = true) @PathVariable String configId) {
        
        log.info("PG 연결 테스트 요청: tenantId={}, configId={}", tenantId, configId);
        
        // 테넌트 권한 확인
        accessControlService.validateTenantAccess(tenantId);
        
        ConnectionTestResponse response = 
                pgConfigurationService.testConnection(tenantId, configId);
        
        return success(response);
    }

    /**
     * 포트원 V2 브라우저 SDK 용 공개 클라이언트 설정(시크릿 미포함).
     * ACTIVE+APPROVED IAMPORT 설정의 storeId·channelKey(testMode 해석)·testMode 만 반환한다.
     */
    @Operation(
            summary = "포트원 클라이언트 설정 조회",
            description = "브라우저 requestPayment 에 필요한 storeId·channelKey 를 반환합니다. API Secret/웹훅 시크릿은 포함하지 않습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = PortOneClientConfigResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "ACTIVE 설정 또는 channelKey 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping("/active/portone-client-config")
    public ResponseEntity<ApiResponse<PortOneClientConfigResponse>> getActivePortOneClientConfig(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId) {

        log.debug("포트원 클라이언트 설정 조회 요청: tenantId={}", tenantId);
        accessControlService.validateTenantAccess(tenantId);

        PortOneClientConfigResponse response =
                pgConfigurationService.getActivePortOneClientConfig(tenantId);
        return success(response);
    }
    
}

