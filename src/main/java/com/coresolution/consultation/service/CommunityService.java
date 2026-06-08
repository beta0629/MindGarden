package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityReportStatus;
import com.coresolution.consultation.dto.community.CommunityCommentCreateRequest;
import com.coresolution.consultation.dto.community.CommunityCommentResponse;
import com.coresolution.consultation.dto.community.CommunityModerationPatchRequest;
import com.coresolution.consultation.dto.community.CommunityModerationQueueItemResponse;
import com.coresolution.consultation.dto.community.CommunityPostCreateRequest;
import com.coresolution.consultation.dto.community.CommunityPostFeedItemResponse;
import com.coresolution.consultation.dto.community.CommunityPostUpdateRequest;
import com.coresolution.consultation.dto.community.CommunityReportCreateRequest;
import com.coresolution.consultation.dto.community.CommunityReportQueueItemResponse;
import com.coresolution.consultation.dto.community.CommunityReportResolutionRequest;
import com.coresolution.consultation.entity.User;
import org.springframework.data.domain.Pageable;

/**
 * 커뮤니티 피드·쓰기·어드민 검수.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityService {

    /**
     * 검수 완료 게시글 피드(탭 필터 선택).
     *
     * @param reader   조회 사용자
     * @param tab      {@code reviews}, {@code columns}, {@code all}(또는 null)
     * @param pageable 페이지
     * @return 피드 항목 목록
     */
    List<CommunityPostFeedItemResponse> listApprovedFeed(User reader, String tab, Pageable pageable);

    /**
     * 단건 조회 — 승인 게시 또는 작성자 본인의 비승인 건.
     *
     * @param reader 조회 사용자
     * @param postId 게시글 id
     * @return 피드 항목
     */
    CommunityPostFeedItemResponse getPost(User reader, Long postId);

    CommunityPostFeedItemResponse createPost(User author, CommunityPostCreateRequest request);

    CommunityPostFeedItemResponse updatePost(User author, Long postId, CommunityPostUpdateRequest request);

    void deletePost(User author, Long postId);

    CommunityCommentResponse addComment(User author, Long postId, CommunityCommentCreateRequest request);

    void deleteComment(User actor, Long commentId);

    void addLike(User actor, Long postId);

    void removeLike(User actor, Long postId);

    void report(User reporter, Long postId, CommunityReportCreateRequest request);

    /**
     * 어드민 커뮤니티 검수 큐 조회 (상태 필터 지원).
     *
     * <p>{@code status} 가 {@code null} 이면 PENDING / APPROVED / REJECTED 전체를 반환한다.
     * 전체 조회 시 PENDING 항목이 항상 상단에 정렬되어 운영자가 검수 대기 글을 먼저 처리할 수 있도록 한다.</p>
     *
     * @param admin    관리자 사용자 (역할/테넌트 검증)
     * @param status   조회 상태 필터. {@code null} 이면 전체 (PENDING + APPROVED + REJECTED)
     * @param pageable 페이지
     * @return 검수 큐 항목 목록
     */
    List<CommunityModerationQueueItemResponse> moderationQueue(
            User admin,
            CommunityModerationStatus status,
            Pageable pageable);

    void moderatePost(User admin, Long postId, CommunityModerationPatchRequest request);

    /**
     * Apple T2 (1.2 UGC) — 어드민 신고 처리 큐 조회.
     *
     * @param admin    관리자
     * @param status   상태 필터(null 이면 전체)
     * @param pageable 페이지
     * @return 신고 큐 항목 목록(OPEN/UNDER_REVIEW 우선)
     */
    List<CommunityReportQueueItemResponse> listReportQueue(
            User admin,
            CommunityReportStatus status,
            Pageable pageable);

    /**
     * Apple T2 (1.2 UGC) — 신고 처리 (RESOLVED/REJECTED).
     *
     * @param admin    관리자
     * @param reportId 신고 row id
     * @param request  처리 결정
     */
    void resolveReport(User admin, Long reportId, CommunityReportResolutionRequest request);

    /**
     * Apple T2 (1.2 UGC) — 게시물 숨김/복원 (어드민).
     *
     * @param admin   관리자
     * @param postId  게시글 id
     * @param reason  숨김 사유(복원 시 무시)
     * @param hide    true=숨김, false=복원
     */
    void hidePost(User admin, Long postId, String reason, boolean hide);

    /**
     * Apple T2 (1.2 UGC) — 댓글 숨김/복원 (어드민).
     *
     * @param admin     관리자
     * @param commentId 댓글 id
     * @param reason    숨김 사유(복원 시 무시)
     * @param hide      true=숨김, false=복원
     */
    void hideComment(User admin, Long commentId, String reason, boolean hide);
}
