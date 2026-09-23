package com.coresolution.core.service.ops;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.Tenant.TenantStatus;
import com.coresolution.core.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Ops Portal 테넌트 목록·정지/재개 서비스.
 * CLOSED/삭제는 제공하지 않음. ACTIVE ↔ SUSPENDED 만 허용.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantOpsService {

    private final TenantRepository tenantRepository;

    /**
     * 삭제되지 않은 테넌트 목록 (subdomain 포함).
     *
     * @return Ops 목록 payload
     */
    public List<Map<String, Object>> listTenants() {
        List<Tenant> tenants = tenantRepository.findAllNotDeletedOrderByName();
        return tenants.stream()
                .map(this::toListItem)
                .collect(Collectors.toList());
    }

    /**
     * 테넌트 상세(목록 필드와 동일) — ⋯ 상세 모달용.
     *
     * @param tenantId 경로 테넌트 ID
     * @return 상세 map
     * @throws IllegalArgumentException 테넌트 없음
     */
    public Map<String, Object> getTenantDetail(String tenantId) {
        Tenant tenant = requireTenant(tenantId);
        return toListItem(tenant);
    }

    /**
     * ACTIVE → SUSPENDED.
     *
     * @param tenantId 경로 테넌트 ID
     * @return 갱신된 목록 항목
     * @throws IllegalArgumentException 테넌트 없음·상태 불가
     */
    @Transactional
    public Map<String, Object> suspendTenant(String tenantId) {
        Tenant tenant = requireTenant(tenantId);
        if (tenant.getStatus() != TenantStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "운영중 상태의 테넌트만 정지할 수 있습니다. 현재: "
                            + (tenant.getStatus() != null ? tenant.getStatus().name() : "null"));
        }
        tenant.setStatus(TenantStatus.SUSPENDED);
        Tenant saved = tenantRepository.save(tenant);
        log.info("Ops 테넌트 정지: tenantId={}", tenantId);
        return toListItem(saved);
    }

    /**
     * SUSPENDED → ACTIVE.
     *
     * @param tenantId 경로 테넌트 ID
     * @return 갱신된 목록 항목
     * @throws IllegalArgumentException 테넌트 없음·상태 불가
     */
    @Transactional
    public Map<String, Object> resumeTenant(String tenantId) {
        Tenant tenant = requireTenant(tenantId);
        if (tenant.getStatus() != TenantStatus.SUSPENDED) {
            throw new IllegalArgumentException(
                    "정지 상태의 테넌트만 재개할 수 있습니다. 현재: "
                            + (tenant.getStatus() != null ? tenant.getStatus().name() : "null"));
        }
        tenant.setStatus(TenantStatus.ACTIVE);
        Tenant saved = tenantRepository.save(tenant);
        log.info("Ops 테넌트 재개: tenantId={}", tenantId);
        return toListItem(saved);
    }

    private Tenant requireTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("테넌트 ID가 필요합니다.");
        }
        return tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId.trim())
                .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));
    }

    private Map<String, Object> toListItem(Tenant tenant) {
        Map<String, Object> tenantMap = new HashMap<>();
        tenantMap.put("tenantId", tenant.getTenantId());
        tenantMap.put("name", tenant.getName());
        tenantMap.put("businessType", tenant.getBusinessType());
        tenantMap.put("status", tenant.getStatus() != null ? tenant.getStatus().name() : null);
        tenantMap.put("subdomain", tenant.getSubdomain());
        tenantMap.put("contactEmail", tenant.getContactEmail());
        tenantMap.put("contactPhone", tenant.getContactPhone());
        tenantMap.put("contactPerson", tenant.getContactPerson());
        return tenantMap;
    }
}
