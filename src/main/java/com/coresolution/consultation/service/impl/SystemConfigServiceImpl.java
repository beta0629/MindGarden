package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.Set;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.dto.NotificationSchedulerFlagDto;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.util.EncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 시스템 설정 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigServiceImpl implements SystemConfigService {
    
    private final SystemConfigRepository systemConfigRepository;
    
    @Override
    public Optional<String> getConfigValue(String configKey) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, configKey)
                .map(config -> {
                    if (config.getIsEncrypted() && config.getConfigValue() != null) {
                        try {
                            return EncryptionUtil.decrypt(config.getConfigValue());
                        } catch (Exception e) {
                            log.error("설정 복호화 실패: {}", configKey, e);
                            return config.getConfigValue(); // 복호화 실패시 원본 반환
                        }
                    }
                    return config.getConfigValue();
                });
    }
    
    @Override
    public String getConfigValue(String configKey, String defaultValue) {
        return getConfigValue(configKey).orElse(defaultValue);
    }
    
    @Override
    @Transactional
    public void setConfigValue(String configKey, String configValue, String description, String category) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<SystemConfig> existingConfig = systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, configKey);
        
        // 암호화 여부 결정
        boolean isEncrypted = configKey.contains("KEY") || configKey.contains("SECRET") || configKey.contains("PASSWORD");
        String finalValue = configValue;
        
        // 암호화가 필요한 경우 암호화
        if (isEncrypted && configValue != null && !configValue.isEmpty()) {
            try {
                finalValue = EncryptionUtil.encrypt(configValue);
                log.info("설정 값 암호화 완료: {}", configKey);
            } catch (Exception e) {
                log.error("설정 값 암호화 실패: {}", configKey, e);
                throw new RuntimeException("암호화 실패", e);
            }
        }
        
        if (existingConfig.isPresent()) {
            // 기존 설정 업데이트
            SystemConfig config = existingConfig.get();
            config.setConfigValue(finalValue);
            config.setDescription(description);
            config.setCategory(category);
            config.setIsEncrypted(isEncrypted);
            config.setUpdatedBy("SYSTEM");
            systemConfigRepository.save(config);
            log.info("설정 업데이트: {} = {} (암호화: {})", configKey, 
                    isEncrypted ? "[암호화됨]" : configValue, isEncrypted);
        } else {
            // 새 설정 생성
            SystemConfig config = SystemConfig.builder()
                    .tenantId(tenantId)
                    .configKey(configKey)
                    .configValue(finalValue)
                    .description(description)
                    .category(category)
                    .isEncrypted(isEncrypted)
                    .isActive(true)
                    .createdBy("SYSTEM")
                    .updatedBy("SYSTEM")
                    .build();
            systemConfigRepository.save(config);
            log.info("새 설정 생성: {} = {} (암호화: {})", configKey, 
                    isEncrypted ? "[암호화됨]" : configValue, isEncrypted);
        }
    }
    
    @Override
    public List<String> getConfigsByCategory(String category) {
        return systemConfigRepository.findByCategoryAndIsActiveTrue(category)
                .stream()
                .map(SystemConfig::getConfigValue)
                .toList();
    }
    
    @Override
    public String getOpenAIApiKey() {
        return getConfigValue("OPENAI_API_KEY", "");
    }
    
    @Override
    public String getOpenAIApiUrl() {
        String defaultUrl = "https://api.openai.com/v1/chat/completions";
        String value = getConfigValue("OPENAI_API_URL", defaultUrl);
        return (value != null && !value.isBlank()) ? value : defaultUrl;
    }
    
    @Override
    public String getOpenAIModel() {
        String defaultModel = "gpt-4o-mini";
        String value = getConfigValue("OPENAI_MODEL", defaultModel);
        return (value != null && !value.isBlank()) ? value : defaultModel;
    }
    
    private static final String DEFAULT_AI_PROVIDER = "openai";
    private static final Map<String, String> PROVIDER_PREFIX = Map.of(
            "openai", "OPENAI",
            "gemini", "GEMINI",
            "claude", "CLAUDE",
            "replicate", "REPLICATE"
    );
    private static final String DEFAULT_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
    private static final Map<String, String> DEFAULT_API_URL = Map.of(
            "openai", "https://api.openai.com/v1/chat/completions",
            "gemini", DEFAULT_GEMINI_API_URL,
            "claude", "",
            "replicate", ""
    );
    private static final Map<String, String> DEFAULT_MODEL = Map.of(
            "openai", "gpt-4o-mini",
            // Google: gemini-2.0-flash 는 신규 키에서 404 — 비어 있을 때는 2.5-flash 권장
            "gemini", "gemini-2.5-flash",
            "claude", "claude-3-5-sonnet-20241022",
            "replicate", ""
    );
    
    @Override
    public String getAiDefaultProvider() {
        String value = getConfigValue("AI_DEFAULT_PROVIDER", "").trim().toLowerCase();
        if (value.isEmpty() || !PROVIDER_PREFIX.containsKey(value)) {
            return DEFAULT_AI_PROVIDER;
        }
        return value;
    }
    
    @Override
    @Transactional
    public void setAiDefaultProvider(String providerId) {
        String normalized = providerId != null ? providerId.trim().toLowerCase() : "";
        if (normalized.isEmpty() || !PROVIDER_PREFIX.containsKey(normalized)) {
            normalized = DEFAULT_AI_PROVIDER;
        }
        setConfigValue("AI_DEFAULT_PROVIDER", normalized, "기본 AI 프로바이더 (openai|gemini|claude|replicate)", "AI");
    }
    
    @Override
    public String getApiKeyForProvider(String providerId) {
        String key = providerId != null ? providerId.trim().toLowerCase() : "";
        String prefix = PROVIDER_PREFIX.get(key);
        if (prefix == null) {
            return "";
        }
        return getConfigValue(prefix + "_API_KEY", "");
    }
    
    @Override
    public String getApiUrlForProvider(String providerId) {
        String key = providerId != null ? providerId.trim().toLowerCase() : "";
        String prefix = PROVIDER_PREFIX.get(key);
        if (prefix == null) {
            return "";
        }
        String defaultUrl = DEFAULT_API_URL.getOrDefault(key, "");
        String value = getConfigValue(prefix + "_API_URL", defaultUrl);
        return (value != null && !value.isBlank()) ? value : defaultUrl;
    }
    
    @Override
    public String getModelForProvider(String providerId) {
        String key = providerId != null ? providerId.trim().toLowerCase() : "";
        String prefix = PROVIDER_PREFIX.get(key);
        if (prefix == null) {
            return "";
        }
        String defaultModel = DEFAULT_MODEL.getOrDefault(key, "");
        String value = getConfigValue(prefix + "_MODEL", defaultModel);
        return (value != null && !value.isBlank()) ? value : defaultModel;
    }
    
    @Override
    public Double getUsdToKrwRate() {
        String rateStr = getConfigValue("USD_TO_KRW_RATE", "1300.0");
        try {
            return Double.parseDouble(rateStr);
        } catch (NumberFormatException e) {
            log.warn("환율 설정이 올바르지 않습니다: {}, 기본값 1300.0 사용", rateStr);
            return 1300.0;
        }
    }
    
    @Override
    public void setUsdToKrwRate(Double rate) {
        setConfigValue("USD_TO_KRW_RATE", rate.toString(), "USD-KRW 환율", "EXCHANGE_RATE");
    }

    private static final Set<String> TRUTHY_VALUES = Set.of("true", "1", "yes", "on", "y", "t");

    /** 전역 행 식별자 — V20260228_001 표준화: 빈 문자열. */
    private static final String GLOBAL_TENANT_ID = "";

    /** 알림 스케줄러 플래그 카테고리 (시드와 동일). */
    private static final String NOTIFICATION_CATEGORY =
            NotificationSchedulerFlagKeys.CATEGORY;

    /** updatedBy 가 비었을 때 사용할 fallback. */
    private static final String DEFAULT_UPDATED_BY = "ADMIN";

    @Override
    public boolean getGlobalBoolean(String configKey, boolean defaultValue) {
        if (configKey == null || configKey.isBlank()) {
            return defaultValue;
        }
        try {
            return systemConfigRepository.findGlobalByConfigKey(configKey)
                    .map(SystemConfig::getConfigValue)
                    .map(value -> value == null ? null : value.trim().toLowerCase())
                    .map(TRUTHY_VALUES::contains)
                    .orElse(defaultValue);
        } catch (Exception e) {
            log.warn("전역 플래그 조회 실패 — 기본값 사용: key={}, default={}, error={}",
                    configKey, defaultValue, e.getMessage());
            return defaultValue;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationSchedulerFlagDto> listNotificationSchedulerFlags() {
        // 키 정렬 안정성을 위해 상수 SSOT 의 Set 을 정렬된 List 로 변환
        List<String> keys = new ArrayList<>(NotificationSchedulerFlagKeys.all());
        keys.sort(String::compareTo);

        List<NotificationSchedulerFlagDto> result = new ArrayList<>(keys.size());
        for (String key : keys) {
            SystemConfig entity = systemConfigRepository.findGlobalByConfigKey(key).orElse(null);
            result.add(NotificationSchedulerFlagDto.fromEntity(
                    key, entity, NotificationSchedulerFlagKeys.DEFAULT_ENABLED));
        }
        return result;
    }

    @Override
    @Transactional
    public NotificationSchedulerFlagDto setGlobalBoolean(
            String configKey, boolean value, String updatedBy) {
        if (configKey == null || configKey.isBlank()) {
            throw new IllegalArgumentException("configKey 는 필수입니다.");
        }
        String actor = (updatedBy == null || updatedBy.isBlank())
                ? DEFAULT_UPDATED_BY
                : updatedBy.trim();
        String configValue = value ? "true" : "false";

        SystemConfig saved = systemConfigRepository.findGlobalByConfigKey(configKey)
                .map(existing -> {
                    existing.setConfigValue(configValue);
                    existing.setUpdatedBy(actor);
                    // category 가 빈 값으로 들어온 레거시 행 보정
                    if (existing.getCategory() == null || existing.getCategory().isBlank()) {
                        existing.setCategory(NOTIFICATION_CATEGORY);
                    }
                    return systemConfigRepository.save(existing);
                })
                .orElseGet(() -> {
                    SystemConfig fresh = SystemConfig.builder()
                            .tenantId(GLOBAL_TENANT_ID)
                            .configKey(configKey)
                            .configValue(configValue)
                            .description("notification scheduler flag")
                            .category(NOTIFICATION_CATEGORY)
                            .isEncrypted(false)
                            .isActive(true)
                            .createdBy(actor)
                            .updatedBy(actor)
                            .build();
                    return systemConfigRepository.save(fresh);
                });

        log.info("[NotificationSchedulerFlag] {} = {} (by {})", configKey, configValue, actor);
        return NotificationSchedulerFlagDto.fromEntity(
                configKey, saved, NotificationSchedulerFlagKeys.DEFAULT_ENABLED);
    }
}
