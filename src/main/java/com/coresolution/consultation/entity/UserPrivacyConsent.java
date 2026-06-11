package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 개인정보 동의 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Entity
@Table(name = "user_privacy_consent")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrivacyConsent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 100)
    private String tenantId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "privacy_consent", nullable = false)
    private Boolean privacyConsent;
    
    @Column(name = "terms_consent", nullable = false)
    private Boolean termsConsent;
    
    @Column(name = "marketing_consent")
    private Boolean marketingConsent;

    /**
     * Apple G1.2 UGC (P2-C) — 동의 시점의 EULA 버전 문자열.
     *
     * <p>{@code null} 또는 현재 시행 버전(예: {@code "1.0.0"})과 일치하지 않으면
     * 부팅 시 재동의 게이트가 발동한다.</p>
     */
    @Column(name = "terms_version", length = 32)
    private String termsVersion;

    @Column(name = "consent_date", nullable = false)
    private LocalDateTime consentDate;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
