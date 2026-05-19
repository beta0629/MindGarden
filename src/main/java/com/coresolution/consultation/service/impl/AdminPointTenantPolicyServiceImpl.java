package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PointTenantPolicyKeys;
import com.coresolution.consultation.dto.shop.admin.PointTenantPoliciesPatchRequest;
import com.coresolution.consultation.dto.shop.admin.PointTenantPoliciesResponse;
import com.coresolution.consultation.entity.PointTenantPolicy;
import com.coresolution.consultation.repository.PointTenantPolicyRepository;
import com.coresolution.consultation.service.AdminPointTenantPolicyService;
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
 * 테넌트 포인트 정책 서비스(MVP).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Service
@RequiredArgsConstructor
public class AdminPointTenantPolicyServiceImpl implements AdminPointTenantPolicyService {

    private final PointTenantPolicyRepository pointTenantPolicyRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public PointTenantPoliciesResponse getPolicies(String tenantId) {
        String tid = requireTenant(tenantId);
        Map<String, Object> merged = new LinkedHashMap<>(PointTenantPolicyKeys.defaultPolicies());
        List<PointTenantPolicy> rows = pointTenantPolicyRepository.findByTenantIdAndIsDeletedFalse(tid);
        for (PointTenantPolicy row : rows) {
            if (!PointTenantPolicyKeys.mvpKeys().contains(row.getPolicyKey())) {
                continue;
            }
            merged.put(row.getPolicyKey(), parseValue(row.getValueJson()));
        }
        return new PointTenantPoliciesResponse(tid, merged);
    }

    @Override
    @Transactional
    public PointTenantPoliciesResponse patchPolicies(String tenantId, PointTenantPoliciesPatchRequest request) {
        String tid = requireTenant(tenantId);
        for (Map.Entry<String, Object> entry : request.policies().entrySet()) {
            String key = entry.getKey();
            if (!PointTenantPolicyKeys.mvpKeys().contains(key)) {
                throw new IllegalArgumentException("지원하지 않는 policy_key 입니다: " + key);
            }
            String json = writeValue(entry.getValue());
            PointTenantPolicy row = pointTenantPolicyRepository
                    .findByTenantIdAndPolicyKeyAndIsDeletedFalse(tid, key)
                    .orElseGet(() -> {
                        PointTenantPolicy created = new PointTenantPolicy();
                        created.setTenantId(tid);
                        created.setPolicyKey(key);
                        return created;
                    });
            row.setValueJson(json);
            pointTenantPolicyRepository.save(row);
        }
        return getPolicies(tid);
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

    private String writeValue(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("정책 값을 JSON으로 직렬화할 수 없습니다.", e);
        }
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }
}
