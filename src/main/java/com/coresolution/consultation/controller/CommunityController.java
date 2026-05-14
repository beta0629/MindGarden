package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.community.CommunityCommentCreateRequest;
import com.coresolution.consultation.dto.community.CommunityCommentResponse;
import com.coresolution.consultation.dto.community.CommunityPostCreateRequest;
import com.coresolution.consultation.dto.community.CommunityPostFeedItemResponse;
import com.coresolution.consultation.dto.community.CommunityPostUpdateRequest;
import com.coresolution.consultation.dto.community.CommunityReportCreateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommunityService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expo {@code COMMUNITY_API} — 피드·게시·댓글·좋아요·신고.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController extends BaseApiController {

    private final CommunityService communityService;

    /**
     * 검수 완료 피드 목록.
     *
     * @param session 세션
     * @param tab     {@code reviews}, {@code columns}, 생략 시 전체
     * @param pageable 페이지
     * @return 게시 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CommunityPostFeedItemResponse>>> listFeed(
            HttpSession session,
            @RequestParam(required = false) String tab,
            @PageableDefault(size = 50) Pageable pageable) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            return success(communityService.listApprovedFeed(user, tab, pageable));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 단건 조회.
     *
     * @param session 세션
     * @param postId  게시글 id
     * @return 게시글
     */
    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<CommunityPostFeedItemResponse>> getOne(
            HttpSession session,
            @PathVariable("postId") Long postId) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            return success(communityService.getPost(user, postId));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 게시글 작성(검수 대기).
     *
     * @param session 세션
     * @param request 작성 본문
     * @return 생성된 게시글
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CommunityPostFeedItemResponse>> create(
            HttpSession session,
            @Valid @RequestBody CommunityPostCreateRequest request) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            return created(communityService.createPost(user, request));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 검수 대기 게시글 수정.
     *
     * @param session 세션
     * @param postId  id
     * @param request 수정 본문
     * @return 갱신된 게시글
     */
    @PatchMapping("/{postId}")
    public ResponseEntity<ApiResponse<CommunityPostFeedItemResponse>> update(
            HttpSession session,
            @PathVariable("postId") Long postId,
            @Valid @RequestBody CommunityPostUpdateRequest request) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            return updated(communityService.updatePost(user, postId, request));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 본인 게시글 소프트 삭제.
     *
     * @param session 세션
     * @param postId  id
     * @return 빈 성공
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(HttpSession session, @PathVariable("postId") Long postId) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            communityService.deletePost(user, postId);
            return deleted();
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 댓글 작성.
     *
     * @param session 세션
     * @param postId  게시글 id
     * @param request 댓글 본문
     * @return 댓글
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<CommunityCommentResponse>> addComment(
            HttpSession session,
            @PathVariable("postId") Long postId,
            @Valid @RequestBody CommunityCommentCreateRequest request) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            return created(communityService.addComment(user, postId, request));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 본인 댓글 삭제.
     *
     * @param session   세션
     * @param commentId 댓글 id
     * @return 빈 성공
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            HttpSession session,
            @PathVariable("commentId") Long commentId) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            communityService.deleteComment(user, commentId);
            return deleted();
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 좋아요 추가(멱등).
     *
     * @param session 세션
     * @param postId  게시글 id
     * @return 빈 성공
     */
    @PostMapping("/{postId}/likes")
    public ResponseEntity<ApiResponse<Void>> addLike(HttpSession session, @PathVariable("postId") Long postId) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            communityService.addLike(user, postId);
            return success("좋아요가 반영되었습니다.");
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 좋아요 취소.
     *
     * @param session 세션
     * @param postId  게시글 id
     * @return 빈 성공
     */
    @DeleteMapping("/{postId}/likes")
    public ResponseEntity<ApiResponse<Void>> removeLike(HttpSession session, @PathVariable("postId") Long postId) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            communityService.removeLike(user, postId);
            return deleted("좋아요가 취소되었습니다.");
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 신고 접수.
     *
     * @param session 세션
     * @param postId  게시글 id
     * @param request 신고 사유
     * @return 빈 성공
     */
    @PostMapping("/{postId}/reports")
    public ResponseEntity<ApiResponse<Void>> report(
            HttpSession session,
            @PathVariable("postId") Long postId,
            @Valid @RequestBody CommunityReportCreateRequest request) {
        User user = requireTenantUser(session);
        try {
            TenantContextHolder.setTenantId(user.getTenantId().trim());
            communityService.report(user, postId, request);
            return created("신고가 접수되었습니다.", null);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static User requireTenantUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return user;
    }
}
