package com.coresolution.consultation.service.ai.dto;

import com.coresolution.consultation.entity.AiUsageLog;
import java.time.LocalDateTime;
import java.util.Locale;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AI 사용 로그 응답 DTO (어드민 AI 프로바이더 관리 페이지 — 로그 테이블 row).
 *
 * <p>트랙 B PR-4 (2026-05-24): 디자이너 §5 — 호출 로그 목록 행 1건.</p>
 *
 * <p>2026-05-25 N3 보강 (V20260529_001): {@code ai_provider} 컬럼이 caller-set 값으로 정합화되어
 * {@link #aiProvider} 는 {@link AiUsageLog#getAiProvider()} 를 직접 사용한다 (model prefix 추정 제거).
 * 전체 본문은 {@link AiUsageLogDetailResponse} 에 노출된다.</p>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageLogResponse {

    /** 로그 PK */
    private Long id;

    /** 실제 호출 provider 라벨 (OPENAI / GEMINI / CLAUDE / REPLICATE / UNKNOWN) — entity 컬럼 직접 사용 */
    private String aiProvider;

    /** caller (requestType — wellness / healing / psych 등) */
    private String requestType;

    /** 사용된 모델 명 (gpt-4o-mini 등) */
    private String model;

    /** 성공/실패 (success | failed) */
    private String status;

    /** 응답 시간(ms). 없으면 null. */
    private Long durationMs;

    /** 토큰 총합. null 가능. */
    private Integer tokenCount;

    /** 실패 시 에러 메시지 (앞 200자 트림). 성공이면 null. */
    private String errorMessage;

    /** 호출 시각 */
    private LocalDateTime createdAt;

    /** 호출자 ID (감사 로그용) */
    private String requestedBy;

    /**
     * Entity → Response 변환.
     *
     * <p>2026-05-25 N3: provider 는 {@link AiUsageLog#getAiProvider()} 를 직접 사용한다.
     * 기존 행이 소문자/혼합 케이스로 저장돼 있더라도 대문자로 정규화하여 일관성을 유지한다.</p>
     */
    public static AiUsageLogResponse fromEntity(AiUsageLog entity) {
        if (entity == null) {
            return null;
        }
        String errorPreview = entity.getErrorMessage();
        if (errorPreview != null && errorPreview.length() > 200) {
            errorPreview = errorPreview.substring(0, 200) + "...";
        }
        return AiUsageLogResponse.builder()
                .id(entity.getId())
                .aiProvider(normalizeProvider(entity.getAiProvider()))
                .requestType(entity.getRequestType())
                .model(entity.getModel())
                .status(Boolean.FALSE.equals(entity.getIsSuccess()) ? "failed" : "success")
                .durationMs(entity.getResponseTimeMs())
                .tokenCount(entity.getTotalTokens())
                .errorMessage(errorPreview)
                .createdAt(entity.getCreatedAt())
                .requestedBy(entity.getRequestedBy())
                .build();
    }

    /**
     * provider 값을 대문자 라벨로 정규화한다. {@code null/blank} 입력은 {@code UNKNOWN} 으로 처리.
     */
    static String normalizeProvider(String raw) {
        if (raw == null || raw.isBlank()) {
            return "UNKNOWN";
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }
}
