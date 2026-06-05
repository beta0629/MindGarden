package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 회기 차감 보정 알림 엔티티.
 *
 * <p>{@code SessionDeductionRecoveryBatch} 가 일정의 회기 차감을 보정하려고 했지만
 * 대상 매핑이 없거나 잔여 회기가 0 인 등 정상 처리 불가 케이스를 어드민이 인지하도록
 * 적재한다. 운영자는 본 알림을 보고 매핑 활성화·회기 추가 등 조치 후 {@code resolved_at}
 * 을 채워 종결한다.</p>
 *
 * <p>관련 합의: 매핑 회기 차감 누락 P1 — Flyway {@code V20260605_002__create_session_recovery_alerts.sql}.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Entity
@Table(name = "session_recovery_alerts", indexes = {
        @Index(name = "idx_sra_tenant", columnList = "tenant_id"),
        @Index(name = "idx_sra_unresolved", columnList = "tenant_id, resolved_at"),
        @Index(name = "idx_sra_schedule", columnList = "schedule_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SessionRecoveryAlert extends BaseEntity {

    /** 매핑 활성/결제 승인 상태인 매핑을 찾을 수 없음. */
    public static final String REASON_ACTIVE_MAPPING_NOT_FOUND = "ACTIVE_MAPPING_NOT_FOUND";
    /** 활성 매핑은 있지만 잔여 회기가 0 이라 차감 불가. */
    public static final String REASON_REMAINING_SESSIONS_ZERO = "REMAINING_SESSIONS_ZERO";
    /** 매핑 status 가 보정 허용 외 (TERMINATED 등). */
    public static final String REASON_MAPPING_STATUS_INVALID = "MAPPING_STATUS_INVALID";
    /** 차감 시도 중 알 수 없는 예외 발생. */
    public static final String REASON_UNEXPECTED_ERROR = "UNEXPECTED_ERROR";

    @NotNull(message = "schedule_id는 필수입니다.")
    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "mapping_id")
    private Long mappingId;

    @NotNull(message = "reason은 필수입니다.")
    @Size(max = 64, message = "reason은 64자 이하여야 합니다.")
    @Column(name = "reason", length = 64, nullable = false)
    private String reason;

    /** 어드민이 알림을 처리·종결한 시각. null 이면 미해결. */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
