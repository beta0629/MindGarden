package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.PointTenantPoliciesPatchRequest;
import com.coresolution.consultation.dto.shop.admin.PointTenantPoliciesResponse;

/**
 * 테넌트 포인트·리워드 정책 조회·수정(MVP).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface AdminPointTenantPolicyService {

    PointTenantPoliciesResponse getPolicies(String tenantId);

    PointTenantPoliciesResponse patchPolicies(String tenantId, PointTenantPoliciesPatchRequest request);
}
