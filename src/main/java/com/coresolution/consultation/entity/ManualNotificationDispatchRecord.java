package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.constant.ManualNotificationProviderMode;
import com.coresolution.consultation.dto.TestNotificationChannel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 프로바이더 호출 직전 기록(수신자·시도별). DISPATCHING 으로 먼저 커밋한 뒤 프로바이더를 부르고 결과로 닫는다.
 *
 * <p>{@code dispatch_key = <jobUuid>:<recipientKey>} 와 (작업, 확정 수신자) 유니크 제약 때문에 같은 작업에서
 * 같은 수신자에게 두 번째 발송 기록을 만들 수 없다 — 기록이 없으면 프로바이더를 부르지 않으므로 중복 발송이 불가능하다.
 * DRY_RUN(.dev)도 같은 경로로 기록한다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Entity
@Table(name = "manual_notification_dispatch_records",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_mndr_dispatch_key", columnNames = {"dispatch_key"}),
        @UniqueConstraint(name = "uk_mndr_job_recipient", columnNames = {"job_id", "job_recipient_id"})
    },
    indexes = {
        @Index(name = "idx_mndr_job_chunk", columnList = "job_id, chunk_index"),
        @Index(name = "idx_mndr_tenant", columnList = "tenant_id")
    })
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ManualNotificationDispatchRecord extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "job_recipient_id", nullable = false)
    private Long jobRecipientId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "phone_masked", length = 20)
    private String phoneMasked;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 20)
    private TestNotificationChannel channel;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "dispatch_key", nullable = false, length = 120)
    private String dispatchKey;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_mode", length = 20)
    private ManualNotificationProviderMode providerMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ManualNotificationDeliveryStatus status;

    @Column(name = "provider_result_code", length = 50)
    private String providerResultCode;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
