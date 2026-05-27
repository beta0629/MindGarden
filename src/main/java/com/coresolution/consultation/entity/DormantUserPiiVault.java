package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * 휴면(DORMANT) 사용자 PII 안전 보관 vault — USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 (Q9).
 *
 * <p>Flyway V20260606_004 로 추가된 {@code dormant_user_pii_vault} 테이블과 1:1 정합. DORMANT
 * 진입 시 사용자의 PII 를 AES-256-GCM 으로 암호화하여 {@code encrypted_pii} 컬럼에 보관하고,
 * 4년 안정 보관 기간이 만료되면 {@code AnonymizeBatchService} 가 본 vault 행과 함께
 * {@code users.lifecycle_state} 를 ANONYMIZED 로 전이한다.</p>
 *
 * <p>사용자가 4년 안정 기간 중 활성 복귀하면 {@code UserLifecycleService.reactivate(...)} 가
 * vault 의 {@code encrypted_pii} 를 복호화해 {@code users} 테이블로 원복하고 본 행을 삭제한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Entity
@Table(
    name = "dormant_user_pii_vault",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_dormant_pii_user_tenant", columnNames = {"user_id", "tenant_id"})
    },
    indexes = {
        @Index(name = "idx_dormant_pii_anonymize_scheduled_at", columnList = "anonymize_scheduled_at"),
        @Index(name = "idx_dormant_pii_pre_notice_sent_at", columnList = "pre_notice_sent_at"),
        @Index(name = "idx_dormant_pii_tenant_id", columnList = "tenant_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "encryptedPii")
public class DormantUserPiiVault extends BaseEntity {

    /** users.id 참조 — FK 미생성 (정리 SSOT 경로 명시). */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 멀티테넌트 격리 키.
     *
     * <p>{@link AuditableTenantBase#tenantId} 필드가 protected 로 보호되어 있어 본 엔티티는
     * setter/getter 를 통해 BaseEntity 의 tenantId 를 그대로 사용한다. 별도 컬럼 매핑 X.</p>
     */

    /**
     * AES-256-GCM {@code {"v":1,"nonce":"<base64>","ciphertext":"<base64>","tag":"<base64>"}}
     * JSON 본문. {@code DormantPiiVaultService} 가 키 ({@code mindgarden.lifecycle.dormant-pii-encryption-key})
     * 로 시리얼라이즈/디시리얼라이즈를 책임진다.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "encrypted_pii", nullable = false, columnDefinition = "json")
    private String encryptedPii;

    /** DORMANT 진입 시각 — 4년 카운트 기준점. */
    @Column(name = "dormant_entered_at", nullable = false)
    private LocalDateTime dormantEnteredAt;

    /** 4년 후 익명화 예정 시각 (dormant_entered_at + 4 YEAR). */
    @Column(name = "anonymize_scheduled_at", nullable = false)
    private LocalDateTime anonymizeScheduledAt;

    /** 30일 사전 통지 발송 시각 — NULL = 미발송. */
    @Column(name = "pre_notice_sent_at")
    private LocalDateTime preNoticeSentAt;

    /** 발송 채널 — EMAIL / KAKAO / SMS. */
    @Column(name = "pre_notice_channel", length = 50)
    private String preNoticeChannel;

    /** 사용자 활성 복귀 인지 시각 — 활성 복귀 시점에 stamp. */
    @Column(name = "pre_notice_acknowledged_at")
    private LocalDateTime preNoticeAcknowledgedAt;
}
