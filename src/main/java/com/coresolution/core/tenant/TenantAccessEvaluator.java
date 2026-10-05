package com.coresolution.core.tenant;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.Tenant.TenantStatus;
import com.coresolution.core.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 테넌트 ID 로 상태를 읽어 {@link TenantAccessPolicy} 에만 판정을 맡긴다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Component
@RequiredArgsConstructor
public class TenantAccessEvaluator {

    private final TenantRepository tenantRepository;
    private final TenantAccessPolicy tenantAccessPolicy;

    /**
     * @param tenantId    테넌트 ID. 비어 있으면 상태 없음으로 판정
     * @param requestPath 요청 경로. 없으면 null
     * @return 정책 판정
     */
    public TenantAccessDecision decide(String tenantId, String requestPath) {
        if (tenantAccessPolicy.isOpsPath(requestPath)) {
            return TenantAccessDecision.ALLOW;
        }
        TenantStatus status = resolveStatus(tenantId);
        return tenantAccessPolicy.decide(status, requestPath);
    }

    private TenantStatus resolveStatus(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        return tenantRepository.findByTenantId(tenantId.trim())
                .map(Tenant::getStatus)
                .orElse(null);
    }
}
