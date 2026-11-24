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
 * get/update 는 feature OFF 여도 허용(ADMIN이 토글로 켤 수 있도록).
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
        boolean enabled = sctFeatureGuard.isEnabled(tenantId);
        return SctSettingsResponse.builder()
                .linkExpiryDays(resolveLinkExpiryDays(tenantId))
                .retentionDays(resolveRetentionDays(tenantId))
                .featureEnabled(enabled)
                .build();
    }

    @Override
    @Transactional
    public SctSettingsResponse updateSettings(
            String tenantId, SctSettingsUpdateRequest request, Long actorId, String actorRole) {
        if (request == null) {
            throw new IllegalArgumentException("요청이 필요합니다.");
        }
        Integer beforeExpiry = resolveLinkExpiryDays(tenantId);
        Integer beforeRetention = resolveRetentionDays(tenantId);
        boolean beforeFeature = sctFeatureGuard.isEnabled(tenantId);

        Integer newExpiry = beforeExpiry;
        if (request.getLinkExpiryDays() != null) {
            int days = request.getLinkExpiryDays();
            if (days < SctFeatureFlagKeys.MIN_LINK_EXPIRY_DAYS
                    || days > SctFeatureFlagKeys.MAX_LINK_EXPIRY_DAYS) {
                throw new IllegalArgumentException("만료 일수는 1~30 이어야 합니다.");
            }
            upsertConfig(tenantId, SctFeatureFlagKeys.LINK_EXPIRY_DAYS, String.valueOf(days),
                    "SCT 링크 만료일수", SctFeatureFlagKeys.CONFIG_CATEGORY, actorId);
            newExpiry = days;
        }

        Integer newRetention = beforeRetention;
        if (Boolean.TRUE.equals(request.getClearRetention())) {
            upsertConfig(tenantId, SctFeatureFlagKeys.RETENTION_DAYS,
                    String.valueOf(SctFeatureFlagKeys.DEFAULT_RETENTION_DAYS),
                    "SCT 응답 보관일수", SctFeatureFlagKeys.CONFIG_CATEGORY, actorId);
            newRetention = SctFeatureFlagKeys.DEFAULT_RETENTION_DAYS;
        } else if (request.getRetentionDays() != null) {
            int days = request.getRetentionDays();
            if (days < SctFeatureFlagKeys.MIN_RETENTION_DAYS) {
                throw new IllegalArgumentException("보관 일수는 1 이상이어야 합니다.");
            }
            upsertConfig(tenantId, SctFeatureFlagKeys.RETENTION_DAYS,
                    String.valueOf(days), "SCT 응답 보관일수",
                    SctFeatureFlagKeys.CONFIG_CATEGORY, actorId);
            newRetention = days;
        }

        boolean newFeature = beforeFeature;
        if (request.getFeatureEnabled() != null) {
            newFeature = Boolean.TRUE.equals(request.getFeatureEnabled());
            upsertConfig(tenantId, SctFeatureFlagKeys.FEATURE_SCT_ENABLED,
                    String.valueOf(newFeature),
                    "SCT 온라인 질문지 기능",
                    SctFeatureFlagKeys.FEATURE_CATEGORY, actorId);
        }

        String beforeJson = "{\"linkExpiryDays\":" + beforeExpiry
                + ",\"retentionDays\":" + beforeRetention
                + ",\"featureEnabled\":" + beforeFeature + "}";
        String afterJson = "{\"linkExpiryDays\":" + newExpiry
                + ",\"retentionDays\":" + newRetention
                + ",\"featureEnabled\":" + newFeature + "}";
        AuditLog entry = AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actorId)
                .actorRole(actorRole)
                .action(AuditAction.SCT_SETTINGS_CHANGED)
                .entityType(SctConstants.ENTITY_TYPE_SETTINGS)
                .beforeJson(beforeJson)
                .afterJson(afterJson)
                .metadataJson("{\"keys\":[\"sct.link.expiry.days\",\"sct.retention.days\","
                        + "\"feature.sct.enabled\"]}")
                .build();
        auditLogService.record(entry);

        return SctSettingsResponse.builder()
                .linkExpiryDays(newExpiry)
                .retentionDays(newRetention)
                .featureEnabled(newFeature)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public int resolveLinkExpiryDays(String tenantId) {
        Optional<SystemConfig> tenantCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, SctFeatureFlagKeys.LINK_EXPIRY_DAYS);
        if (tenantCfg.isPresent() && tenantCfg.get().getConfigValue() != null
                && !tenantCfg.get().getConfigValue().isBlank()) {
            return parseLinkExpiryDays(tenantCfg.get().getConfigValue());
        }
        Optional<SystemConfig> globalCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue("", SctFeatureFlagKeys.LINK_EXPIRY_DAYS);
        if (globalCfg.isPresent() && globalCfg.get().getConfigValue() != null
                && !globalCfg.get().getConfigValue().isBlank()) {
            return parseLinkExpiryDays(globalCfg.get().getConfigValue());
        }
        return SctFeatureFlagKeys.DEFAULT_LINK_EXPIRY_DAYS;
    }

    @Override
    @Transactional(readOnly = true)
    public int resolveRetentionDays(String tenantId) {
        Optional<SystemConfig> tenantCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, SctFeatureFlagKeys.RETENTION_DAYS);
        if (tenantCfg.isPresent()) {
            return parseRetentionDays(tenantCfg.get().getConfigValue());
        }
        Optional<SystemConfig> globalCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue("", SctFeatureFlagKeys.RETENTION_DAYS);
        if (globalCfg.isPresent()) {
            return parseRetentionDays(globalCfg.get().getConfigValue());
        }
        return SctFeatureFlagKeys.DEFAULT_RETENTION_DAYS;
    }

    private void upsertConfig(
            String tenantId, String key, String value, String description,
            String category, Long actorId) {
        Optional<SystemConfig> existing = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, key);
        String actor = actorId == null ? "ADMIN" : String.valueOf(actorId);
        if (existing.isPresent()) {
            SystemConfig cfg = existing.get();
            cfg.setConfigValue(value);
            cfg.setUpdatedBy(actor);
            cfg.setDescription(description);
            cfg.setCategory(category);
            systemConfigRepository.save(cfg);
        } else {
            SystemConfig cfg = SystemConfig.builder()
                    .tenantId(tenantId)
                    .configKey(key)
                    .configValue(value)
                    .description(description)
                    .category(category)
                    .isEncrypted(false)
                    .isActive(true)
                    .createdBy(actor)
                    .updatedBy(actor)
                    .build();
            systemConfigRepository.save(cfg);
        }
    }

    private static int parseLinkExpiryDays(String raw) {
        try {
            int v = Integer.parseInt(raw.trim());
            if (v < SctFeatureFlagKeys.MIN_LINK_EXPIRY_DAYS
                    || v > SctFeatureFlagKeys.MAX_LINK_EXPIRY_DAYS) {
                return SctFeatureFlagKeys.DEFAULT_LINK_EXPIRY_DAYS;
            }
            return v;
        } catch (NumberFormatException e) {
            return SctFeatureFlagKeys.DEFAULT_LINK_EXPIRY_DAYS;
        }
    }

    private static int parseRetentionDays(String raw) {
        if (raw == null || raw.isBlank()) {
            return SctFeatureFlagKeys.DEFAULT_RETENTION_DAYS;
        }
        try {
            int v = Integer.parseInt(raw.trim());
            if (v < SctFeatureFlagKeys.MIN_RETENTION_DAYS) {
                return SctFeatureFlagKeys.DEFAULT_RETENTION_DAYS;
            }
            return v;
        } catch (NumberFormatException e) {
            return SctFeatureFlagKeys.DEFAULT_RETENTION_DAYS;
        }
    }
}
