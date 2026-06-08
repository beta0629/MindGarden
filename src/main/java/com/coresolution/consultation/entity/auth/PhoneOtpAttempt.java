package com.coresolution.consultation.entity.auth;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple SIWA(추후 다른 OAuth 확장 가능) 휴대폰 매칭 흐름의 OTP 시도/한도 추적.
 *
 * <p>운영 정책 (2026-06-08 사용자 결정):
 * <ul>
 *   <li>D2: JWT phoneVerificationToken + DB 시도카운터 조합 — JWT 만으로는 시도 횟수·재발송 제어 불가.</li>
 *   <li>D3: 재발송 쿨다운 1분 / 일 5회 / 검증 시도 5회.</li>
 * </ul>
 * </p>
 *
 * <p>저장 정책:
 * <ul>
 *   <li>OTP 코드는 bcrypt 해시만 저장 (평문 절대 금지).</li>
 *   <li>휴대폰 번호는 정규화(01012345678) 후 SHA-256 hex 만 저장 (PII 평문 금지).</li>
 *   <li>verify 시 attempts++ 후 5 회 초과 시 status=FAILED 로 무효화 → 새 발송 강제.</li>
 *   <li>expires_at 초과 row 는 status=EXPIRED 로 batch 청소.</li>
 * </ul>
 * </p>
 *
 * <p>본 엔티티는 {@code AuditableTenantBase} 를 상속하지 않는다. 이유:
 * 본 row 는 짧은 수명(3분)·집계용으로, 별도 audit 컬럼(updated_at, deleted_at, version) 이 불필요하고
 * 명시적 created_at / expires_at / verified_at 만으로 충분하기 때문이다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Entity
@Table(
    name = "phone_otp_attempts",
    indexes = {
        @Index(name = "idx_phone_otp_attempts_lookup", columnList = "tenant_id,phone_hash,status"),
        @Index(name = "idx_phone_otp_attempts_provider_user", columnList = "provider,provider_user_id,created_at"),
        @Index(name = "idx_phone_otp_attempts_expires", columnList = "expires_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhoneOtpAttempt {

    /** PENDING — 발송 후 검증 대기. */
    public static final String STATUS_PENDING = "PENDING";

    /** VERIFIED — OTP 검증 성공. */
    public static final String STATUS_VERIFIED = "VERIFIED";

    /** FAILED — 시도 횟수 초과 등으로 row 무효화. */
    public static final String STATUS_FAILED = "FAILED";

    /** EXPIRED — expires_at 시간 초과. */
    public static final String STATUS_EXPIRED = "EXPIRED";

    /** Apple SIWA 흐름에서 사용하는 provider 값. */
    public static final String PROVIDER_APPLE = "APPLE";

    /** OTP 검증 시도 최대 횟수 (5회). */
    public static final int MAX_ATTEMPTS = 5;

    /** 일일 최대 발송 횟수 (5회). */
    public static final int MAX_DAILY_COUNT = 5;

    /** 재발송 최소 간격(초). 1분. */
    public static final long RESEND_COOLDOWN_SECONDS = 60L;

    /** OTP 만료 시간(분). 3분. */
    public static final long EXPIRY_MINUTES = 3L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "provider", nullable = false, length = 32)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    @Column(name = "phone_hash", nullable = false, length = 64)
    private String phoneHash;

    @Column(name = "code_hash", nullable = false, length = 255)
    private String codeHash;

    @Column(name = "attempts", nullable = false)
    private Integer attempts;

    @Column(name = "daily_count", nullable = false)
    private Integer dailyCount;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
}
