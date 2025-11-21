package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 지점 통계 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchStatisticsResponse {
    
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
    
    /**
     * BranchStatisticsDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 BranchStatisticsDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto BranchStatisticsDto (deprecated)
     * @return BranchStatisticsResponse
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static BranchStatisticsResponse fromDto(BranchStatisticsDto dto) {
        if (dto == null) {
            return null;
        }
        
        return BranchStatisticsResponse.builder()
            .branchId(dto.getBranchId())
            .branchCode(dto.getBranchCode())
            .branchName(dto.getBranchName())
            .totalUsers(dto.getTotalUsers())
            .consultants(dto.getConsultants())
            .clients(dto.getClients())
            .admins(dto.getAdmins())
            .totalConsultations(dto.getTotalConsultations())
            .completedConsultations(dto.getCompletedConsultations())
            .pendingConsultations(dto.getPendingConsultations())
            .cancelledConsultations(dto.getCancelledConsultations())
            .totalRevenue(dto.getTotalRevenue())
            .monthlyRevenue(dto.getMonthlyRevenue())
            .averageRevenue(dto.getAverageRevenue())
            .averageRating(dto.getAverageRating())
            .totalRatings(dto.getTotalRatings())
            .performanceMetrics(dto.getPerformanceMetrics())
            .startDate(dto.getStartDate())
            .endDate(dto.getEndDate())
            .period(dto.getPeriod())
            .trendData(dto.getTrendData())
            .performanceGrade(dto.getPerformanceGrade())
            .gradeColor(dto.getGradeColor())
            .gradeLabel(dto.getGradeLabel())
            .build();
    }
}

