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
 * 웰니스 템플릿 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Entity
@Table(name = "wellness_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellnessTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "day_of_week")
    private Integer dayOfWeek;
    
    @Column(name = "season", length = 20)
    private String season;
    
    @Column(name = "category", length = 50)
    private String category;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "is_important")
    @Builder.Default
    private Boolean isImportant = false;
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", length = 100)
    @Builder.Default
    private String createdBy = "SYSTEM";
}