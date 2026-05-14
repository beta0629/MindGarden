package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.community.CommunityCommentCreateRequest;
import com.coresolution.consultation.dto.community.CommunityCommentResponse;
import com.coresolution.consultation.dto.community.CommunityModerationPatchRequest;
import com.coresolution.consultation.dto.community.CommunityModerationQueueItemResponse;
import com.coresolution.consultation.dto.community.CommunityPostCreateRequest;
import com.coresolution.consultation.dto.community.CommunityPostFeedItemResponse;
import com.coresolution.consultation.dto.community.CommunityPostUpdateRequest;
import com.coresolution.consultation.dto.community.CommunityReportCreateRequest;
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

    List<CommunityModerationQueueItemResponse> moderationQueue(User admin, Pageable pageable);

    void moderatePost(User admin, Long postId, CommunityModerationPatchRequest request);
}
