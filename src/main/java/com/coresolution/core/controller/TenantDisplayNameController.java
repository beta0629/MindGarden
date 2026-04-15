package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.TenantNameUpdateRequest;
import com.coresolution.core.dto.TenantNameUpdateResponse;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.TenantService;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 표시명({@code tenants.name}) 변경 API.
 *
 * <p><b>계약</b></p>
 * <ul>
 *   <li>{@code PUT /api/v1/tenants/{tenantId}/name}</li>
 *   <li>Request body: JSON {@code { "name": "새 테넌트명" }} ({@link TenantNameUpdateRequest})</li>
 *   <li>성공 시 200, 본문 {@link ApiResponse}{@code <}{@link TenantNameUpdateResponse}{@code >}
 *       및 메시지 "테넌트명이 변경되었습니다."</li>
 *   <li>권한: 테넌트 관리자({@code ADMIN}) 또는 운영({@code OPS}), {@link TenantAccessControlService#validateTenantAccess(String)} 통과</li>
 *   <li>{@code branding_json.companyName} 동기화는 본 API 범위에 포함하지 않음</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-04-01
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/name")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "테넌트 표시명", description = "테넌트명(tenants.name) 변경 API")
public class TenantDisplayNameController extends BaseApiController {

    private final TenantService tenantService;
    private final TenantAccessControlService accessControlService;

    /**
     * 테넌트 표시명을 변경합니다.
     *
     * @param tenantId 경로의 테넌트 ID (컨텍스트·요청과 일치 검증)
     * @param request  새 이름
     * @return 갱신된 테넌트 스냅샷
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    @Operation(
            summary = "테넌트명 변경",
            description = "tenants.name을 갱신하고, branding_json.companyName(한글 회사명)과 동기화합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "변경 성공",
                    content = @Content(schema = @Schema(implementation = TenantNameUpdateResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "유효성 검증 실패 또는 비즈니스 규칙 위반"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "테넌트 없음")
    })
    public ResponseEntity<ApiResponse<TenantNameUpdateResponse>> updateDisplayName(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Valid @RequestBody TenantNameUpdateRequest request) {

        log.info("테넌트 표시명 변경 요청: tenantId={}", tenantId);

        accessControlService.validateTenantAccess(tenantId);

        TenantNameUpdateResponse response = tenantService.updateTenantDisplayName(tenantId, request);

        return updated("테넌트명이 변경되었습니다.", response);
    }
}
