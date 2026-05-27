package com.coresolution.consultation.util.pii;

import java.util.Collections;
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.coresolution.consultation.config.PiiScrubberProperties;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 1단계 정규식 기반 PII 스크러빙 구현체.
 *
 * <p>본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q11
 * — 1단계 (즉시 도입) 정규식. 후속 단계 (BERT/GPT) 도입 시 본 클래스 변경 없이
 * 다른 {@link PiiScrubberStrategy} 구현체를 추가하면 된다.
 *
 * <p><b>적용 순서</b>: 더 엄격한 패턴(RRN, ARN) 을 먼저 적용해 일반적인 숫자열 패턴(BANK, CARD) 의
 * 오탐을 줄인다.
 *
 * <p><b>스레드 안전성</b>: {@link Pattern} 은 immutable 하므로 본 컴포넌트는 thread-safe.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Slf4j
@Component
public class RegexBasedPiiScrubber implements PiiScrubberStrategy {

    /** 본 전략 식별자. */
    static final String STRATEGY_NAME = "regex";

    /** 정책 설정에서 활성/비활성 토글을 읽는다. */
    private final PiiScrubberProperties properties;

    /** 패턴 적용 순서 (RRN/ARN → EMAIL/URL → PHONE → CARD → BANK). */
    private final Map<PiiPatternType, Pattern> compiledPatterns;

    public RegexBasedPiiScrubber(PiiScrubberProperties properties) {
        this.properties = properties;
        this.compiledPatterns = buildCompiledPatterns();
    }

    /**
     * 적용 순서 보존 + 컴파일된 패턴 맵 구성.
     *
     * <p>{@code LinkedHashMap} (EnumMap 은 enum 선언 순서 유지) 으로 RRN/ARN 을 먼저 적용한다.
     */
    private Map<PiiPatternType, Pattern> buildCompiledPatterns() {
        EnumMap<PiiPatternType, Pattern> map = new EnumMap<>(PiiPatternType.class);

        // 13자리(주민번호) → 외국인 → 이메일 → URL → 전화 → 카드(긴 숫자열) → 계좌(짧은 숫자열) 순서
        map.put(PiiPatternType.RRN,
            Pattern.compile("(?<![0-9])\\d{6}-?[1-4]\\d{6}(?![0-9])"));
        map.put(PiiPatternType.ARN,
            Pattern.compile("(?<![0-9])\\d{6}-?[5-8]\\d{6}(?![0-9])"));
        map.put(PiiPatternType.EMAIL,
            Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b"));
        map.put(PiiPatternType.URL,
            Pattern.compile("https?://[^\\s\\u3000\"'<>]+"));
        // 한국 휴대 + 한국 일반(02 / 03x ~ 06x) 통합
        map.put(PiiPatternType.PHONE,
            Pattern.compile("(?<![0-9])(?:01[016789]|0(?:2|[3-6][1-5])|070|050\\d?)-?\\d{3,4}-?\\d{4}(?![0-9])"));
        // 13~19자리 숫자열 (하이픈/공백 허용). RRN/ARN 우선 매칭으로 13자리 주민번호 오탐 회피.
        map.put(PiiPatternType.CARD,
            Pattern.compile("(?<![0-9])(?:\\d[ -]?){12,18}\\d(?![0-9])"));
        // 일반 계좌번호 패턴 (3-2-6 등 9~20자리). CARD 우선 매칭 후 잔여 매칭만 처리.
        map.put(PiiPatternType.BANK,
            Pattern.compile("(?<![0-9])\\d{3,6}-\\d{2,6}-\\d{4,8}(?![0-9])"));

        return Collections.unmodifiableMap(map);
    }

    @Override
    public String scrub(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        Set<PiiPatternType> active = getActivePatterns();
        if (active.isEmpty()) {
            return input;
        }

        String result = input;
        for (Map.Entry<PiiPatternType, Pattern> entry : compiledPatterns.entrySet()) {
            if (!active.contains(entry.getKey())) {
                continue;
            }
            result = applyPattern(result, entry.getValue(), entry.getKey().getRedactionLabel());
        }
        return result;
    }

    /**
     * 단일 패턴 적용. {@link Matcher#appendReplacement(StringBuilder, String)} 의 백슬래시 이스케이프
     * 이슈를 회피하기 위해 라벨을 {@link Matcher#quoteReplacement(String)} 로 감싼다.
     */
    private String applyPattern(String input, Pattern pattern, String label) {
        Matcher matcher = pattern.matcher(input);
        if (!matcher.find()) {
            return input;
        }

        StringBuilder builder = new StringBuilder(input.length());
        String quotedLabel = Matcher.quoteReplacement(label);
        do {
            matcher.appendReplacement(builder, quotedLabel);
        } while (matcher.find());
        matcher.appendTail(builder);
        return builder.toString();
    }

    @Override
    public Set<PiiPatternType> getActivePatterns() {
        Set<PiiPatternType> resolved = properties.resolveEnabledPatterns();
        return resolved.isEmpty()
            ? Collections.emptySet()
            : Collections.unmodifiableSet(new LinkedHashSet<>(resolved));
    }

    @Override
    public String getStrategyName() {
        return STRATEGY_NAME;
    }
}
