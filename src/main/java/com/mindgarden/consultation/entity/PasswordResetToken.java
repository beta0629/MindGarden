package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 비밀번호 재설정 토큰 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "token", nullable = false, unique = true, length = 255)
    private String token;
    
    @Column(name = "email", nullable = false, length = 100)
    private String email;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "used", nullable = false)
    @Builder.Default
    private Boolean used = false;
    
    @Column(name = "used_at")
    private LocalDateTime usedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * 토큰이 만료되었는지 확인
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    /**
     * 토큰이 사용 가능한지 확인 (사용되지 않았고 만료되지 않았는지)
     */
    public boolean isValid() {
        return !used && !isExpired();
    }
    
    /**
     * 토큰을 사용됨으로 표시
     */
    public void markAsUsed() {
        this.used = true;
        this.usedAt = LocalDateTime.now();
    }
}
