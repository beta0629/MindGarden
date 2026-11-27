package com.coresolution.consultation.sct.service;

import java.util.Optional;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * SCT 본인확인 SMS OTP system_config 조회(테넌트 → 전역 tenant_id='' 폴백).
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Component
@RequiredArgsConstructor
public class SctIdentityOtpSettings {

    private final SystemConfigRepository systemConfigRepository;

    /**
     * OTP 자릿수.
     *
     * @param tenantId 테넌트
     * @return 자릿수
     */
    public int codeLength(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_CODE_LENGTH,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_CODE_LENGTH);
    }

    /**
     * OTP TTL(초).
     *
     * @param tenantId 테넌트
     * @return 초
     */
    public int ttlSeconds(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_TTL_SECONDS,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_TTL_SECONDS);
    }

    /**
     * 최대 검증 시도.
     *
     * @param tenantId 테넌트
     * @return 횟수
     */
    public int maxAttempts(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_MAX_ATTEMPTS,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_MAX_ATTEMPTS);
    }

    /**
     * 재발송 쿨다운(초).
     *
     * @param tenantId 테넌트
     * @return 초
     */
    public int resendCooldownSeconds(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_RESEND_COOLDOWN_SECONDS,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_RESEND_COOLDOWN_SECONDS);
    }

    /**
     * 초대당 시간당 발송 상한.
     *
     * @param tenantId 테넌트
     * @return 상한
     */
    public int sendLimitPerHourInvite(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_SEND_LIMIT_PER_HOUR_INVITE,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_INVITE);
    }

    /**
     * 번호 해시당 시간당 발송 상한.
     *
     * @param tenantId 테넌트
     * @return 상한
     */
    public int sendLimitPerHourPhone(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_SEND_LIMIT_PER_HOUR_PHONE,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_PHONE);
    }

    /**
     * IP 해시당 시간당 발송 상한.
     *
     * @param tenantId 테넌트
     * @return 상한
     */
    public int sendLimitPerHourIp(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_SEND_LIMIT_PER_HOUR_IP,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_IP);
    }

    /**
     * 오답 잠금(분).
     *
     * @param tenantId 테넌트
     * @return 분
     */
    public int lockMinutes(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_LOCK_MINUTES,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_LOCK_MINUTES);
    }

    /**
     * 불일치 timing pad(ms).
     *
     * @param tenantId 테넌트
     * @return ms
     */
    public int timingPadMs(String tenantId) {
        return intValue(tenantId, SctFeatureFlagKeys.IDENTITY_OTP_TIMING_PAD_MS,
                SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_TIMING_PAD_MS);
    }

    private int intValue(String tenantId, String key, int defaultValue) {
        String raw = resolveRaw(tenantId, key);
        if (!StringUtils.hasText(raw)) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private String resolveRaw(String tenantId, String key) {
        if (StringUtils.hasText(tenantId)) {
            Optional<SystemConfig> tenantCfg = systemConfigRepository
                    .findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, key);
            if (tenantCfg.isPresent() && StringUtils.hasText(tenantCfg.get().getConfigValue())) {
                return tenantCfg.get().getConfigValue();
            }
        }
        Optional<SystemConfig> globalCfg = systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue("", key);
        return globalCfg.map(SystemConfig::getConfigValue).orElse(null);
    }
}
