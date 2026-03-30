package com.coresolution.consultation.entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 치료 경과 예측 엔티티
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Entity
@Table(name = "treatment_predictions")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class TreatmentPrediction extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "consultation_id")
    private Long consultationId;

    // 예측 결과
    @Column(name = "predicted_outcome", length = 50)
    private String predictedOutcome;  // EXCELLENT, GOOD, MODERATE, POOR

    @Column(name = "success_probability", precision = 3, scale = 2)
    private BigDecimal successProbability;

    @Column(name = "estimated_improvement_rate", precision = 5, scale = 2)
    private BigDecimal estimatedImprovementRate;

    // 권장 회기 수
    @Column(name = "recommended_session_count")
    private Integer recommendedSessionCount;

    @Column(name = "confidence_level", precision = 3, scale = 2)
    private BigDecimal confidenceLevel;

    // 예측 근거
    @Column(name = "prediction_factors", columnDefinition = "JSON")
    private String predictionFactors;

    @Column(name = "similar_cases_count")
    private Integer similarCasesCount;

    @Column(name = "similar_case_ids", columnDefinition = "JSON")
    private String similarCaseIds;

    // 위험 요인
    @Column(name = "risk_factors", columnDefinition = "JSON")
    private String riskFactors;

    @Column(name = "protective_factors", columnDefinition = "JSON")
    private String protectiveFactors;

    // 모델 정보
    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Column(name = "prediction_date")
    private LocalDateTime predictionDate;
}
