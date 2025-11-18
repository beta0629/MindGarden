package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 사용자 Passkey 엔티티
 * Week 15-16: Passkey 인증 설계 및 준비
 * 
 * WebAuthn 기반 Passkey 정보를 저장하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "user_passkey", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_credential_id", columnList = "credential_id"),
    @Index(name = "idx_user_active", columnList = "user_id, is_active, is_deleted")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPasskey {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "credential_id", unique = true, nullable = false, length = 255)
    private String credentialId; // WebAuthn Credential ID (Base64 인코딩)
    
    @Column(name = "public_key", columnDefinition = "TEXT", nullable = false)
    private String publicKey; // 공개 키 (Base64 인코딩)
    
    @Column(name = "counter", nullable = false)
    @Builder.Default
    private Long counter = 0L; // 리플레이 공격 방지를 위한 카운터
    
    @Column(name = "device_name", length = 100)
    private String deviceName; // 사용자가 지정한 기기 이름 (예: "내 iPhone", "내 노트북")
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt; // 마지막 사용 일시
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true; // 활성화 여부
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
}

