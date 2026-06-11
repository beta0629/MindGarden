package com.coresolution.consultation.constant;

/**
 * 커뮤니티 신고 사유 코드.
 *
 * <p>Apple G1.2 UGC — P2-C 시안(§B) 적용: 기존 8종 → 5종으로 단순화.
 * 운영 환경의 기존 row 는 {@code V20260611_001} 마이그레이션에서 5종으로 매핑된다
 * ({@code ABUSIVE_LANGUAGE → HARASSMENT}, {@code VIOLENCE → HARASSMENT},
 *  {@code MISINFORMATION → OTHER}, {@code COPYRIGHT → OTHER}).</p>
 *
 * <p>레거시 enum 값은 호환 차원에서 {@link Deprecated} 로 유지하되 신규 신고는 5종만 받는다.
 * Bean Validation 으로 5종만 허용하려면 {@link #isApprovedForIntake()} 를 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public enum CommunityReportReasonCode {

    /** 음란·외설적 콘텐츠 (Apple G1.2 "objectionable content"). */
    OBSCENE,

    /** 폭력·혐오·괴롭힘 — 기존 {@code ABUSIVE_LANGUAGE}/{@code VIOLENCE} 통합. */
    HARASSMENT,

    /** 사기·스팸·광고. */
    SPAM,

    /** Apple G1.2 — 자해·자살 조장 (P2-C 신규). */
    SELF_HARM,

    /** 그 외 사유 — 상세 메모 권장. 기존 {@code MISINFORMATION}/{@code COPYRIGHT} 도 이 코드로 흡수. */
    OTHER,

    /** @deprecated P2-C 5종 매핑에서 {@link #HARASSMENT} 로 통합. 신규 신고 차단. */
    @Deprecated
    ABUSIVE_LANGUAGE,

    /** @deprecated P2-C 5종 매핑에서 {@link #HARASSMENT} 로 통합. 신규 신고 차단. */
    @Deprecated
    VIOLENCE,

    /** @deprecated P2-C 5종 매핑에서 {@link #OTHER} 로 통합. 신규 신고 차단. */
    @Deprecated
    MISINFORMATION,

    /** @deprecated P2-C 5종 매핑에서 {@link #OTHER} 로 통합. 신규 신고 차단. */
    @Deprecated
    COPYRIGHT;

    /**
     * P2-C 시안 §B 5종 — 신규 신고 접수 시 허용 여부.
     *
     * @return 신규 접수 가능한 코드면 {@code true}
     */
    public boolean isApprovedForIntake() {
        switch (this) {
            case OBSCENE:
            case HARASSMENT:
            case SPAM:
            case SELF_HARM:
            case OTHER:
                return true;
            default:
                return false;
        }
    }

    /**
     * 레거시 enum 값을 P2-C 5종으로 매핑.
     *
     * @return 매핑된 신규 코드 (자기 자신이거나 5종 중 하나)
     */
    public CommunityReportReasonCode toApprovedReasonCode() {
        switch (this) {
            case ABUSIVE_LANGUAGE:
            case VIOLENCE:
                return HARASSMENT;
            case MISINFORMATION:
            case COPYRIGHT:
                return OTHER;
            default:
                return this;
        }
    }
}
