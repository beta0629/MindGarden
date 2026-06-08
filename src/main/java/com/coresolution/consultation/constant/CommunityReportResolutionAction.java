package com.coresolution.consultation.constant;

/**
 * Apple T2 (1.2 UGC) — 어드민이 신고 처리 시 적용한 결정.
 *
 * <p>운영자는 신고 1건당 하나의 액션을 선택한다. {@link #NONE} 은 기각(REJECTED)과 함께 사용되어
 * 액션 자체가 적용되지 않은 경우를 의미한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public enum CommunityReportResolutionAction {

    /** 미지정 — 신고 기각 시 사용. */
    NONE,

    /** 콘텐츠 숨김 처리(소프트 삭제·hidden_at 설정). */
    HIDE_CONTENT,

    /** 콘텐츠 삭제 처리(soft delete). */
    DELETE_CONTENT,

    /** 작성자 7일 일시 정지. */
    SUSPEND_USER,

    /** 작성자 영구 추방. */
    BAN_USER
}
