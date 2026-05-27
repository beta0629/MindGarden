package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.NotificationType;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
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
 * 사용자별 in-app 알림 — broadcast 인 {@code system_notifications} 과 분리된 단일 수신자 행.
 *
 * <p>Flyway V20260604_001 의 {@code notifications} 테이블과 1:1 정합. soft-delete
 * ({@code is_deleted}/{@code deleted_at}) 보유. 본 테이블은 {@code version} 컬럼이 없으므로
 * {@link BaseEntity} / {@link AuditableTenantBase} 상속 대신 독립 매핑.</p>
 *
 * <p>{@code notificationType} 컬럼은 {@link NotificationType} enum 이 {@code @Enumerated(EnumType.STRING)}
 * 으로 매핑되어 enum 명을 그대로 적재한다 — 다른 lifecycle entity (AuditLog/PersonalDataDestructionLog
 * 등) 와 정합화.</p>
 *
 * <p>FK: {@code recipient_user_id → users(id)} (NOT NULL),
 *     {@code sender_user_id → users(id)} (NULL — SYSTEM).</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Entity
@Table(
    name = "notifications",
    indexes = {
        @Index(
            name = "idx_notifications_tenant_recipient_status_created",
            columnList = "tenant_id, recipient_user_id, status, created_at"
        ),
        @Index(name = "idx_notifications_sender", columnList = "sender_user_id"),
        @Index(name = "idx_notifications_type", columnList = "notification_type")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    /** {@code notifications.status} 컬럼의 라벨 상수. 향후 별도 enum 으로 분리 가능. */
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SENT = "SENT";
    public static final String STATUS_READ = "READ";
    public static final String STATUS_CANCELLED = "CANCELLED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "recipient_user_id", nullable = false)
    private Long recipientUserId;

    @Column(name = "sender_user_id")
    private Long senderUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 40)
    private NotificationType notificationType;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "json")
    private String metadataJson;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_PENDING;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = Boolean.FALSE;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /** 소프트 삭제 처리. */
    public void softDelete() {
        this.isDeleted = Boolean.TRUE;
        this.deletedAt = LocalDateTime.now();
    }
}
