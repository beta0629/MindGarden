package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.AuditAction;

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
 * 통일 감사 로그 SSOT — USER_LIFECYCLE_TERMINATION_POLICY §4.
 *
 * <p>Flyway V20260604_001 의 {@code audit_logs} 테이블과 1:1 정합. lifecycle / anonymize /
 * destruction / 관리자 액션 모두 본 행으로 추적된다. 본 entity 는 append-only 로그이며
 * 소프트 삭제·updated_at·version 컬럼을 보유하지 않는다 (마이그레이션 정의 정합).</p>
 *
 * <p>FK: {@code actor_user_id → users(id)} (NULL 허용 — SYSTEM cron),
 *     {@code target_user_id → users(id)} (NULL 허용 — 사용자 무관 액션).</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_logs_tenant_created", columnList = "tenant_id, created_at"),
        @Index(name = "idx_audit_logs_actor", columnList = "actor_user_id"),
        @Index(name = "idx_audit_logs_target", columnList = "target_user_id"),
        @Index(name = "idx_audit_logs_action", columnList = "action"),
        @Index(name = "idx_audit_logs_entity", columnList = "entity_type, entity_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "actor_role", length = 40)
    private String actorRole;

    @Column(name = "target_user_id")
    private Long targetUserId;

    /**
     * 액션 — {@link AuditAction} enum 을 {@code @Enumerated(EnumType.STRING)} 으로 매핑.
     * Hibernate 가 enum 명을 DB 의 {@code action} 컬럼 (VARCHAR(60)) 에 저장한다.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 60)
    private AuditAction action;

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_json", columnDefinition = "json")
    private String beforeJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_json", columnDefinition = "json")
    private String afterJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "json")
    private String metadataJson;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
