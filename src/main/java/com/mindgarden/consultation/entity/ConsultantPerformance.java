package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.mindgarden.consultation.service.StatisticsConfigService;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사별 성과 엔티티
 * 상담사의 일별/월별 성과 데이터 저장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Entity
@Table(name = "consultant_performance",
    indexes = {
        @Index(name = "idx_performance_date", columnList = "performanceDate"),
        @Index(name = "idx_performance_score", columnList = "performanceScore"),
        @Index(name = "idx_performance_consultant", columnList = "consultantId")
    })
@IdClass(ConsultantPerformanceId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantPerformance {

    @Id
    @Column(name = "consultant_id")
    private Long consultantId;

    @Id
    @Column(name = "performance_date")
    private LocalDate performanceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", insertable = false, updatable = false)
    private User consultant;

    @Column(name = "completion_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal completionRate = BigDecimal.ZERO;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Column(name = "total_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "client_retention_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal clientRetentionRate = BigDecimal.ZERO;

    @Column(name = "performance_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal performanceScore = BigDecimal.ZERO;

    @Column(name = "grade", length = 10)
    private String grade;

    @Column(name = "refund_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal refundRate = BigDecimal.ZERO;

    @Column(name = "total_schedules")
    @Builder.Default
    private Integer totalSchedules = 0;

    @Column(name = "completed_schedules")
    @Builder.Default
    private Integer completedSchedules = 0;

    @Column(name = "cancelled_schedules")
    @Builder.Default
    private Integer cancelledSchedules = 0;

    @Column(name = "no_show_schedules")
    @Builder.Default
    private Integer noShowSchedules = 0;

    @Column(name = "total_ratings")
    @Builder.Default
    private Integer totalRatings = 0;

    @Column(name = "unique_clients")
    @Builder.Default
    private Integer uniqueClients = 0;

    @Column(name = "repeat_clients")
    @Builder.Default
    private Integer repeatClients = 0;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    private StatisticsConfigService statisticsConfigService;

    // 업데이트 시 자동으로 시간 설정
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }

    // StatisticsConfigService 주입 (Service Layer에서 사용)
    public void setStatisticsConfigService(StatisticsConfigService statisticsConfigService) {
        this.statisticsConfigService = statisticsConfigService;
    }

    // 성과 점수 계산 (공통코드 기반 가중치 적용)
    public void calculatePerformanceScore() {
        double score = 0.0;
        
        if (totalSchedules > 0 && statisticsConfigService != null) {
            // 완료율 점수 (공통코드에서 가중치 조회)
            BigDecimal completionWeight = statisticsConfigService.getPerformanceWeight("COMPLETION_RATE");
            double completionScore = (completedSchedules.doubleValue() / totalSchedules) * completionWeight.doubleValue();
            score += completionScore;
            
            // 평균 평점 점수 (공통코드에서 가중치 조회)
            BigDecimal ratingWeight = statisticsConfigService.getPerformanceWeight("AVERAGE_RATING");
            score += avgRating.doubleValue() * ratingWeight.doubleValue();
            
            // 고객 유지율 점수 (공통코드에서 가중치 조회)
            if (uniqueClients > 0) {
                BigDecimal retentionWeight = statisticsConfigService.getPerformanceWeight("CLIENT_RETENTION");
                double retentionScore = (repeatClients.doubleValue() / uniqueClients) * retentionWeight.doubleValue();
                score += retentionScore;
            }
            
            // 취소율 보너스 (공통코드에서 기준값과 보너스 점수 조회)
            BigDecimal cancellationThreshold = statisticsConfigService.getCancellationRateThreshold("ACCEPTABLE");
            double cancellationRate = (cancelledSchedules.doubleValue() / totalSchedules) * 100;
            if (cancellationRate < cancellationThreshold.doubleValue()) {
                BigDecimal bonusScore = statisticsConfigService.getBonusScore("CANCELLATION_BONUS");
                score += bonusScore.doubleValue();
            }
            
            // 노쇼율 보너스 (공통코드에서 기준값과 보너스 점수 조회)
            BigDecimal noShowThreshold = statisticsConfigService.getNoShowRateThreshold("ACCEPTABLE");
            double noShowRate = (noShowSchedules.doubleValue() / totalSchedules) * 100;
            if (noShowRate < noShowThreshold.doubleValue()) {
                BigDecimal bonusScore = statisticsConfigService.getBonusScore("NOSHOW_BONUS");
                score += bonusScore.doubleValue();
            }
        } else if (totalSchedules > 0) {
            // 기본값 (공통코드 서비스가 없는 경우)
            score = calculatePerformanceScoreWithDefaults();
        }
        
        this.performanceScore = BigDecimal.valueOf(Math.round(score * 100.0) / 100.0);
        
        // 등급 자동 계산
        calculateGrade();
    }
    
    // 기본값으로 성과 점수 계산 (fallback)
    private double calculatePerformanceScoreWithDefaults() {
        double score = 0.0;
        
        // 완료율 (30%)
        double completionScore = (completedSchedules.doubleValue() / totalSchedules) * 30;
        score += completionScore;
        
        // 평균 평점 (20%)
        score += avgRating.doubleValue() * 20;
        
        // 고객 유지율 (20%)
        if (uniqueClients > 0) {
            double retentionScore = (repeatClients.doubleValue() / uniqueClients) * 20;
            score += retentionScore;
        }
        
        // 취소율이 10% 미만이면 추가 점수 (15%)
        double cancellationRate = (cancelledSchedules.doubleValue() / totalSchedules) * 100;
        if (cancellationRate < 10) {
            score += 15;
        }
        
        // 노쇼율이 5% 미만이면 추가 점수 (15%)
        double noShowRate = (noShowSchedules.doubleValue() / totalSchedules) * 100;
        if (noShowRate < 5) {
            score += 15;
        }
        
        return score;
    }

    // 등급 계산 (공통코드 기반)
    private void calculateGrade() {
        if (statisticsConfigService != null) {
            this.grade = statisticsConfigService.getGradeName(performanceScore);
        } else {
            // 기본값 (공통코드 서비스가 없는 경우)
            calculateGradeWithDefaults();
        }
    }
    
    // 기본값으로 등급 계산 (fallback)
    private void calculateGradeWithDefaults() {
        double score = performanceScore.doubleValue();
        
        if (score >= 90) {
            this.grade = "S급";
        } else if (score >= 80) {
            this.grade = "A급";
        } else if (score >= 70) {
            this.grade = "B급";
        } else if (score >= 60) {
            this.grade = "C급";
        } else {
            this.grade = "D급";
        }
    }
}
