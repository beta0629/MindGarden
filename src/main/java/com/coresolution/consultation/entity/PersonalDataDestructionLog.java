package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.constant.LegalBasis;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * PIPA §16 개인정보 파기 기록 — anonymize / tombstone / hard_delete / dormant 전수 audit trail.
 *
 * <p>Flyway V20260604_001 의 {@code personal_data_destruction_logs} 테이블과 1:1 정합.
 * 회원 lifecycle 통합 정책의 자발/강제/자동 파기 경로가 본 행을 반드시 적재한다 (W1 P0).
 * {@code before_*_hash} 는 SHA-256 추적용 — 원본 PII 보존 금지.</p>
 *
 * <p>FK: {@code target_user_id → users(id)} (NOT NULL),
 *     {@code executed_by_user_id → users(id)} (NULL — SYSTEM cron).</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Entity
@Table(
    name = "personal_data_destruction_logs",
    indexes = {
        @Index(name = "idx_pdd_logs_tenant_executed", columnList = "tenant_id, executed_at"),
        @Index(name = "idx_pdd_logs_target", columnList = "target_user_id"),
        @Index(name = "idx_pdd_logs_type", columnList = "destruction_type"),
        @Index(name = "idx_pdd_logs_executed_by", columnList = "executed_by_user_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalDataDestructionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "destruction_type", nullable = false, length = 30)
    private DestructionType destructionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pii_columns_affected", nullable = false, columnDefinition = "json")
    private String piiColumnsAffected;

    @Column(name = "before_email_hash", length = 64)
    private String beforeEmailHash;

    @Column(name = "before_name_hash", length = 64)
    private String beforeNameHash;

    @Column(name = "before_phone_hash", length = 64)
    private String beforePhoneHash;

    @Column(name = "executed_by_user_id")
    private Long executedByUserId;

    @Column(name = "execution_reason", length = 255)
    private String executionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "legal_basis", nullable = false, length = 60)
    private LegalBasis legalBasis;

    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;

    /**
     * 7일 복구 윈도우 만료 시각. {@code null} 이면 즉시 파기 (복구 불가).
     */
    @Column(name = "recovery_window_until")
    private LocalDateTime recoveryWindowUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 복구 윈도우 내인지 검증. {@code null} 이면 false. */
    public boolean isRecoverable(LocalDateTime now) {
        return recoveryWindowUntil != null && recoveryWindowUntil.isAfter(now);
    }
}
