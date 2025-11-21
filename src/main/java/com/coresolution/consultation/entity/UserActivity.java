package com.coresolution.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 활동 내역 엔티티
 */
@Entity
@Table(name = "user_activities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "activity_type", length = 50, nullable = false)
    private String activityType; // CONSULTATION, PAYMENT, SYSTEM, PROFILE
    
    @Column(name = "title", length = 200, nullable = false)
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "status", length = 20, nullable = false)
    private String status; // COMPLETED, PENDING, FAILED, INFO
    
    @Column(name = "icon", length = 50)
    private String icon;
    
    @Column(name = "color", length = 20)
    private String color;
    
    @Column(name = "related_id")
    private Long relatedId; // 관련 엔티티 ID (상담, 결제 등)
    
    @Column(name = "related_type", length = 50)
    private String relatedType; // CONSULTATION, PAYMENT, SCHEDULE 등
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
