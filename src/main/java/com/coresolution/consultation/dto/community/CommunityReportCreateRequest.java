package com.coresolution.consultation.dto.community;

import com.coresolution.consultation.constant.CommunityReportReasonCode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 게시글·댓글 신고 요청.
 *
 * <p>P2-C (Apple G1.2 UGC) — 5종 사유만 허용. 레거시 8종 코드는
 * {@link CommunityReportReasonCode#toApprovedReasonCode()} 로 서비스 레벨에서 매핑된다.</p>
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
