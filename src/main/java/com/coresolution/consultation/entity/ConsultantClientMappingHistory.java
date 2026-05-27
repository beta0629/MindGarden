package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.MappingHistoryEventType;

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
 * 상담사-내담자 매핑 변경 이력.
 *
 * <p>Flyway V20260604_001 의 {@code consultant_client_mapping_history} 테이블과 1:1 정합.
 * core-planner v1.1 합의서 §8 도착 시 신규 이벤트·컬럼 추가 가능. append-only 로그이므로
 * 소프트 삭제·updated_at·version 미보유.</p>
 *
 * <p>FK: {@code mapping_id → consultant_client_mappings(id)} (NOT NULL),
 *     {@code client_id → users(id)} (NULL — 스냅샷),
 *     {@code consultant_id → users(id)} (NULL — 스냅샷),
 *     {@code triggered_by_user_id → users(id)} (NULL — SYSTEM/auto-event).</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Entity
@Table(
    name = "consultant_client_mapping_history",
    indexes = {
        @Index(name = "idx_ccmh_tenant_mapping_created", columnList = "tenant_id, mapping_id, created_at"),
        @Index(name = "idx_ccmh_client", columnList = "client_id"),
        @Index(name = "idx_ccmh_consultant", columnList = "consultant_id"),
        @Index(name = "idx_ccmh_event_type", columnList = "event_type")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMappingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "mapping_id", nullable = false)
    private Long mappingId;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "consultant_id")
    private Long consultantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private MappingHistoryEventType eventType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_state_json", columnDefinition = "json")
    private String beforeStateJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_state_json", columnDefinition = "json")
    private String afterStateJson;

    @Column(name = "triggered_by_user_id")
    private Long triggeredByUserId;

    @Column(name = "reason", length = 255)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
