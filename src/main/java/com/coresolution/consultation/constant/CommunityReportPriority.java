package com.coresolution.consultation.constant;

/**
 * Apple T2 (1.2 UGC) — 신고 우선순위.
 *
 * <p>{@link #AUTO_QUARANTINE} 은 동일 게시물 3건 누적 신고 트리거에 의해 자동 격리된 신고를 의미한다.
 * 어드민 큐에서 상단에 노출되어 즉시 처리할 수 있도록 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public enum CommunityReportPriority {

    /** 일반 신고. */
    NORMAL,

    /** 우선순위 높음(반복 신고 등). */
    HIGH,

    /** 동일 콘텐츠 3건 누적 신고 자동 격리 트리거. */
    AUTO_QUARANTINE
}
