package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 알림 배치/이벤트 발송 멱등성 로그 엔티티.
 *
 * <p>발송 직전 INSERT(success=false) → 결과 UPDATE(success/error/solapi_ids/channel) 패턴으로 사용한다.
 * UNIQUE 키 {@code (tenant_id, template_code, target_type, target_id, recipient_user_id)} 가
 * 중복 발송을 차단하므로 호출자({@code BatchNotificationDispatchService}) 는 INSERT 충돌을
 * 멱등성 skip 으로 해석한다.
 *
 * <p>감사로그는 발송 실패 시에도 반드시 남아야 하므로 호출부는
 * {@code Propagation.REQUIRES_NEW} 로 트랜잭션을 분리한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Entity
@Table(name = "notification_batch_send_log",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_nbsl_dispatch_idempotency",
            columnNames = {"tenant_id", "template_code", "target_type", "target_id", "recipient_user_id"})
    },
    indexes = {
        @Index(name = "idx_nbsl_tenant_sent", columnList = "tenant_id, sent_at"),
        @Index(name = "idx_nbsl_tenant_template", columnList = "tenant_id, template_code")
    })
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationBatchSendLog extends BaseEntity {

    @Column(name = "template_code", nullable = false, length = 100)
    private String templateCode;

    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "recipient_user_id", nullable = false)
    private Long recipientUserId;

    @Column(name = "recipient_phone_masked", nullable = false, length = 20)
    private String recipientPhoneMasked;

    @Column(name = "channel_used", nullable = false, length = 20)
    private String channelUsed;

    @Column(name = "fallback_to_sms", nullable = false)
    private Boolean fallbackToSms = Boolean.FALSE;

    @Column(name = "success", nullable = false)
    private Boolean success = Boolean.FALSE;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "solapi_group_id", length = 100)
    private String solapiGroupId;

    @Column(name = "solapi_message_id", length = 100)
    private String solapiMessageId;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;
}
