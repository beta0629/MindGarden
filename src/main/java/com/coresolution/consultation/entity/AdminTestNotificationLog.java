package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 어드민 SMS·카카오 알림톡 테스트 발송 감사로그 엔티티.
 *
 * <p>발송 직전 INSERT(success=false) → 결과 UPDATE(success/error/solapi_ids) 패턴으로 사용한다.
 * 감사로그는 발송 실패 시에도 반드시 남아야 하므로 호출부는 {@code Propagation.REQUIRES_NEW}로
 * 트랜잭션을 분리한다(기획서 §7 위험 매트릭스 — 감사로그 누락 완화).
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Entity
@Table(name = "admin_test_notification_logs",
    indexes = {
        @Index(name = "idx_atnl_tenant", columnList = "tenant_id"),
        @Index(name = "idx_atnl_sent_by_user", columnList = "sent_by_user_id"),
        @Index(name = "idx_atnl_sent_at", columnList = "sent_at"),
        @Index(name = "idx_atnl_tenant_user_sent",
            columnList = "tenant_id, sent_by_user_id, sent_at"),
        @Index(name = "idx_atnl_tenant_batch",
            columnList = "tenant_id, batch_id")
    })
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTestNotificationLog extends BaseEntity {

    @Column(name = "sent_by_user_id", nullable = false)
    private Long sentByUserId;

    @Column(name = "sent_by_username", nullable = false, length = 100)
    private String sentByUsername;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_mode", nullable = false, length = 20)
    private TestNotificationRecipientMode recipientMode;

    @Column(name = "recipient_user_id")
    private Long recipientUserId;

    @Column(name = "recipient_phone_masked", nullable = false, length = 20)
    private String recipientPhoneMasked;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 20)
    private TestNotificationChannel channel;

    @Column(name = "template_code", length = 100)
    private String templateCode;

    /** JSON 직렬화된 템플릿 파라미터(알림톡 한정). */
    @Column(name = "template_params", columnDefinition = "JSON")
    private String templateParams;

    @Column(name = "message_content", columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    /**
     * 수동 발송 배치 그룹 ID(UUID). 단일 발송 도구는 {@code null} 로 두며,
     * 어드민 수동 알림 발송 도구가 한 번에 다중 수신자를 발송할 때만 동일한 UUID 가
     * 같은 배치 행 N개에 부여된다(P1.2 / 2026-05-23).
     */
    @Column(name = "batch_id", length = 36)
    private String batchId;

    @Builder.Default
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
}
