package com.coresolution.consultation.constant;

/**
 * Apple T2 (Guideline 1.2 UGC) — 커뮤니티 신고 처리 상태.
 *
 * <p>운영자는 OPEN → UNDER_REVIEW → RESOLVED/REJECTED 순으로 처리하며 24h SLA 가 부과된다.
 * 운영자는 status 필터링으로 어드민 큐를 좁힐 수 있고 default 는 OPEN+UNDER_REVIEW 이다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public enum CommunityReportStatus {

    /** 신규 접수 — 어드민 처리 대기. */
    OPEN,

    /** 어드민 검토 중 — UI 진입 시 표시. */
    UNDER_REVIEW,

    /** 처리 완료(콘텐츠 삭제·사용자 정지 등 액션 적용). */
    RESOLVED,

    /** 신고 기각(허위 신고 등). */
    REJECTED
}
