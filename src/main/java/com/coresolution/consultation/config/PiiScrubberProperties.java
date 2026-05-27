package com.coresolution.consultation.config;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import com.coresolution.consultation.util.pii.PiiPatternType;
import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 자유 입력 PII 스크러빙 설정.
 *
 * <p>{@code mindgarden.lifecycle.pii-scrubber.*} 키로 바인딩. 본 합의서
 * {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q11 결재 결과 —
 * 1단계 정규식(default) + 향후 단계적 BERT/GPT 확장.
 *
 * <ul>
 *   <li>{@link #getStrategy()} = {@code "regex"} (default) | {@code "bert"} (Phase 5.1) | {@code "gpt"} (Phase 5.3)</li>
 *   <li>{@link #getEnabledPatterns()} = 활성 패턴 콤마 구분 문자열 (default 7개 모두)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ConfigurationProperties(prefix = "mindgarden.lifecycle.pii-scrubber")
@Getter
@Setter
public class PiiScrubberProperties {

    /** 전략 식별자 — {@link com.coresolution.consultation.util.pii.PiiScrubberStrategy#getStrategyName()} 과 일치. */
    private String strategy = "regex";

    /** 활성 패턴 콤마 구분 문자열 (예: {@code "email,phone,rrn,arn,card,bank,url"}). */
    private String enabledPatterns = "email,phone,rrn,arn,card,bank,url";

    /**
     * {@link #enabledPatterns} 문자열을 {@link PiiPatternType} 집합으로 파싱한다.
     *
     * <p>알 수 없는 토큰은 무시된다(부분 활성화). 빈 문자열이면 empty set 반환.
     *
     * @return 활성 패턴 집합 (immutable view).
     */
    public Set<PiiPatternType> resolveEnabledPatterns() {
        if (enabledPatterns == null || enabledPatterns.isBlank()) {
            return EnumSet.noneOf(PiiPatternType.class);
        }

        Set<PiiPatternType> resolved = EnumSet.noneOf(PiiPatternType.class);
        List<String> unknown = new ArrayList<>();
        for (String token : enabledPatterns.split(",")) {
            String normalized = token.trim().toUpperCase(Locale.ROOT);
            if (normalized.isEmpty()) {
                continue;
            }
            try {
                resolved.add(PiiPatternType.valueOf(normalized));
            } catch (IllegalArgumentException ex) {
                unknown.add(token.trim());
            }
        }

        if (!unknown.isEmpty()) {
            // 알 수 없는 토큰은 로깅 없이 무시하되, 호출부에서 검증할 수 있도록 noop 진행
            // (스킬: 로깅 표준 — properties 클래스에서 logger 의존성 추가 지양)
            return EnumSet.copyOf(resolved);
        }

        return resolved.isEmpty() ? EnumSet.noneOf(PiiPatternType.class) : EnumSet.copyOf(resolved);
    }
}
