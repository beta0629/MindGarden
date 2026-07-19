package com.coresolution.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
 * 일정 변경 SCHEDULE_CHANGED 외부 채널(알림톡/SMS) 디바운스 pending.
 *
 * <p>슬롯 변경 시 즉시 발송하지 않고 본 행을 upsert 한 뒤,
 * {@code fire_at} 경과 시 스케줄러가 최신 슬롯으로 1회 발송한다.</p>
 *
 * @author MindGarden
 * @since 2026-07-19
 */
@Entity
@Table(
        name = "schedule_change_notification_pending",
        indexes = {
                @Index(name = "idx_scnp_due", columnList = "status, fire_at, is_deleted"),
                @Index(name = "idx_scnp_tenant_schedule_status", columnList = "tenant_id, schedule_id, status"),
                @Index(name = "idx_scnp_idem", columnList = "tenant_id, schedule_id, slot_version, status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ScheduleChangeNotificationPending extends BaseEntity {

    @NotNull
    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @NotNull
    @Column(name = "fire_at", nullable = false)
    private LocalDateTime fireAt;

    @NotNull
    @Column(name = "previous_date", nullable = false)
    private LocalDate previousDate;

    @Column(name = "previous_start_time")
    private LocalTime previousStartTime;

    /**
     * 발송 대상 슬롯 버전(멱등 키). 예: {@code 2026-05-21|14:00|15:00} 또는 updatedAt 스냅샷.
     */
    @NotNull
    @Size(max = 128)
    @Column(name = "slot_version", length = 128, nullable = false)
    private String slotVersion;

    @NotNull
    @Size(max = 32)
    @Column(name = "status", length = 32, nullable = false)
    private String status;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
