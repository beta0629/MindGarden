package com.coresolution.consultation.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 웰니스 컨텐츠 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellnessContent {
    
    private String title;
    private String content;
    private String category;
    private String season;
    private Integer dayOfWeek;
}
