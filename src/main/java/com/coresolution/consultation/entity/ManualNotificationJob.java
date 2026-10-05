package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.constant.ManualNotificationJobStatus;
import com.coresolution.consultation.constant.ManualNotificationProviderMode;
import com.coresolution.consultation.constant.ManualNotificationRecipientMode;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplateSource;
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
 * 어드민 수동 다중 발송 비동기 작업.
 *
 * <p>요청마다 멱등 키(관리자·테넌트 범위 유니크)를 받아 같은 요청은 작업 1건만 만든다. 상태 전이와 집계는
 * 저장소의 조건부 UPDATE 로만 바꾼다(엔티티 save 는 최초 INSERT 에만 사용).
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Entity
@Table(name = "manual_notification_jobs",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_mnj_job_uuid", columnNames = {"job_uuid"}),
        @UniqueConstraint(name = "uk_mnj_idempotency",
            columnNames = {"tenant_id", "created_by_user_id", "idempotency_key"})
    },
    indexes = {
        @Index(name = "idx_mnj_tenant_created", columnList = "tenant_id, created_at"),
        @Index(name = "idx_mnj_status_lease", columnList = "status, lease_until")
    })
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ManualNotificationJob extends BaseEntity {

    @Column(name = "job_uuid", nullable = false, length = 36)
    private String jobUuid;

    @Column(name = "idempotency_key", nullable = false, length = 64)
    private String idempotencyKey;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "created_by_username", length = 100)
    private String createdByUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 20)
    private TestNotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_mode", nullable = false, length = 20)
    private ManualNotificationRecipientMode recipientMode;

    @Column(name = "marketing", nullable = false)
    private Boolean marketing;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ManualNotificationJobStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_mode", length = 20)
    private ManualNotificationProviderMode providerMode;

    @Column(name = "message_content", columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "push_title", length = 100)
    private String pushTitle;

    @Column(name = "template_code", length = 100)
    private String templateCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_source", length = 20)
    private TestNotificationAlimtalkTemplateSource templateSource;

    @Column(name = "template_params", columnDefinition = "TEXT")
    private String templateParams;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "snapshot_token", length = 64)
    private String snapshotToken;

    @Column(name = "excluded_count", nullable = false)
    private Integer excludedCount;

    @Column(name = "ineligible_count", nullable = false)
    private Integer ineligibleCount;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount;

    @Column(name = "sent_count", nullable = false)
    private Integer sentCount;

    @Column(name = "failed_count", nullable = false)
    private Integer failedCount;

    @Column(name = "skipped_count", nullable = false)
    private Integer skippedCount;

    @Column(name = "chunk_size", nullable = false)
    private Integer chunkSize;

    @Column(name = "chunk_count", nullable = false)
    private Integer chunkCount;

    @Column(name = "execution_attempts", nullable = false)
    private Integer executionAttempts;

    @Column(name = "lease_owner", length = 100)
    private String leaseOwner;

    @Column(name = "lease_until")
    private LocalDateTime leaseUntil;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "error_code", length = 50)
    private String errorCode;
}
