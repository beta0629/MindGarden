package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 오늘의 유머 엔티티
 * 상담사들에게 힘이 되는 유머를 제공
 */
@Entity
@Table(name = "daily_humor")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyHumor {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(name = "category", length = 50, nullable = false)
    private String category; // WORK, LIFE, GENERAL
    
    @Column(name = "consultant_role", length = 50)
    private String consultantRole; // 특정 역할 대상 (NULL이면 전체)
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
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
