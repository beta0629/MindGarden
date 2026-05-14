package com.coresolution.consultation.dto.community;

import com.coresolution.consultation.constant.CommunityReportReasonCode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 게시글·댓글 신고 요청.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
public class CommunityReportCreateRequest {

    @NotNull
    private CommunityReportReasonCode reasonCode;

    @Size(max = 1000)
    private String detailMessage;

    /** 신고 대상이 댓글일 때 community_comments.id */
    private Long commentId;
}
