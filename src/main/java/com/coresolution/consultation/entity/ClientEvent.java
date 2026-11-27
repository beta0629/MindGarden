package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내담자 관리용 타임라인 이벤트 (append-only).
 *
 * <p>Flyway {@code V20261126_002__create_client_event.sql} 과 1:1 정합.
 * soft delete·updated_at·version 미보유. 참조 ID는 스냅샷이다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Entity
@Table(
    name = "client_event",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_client_event_tenant_idempotency",
            columnNames = {"tenant_id", "idempotency_key"})
    },
    indexes = {
        @Index(
            name = "idx_client_event_tenant_client_occurred",
            columnList = "tenant_id, client_id, occurred_at"),
        @Index(
            name = "idx_client_event_tenant_mapping_occurred",
            columnList = "tenant_id, mapping_id, occurred_at"),
        @Index(
            name = "idx_client_event_tenant_event_type",
            columnList = "tenant_id, event_type")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private ClientEventType eventType;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "actor_role", length = 40)
    private String actorRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private ClientEventSource source;

    @Column(name = "reason", length = 255)
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_json", columnDefinition = "json")
    private String beforeJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_json", columnDefinition = "json")
    private String afterJson;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "mapping_id")
    private Long mappingId;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "erp_transaction_id", length = 100)
    private String erpTransactionId;

    @Column(name = "sessions_remaining_before")
    private Integer sessionsRemainingBefore;

    @Column(name = "sessions_remaining_after")
    private Integer sessionsRemainingAfter;

    @Column(name = "sessions_used_before")
    private Integer sessionsUsedBefore;

    @Column(name = "sessions_used_after")
    private Integer sessionsUsedAfter;

    @Column(name = "amount", precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "idempotency_key", length = 191)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
