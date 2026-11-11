package com.coresolution.consultation.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 휴대폰 비밀번호 찾기(SMS) OTP·opaque TTL 설정.
 *
 * <p>{@code password-reset.*} 키로 바인딩한다. MySQL {@code phone_otp_attempts.expires_at}
 * · API {@code expiresInSeconds} · Redis opaque challenge TTL 의 SSOT 이며,
 * OAuth/Apple 휴대폰 OTP 와는 무관하다.</p>
 *
 * <p>프로파일별 오버라이드(예: application-dev.yml 1200초)로 환경 분리하며,
 * 코드에 {@code spring.profiles.active} / 호스트명 분기를 두지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-06
 */
@Validated
@ConfigurationProperties(prefix = "password-reset")
@Getter
@Setter
public class PasswordResetSmsOtpProperties {

    /** 기본 OTP/challenge 만료(초) — 운영·미지정 프로파일 기본값(3분). */
    public static final long DEFAULT_OTP_EXPIRY_SECONDS = 180L;

    /** 기본 opaque proof 만료(초) — 5분. prod/.dev 동일. */
    public static final long DEFAULT_PROOF_TTL_SECONDS = 300L;

    /** 허용 하한(초). */
    public static final long MIN_TTL_SECONDS = 60L;

    /** 허용 상한(초). */
    public static final long MAX_TTL_SECONDS = 3600L;

    /**
     * MySQL OTP 만료·API {@code expiresInSeconds} SSOT(초).
     *
     * <p>기본 {@link #DEFAULT_OTP_EXPIRY_SECONDS}. 범위 밖 값은 바인딩 검증으로 기동 실패한다.</p>
     */
    @Min(MIN_TTL_SECONDS)
    @Max(MAX_TTL_SECONDS)
    private long otpExpirySeconds = DEFAULT_OTP_EXPIRY_SECONDS;

    /** Redis opaque challenge/proof TTL. */
    @Valid
    private Opaque opaque = new Opaque();

    /**
     * opaque 토큰 TTL 중첩 설정.
     */
    @Getter
    @Setter
    public static class Opaque {

        /**
         * Redis challenge TTL(초). 의도상 {@code otpExpirySeconds} 와 동일.
         */
        @Min(MIN_TTL_SECONDS)
        @Max(MAX_TTL_SECONDS)
        private long challengeTtlSeconds = DEFAULT_OTP_EXPIRY_SECONDS;

        /**
         * Redis proof TTL(초). 이번 변경에서 넓히지 않음(기본 300).
         */
        @Min(MIN_TTL_SECONDS)
        @Max(MAX_TTL_SECONDS)
        private long proofTtlSeconds = DEFAULT_PROOF_TTL_SECONDS;
    }
}
