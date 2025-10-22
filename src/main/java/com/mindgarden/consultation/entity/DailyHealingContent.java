package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 오늘의 힐링 컨텐츠 엔티티
 * 내담자와 상담사를 위한 힐링 컨텐츠를 일별로 저장
 */
@Entity
@Table(name = "daily_healing_content")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyHealingContent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "content_date", nullable = false)
    private LocalDate contentDate; // 컨텐츠 생성 날짜
    
    @Column(name = "title", length = 200, nullable = false)
    private String title; // 제목
    
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content; // HTML 컨텐츠
    
    @Column(name = "category", length = 50, nullable = false)
    private String category; // HUMOR, WARM_WORDS, MEDITATION, MOTIVATION, GENERAL
    
    @Column(name = "user_role", length = 50, nullable = false)
    private String userRole; // CLIENT, CONSULTANT
    
    @Column(name = "emoji", length = 10)
    private String emoji; // 이모지
    
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
