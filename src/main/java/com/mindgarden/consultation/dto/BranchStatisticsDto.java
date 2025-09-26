package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

/**
 * 지점 통계 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchStatisticsDto {
    
    private Long branchId;
    private String branchCode;
    private String branchName;
    
    // 사용자 통계
    private Integer totalUsers;
    private Integer consultants;
    private Integer clients;
    private Integer admins;
    
    // 상담 통계
    private Integer totalConsultations;
    private Integer completedConsultations;
    private Integer pendingConsultations;
    private Integer cancelledConsultations;
    
    // 수익 통계
    private Double totalRevenue;
    private Double monthlyRevenue;
    private Double averageRevenue;
    
    // 평점 통계
    private Double averageRating;
    private Integer totalRatings;
    
    // 성과 지표
    private Map<String, Object> performanceMetrics;
    
    // 기간별 통계
    private LocalDate startDate;
    private LocalDate endDate;
    private String period;
    
    // 트렌드 데이터
    private Map<String, Object> trendData;
    
    // 등급 정보
    private String performanceGrade;
    private String gradeColor;
    private String gradeLabel;
}
