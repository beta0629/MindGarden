package com.coresolution.consultation.sct.constant;

/**
 * SCT system_config 키 SSOT.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public final class SctFeatureFlagKeys {

    /** 테넌트 SCT 기능 ON/OFF. 기본 false(fail-closed). */
    public static final String FEATURE_SCT_ENABLED = "feature.sct.enabled";

    /** 링크 만료 일수. 기본 14, 허용 1~30. 새 발송부터 적용. */
    public static final String LINK_EXPIRY_DAYS = "sct.link.expiry.days";

    /** 응답 보관 일수. 기본 365. 자동 삭제 배치 없음(ADMIN 수동 파기). */
    public static final String RETENTION_DAYS = "sct.retention.days";

    public static final int DEFAULT_LINK_EXPIRY_DAYS = 14;
    public static final int MIN_LINK_EXPIRY_DAYS = 1;
    public static final int MAX_LINK_EXPIRY_DAYS = 30;

    /** 보관 기본일수(실시일/제출일 기준). */
    public static final int DEFAULT_RETENTION_DAYS = 365;
    public static final int MIN_RETENTION_DAYS = 1;

    public static final String CONFIG_CATEGORY = "SCT";
    public static final String FEATURE_CATEGORY = "FEATURE";

    /** SCT 본인확인 SMS OTP 자릿수. */
    public static final String IDENTITY_OTP_CODE_LENGTH = "sct.identity.otp.code.length";
    /** SCT 본인확인 SMS OTP TTL(초). */
    public static final String IDENTITY_OTP_TTL_SECONDS = "sct.identity.otp.ttl.seconds";
    /** SCT 본인확인 SMS OTP 최대 검증 시도. */
    public static final String IDENTITY_OTP_MAX_ATTEMPTS = "sct.identity.otp.max.attempts";
    /** SCT 본인확인 SMS OTP 재발송 쿨다운(초). */
    public static final String IDENTITY_OTP_RESEND_COOLDOWN_SECONDS =
            "sct.identity.otp.resend.cooldown.seconds";
    /** SCT 본인확인 SMS OTP 초대당 시간당 발송 상한. */
    public static final String IDENTITY_OTP_SEND_LIMIT_PER_HOUR_INVITE =
            "sct.identity.otp.send.limit.per.hour.invite";
    /** SCT 본인확인 SMS OTP 번호 해시당 시간당 발송 상한. */
    public static final String IDENTITY_OTP_SEND_LIMIT_PER_HOUR_PHONE =
            "sct.identity.otp.send.limit.per.hour.phone";
    /** SCT 본인확인 SMS OTP IP 해시당 시간당 발송 상한. */
    public static final String IDENTITY_OTP_SEND_LIMIT_PER_HOUR_IP =
            "sct.identity.otp.send.limit.per.hour.ip";
    /** SCT 본인확인 SMS OTP 오답 잠금(분). */
    public static final String IDENTITY_OTP_LOCK_MINUTES = "sct.identity.otp.lock.minutes";
    /** SCT 본인확인 SMS OTP 불일치 timing pad(ms). */
    public static final String IDENTITY_OTP_TIMING_PAD_MS = "sct.identity.otp.timing.pad.ms";

    public static final int DEFAULT_IDENTITY_OTP_CODE_LENGTH = 6;
    public static final int DEFAULT_IDENTITY_OTP_TTL_SECONDS = 180;
    public static final int DEFAULT_IDENTITY_OTP_MAX_ATTEMPTS = 5;
    public static final int DEFAULT_IDENTITY_OTP_RESEND_COOLDOWN_SECONDS = 60;
    public static final int DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_INVITE = 10;
    public static final int DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_PHONE = 5;
    public static final int DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_IP = 20;
    public static final int DEFAULT_IDENTITY_OTP_LOCK_MINUTES = 15;
    public static final int DEFAULT_IDENTITY_OTP_TIMING_PAD_MS = 200;

    private SctFeatureFlagKeys() {
    }
}
