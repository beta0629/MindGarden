package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.Optional;
import java.util.Map;
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
        return getConfigValue("OPENAI_API_URL", "https://api.openai.com/v1/chat/completions");
    }
    
    @Override
    public String getOpenAIModel() {
        return getConfigValue("OPENAI_MODEL", "gpt-3.5-turbo");
    }
    
    private static final String DEFAULT_AI_PROVIDER = "openai";
    private static final Map<String, String> PROVIDER_PREFIX = Map.of(
            "openai", "OPENAI",
            "gemini", "GEMINI",
            "claude", "CLAUDE",
            "replicate", "REPLICATE"
    );
    private static final Map<String, String> DEFAULT_API_URL = Map.of(
            "openai", "https://api.openai.com/v1/chat/completions",
            "gemini", "",
            "claude", "",
            "replicate", ""
    );
    private static final Map<String, String> DEFAULT_MODEL = Map.of(
            "openai", "gpt-3.5-turbo",
            "gemini", "",
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
        return getConfigValue(prefix + "_API_URL", defaultUrl);
    }
    
    @Override
    public String getModelForProvider(String providerId) {
        String key = providerId != null ? providerId.trim().toLowerCase() : "";
        String prefix = PROVIDER_PREFIX.get(key);
        if (prefix == null) {
            return "";
        }
        String defaultModel = DEFAULT_MODEL.getOrDefault(key, "");
        return getConfigValue(prefix + "_MODEL", defaultModel);
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
}
