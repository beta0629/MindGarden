package com.coresolution.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 따뜻한 말 한마디 엔티티
 * 상담사들에게 격려와 위로를 제공
 */
@Entity
@Table(name = "warm_words")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarmWords {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(name = "category", length = 50, nullable = false)
    private String category; // ENCOURAGEMENT, APPRECIATION, SUPPORT
    
    @Column(name = "consultant_role", length = 50)
    private String consultantRole; // 특정 역할 대상 (NULL이면 전체)
    
    @Column(name = "mood_type", length = 50)
    private String moodType; // STRESSED, TIRED, OVERWHELMED, SUCCESS
    
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
