package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PointTenantPolicyKeys;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.entity.PointTenantPolicy;
import com.coresolution.consultation.repository.PointTenantPolicyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link PointTenantPolicyServiceImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PointTenantPolicyServiceImpl")
class PointTenantPolicyServiceImplTest {

    private static final String TENANT = "tenant-policy";

    @Mock
    private PointTenantPolicyRepository pointTenantPolicyRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PointTenantPolicyServiceImpl service;

    @Test
    @DisplayName("DB 행 없으면 스펙 기본값 반환")
    void getEffectivePolicies_noRows_returnsDefaults() {
        when(pointTenantPolicyRepository.findByTenantIdAndIsDeletedFalse(TENANT)).thenReturn(List.of());

        Map<String, Object> policies = service.getEffectivePolicies(TENANT);

        assertEquals(PointTenantPolicyKeys.defaultPolicies(), policies);
        EffectivePointTenantPolicies typed = EffectivePointTenantPolicies.fromPoliciesMap(policies);
        assertEquals(0L, typed.minOrderForRedeemMinor());
        assertEquals(0L, typed.maxRedeemPerOrderMinor());
        assertTrue(typed.allowPgMix());
        assertTrue(typed.allowPointsOnly());
    }

    @Test
    @DisplayName("DB 저장값이 기본값을 덮어씀")
    void getEffectivePolicies_withRows_mergesOverrides() {
        PointTenantPolicy minOrder = policyRow(PointTenantPolicyKeys.MIN_ORDER_FOR_REDEEM, "{\"amountMinor\":5000}");
        PointTenantPolicy allowMix = policyRow(PointTenantPolicyKeys.ALLOW_PG_MIX, "false");
        when(pointTenantPolicyRepository.findByTenantIdAndIsDeletedFalse(TENANT))
                .thenReturn(List.of(minOrder, allowMix));

        EffectivePointTenantPolicies typed = service.getEffectivePoliciesTyped(TENANT);

        assertEquals(5_000L, typed.minOrderForRedeemMinor());
        assertFalse(typed.allowPgMix());
        assertTrue(typed.allowPointsOnly());
    }

    private static PointTenantPolicy policyRow(String key, String json) {
        PointTenantPolicy row = new PointTenantPolicy();
        row.setTenantId(TENANT);
        row.setPolicyKey(key);
        row.setValueJson(json);
        return row;
    }
}
