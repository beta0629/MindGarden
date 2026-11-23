package com.coresolution.consultation.sct.service.impl;

import java.util.Optional;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import com.coresolution.consultation.sct.dto.SctSettingsResponse;
import com.coresolution.consultation.sct.dto.SctSettingsUpdateRequest;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SCT 설정 서비스 구현.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctSettingsServiceImpl implements SctSettingsService {

    private final SystemConfigRepository systemConfigRepository;
    private final AuditLogService auditLogService;
    private final SctFeatureGuard sctFeatureGuard;

    @Override
    @Transactional(readOnly = true)
    public SctSettingsResponse getSettings(String tenantId) {
        sctFeatureGuard.requireEnabled(tenantId);
        return SctSettingsResponse.builder()
                .linkExpiryDays(resolveLinkExpiryDays(tenantId))
                .retentionDays(readRetentionDays(tenantId))
                .featureEnabled(true)
                .build();
    }

    @Override
    @Transactional
    public SctSettingsResponse updateSettings(
            String tenantId, SctSettingsUpdateRequest request, Long actorId, String actorRole) {
        sctFeatureGuard.requireEnabled(tenantId);
        if (request == null) {
            throw new IllegalArgumentException("요청이 필요합니다.");
        }
        Integer beforeExpiry = resolveLinkExpiryDays(tenantId);
        Integer beforeRetention = readRetentionDays(tenantId);

        Integer newExpiry = beforeExpiry;
        if (request.getLinkExpiryDays() != null) {
            int days = request.getLinkExpiryDays();
            if (days < SctFeatureFlagKeys.MIN_LINK_EXPIRY_DAYS
                    || days > SctFeatureFlagKeys.MAX_LINK_EXPIRY_DAYS) {
                throw new IllegalArgumentException("만료 일수는 1~30 이어야 합니다.");
            }
            upsertConfig(tenantId, SctFeatureFlagKeys.LINK_EXPIRY_DAYS, String.valueOf(days),
                    "SCT 링크 만료일수", actorId);
            newExpiry = days;
        }

        Integer newRetention = beforeRetention;
        if (Boolean.TRUE.equals(request.getClearRetention())) {
            upsertConfig(tenantId, SctFeatureFlagKeys.RETENTION_DAYS, null,
                    "SCT 응답 보관일수", actorId);
            newRetention = null;
        } else if (request.getRetentionDays() != null) {
            upsertConfig(tenantId, SctFeatureFlagKeys.RETENTION_DAYS,
                    String.valueOf(request.getRetentionDays()), "SCT 응답 보관일수", actorId);
            newRetention = request.getRetentionDays();
        }

        String beforeJson = "{\"linkExpiryDays\":" + beforeExpiry
                + ",\"retentionDays\":" + (beforeRetention == null ? "null" : beforeRetention) + "}";
        String afterJson = "{\"linkExpiryDays\":" + newExpiry
                + ",\"retentionDays\":" + (newRetention == null ? "null" : newRetention) + "}";
        AuditLog entry = AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actorId)
                .actorRole(actorRole)
                .action(AuditAction.SCT_SETTINGS_CHANGED)
                .entityType(SctConstants.ENTITY_TYPE_SETTINGS)
                .beforeJson(beforeJson)
                .afterJson(afterJson)
                .metadataJson("{\"keys\":[\"sct.link.expiry.days\",\"sct.retention.days\"]}")
                .build();
        auditLogService.record(entry);

        return SctSettingsResponse.builder()
                .linkExpiryDays(newExpiry)
                .retentionDays(newRetention)
                .featureEnabled(true)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public int resolveLinkExpiryDays(String tenantId) {
        Optional<SystemConfig> tenantCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, SctFeatureFlagKeys.LINK_EXPIRY_DAYS);
        if (tenantCfg.isPresent() && tenantCfg.get().getConfigValue() != null
                && !tenantCfg.get().getConfigValue().isBlank()) {
            return parseDays(tenantCfg.get().getConfigValue(), SctFeatureFlagKeys.DEFAULT_LINK_EXPIRY_DAYS);
        }
        Optional<SystemConfig> globalCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue("", SctFeatureFlagKeys.LINK_EXPIRY_DAYS);
        if (globalCfg.isPresent() && globalCfg.get().getConfigValue() != null
                && !globalCfg.get().getConfigValue().isBlank()) {
            return parseDays(globalCfg.get().getConfigValue(), SctFeatureFlagKeys.DEFAULT_LINK_EXPIRY_DAYS);
        }
        return SctFeatureFlagKeys.DEFAULT_LINK_EXPIRY_DAYS;
    }

    private Integer readRetentionDays(String tenantId) {
        Optional<SystemConfig> tenantCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, SctFeatureFlagKeys.RETENTION_DAYS);
        if (tenantCfg.isPresent()) {
            String v = tenantCfg.get().getConfigValue();
            if (v == null || v.isBlank()) {
                return null;
            }
            return Integer.parseInt(v.trim());
        }
        Optional<SystemConfig> globalCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue("", SctFeatureFlagKeys.RETENTION_DAYS);
        if (globalCfg.isEmpty()) {
            return null;
        }
        String v = globalCfg.get().getConfigValue();
        if (v == null || v.isBlank()) {
            return null;
        }
        return Integer.parseInt(v.trim());
    }

    private void upsertConfig(String tenantId, String key, String value, String description, Long actorId) {
        Optional<SystemConfig> existing = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, key);
        String actor = actorId == null ? "ADMIN" : String.valueOf(actorId);
        if (existing.isPresent()) {
            SystemConfig cfg = existing.get();
            cfg.setConfigValue(value);
            cfg.setUpdatedBy(actor);
            cfg.setDescription(description);
            cfg.setCategory(SctFeatureFlagKeys.CONFIG_CATEGORY);
            systemConfigRepository.save(cfg);
        } else {
            SystemConfig cfg = SystemConfig.builder()
                    .tenantId(tenantId)
                    .configKey(key)
                    .configValue(value)
                    .description(description)
                    .category(SctFeatureFlagKeys.CONFIG_CATEGORY)
                    .isEncrypted(false)
                    .isActive(true)
                    .createdBy(actor)
                    .updatedBy(actor)
                    .build();
            systemConfigRepository.save(cfg);
        }
    }

    private static int parseDays(String raw, int defaultValue) {
        try {
            int v = Integer.parseInt(raw.trim());
            if (v < SctFeatureFlagKeys.MIN_LINK_EXPIRY_DAYS || v > SctFeatureFlagKeys.MAX_LINK_EXPIRY_DAYS) {
                return defaultValue;
            }
            return v;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
