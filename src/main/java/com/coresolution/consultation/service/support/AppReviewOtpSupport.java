package com.coresolution.consultation.service.support;

import com.coresolution.consultation.config.AppReviewProperties;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PhoneHashUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * App Store 리뷰용 고정 OTP 허용 판정 — Apple / OAuth 휴대폰 인증 공용.
 *
 * <p>바이패스는 {@link AppReviewProperties} 가 모두 충족될 때만 동작한다
 * (enabled + 비어 있지 않은 code + allowlist 전화).</p>
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@Component
@RequiredArgsConstructor
public class AppReviewOtpSupport {

    private final AppReviewProperties properties;

    /**
     * 바이패스 설정이 실질적으로 활성인지 (플래그 + 코드 비공백).
     *
     * @return 활성 여부
     */
    public boolean isConfigured() {
        return properties.isAppleOtpBypassEnabled()
                && StringUtils.hasText(properties.getAppleOtpCode());
    }

    /**
     * 정규화 후 allowlist 에 포함된 전화인지.
     *
     * @param rawOrNormalizedPhone 원본 또는 정규화 전화
     * @return allowlist 매치 여부
     */
    public boolean isAllowlistedPhone(String rawOrNormalizedPhone) {
        if (!isConfigured() || !StringUtils.hasText(rawOrNormalizedPhone)) {
            return false;
        }
        String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits(rawOrNormalizedPhone);
        if (!StringUtils.hasText(normalized)) {
            return false;
        }
        for (String phone : properties.getAppleOtpPhoneList()) {
            String candidate = LoginIdentifierUtils.normalizeKoreanMobileDigits(phone);
            if (normalized.equals(candidate)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 발송 단계에서 리뷰 고정 코드를 쓸지 결정. allowlist 이면 고정 코드, 아니면 null.
     *
     * @param normalizedPhone 정규화된 한국 휴대폰 digits
     * @return 리뷰 OTP 또는 null
     */
    public String resolveOtpCodeForSend(String normalizedPhone) {
        if (!isAllowlistedPhone(normalizedPhone)) {
            return null;
        }
        return properties.getAppleOtpCode();
    }

    /**
     * 검증 단계에서 입력 코드가 리뷰 고정 코드이고 phoneHash 가 allowlist 전화과 일치하는지.
     *
     * @param phoneHash SHA-256 hex of normalized phone
     * @param inputCode 사용자가 입력한 OTP
     * @return 리뷰 바이패스 수락 여부
     */
    public boolean matchesReviewCodeForPhoneHash(String phoneHash, String inputCode) {
        if (!isConfigured() || !StringUtils.hasText(phoneHash) || !StringUtils.hasText(inputCode)) {
            return false;
        }
        if (!properties.getAppleOtpCode().equals(inputCode)) {
            return false;
        }
        for (String phone : properties.getAppleOtpPhoneList()) {
            String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits(phone);
            if (!StringUtils.hasText(normalized)) {
                continue;
            }
            if (phoneHash.equals(PhoneHashUtils.sha256Hex(normalized))) {
                return true;
            }
        }
        return false;
    }
}
