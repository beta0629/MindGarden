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
 * 예약 즉시 SMS 업무시간 외 지연 발송 pending.
 *
 * <p>등록 시점이 업무시간 밖이면 즉시 발송하지 않고 본 행을 저장한 뒤,
 * {@code fire_at} 경과 시 스케줄러가 등록 시점 템플릿으로 1회 발송한다.</p>
 *
 * @author MindGarden
 * @since 2026-07-29
 */
@Entity
@Table(
        name = "immediate_reservation_sms_pending",
        indexes = {
                @Index(name = "idx_irsp_due", columnList = "status, fire_at, is_deleted"),
                @Index(name = "idx_irsp_tenant_schedule_status", columnList = "tenant_id, schedule_id, status"),
                @Index(name = "idx_irsp_idem", columnList = "tenant_id, schedule_id, template_code, status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ImmediateReservationSmsPending extends BaseEntity {

    @NotNull
    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @NotNull
    @Size(max = 64)
    @Column(name = "template_code", length = 64, nullable = false)
    private String templateCode;

    @NotNull
    @Column(name = "fire_at", nullable = false)
    private LocalDateTime fireAt;

    @NotNull
    @Size(max = 32)
    @Column(name = "status", length = 32, nullable = false)
    private String status;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
