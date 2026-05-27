package com.coresolution.consultation.util.pii;

import java.util.Set;

/**
 * 개인정보(PII) 스크러빙 전략 인터페이스.
 *
 * <p>본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q11 의
 * 3단계 로드맵을 반영하기 위한 Strategy Pattern. 후속 단계 (Phase 5.1 KcBERT, Phase 5.2 KLUE NER,
 * Phase 5.3 GPT-4o) 도입 시 호출부 변경 없이 본 인터페이스 구현체만 추가한다.
 *
 * <ul>
 *   <li>1단계 (현재) — {@link com.coresolution.consultation.util.pii.RegexBasedPiiScrubber} (정규식)</li>
 *   <li>2단계 (후속) — KcBERT(alphagyuu/Korean-PII-Masking-BERT) 기반 NER</li>
 *   <li>3단계 (후속) — KLUE NER 23 카테고리(ehd0309/ko-pii-public-v1) 확장</li>
 * </ul>
 *
 * <p>모든 구현체는 stateless 하며 thread-safe 해야 한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public interface PiiScrubberStrategy {

    /**
     * 자유 입력 텍스트에서 PII 를 마스킹한다.
     *
     * <p>입력이 {@code null} 또는 빈 문자열이면 그대로 반환한다. 비활성화된 경우(설정으로 일괄 off)에도
     * 입력을 변형 없이 반환해야 한다.
     *
     * @param input 원본 텍스트
     * @return PII 가 치환된 텍스트 (변경 없으면 입력과 동일).
     */
    String scrub(String input);

    /**
     * 본 전략이 처리하는 활성화된 패턴 유형 집합.
     *
     * @return 활성화된 {@link PiiPatternType} 집합. 비활성화 시 empty.
     */
    Set<PiiPatternType> getActivePatterns();

    /**
     * 전략 식별자 (로깅·관측·테스트 분기에 사용).
     *
     * @return 전략 이름 (예: {@code "regex"}, {@code "bert"}, {@code "gpt"}).
     */
    String getStrategyName();
}
