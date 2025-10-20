package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 시스템 공지 읽음 상태 엔티티
 * 각 사용자가 공지를 읽었는지 추적
 */
@Entity
@Table(name = "system_notification_reads", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"notification_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SystemNotificationRead extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 공지 ID
     */
    @NotNull(message = "공지 ID는 필수입니다.")
    @Column(name = "notification_id", nullable = false)
    private Long notificationId;
    
    /**
     * 사용자 ID
     */
    @NotNull(message = "사용자 ID는 필수입니다.")
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    /**
     * 읽음 여부
     */
    @Column(name = "is_read")
    private Boolean isRead = false;
    
    /**
     * 읽은 시간
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    /**
     * 읽음 처리
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}

