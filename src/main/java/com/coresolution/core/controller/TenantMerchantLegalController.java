package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.MerchantLegalDto;
import com.coresolution.core.dto.MerchantLegalUpdateRequest;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.MerchantLegalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 테넌트 사업자·약관 API (센터 설정).
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/merchant-legal")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "테넌트 사업자·약관", description = "센터 사업자·약관 조회/저장")
public class TenantMerchantLegalController extends BaseApiController {

    private final MerchantLegalService merchantLegalService;
    private final TenantAccessControlService accessControlService;

    @Operation(summary = "사업자·약관 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<MerchantLegalDto>> get(
            @PathVariable String tenantId) {
        accessControlService.validateTenantAccess(tenantId);
        return success(merchantLegalService.getForTenant(tenantId));
    }

    @Operation(summary = "사업자·약관 저장")
    @PutMapping
    public ResponseEntity<ApiResponse<MerchantLegalDto>> save(
            @PathVariable String tenantId,
            @RequestBody MerchantLegalUpdateRequest request) {
        accessControlService.validateTenantAccess(tenantId);
        return success(merchantLegalService.saveForTenant(tenantId, request));
    }
}
