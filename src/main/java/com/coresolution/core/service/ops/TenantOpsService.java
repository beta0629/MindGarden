package com.coresolution.core.service.ops;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.Tenant.TenantStatus;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.tenant.TenantCloseMessages;
import com.coresolution.core.util.OpsPermissionUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Ops Portal 테넌트 목록·정지/재개 서비스.
 * 종료는 {@link TenantCloseService}. ACTIVE → SUSPENDED 만 정지하고, 재개는 SUSPENDED → ACTIVE 만 허용한다.
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
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * @param includeClosed true 이면 CLOSED 를 포함한다
     * @return Ops 목록 payload
     */
    public List<Map<String, Object>> listTenants(boolean includeClosed) {
        List<Tenant> tenants = includeClosed
                ? tenantRepository.findOpsTenantsIncludingClosed()
                : tenantRepository.findOpsVisibleTenants();
        return tenants.stream()
                .map(TenantOpsListItem::from)
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
        return TenantOpsListItem.from(tenant);
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
        auditLogService.record(AuditLog.builder()
                .tenantId(saved.getTenantId())
                .actorRole(TenantCloseMessages.ACTOR_ROLE_OPS)
                .action(AuditAction.TENANT_SUSPENDED)
                .entityType(TenantCloseMessages.ENTITY_TYPE_TENANT)
                .entityId(saved.getId())
                .metadataJson(suspendMetadataJson())
                .build());
        log.info("Ops 테넌트 정지: tenantId={}", tenantId);
        return TenantOpsListItem.from(saved);
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
        return TenantOpsListItem.from(saved);
    }

    private String suspendMetadataJson() {
        try {
            return objectMapper.writeValueAsString(
                    java.util.Map.of("actor", OpsPermissionUtils.currentActorName()));
        } catch (JsonProcessingException ex) {
            log.warn("정지 감사 metadata 직렬화 실패: {}", ex.getClass().getSimpleName());
            return "{}";
        }
    }

    private Tenant requireTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("테넌트 ID가 필요합니다.");
        }
        return tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId.trim())
                .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));
    }
}
