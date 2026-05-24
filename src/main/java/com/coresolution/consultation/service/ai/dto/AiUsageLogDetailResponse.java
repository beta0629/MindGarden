package com.coresolution.consultation.service.ai.dto;

import com.coresolution.consultation.entity.AiUsageLog;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AI 사용 로그 상세 응답 DTO (모달용 전체 본문).
 *
 * <p>트랙 B PR-4 (2026-05-24): 디자이너 §5 — 로그 상세 모달.
 * 현 엔티티에 prompt/response 컬럼이 없어 메타 + 에러 본문만 노출한다. 추후 컬럼 추가 시 확장.</p>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageLogDetailResponse {

    private Long id;

    /** 추정 provider 라벨 (OPENAI / GEMINI / CLAUDE / REPLICATE / UNKNOWN) */
    private String aiProvider;

    /** caller (requestType) */
    private String requestType;

    /** 사용된 모델 명 */
    private String model;

    /** 성공/실패 */
    private String status;

    /** 응답 시간(ms) */
    private Long durationMs;

    /** prompt 토큰 */
    private Integer promptTokens;

    /** completion 토큰 */
    private Integer completionTokens;

    /** 총 토큰 */
    private Integer totalTokens;

    /** 예상 비용(USD) */
    private Double estimatedCost;

    /** 에러 메시지 전체 본문 (성공이면 null) */
    private String errorMessage;

    /** 호출 시각 */
    private LocalDateTime createdAt;

    /** 호출자 */
    private String requestedBy;

    public static AiUsageLogDetailResponse fromEntity(AiUsageLog entity, String provider) {
        if (entity == null) {
            return null;
        }
        return AiUsageLogDetailResponse.builder()
                .id(entity.getId())
                .aiProvider(provider)
                .requestType(entity.getRequestType())
                .model(entity.getModel())
                .status(Boolean.FALSE.equals(entity.getIsSuccess()) ? "failed" : "success")
                .durationMs(entity.getResponseTimeMs())
                .promptTokens(entity.getPromptTokens())
                .completionTokens(entity.getCompletionTokens())
                .totalTokens(entity.getTotalTokens())
                .estimatedCost(entity.getEstimatedCost())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .requestedBy(entity.getRequestedBy())
                .build();
    }
}
