package com.coresolution.consultation.constant;

/**
 * 개인정보 파기 근거({@code personal_data_destruction_logs.legal_basis}) enum.
 *
 * <p>PIPA / 의료법 / 상법 / 세법 / GDPR 등 파기 또는 보관 의무의 법적 근거를 코드로 적재.
 * 코드 문자열에는 절(§) 문자를 사용하지 않는다 — 마이그레이션 컬럼 길이(VARCHAR 60) 안에서
 * ASCII 만 사용하도록 정착했다. 한국어 라벨은 {@link #getMessageKey()} 의 i18n 키.</p>
 *
 * <ul>
 *   <li>{@link #PIPA_36} — PIPA 제36조 (개인정보 정정·삭제 요구)</li>
 *   <li>{@link #PIPA_39_6} — PIPA 제39조의6 (장기 미이용자 휴면)</li>
 *   <li>{@link #PIPA_39_7} — PIPA 제39조의7 (개인정보 파기 의무)</li>
 *   <li>{@link #ADMIN_FORCED} — 관리자 강제 파기</li>
 *   <li>{@link #MEDICAL_LAW_22_10Y} — 의료법 제22조 (의료기록 10년 보관 의무)</li>
 *   <li>{@link #COMMERCIAL_LAW_5Y} — 상법 (거래 기록 5년 보관)</li>
 *   <li>{@link #TAX_LAW_5Y} — 세법 (세무 기록 5년 보관)</li>
 *   <li>{@link #GDPR_17} — GDPR Article 17 (Right to erasure)</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public enum LegalBasis {

    PIPA_36("PIPA_36", "enums.LegalBasis.PIPA_36"),
    PIPA_39_6("PIPA_39_6", "enums.LegalBasis.PIPA_39_6"),
    PIPA_39_7("PIPA_39_7", "enums.LegalBasis.PIPA_39_7"),
    ADMIN_FORCED("ADMIN_FORCED", "enums.LegalBasis.ADMIN_FORCED"),
    MEDICAL_LAW_22_10Y("MEDICAL_LAW_22_10Y", "enums.LegalBasis.MEDICAL_LAW_22_10Y"),
    COMMERCIAL_LAW_5Y("COMMERCIAL_LAW_5Y", "enums.LegalBasis.COMMERCIAL_LAW_5Y"),
    TAX_LAW_5Y("TAX_LAW_5Y", "enums.LegalBasis.TAX_LAW_5Y"),
    GDPR_17("GDPR_17", "enums.LegalBasis.GDPR_17");

    private final String code;
    private final String messageKey;

    LegalBasis(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getCode() {
        return code;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public static LegalBasis fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("LegalBasis code is null");
        }
        for (LegalBasis value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown LegalBasis code: " + code);
    }
}
