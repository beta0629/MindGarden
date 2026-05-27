package com.coresolution.consultation.util.pii;

/**
 * 자유 입력 텍스트에서 마스킹 대상이 되는 개인정보(PII) 패턴 유형.
 *
 * <p>본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q11
 * 결재 — 1단계 정규식 기반 7개 패턴.
 *
 * <p>각 패턴 유형은 {@link PiiScrubberStrategy} 구현체에서 라벨링·치환에 사용된다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public enum PiiPatternType {

    /** 이메일 주소. */
    EMAIL("[REDACTED_EMAIL]"),

    /** 한국 휴대전화 / 일반 전화번호. */
    PHONE("[REDACTED_PHONE]"),

    /** 주민등록번호. */
    RRN("[REDACTED_RRN]"),

    /** 외국인등록번호. */
    ARN("[REDACTED_ARN]"),

    /** 신용카드 번호(13~19자리, Luhn 체크는 후속 단계). */
    CARD("[REDACTED_CARD]"),

    /** 은행 계좌번호(일반 패턴). */
    BANK("[REDACTED_BANK]"),

    /** URL. */
    URL("[REDACTED_URL]");

    /** 치환 라벨. */
    private final String redactionLabel;

    PiiPatternType(String redactionLabel) {
        this.redactionLabel = redactionLabel;
    }

    /**
     * @return 매칭된 PII 가 치환될 라벨 문자열.
     */
    public String getRedactionLabel() {
        return redactionLabel;
    }

    /**
     * 설정 키({@code mindgarden.lifecycle.pii-scrubber.enabled-patterns})에 사용되는 소문자 이름.
     *
     * @return enum 이름의 소문자 표현 (예: {@code "email"}).
     */
    public String getConfigKey() {
        return name().toLowerCase(java.util.Locale.ROOT);
    }
}
