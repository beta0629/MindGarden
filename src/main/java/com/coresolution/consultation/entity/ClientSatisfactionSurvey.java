package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

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
 * 내담자 만족도 — planner v1.0 인용 (empathy / professionalism / recommendation 세분화).
 *
 * <p>Flyway V20260604_001 의 {@code client_satisfaction_surveys} 테이블과 1:1 정합.
 * 본 테이블은 {@code submitted_at} 을 자체 타임스탬프로 사용 ({@code created_at} 컬럼이 없음).
 * soft-delete 보유 ({@code is_deleted}/{@code deleted_at}).</p>
 *
 * <p>FK: {@code client_id → users(id)} (NOT NULL),
 *     {@code consultant_id → users(id)} (NOT NULL),
 *     {@code mapping_id → consultant_client_mappings(id)} (NULL),
 *     {@code schedule_id} 는 논리 FK (schedules 는 FK 정의가 없음).</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Entity
@Table(
    name = "client_satisfaction_surveys",
    indexes = {
        @Index(name = "idx_css_tenant_consultant_submitted",
            columnList = "tenant_id, consultant_id, submitted_at"),
        @Index(name = "idx_css_client", columnList = "client_id"),
        @Index(name = "idx_css_mapping", columnList = "mapping_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientSatisfactionSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    @Column(name = "mapping_id")
    private Long mappingId;

    /** 논리 FK — {@code schedules(id)}. 운영 schedules 테이블이 FK 미정의 (debugger §6 정합). */
    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "overall_rating", nullable = false)
    private Short overallRating;

    @Column(name = "professionalism_rating")
    private Short professionalismRating;

    @Column(name = "empathy_rating")
    private Short empathyRating;

    @Column(name = "recommendation_rating")
    private Short recommendationRating;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Builder.Default
    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous = Boolean.FALSE;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

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
