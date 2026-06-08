package com.coresolution.consultation.dto.community;

import com.coresolution.consultation.constant.CommunityReportResolutionAction;
import com.coresolution.consultation.constant.CommunityReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Apple T2 (1.2 UGC) — 어드민 신고 처리 요청.
 *
 * <p>{@code status} 가 RESOLVED 면 {@code action} 이 필수이며, REJECTED 면 action 은 NONE 으로 강제된다.
 * {@code action=HIDE_CONTENT} 또는 {@code DELETE_CONTENT} 는 게시물/댓글 hidden_at 을 동시에 설정한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
public class CommunityReportResolutionRequest {

    /** 처리 후 상태(RESOLVED 또는 REJECTED). */
    @NotNull
    private CommunityReportStatus status;

    /** 적용 액션(REJECTED 의 경우 NONE). */
    private CommunityReportResolutionAction action;

    /** 운영자 메모(선택, 500자). */
    @Size(max = 500)
    private String note;
}
