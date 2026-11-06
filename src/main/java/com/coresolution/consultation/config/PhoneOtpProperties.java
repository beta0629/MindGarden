package com.coresolution.consultation.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * OAuth/Apple 휴대폰 인증 OTP TTL 설정.
 *
 * <p>{@code mindgarden.otp.phone.*} 키로 바인딩. 발급 시 {@code phone_otp_attempts.expires_at}
 * 및 API {@code expiresInSeconds} 의 SSOT 이다. OTP 코드는 Redis 가 아니라 MySQL
 * {@code phone_otp_attempts} 에 저장되며, password-reset opaque Redis TTL 과는 별개다.</p>
 *
 * <p>프로파일별 오버라이드(예: application-dev.yml 1200초)로 환경 분리하며,
 * 코드에 {@code spring.profiles.active} / 호스트명 분기를 두지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-06
 */
@Validated
@ConfigurationProperties(prefix = "mindgarden.otp.phone")
@Getter
@Setter
public class PhoneOtpProperties {

    /** 기본 OTP 만료(초) — 운영·미지정 프로파일 기본값(3분). */
    public static final long DEFAULT_EXPIRY_SECONDS = 180L;

    /** 허용 하한(초). */
    public static final long MIN_EXPIRY_SECONDS = 60L;

    /** 허용 상한(초). */
    public static final long MAX_EXPIRY_SECONDS = 3600L;

    /**
     * OTP 만료 시간(초).
     *
     * <p>기본 {@link #DEFAULT_EXPIRY_SECONDS}. 범위 밖 값은 바인딩 검증으로 기동 실패한다.</p>
     */
    @Min(MIN_EXPIRY_SECONDS)
    @Max(MAX_EXPIRY_SECONDS)
    private long expirySeconds = DEFAULT_EXPIRY_SECONDS;
}
