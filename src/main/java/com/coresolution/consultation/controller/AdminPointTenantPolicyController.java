package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.shop.admin.PointTenantPoliciesPatchRequest;
import com.coresolution.consultation.dto.shop.admin.PointTenantPoliciesResponse;
import com.coresolution.consultation.service.AdminPointTenantPolicyService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 어드민 — 포인트·리워드 정책 API(MVP).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@RestController
@RequestMapping("/api/v1/admin/shop/point-policies")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminPointTenantPolicyController extends BaseApiController {

    private final AdminPointTenantPolicyService adminPointTenantPolicyService;

    @GetMapping
    public ResponseEntity<ApiResponse<PointTenantPoliciesResponse>> getPolicies() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(adminPointTenantPolicyService.getPolicies(tenantId));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<PointTenantPoliciesResponse>> patchPolicies(
            @Valid @RequestBody PointTenantPoliciesPatchRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return updated(adminPointTenantPolicyService.patchPolicies(tenantId, request));
    }
}
