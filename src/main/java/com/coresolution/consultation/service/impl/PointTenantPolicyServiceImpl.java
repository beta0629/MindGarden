package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PointTenantPolicyKeys;
import com.coresolution.consultation.entity.PointTenantPolicy;
import com.coresolution.consultation.repository.PointTenantPolicyRepository;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 테넌트 포인트 정책 조회(클라이언트·체크아웃).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Service
@RequiredArgsConstructor
public class PointTenantPolicyServiceImpl implements PointTenantPolicyService {

    private final PointTenantPolicyRepository pointTenantPolicyRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getEffectivePolicies(String tenantId) {
        String tid = requireTenant(tenantId);
        Map<String, Object> merged = new LinkedHashMap<>(PointTenantPolicyKeys.defaultPolicies());
        List<PointTenantPolicy> rows = pointTenantPolicyRepository.findByTenantIdAndIsDeletedFalse(tid);
        for (PointTenantPolicy row : rows) {
            if (!PointTenantPolicyKeys.mvpKeys().contains(row.getPolicyKey())) {
                continue;
            }
            merged.put(row.getPolicyKey(), parseValue(row.getValueJson()));
        }
        return Map.copyOf(merged);
    }

    private Object parseValue(String json) {
        if (!StringUtils.hasText(json)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("정책 JSON 파싱 실패", e);
        }
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }
}
