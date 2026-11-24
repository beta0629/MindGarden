package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.converter.EmailAttributeConverter;
import com.coresolution.consultation.converter.PhoneAttributeConverter;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
 * SCT 발송 건(초대).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_invitations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sct_inv_token_hash", columnNames = "token_hash"),
    @UniqueConstraint(name = "uk_sct_inv_tenant_mgmt_no", columnNames = {"tenant_id", "management_no"})
}, indexes = {
    @Index(name = "idx_sct_inv_tenant_status", columnList = "tenant_id,status,created_at"),
    @Index(name = "idx_sct_inv_tenant_client", columnList = "tenant_id,client_id,submitted_at"),
    @Index(name = "idx_sct_inv_tenant_mapping", columnList = "tenant_id,mapping_id"),
    @Index(name = "idx_sct_inv_phone_hash", columnList = "tenant_id,target_phone_hash")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SctInvitation extends BaseEntity {

    @Column(name = "form_template_id", nullable = false)
    private Long formTemplateId;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "mapping_id")
    private Long mappingId;

    @Column(name = "consultant_id")
    private Long consultantId;

    /** 테넌트 단위 관리번호(PII 없음). 생성 시 자동 부여, 수정 API 없음. */
    @Column(name = "management_no", nullable = false, length = 32)
    private String managementNo;

    @Column(name = "recipient_name", length = 120)
    private String recipientName;

    @Convert(converter = PhoneAttributeConverter.class)
    @Column(name = "target_phone", length = 512)
    private String targetPhone;

    @Convert(converter = EmailAttributeConverter.class)
    @Column(name = "target_email", length = 512)
    private String targetEmail;

    @Column(name = "target_phone_hash", length = 64)
    private String targetPhoneHash;

    @Column(name = "target_email_hash", length = 64)
    private String targetEmailHash;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "token_expires_at", nullable = false)
    private LocalDateTime tokenExpiresAt;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "draft_saved_at")
    private LocalDateTime draftSavedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "sent_by_user_id", nullable = false)
    private Long sentByUserId;

    @Column(name = "sms_dispatch_result", length = 40)
    private String smsDispatchResult;

    @Column(name = "link_opened_at")
    private LocalDateTime linkOpenedAt;

    @Column(name = "verify_fail_count", nullable = false)
    @lombok.Builder.Default
    private Integer verifyFailCount = 0;

    @Column(name = "verify_locked_until")
    private LocalDateTime verifyLockedUntil;

    @Column(name = "respondent_meta_json", columnDefinition = "TEXT")
    private String respondentMetaJson;

    @Column(name = "requires_guardian", nullable = false)
    @lombok.Builder.Default
    private Boolean requiresGuardian = false;
}
