package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import java.util.Map;

/**
 * 테넌트 스코프 포인트 정책 조회(클라이언트·체크아웃).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface PointTenantPolicyService {

    /**
     * DB 저장값과 스펙 기본값을 병합한 유효 정책을 반환한다.
     *
     * @param tenantId 테넌트 ID
     * @return MVP 정책 키 → 값 맵
     */
    Map<String, Object> getEffectivePolicies(String tenantId);

    /**
     * 체크아웃 검증용 타입 변환 정책.
     *
     * @param tenantId 테넌트 ID
     * @return 타입 변환된 정책
     */
    default EffectivePointTenantPolicies getEffectivePoliciesTyped(String tenantId) {
        return EffectivePointTenantPolicies.fromPoliciesMap(getEffectivePolicies(tenantId));
    }
}
