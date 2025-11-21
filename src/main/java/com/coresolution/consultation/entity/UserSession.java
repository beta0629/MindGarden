package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 활성 세션 관리 엔티티
 * 중복 로그인 방지를 위한 세션 추적
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
@Entity
@Table(name = "user_sessions", 
       indexes = {
           @Index(name = "idx_user_sessions_user_id", columnList = "user_id"),
           @Index(name = "idx_user_sessions_session_id", columnList = "session_id"),
           @Index(name = "idx_user_sessions_is_active", columnList = "is_active"),
           @Index(name = "idx_user_sessions_created_at", columnList = "created_at"),
           @Index(name = "idx_user_sessions_expires_at", columnList = "expires_at"),
           @Index(name = "idx_user_sessions_client_ip", columnList = "client_ip")
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {
    
    /**
     * 세션 ID (Primary Key)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 사용자 ID (Foreign Key)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    /**
     * HTTP 세션 ID
     */
    @Column(name = "session_id", nullable = false, length = 100, unique = true)
    private String sessionId;
    
    /**
     * 세션 생성 시간
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 마지막 활동 시간
     */
    @Column(name = "last_activity_at", nullable = false)
    private LocalDateTime lastActivityAt;
    
    /**
     * 세션 만료 시간
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    /**
     * 세션 활성 상태
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 클라이언트 IP 주소
     */
    @Column(name = "client_ip", length = 45)
    private String clientIp;
    
    /**
     * 사용자 에이전트 정보
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    /**
     * 로그인 방식 (NORMAL, SOCIAL)
     */
    @Column(name = "login_type", length = 20)
    @Builder.Default
    private String loginType = "NORMAL";
    
    /**
     * 소셜 로그인 제공자 (KAKAO, NAVER 등)
     */
    @Column(name = "social_provider", length = 20)
    private String socialProvider;
    
    /**
     * 세션 종료 시간 (비활성화 시)
     */
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    /**
     * 세션 종료 사유
     */
    @Column(name = "end_reason", length = 50)
    private String endReason;
    
    /**
     * 세션이 활성 상태인지 확인
     */
    public boolean isSessionActive() {
        return isActive && LocalDateTime.now().isBefore(expiresAt);
    }
    
    /**
     * 세션을 비활성화
     */
    public void deactivate(String reason) {
        this.isActive = false;
        this.endedAt = LocalDateTime.now();
        this.endReason = reason;
    }
    
    /**
     * 세션 활동 시간 업데이트
     */
    public void updateLastActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }
    
    /**
     * 세션 만료 시간 연장
     */
    public void extendExpiration(int minutes) {
        this.expiresAt = LocalDateTime.now().plusMinutes(minutes);
    }
}
