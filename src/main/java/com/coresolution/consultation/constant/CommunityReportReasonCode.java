package com.coresolution.consultation.constant;

/**
 * 커뮤니티 신고 사유 코드.
 *
 * <p>Apple T2 (1.2 UGC) — 디자이너 핸드오프 §4.2 신고 모달 사유 6종 + 기존 호환 코드 유지.
 * 추가 사유는 공통 코드 그룹으로 확장 가능하다.</p>
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public enum CommunityReportReasonCode {

    /** 스팸·광고. */
    SPAM,

    /** 욕설·괴롭힘·혐오. */
    HARASSMENT,

    /** Apple T2 1.2 — 욕설·폭력적 언어(괴롭힘과 별도 분류 시). */
    ABUSIVE_LANGUAGE,

    /** Apple T2 1.2 — 음란·외설적 콘텐츠. */
    OBSCENE,

    /** Apple T2 1.2 — 폭력·위협. */
    VIOLENCE,

    /** 허위·미검증 정보. */
    MISINFORMATION,

    /** 저작권·초상권·개인정보 침해. */
    COPYRIGHT,

    /** 그 외 사유 — 상세 메모 권장. */
    OTHER
}
