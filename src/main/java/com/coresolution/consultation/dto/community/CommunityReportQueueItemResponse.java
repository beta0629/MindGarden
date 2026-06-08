package com.coresolution.consultation.dto.community;

import com.coresolution.consultation.constant.CommunityReportPriority;
import com.coresolution.consultation.constant.CommunityReportResolutionAction;
import com.coresolution.consultation.constant.CommunityReportStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * Apple T2 (1.2 UGC) — 어드민 신고 처리 큐 항목.
 *
 * <p>디자이너 핸드오프 §8.2 카드 + §8.3 SLA 타이머 표시를 위해 status/priority/createdAt 을
 * 그대로 노출하고, 본문 미리보기·신고자 표시·대상 정보를 함께 묶는다.</p>
 *
 * <p>{@code minutesSinceCreated} 는 백엔드에서 계산해 FE 가 분 단위로만 표시하도록 한다.
 * 18h(1080m) 이상이면 디자인 토큰 {@code --color-warning-500}, 24h(1440m) 이상이면
 * {@code --color-danger-500} 를 적용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommunityReportQueueItemResponse {

    /** 신고 row id. */
    long id;

    /** 처리 상태. */
    CommunityReportStatus status;

    /** 우선순위 (자동 격리 신고는 AUTO_QUARANTINE 으로 상단 강조). */
    CommunityReportPriority priority;

    /** 신고 사유 코드 ({@code CommunityReportReasonCode} 이름). */
    String reasonCode;

    /** 신고자가 작성한 상세 메모(선택). */
    String detailMessage;

    /** 신고자 표시명 (nickname → name → 사용자). */
    String reporterDisplay;

    /** 신고자 users.id. */
    long reporterUserId;

    /** 대상 게시글 id. */
    long postId;

    /** 대상 게시글 작성자 표시명 (anonymous 처리). */
    String postAuthorDisplay;

    /** 대상 게시글 작성자 users.id. */
    long postAuthorUserId;

    /** 대상 게시글 제목. */
    String postTitle;

    /** 대상 게시글 본문 미리보기 (240자). */
    String postBodyPreview;

    /** 댓글 신고일 때 댓글 id (게시글 신고면 null). */
    Long commentId;

    /** 댓글 신고일 때 댓글 본문 미리보기 (240자). */
    String commentBodyPreview;

    /** 게시글이 이미 숨김 처리되었는지 (어드민 큐에서 회색 처리용). */
    boolean postHidden;

    /** 신고 접수 시각 (ISO LocalDateTime). */
    String createdAt;

    /** 신고 접수 후 경과 분 (SLA 타이머 표시용). */
    long minutesSinceCreated;

    /** 처리 시각 (ISO LocalDateTime, null 이면 미처리). */
    String resolvedAt;

    /** 처리한 관리자 표시명 (null 이면 미처리). */
    String resolvedByDisplay;

    /** 처리 액션 (null 이면 미처리). */
    CommunityReportResolutionAction resolutionAction;
}
