package com.coresolution.consultation.service.ai.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AI 프로바이더 헬스체크 응답 DTO.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProviderHealth {

    private String tenantId;
    private String activeProvider;
    private boolean openaiKeyRegistered;
    private boolean geminiKeyRegistered;
    private Instant checkedAt;
}
