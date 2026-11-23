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

    @Column(name = "consent_type", nullable = false, length = 40)
    private String consentType;

    @Column(name = "consent_template_version", length = 40)
    private String consentTemplateVersion;

    @Column(name = "agreed", nullable = false)
    private Boolean agreed;

    @Convert(converter = PersonalNameAttributeConverter.class)
    @Column(name = "guardian_name_enc", length = 512)
    private String guardianName;

    @Column(name = "guardian_relation", length = 40)
    private String guardianRelation;

    @Column(name = "agreed_at", nullable = false)
    private LocalDateTime agreedAt;

    @Column(name = "ip_hash", nullable = false, length = 64)
    private String ipHash;

    @Column(name = "user_agent_hash", length = 64)
    private String userAgentHash;
}
