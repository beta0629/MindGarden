package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.dto.TenantSmsEffectiveCredentials;
import com.coresolution.consultation.dto.TenantSmsSettingsResponse;
import com.coresolution.consultation.dto.TenantSmsSettingsUpdateRequest;
import com.coresolution.consultation.entity.TenantSmsSettings;
import com.coresolution.consultation.repository.TenantSmsSettingsRepository;
import com.coresolution.consultation.service.TenantSmsSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트별 SMS 비시크릿 설정 구현.
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@Service
@RequiredArgsConstructor
public class TenantSmsSettingsServiceImpl implements TenantSmsSettingsService {

    private final TenantSmsSettingsRepository tenantSmsSettingsRepository;
    private final SmsProperties smsProperties;
    private final Environment environment;

    @Override
    @Transactional(readOnly = true)
    public TenantSmsSettingsResponse getEffectiveSettings(String tenantId) {
        return tenantSmsSettingsRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .map(this::toResponse)
            .orElseGet(() -> defaultResponse(tenantId));
    }

    @Override
    @Transactional
    public TenantSmsSettingsResponse upsert(String tenantId, TenantSmsSettingsUpdateRequest request) {
        TenantSmsSettings entity = tenantSmsSettingsRepository
            .findByTenantIdAndIsDeletedFalse(tenantId)
            .orElseGet(() -> {
                TenantSmsSettings created = new TenantSmsSettings();
                created.setTenantId(tenantId);
                return created;
            });
        applyRequest(entity, request);
        TenantSmsSettings saved = tenantSmsSettingsRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSmsEnabledForTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return true;
        }
        return tenantSmsSettingsRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .map(TenantSmsSettings::getSmsEnabled)
            .orElse(Boolean.TRUE);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantSmsEffectiveCredentials getEffectiveCredentials(String tenantId) {
        String globalProvider = smsProperties.getProvider();
        String globalKey = smsProperties.getApiKey();
        String globalSecret = smsProperties.getApiSecret();
        String globalSender = smsProperties.getSenderNumber();

        if (tenantId == null || tenantId.isBlank()) {
            return new TenantSmsEffectiveCredentials(globalProvider, globalKey, globalSecret, globalSender);
        }

        return tenantSmsSettingsRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .map(row -> new TenantSmsEffectiveCredentials(
                firstNonBlank(row.getProvider(), globalProvider),
                resolveRefOrFallback(row.getApiKeyRef(), globalKey),
                resolveRefOrFallback(row.getApiSecretRef(), globalSecret),
                firstNonBlank(row.getSenderNumber(), globalSender)
            ))
            .orElseGet(() -> new TenantSmsEffectiveCredentials(
                globalProvider, globalKey, globalSecret, globalSender));
    }

    /**
     * 참조 키로 환경에서 값을 조회하고, 없으면 전역 폴백을 사용한다.
     *
     * @param ref      참조 문자열(비어 있으면 폴백)
     * @param fallback sms.auth 등 전역 값
     * @return 효과적 문자열
     */
    private String resolveRefOrFallback(String ref, String fallback) {
        if (ref == null || ref.isBlank()) {
            return fallback;
        }
        String trimmed = ref.trim();
        String resolvedRef = environment.resolvePlaceholders(trimmed);
        String fromSpring = environment.getProperty(resolvedRef);
        if (fromSpring != null && !fromSpring.isBlank()) {
            return fromSpring;
        }
        String fromEnv = System.getenv(resolvedRef);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        return fallback;
    }

    private void applyRequest(TenantSmsSettings entity, TenantSmsSettingsUpdateRequest request) {
        entity.setSmsEnabled(request.getSmsEnabled());
        entity.setProvider(emptyToNull(request.getProvider()));
        entity.setSenderNumber(emptyToNull(request.getSenderNumber()));
        entity.setApiKeyRef(emptyToNull(request.getApiKeyRef()));
        entity.setApiSecretRef(emptyToNull(request.getApiSecretRef()));
    }

    private static String emptyToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private static String firstNonBlank(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }
        return fallback;
    }

    private TenantSmsSettingsResponse toResponse(TenantSmsSettings e) {
        return TenantSmsSettingsResponse.builder()
            .tenantId(e.getTenantId())
            .smsEnabled(Boolean.TRUE.equals(e.getSmsEnabled()))
            .provider(e.getProvider())
            .senderNumber(e.getSenderNumber())
            .apiKeyRef(e.getApiKeyRef())
            .apiSecretRef(e.getApiSecretRef())
            .build();
    }

    private static TenantSmsSettingsResponse defaultResponse(String tenantId) {
        return TenantSmsSettingsResponse.builder()
            .tenantId(tenantId)
            .smsEnabled(true)
            .build();
    }
}
