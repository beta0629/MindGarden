package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 활동 내역 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityResponse {
    
    private Long id;
    private String activityType;
    private String title;
    private String description;
    private String status;
    private String icon;
    private String color;
    private Long relatedId;
    private String relatedType;
    private LocalDateTime createdAt;
    private String timeAgo; // "오늘", "1일 전" 등
}
