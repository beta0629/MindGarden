package com.coresolution.consultation.service.ai;

import com.coresolution.consultation.service.ai.dto.AiProviderHealth;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * AI 프로바이더 헬스체크 서비스.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@Service
@RequiredArgsConstructor
public class AiProviderHealthService {

    private final AiProviderResolver providerResolver;

    /**
     * 테넌트의 AI 프로바이더 헬스 상태를 조회한다.
     *
     * @param tenantId 테넌트 ID (필수)
     * @return 헬스 DTO (키 등록 여부만 boolean, 키 값 미노출)
     */
    public AiProviderHealth checkHealth(String tenantId) {
        String activeProvider = providerResolver.resolveProvider(tenantId);
        return AiProviderHealth.builder()
                .tenantId(tenantId)
                .activeProvider(activeProvider)
                .openaiKeyRegistered(providerResolver.isProviderKeyRegistered(tenantId, "OPENAI"))
                .geminiKeyRegistered(providerResolver.isProviderKeyRegistered(tenantId, "GEMINI"))
                .checkedAt(Instant.now())
                .build();
    }
}
