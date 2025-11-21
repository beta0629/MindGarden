package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 일별 통계 엔티티
 * PL/SQL 통계 시스템을 위한 일별 집계 데이터
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Entity
@Table(name = "daily_statistics",
    indexes = {
        @Index(name = "idx_daily_stats_date", columnList = "statDate"),
        @Index(name = "idx_daily_stats_branch", columnList = "branchCode"),
        @Index(name = "idx_daily_stats_date_branch", columnList = "statDate, branchCode")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_stats_date_branch", columnNames = {"statDate", "branchCode"})
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStatistics extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    @Column(name = "branch_code", length = 20)
    private String branchCode;

    @Column(name = "total_consultations")
    @Builder.Default
    private Integer totalConsultations = 0;

    @Column(name = "completed_consultations")
    @Builder.Default
    private Integer completedConsultations = 0;

    @Column(name = "cancelled_consultations")
    @Builder.Default
    private Integer cancelledConsultations = 0;

    @Column(name = "total_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Column(name = "total_refunds")
    @Builder.Default
    private Integer totalRefunds = 0;

    @Column(name = "refund_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "consultant_count")
    @Builder.Default
    private Integer consultantCount = 0;

    @Column(name = "client_count")
    @Builder.Default
    private Integer clientCount = 0;

    // BaseEntity에서 createdAt, updatedAt 상속받음
}