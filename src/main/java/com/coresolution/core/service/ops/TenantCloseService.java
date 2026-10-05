package com.coresolution.core.service.ops;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.Tenant.TenantStatus;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.tenant.TenantCloseDecision;
import com.coresolution.core.tenant.TenantCloseMessages;
import com.coresolution.core.tenant.TenantClosePolicy;
import com.coresolution.core.tenant.TenantCloseProperties;
import com.coresolution.core.tenant.TenantCloseRejectedException;
import com.coresolution.core.tenant.TenantSettingsIdentityCleaner;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트 종료(close).
 *
 * <p>행은 지우지 않고 status=CLOSED, is_deleted=true, deleted_at, 감사 로그만 남긴다.
 * subdomain 과 settings_json 의 subdomain·domain 비우기는
 * {@code tenant.close.release-identity} 가 켜진 때(기본 꺼짐, 마이그레이션 후)만 한다.
 * 관련 데이터 파기는 보관 기간 정책이 정해진 뒤의 일이다.</p>
 *
 * <p>TODO: 보관 기간이 지난 종료 테넌트의 데이터 파기 배치는 이 서비스에 넣지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Service
public class TenantCloseService {

    private final TenantRepository tenantRepository;
    private final TenantClosePolicy tenantClosePolicy;
    private final TenantCloseProperties tenantCloseProperties;
    private final AuditLogService auditLogService;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    /**
     * 운영용 생성자. 시각은 Asia/Seoul.
     *
     * @param tenantRepository  테넌트 저장소
     * @param tenantClosePolicy 종료 판정
     * @param auditLogService   감사 로그
     */
    @Autowired
    public TenantCloseService(
            TenantRepository tenantRepository,
            TenantClosePolicy tenantClosePolicy,
            TenantCloseProperties tenantCloseProperties,
            AuditLogService auditLogService) {
        this(tenantRepository, tenantClosePolicy, tenantCloseProperties, auditLogService,
                Clock.system(TenantCloseMessages.ZONE_SEOUL), new ObjectMapper());
    }

    /**
     * @param clock        종료 시각
     * @param objectMapper settings_json
     */
    TenantCloseService(
            TenantRepository tenantRepository,
            TenantClosePolicy tenantClosePolicy,
            TenantCloseProperties tenantCloseProperties,
            AuditLogService auditLogService,
            Clock clock,
            ObjectMapper objectMapper) {
        this.tenantRepository = tenantRepository;
        this.tenantClosePolicy = tenantClosePolicy;
        this.tenantCloseProperties = tenantCloseProperties;
        this.auditLogService = auditLogService;
        this.clock = clock;
        this.objectMapper = objectMapper;
    }

    /**
     * SUSPENDED 테넌트를 종료한다.
     *
     * @param tenantId 테넌트 ID
     * @param closedBy 처리자. 컬럼 추가 전까지 감사 metadata 에만 남긴다
     * @return 갱신된 목록 항목
     */
    @Transactional
    public Map<String, Object> closeTenant(String tenantId, String closedBy) {
        Tenant tenant = requireTenant(tenantId);
        LocalDateTime now = LocalDateTime.now(clock);
        TenantCloseDecision decision = tenantClosePolicy.evaluate(tenant, now);
        if (decision != TenantCloseDecision.ALLOWED) {
            throw new TenantCloseRejectedException(decision);
        }

        String previousSubdomain = tenant.getSubdomain();
        String previousDomain = TenantSettingsIdentityCleaner.extractDomain(
                tenant.getSettingsJson(), objectMapper);
        String normalizedClosedBy = normalizeClosedBy(closedBy);
        String beforeJson = writeJson(beforeSnapshot(tenant, previousSubdomain, previousDomain));

        // TODO: 마이그레이션 후 활성화 — previous_subdomain, previous_domain, suspended_at, closed_by
        // 컬럼이 없는 동안 엔티티에 매핑하지 않는다. 원본은 감사 로그에 남긴다.
        stageDeferredCloseColumns(previousSubdomain, previousDomain, normalizedClosedBy);

        tenant.setStatus(TenantStatus.CLOSED);
        tenant.setIsDeleted(true);
        tenant.setDeletedAt(now);
        if (tenantCloseProperties.isReleaseIdentity()) {
            releaseIdentity(tenant);
        }

        Tenant saved = tenantRepository.save(tenant);
        auditLogService.record(AuditLog.builder()
                .tenantId(saved.getTenantId())
                .actorRole(TenantCloseMessages.ACTOR_ROLE_OPS)
                .action(AuditAction.TENANT_CLOSED)
                .entityType(TenantCloseMessages.ENTITY_TYPE_TENANT)
                .entityId(saved.getId())
                .beforeJson(beforeJson)
                .afterJson(writeJson(afterSnapshot(saved)))
                .metadataJson(writeJson(metadata(normalizedClosedBy)))
                .build());
        log.info("Ops 테넌트 종료: tenantId={}", saved.getTenantId());
        return TenantOpsListItem.from(saved);
    }

    /**
     * 마이그레이션 후 활성화. subdomain 을 비우고 settings_json 의 subdomain·domain 을 지운다.
     * previous_* 컬럼 매핑이 켜진 커밋과 함께 {@code tenant.close.release-identity} 를 켠다.
     *
     * @param tenant 종료 대상
     */
    private void releaseIdentity(Tenant tenant) {
        tenant.setSubdomain(null);
        tenant.setSettingsJson(TenantSettingsIdentityCleaner.stripSubdomainAndDomain(
                tenant.getSettingsJson(), objectMapper));
    }

    /**
     * 컬럼이 생기기 전에는 값을 엔티티에 쓰지 않는다.
     * 시그니처는 마이그레이션 후 대입할 인자를 고정하기 위한 것이다.
     *
     * @param previousSubdomain 비우기 전 subdomain
     * @param previousDomain    settings_json domain
     * @param closedBy          처리자
     */
    private void stageDeferredCloseColumns(
            String previousSubdomain, String previousDomain, String closedBy) {
        log.debug(
                "종료 식별자 컬럼 매핑 대기: subdomainPresent={}, domainPresent={}, closedByPresent={}",
                previousSubdomain != null && !previousSubdomain.isBlank(),
                previousDomain != null && !previousDomain.isBlank(),
                closedBy != null && !closedBy.isBlank());
    }

    private Tenant requireTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new TenantCloseRejectedException(
                    TenantCloseMessages.CODE_TENANT_NOT_FOUND,
                    TenantCloseMessages.MESSAGE_TENANT_NOT_FOUND);
        }
        return tenantRepository.findByTenantId(tenantId.trim())
                .orElseThrow(() -> new TenantCloseRejectedException(
                        TenantCloseMessages.CODE_TENANT_NOT_FOUND,
                        TenantCloseMessages.MESSAGE_TENANT_NOT_FOUND));
    }

    private static String normalizeClosedBy(String closedBy) {
        if (closedBy == null || closedBy.isBlank()) {
            return TenantCloseMessages.ACTOR_UNKNOWN;
        }
        String trimmed = closedBy.trim();
        if (trimmed.length() <= TenantCloseMessages.CLOSED_BY_MAX_LENGTH) {
            return trimmed;
        }
        return trimmed.substring(0, TenantCloseMessages.CLOSED_BY_MAX_LENGTH);
    }

    private static Map<String, Object> beforeSnapshot(
            Tenant tenant, String previousSubdomain, String previousDomain) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put(TenantOpsListItem.STATUS, tenant.getStatus() != null ? tenant.getStatus().name() : null);
        snapshot.put(TenantCloseMessages.SETTINGS_KEY_SUBDOMAIN, previousSubdomain);
        snapshot.put(TenantCloseMessages.SETTINGS_KEY_DOMAIN, previousDomain);
        return snapshot;
    }

    private static Map<String, Object> afterSnapshot(Tenant tenant) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put(TenantOpsListItem.STATUS, TenantStatus.CLOSED.name());
        snapshot.put(TenantCloseMessages.SETTINGS_KEY_SUBDOMAIN, tenant.getSubdomain());
        snapshot.put("isDeleted", Boolean.TRUE.equals(tenant.getIsDeleted()));
        return snapshot;
    }

    private static Map<String, Object> metadata(String closedBy) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("closedBy", closedBy);
        return metadata;
    }

    private String writeJson(Map<String, Object> body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException ex) {
            throw new TenantCloseRejectedException(
                    TenantCloseMessages.CODE_SETTINGS_UNREADABLE,
                    TenantCloseMessages.MESSAGE_SETTINGS_UNREADABLE);
        }
    }
}
