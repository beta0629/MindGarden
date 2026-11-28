package com.coresolution.consultation.sct.service.impl;

import java.util.Optional;
import java.util.regex.Pattern;
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

    private static final Pattern PUBLIC_CONTACT_PHONE_PATTERN =
            Pattern.compile(SctFeatureFlagKeys.PUBLIC_CONTACT_PHONE_PATTERN);

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
                .officePhone(resolvePublicOfficePhone(tenantId))
                .mobilePhone(resolvePublicMobilePhone(tenantId))
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
        String beforeOffice = resolvePublicOfficePhone(tenantId);
        String beforeMobile = resolvePublicMobilePhone(tenantId);

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

        if (request.getOfficePhone() != null) {
            String officeValue = normalizePublicContactPhone(request.getOfficePhone(), "사무실 전화");
            upsertConfig(tenantId, SctFeatureFlagKeys.PUBLIC_CONTACT_OFFICE, officeValue,
                    "SCT 공개 사무실 전화", SctFeatureFlagKeys.CONFIG_CATEGORY, actorId);
        }
        if (request.getMobilePhone() != null) {
            String mobileValue = normalizePublicContactPhone(request.getMobilePhone(), "공개 휴대폰");
            upsertConfig(tenantId, SctFeatureFlagKeys.PUBLIC_CONTACT_MOBILE, mobileValue,
                    "SCT 공개 휴대폰", SctFeatureFlagKeys.CONFIG_CATEGORY, actorId);
        }

        String afterOffice = resolvePublicOfficePhone(tenantId);
        String afterMobile = resolvePublicMobilePhone(tenantId);

        String beforeJson = "{\"linkExpiryDays\":" + beforeExpiry
                + ",\"retentionDays\":" + beforeRetention
                + ",\"featureEnabled\":" + beforeFeature
                + ",\"officePhone\":" + jsonStringOrNull(beforeOffice)
                + ",\"mobilePhone\":" + jsonStringOrNull(beforeMobile) + "}";
        String afterJson = "{\"linkExpiryDays\":" + newExpiry
                + ",\"retentionDays\":" + newRetention
                + ",\"featureEnabled\":" + newFeature
                + ",\"officePhone\":" + jsonStringOrNull(afterOffice)
                + ",\"mobilePhone\":" + jsonStringOrNull(afterMobile) + "}";
        AuditLog entry = AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(actorId)
                .actorRole(actorRole)
                .action(AuditAction.SCT_SETTINGS_CHANGED)
                .entityType(SctConstants.ENTITY_TYPE_SETTINGS)
                .beforeJson(beforeJson)
                .afterJson(afterJson)
                .metadataJson("{\"keys\":[\"sct.link.expiry.days\",\"sct.retention.days\","
                        + "\"feature.sct.enabled\",\""
                        + SctFeatureFlagKeys.PUBLIC_CONTACT_OFFICE + "\",\""
                        + SctFeatureFlagKeys.PUBLIC_CONTACT_MOBILE + "\"]}")
                .build();
        auditLogService.record(entry);

        return SctSettingsResponse.builder()
                .linkExpiryDays(newExpiry)
                .retentionDays(newRetention)
                .featureEnabled(newFeature)
                .officePhone(afterOffice)
                .mobilePhone(afterMobile)
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

    @Override
    @Transactional(readOnly = true)
    public String resolvePublicOfficePhone(String tenantId) {
        return resolveConfigString(tenantId, SctFeatureFlagKeys.PUBLIC_CONTACT_OFFICE);
    }

    @Override
    @Transactional(readOnly = true)
    public String resolvePublicMobilePhone(String tenantId) {
        return resolveConfigString(tenantId, SctFeatureFlagKeys.PUBLIC_CONTACT_MOBILE);
    }

    private String resolveConfigString(String tenantId, String configKey) {
        Optional<SystemConfig> tenantCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, configKey);
        if (tenantCfg.isPresent() && tenantCfg.get().getConfigValue() != null
                && !tenantCfg.get().getConfigValue().isBlank()) {
            return tenantCfg.get().getConfigValue().trim();
        }
        Optional<SystemConfig> globalCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue("", configKey);
        if (globalCfg.isPresent() && globalCfg.get().getConfigValue() != null
                && !globalCfg.get().getConfigValue().isBlank()) {
            return globalCfg.get().getConfigValue().trim();
        }
        return null;
    }

    /**
     * null 요청은 호출하지 않음. blank → 빈 문자열(테넌트 행 비움). 그 외 형식 검증.
     *
     * @param raw   요청 값(non-null)
     * @param label 오류 메시지용 필드명
     * @return upsert 할 값(빈 문자열 또는 정규화된 번호)
     * @throws IllegalArgumentException 형식 오류
     */
    private static String normalizePublicContactPhone(String raw, String label) {
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        if (trimmed.length() > SctFeatureFlagKeys.PUBLIC_CONTACT_PHONE_MAX_LENGTH
                || !PUBLIC_CONTACT_PHONE_PATTERN.matcher(trimmed).matches()
                || trimmed.chars().noneMatch(Character::isDigit)) {
            throw new IllegalArgumentException(
                    label + "은(는) 숫자와 하이픈만 사용하며 최대 "
                            + SctFeatureFlagKeys.PUBLIC_CONTACT_PHONE_MAX_LENGTH
                            + "자여야 합니다.");
        }
        return trimmed;
    }

    private static String jsonStringOrNull(String value) {
        if (value == null) {
            return "null";
        }
        return "\"" + value + "\"";
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
