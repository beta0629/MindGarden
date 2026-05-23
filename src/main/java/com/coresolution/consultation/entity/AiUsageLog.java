package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import java.util.Locale;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI API 사용 로그 엔티티 (멀티 프로바이더 통합).
 *
 * <p>트랙 B PR-2 리네임 (기획서 §7 Q5=a): 기존 {@code OpenAIUsageLog} +
 * {@code openai_usage_logs} 테이블이 OpenAI 외 Gemini·Claude·Replicate 등을 통합 적재함에 따라
 * provider-prefix 를 제거한다.</p>
 *
 * <p>테이블 리네임은 Flyway V20260528_006 (RENAME TABLE openai_usage_logs TO ai_usage_logs)
 * 에서 처리한다.</p>
 *
 * @author CoreSolution
 * @author MindGarden
 * @since 2025-01-21
 */
@Entity
@Table(name = "ai_usage_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    /**
     * 요청 타입 (wellness, healing, psych, anomaly_detection 등 caller 라벨).
     */
    @Column(name = "request_type", length = 50)
    private String requestType;

    /**
     * 사용된 모델 (gpt-4o-mini, gpt-4o, gemini-2.5-flash 등).
     */
    @Column(length = 50)
    private String model;

    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @Column(name = "total_tokens")
    private Integer totalTokens;

    /**
     * 예상 비용(USD).
     */
    @Column(name = "estimated_cost")
    private Double estimatedCost;

    @Column(name = "is_success")
    private Boolean isSuccess;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "requested_by", length = 100)
    private String requestedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isSuccess == null) {
            isSuccess = true;
        }
    }

    /**
     * 예상 비용(USD)을 모델명 기준 대략 단가로 계산한다.
     * 미식별 모델은 gpt-4o-mini 단가로 대체한다.
     */
    public void calculateCost() {
        if (promptTokens == null || completionTokens == null) {
            return;
        }
        String m = model != null ? model.toLowerCase(Locale.ROOT) : "";
        double inputPer1k;
        double outputPer1k;
        if (m.contains("gpt-4o-mini")) {
            inputPer1k = 0.00015;
            outputPer1k = 0.0006;
        } else if (m.contains("gpt-4o")) {
            inputPer1k = 0.0025;
            outputPer1k = 0.01;
        } else if (m.contains("gpt-3.5")) {
            inputPer1k = 0.0005;
            outputPer1k = 0.0015;
        } else {
            inputPer1k = 0.00015;
            outputPer1k = 0.0006;
        }
        double inputCost = (promptTokens / 1000.0) * inputPer1k;
        double outputCost = (completionTokens / 1000.0) * outputPer1k;
        this.estimatedCost = inputCost + outputCost;
    }
}
