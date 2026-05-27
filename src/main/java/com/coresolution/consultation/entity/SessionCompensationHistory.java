package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.coresolution.consultation.constant.CompensationType;

import org.hibernate.annotations.CreationTimestamp;

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
 * 회기 보상 이력 — no-show / late-cancel / extension / partial-refund-rollback.
 *
 * <p>Flyway V20260604_001 의 {@code session_compensation_history} 테이블과 1:1 정합.
 * {@code session_delta DECIMAL(5,2)} 는 0.5 / 1.0 등 부분 회기 보상을 지원하므로
 * {@link BigDecimal} 매핑. append-only 로그.</p>
 *
 * <p>FK: {@code mapping_id → consultant_client_mappings(id)} (NOT NULL),
 *     {@code client_id → users(id)} (NOT NULL),
 *     {@code triggered_by_user_id → users(id)} (NULL — SYSTEM auto-comp).</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Entity
@Table(
    name = "session_compensation_history",
    indexes = {
        @Index(name = "idx_sch_tenant_mapping_created", columnList = "tenant_id, mapping_id, created_at"),
        @Index(name = "idx_sch_client", columnList = "client_id"),
        @Index(name = "idx_sch_type", columnList = "compensation_type")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionCompensationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "mapping_id", nullable = false)
    private Long mappingId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "consultant_id")
    private Long consultantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "compensation_type", nullable = false, length = 40)
    private CompensationType compensationType;

    @Column(name = "session_delta", nullable = false, precision = 5, scale = 2)
    private BigDecimal sessionDelta;

    @Column(name = "before_remaining_sessions", nullable = false)
    private Integer beforeRemainingSessions;

    @Column(name = "after_remaining_sessions", nullable = false)
    private Integer afterRemainingSessions;

    @Column(name = "triggered_by_user_id")
    private Long triggeredByUserId;

    @Column(name = "reason", length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
