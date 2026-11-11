package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.converter.PersonalNameAttributeConverter;
import com.coresolution.consultation.converter.PhoneAttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 센터 홈페이지 공개 문의 접수 엔티티.
 *
 * <p>이름·전화는 {@link PersonalNameAttributeConverter} /
 * {@link PhoneAttributeConverter} 로 암호화 저장한다. 클라이언트 IP 는 해시만 보관한다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Entity
@Table(name = "homepage_inquiries")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class HomepageInquiry extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Convert(converter = PersonalNameAttributeConverter.class)
    @Column(name = "name", nullable = false, length = 512)
    private String name;

    @Convert(converter = PhoneAttributeConverter.class)
    @Column(name = "phone", nullable = false, length = 512)
    private String phone;

    @Column(name = "inquiry_type", nullable = false, length = 64)
    private String inquiryType;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "privacy_consent_at", nullable = false)
    private LocalDateTime privacyConsentAt;

    @Column(name = "consent_version", nullable = false, length = 64)
    private String consentVersion;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "source", length = 32)
    private String source;

    @Column(name = "source_ref", length = 128)
    private String sourceRef;

    @Column(name = "legacy_inquiry_type", length = 128)
    private String legacyInquiryType;

    @Column(name = "client_ip_hash", length = 64)
    private String clientIpHash;
}
