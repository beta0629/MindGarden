package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
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
 * 수동 발송 작업의 확정 수신자(발송 시점에 서버가 정한 목록). 작업·수신자 키 유니크로 한 작업 안 중복 수신자를 막는다.
 *
 * <p>전화번호는 마스킹 값만 평문으로 둔다. 직접 입력 번호(등록 사용자 아님)만 암호문을 함께 저장하고,
 * 등록 사용자는 발송 직전에 사용자 정보에서 다시 읽는다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Entity
@Table(name = "manual_notification_job_recipients",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_mnjr_job_recipient", columnNames = {"job_id", "recipient_key"})
    },
    indexes = {
        @Index(name = "idx_mnjr_job_status_seq", columnList = "job_id, status, seq"),
        @Index(name = "idx_mnjr_tenant", columnList = "tenant_id")
    })
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ManualNotificationJobRecipient extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "seq", nullable = false)
    private Integer seq;

    @Column(name = "recipient_key", nullable = false, length = 80)
    private String recipientKey;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "phone_masked", length = 20)
    private String phoneMasked;

    @Column(name = "phone_encrypted", length = 512)
    private String phoneEncrypted;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ManualNotificationDeliveryStatus status;

    @Column(name = "chunk_index")
    private Integer chunkIndex;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Column(name = "provider_result_code", length = 50)
    private String providerResultCode;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "audit_log_id")
    private Long auditLogId;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
