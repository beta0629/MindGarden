package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.converter.PersonalNameAttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * SCT 동의 기록. IP는 해시만 저장.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_consents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "invitation_id", nullable = false)
    private Long invitationId;

    /** 내담자 단위 동의. 미연동 시 null, link 시 승계. */
    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "consent_type", nullable = false, length = 40)
    private String consentType;

    @Column(name = "consent_template_version", length = 40)
    private String consentTemplateVersion;

    @Column(name = "agreed", nullable = false)
    private Boolean agreed;

    @Convert(converter = PersonalNameAttributeConverter.class)
    @Column(name = "guardian_name_enc", length = 512)
    private String guardianName;

    @Convert(converter = PersonalNameAttributeConverter.class)
    @Column(name = "guardian_relation", length = 512)
    private String guardianRelation;

    @Convert(converter = PersonalNameAttributeConverter.class)
    @Column(name = "signer_name_enc", length = 512)
    private String signerName;

    @Convert(converter = PersonalNameAttributeConverter.class)
    @Column(name = "child_name_confirm_enc", length = 512)
    private String childNameConfirm;

    @Column(name = "is_revoked", nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoked_by_user_id")
    private Long revokedByUserId;

    @Column(name = "agreed_at", nullable = false)
    private LocalDateTime agreedAt;

    @Column(name = "ip_hash", nullable = false, length = 64)
    private String ipHash;

    @Column(name = "user_agent_hash", length = 64)
    private String userAgentHash;
}
