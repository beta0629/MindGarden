package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MobilePushConstants;
import com.coresolution.consultation.constant.MobilePushPlatform;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPatchRequest;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPayload;
import com.coresolution.consultation.entity.MobilePushSettings;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.service.MobilePushService;
import com.coresolution.consultation.util.MobilePushTokenHasher;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 모바일 푸시 토큰·설정 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Service
@RequiredArgsConstructor
public class MobilePushServiceImpl implements MobilePushService {

    private final MobilePushTokenRepository mobilePushTokenRepository;
    private final MobilePushSettingsRepository mobilePushSettingsRepository;

    @Override
    @Transactional
    public void registerToken(String tenantId, Long userId, String rawToken, MobilePushPlatform platform,
            JsonNode deviceInfo) {
        validateToken(rawToken);
        String hash = MobilePushTokenHasher.sha256Hex(rawToken);
        String tid = tenantId.trim();
        mobilePushTokenRepository
                .findByTenantIdAndUserIdAndTokenSha256AndIsDeletedFalse(tid, userId, hash)
                .ifPresentOrElse(
                        existing -> {
                            existing.setPushToken(rawToken);
                            existing.setPlatform(platform.getCode());
                            existing.setDeviceInfo(deviceInfo);
                            existing.setActive(true);
                            mobilePushTokenRepository.save(existing);
                        },
                        () -> {
                            MobilePushToken row = MobilePushToken.builder()
                                    .tenantId(tid)
                                    .userId(userId)
                                    .tokenSha256(hash)
                                    .pushToken(rawToken)
                                    .platform(platform.getCode())
                                    .deviceInfo(deviceInfo)
                                    .active(true)
                                    .isDeleted(false)
                                    .build();
                            mobilePushTokenRepository.save(row);
                        });
    }

    @Override
    @Transactional
    public void unregisterToken(String tenantId, Long userId, String rawToken) {
        validateToken(rawToken);
        String hash = MobilePushTokenHasher.sha256Hex(rawToken);
        String tid = tenantId.trim();
        mobilePushTokenRepository
                .findByTenantIdAndUserIdAndTokenSha256AndIsDeletedFalse(tid, userId, hash)
                .ifPresent(row -> {
                    row.setActive(false);
                    mobilePushTokenRepository.save(row);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public MobilePushSettingsPayload getSettings(String tenantId, Long userId) {
        String tid = tenantId.trim();
        return mobilePushSettingsRepository
                .findByTenantIdAndUserIdAndIsDeletedFalse(tid, userId)
                .map(MobilePushServiceImpl::toPayload)
                .orElseGet(MobilePushSettingsPayload::allEnabledDefaults);
    }

    @Override
    @Transactional
    public MobilePushSettingsPayload patchSettings(String tenantId, Long userId, MobilePushSettingsPatchRequest patch) {
        String tid = tenantId.trim();
        MobilePushSettings entity = mobilePushSettingsRepository
                .findByTenantIdAndUserIdAndIsDeletedFalse(tid, userId)
                .orElseGet(() -> MobilePushSettings.builder()
                        .tenantId(tid)
                        .userId(userId)
                        .scheduleEnabled(true)
                        .paymentEnabled(true)
                        .messageEnabled(true)
                        .wellnessEnabled(true)
                        .systemEnabled(true)
                        .isDeleted(false)
                        .build());

        if (patch.getSchedule() != null) {
            entity.setScheduleEnabled(patch.getSchedule());
        }
        if (patch.getPayment() != null) {
            entity.setPaymentEnabled(patch.getPayment());
        }
        if (patch.getMessage() != null) {
            entity.setMessageEnabled(patch.getMessage());
        }
        if (patch.getWellness() != null) {
            entity.setWellnessEnabled(patch.getWellness());
        }
        if (patch.getSystem() != null) {
            entity.setSystemEnabled(patch.getSystem());
        }

        MobilePushSettings saved = mobilePushSettingsRepository.save(entity);
        return toPayload(saved);
    }

    private static void validateToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("token이 비어 있습니다.");
        }
        if (rawToken.length() > MobilePushConstants.PUSH_TOKEN_MAX_CHARS) {
            throw new IllegalArgumentException("token 길이가 상한을 초과했습니다.");
        }
    }

    private static MobilePushSettingsPayload toPayload(MobilePushSettings e) {
        return MobilePushSettingsPayload.builder()
                .schedule(e.isScheduleEnabled())
                .payment(e.isPaymentEnabled())
                .message(e.isMessageEnabled())
                .wellness(e.isWellnessEnabled())
                .system(e.isSystemEnabled())
                .build();
    }
}
