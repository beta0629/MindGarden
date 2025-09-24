package com.mindgarden.consultation.entity;

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
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "privacy_consent", nullable = false)
    private Boolean privacyConsent;
    
    @Column(name = "terms_consent", nullable = false)
    private Boolean termsConsent;
    
    @Column(name = "marketing_consent")
    private Boolean marketingConsent;
    
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
