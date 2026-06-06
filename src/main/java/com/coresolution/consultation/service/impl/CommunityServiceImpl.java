package com.coresolution.consultation.service.impl;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityPostKind;
import com.coresolution.consultation.dto.community.CommunityCommentCreateRequest;
import com.coresolution.consultation.dto.community.CommunityCommentResponse;
import com.coresolution.consultation.dto.community.CommunityModerationPatchRequest;
import com.coresolution.consultation.dto.community.CommunityModerationQueueItemResponse;
import com.coresolution.consultation.dto.community.CommunityPostCreateRequest;
import com.coresolution.consultation.dto.community.CommunityPostFeedItemResponse;
import com.coresolution.consultation.dto.community.CommunityPostUpdateRequest;
import com.coresolution.consultation.dto.community.CommunityReportCreateRequest;
import com.coresolution.consultation.entity.CommunityComment;
import com.coresolution.consultation.entity.CommunityPost;
import com.coresolution.consultation.entity.CommunityPostLike;
import com.coresolution.consultation.entity.CommunityReport;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.CommunityCommentRepository;
import com.coresolution.consultation.repository.CommunityPostLikeRepository;
import com.coresolution.consultation.repository.CommunityPostRepository;
import com.coresolution.consultation.repository.CommunityReportRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link CommunityService} 구현.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CommunityServiceImpl implements CommunityService {

    private static final DateTimeFormatter ISO_DT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final int BODY_PREVIEW_MAX = 240;

    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;
    private final CommunityPostLikeRepository communityPostLikeRepository;
    private final CommunityReportRepository communityReportRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CommunityPostFeedItemResponse> listApprovedFeed(User reader, String tab, Pageable pageable) {
        String tenantId = requireTenantId(reader);
        List<CommunityPost> posts = loadApprovedPosts(tenantId, tab, pageable);
        return mapPostsToFeed(tenantId, posts);
    }

    @Override
    @Transactional(readOnly = true)
    public CommunityPostFeedItemResponse getPost(User reader, Long postId) {
        String tenantId = requireTenantId(reader);
        CommunityPost post = requireReadablePost(tenantId, postId, reader);
        List<CommunityComment> comments = communityCommentRepository
                .findByTenantIdAndPost_IdInAndIsDeletedFalseOrderByCreatedAtAsc(tenantId, List.of(post.getId()));
        long likes = communityPostLikeRepository.countByTenantIdAndPost_IdAndIsDeletedFalse(tenantId, post.getId());
        return toFeedItem(post, comments, likes);
    }

    @Override
    public CommunityPostFeedItemResponse createPost(User author, CommunityPostCreateRequest request) {
        String tenantId = requireTenantId(author);
        validateKindForRole(author, request.getPostKind());
        User authorRef = userRepository.getReferenceById(author.getId());
        CommunityPost post = CommunityPost.builder()
                .tenantId(tenantId)
                .author(authorRef)
                .postKind(request.getPostKind())
                .title(request.getTitle().trim())
                .body(request.getBody().trim())
                .specialty(trimToNull(request.getSpecialty()))
                .anonymous(request.isAnonymous())
                .moderationStatus(CommunityModerationStatus.PENDING)
                .isDeleted(false)
                .build();
        CommunityPost saved = communityPostRepository.save(post);
        return toFeedItem(saved, Collections.emptyList(), 0L);
    }

    @Override
    public CommunityPostFeedItemResponse updatePost(User author, Long postId, CommunityPostUpdateRequest request) {
        String tenantId = requireTenantId(author);
        CommunityPost post = requireOwnedPost(tenantId, postId, author);
        if (post.getModerationStatus() != CommunityModerationStatus.PENDING) {
            throw new AccessDeniedException("검수 대기 중인 게시글만 수정할 수 있습니다.");
        }
        post.setTitle(request.getTitle().trim());
        post.setBody(request.getBody().trim());
        post.setSpecialty(trimToNull(request.getSpecialty()));
        post.setAnonymous(request.isAnonymous());
        CommunityPost saved = communityPostRepository.save(post);
        List<CommunityComment> comments = communityCommentRepository
                .findByTenantIdAndPost_IdInAndIsDeletedFalseOrderByCreatedAtAsc(tenantId, List.of(saved.getId()));
        long likes = communityPostLikeRepository.countByTenantIdAndPost_IdAndIsDeletedFalse(tenantId, saved.getId());
        return toFeedItem(saved, comments, likes);
    }

    @Override
    public void deletePost(User author, Long postId) {
        String tenantId = requireTenantId(author);
        CommunityPost post = requireOwnedPost(tenantId, postId, author);
        post.delete();
        communityPostRepository.save(post);
    }

    @Override
    public CommunityCommentResponse addComment(User author, Long postId, CommunityCommentCreateRequest request) {
        String tenantId = requireTenantId(author);
        CommunityPost post = requireApprovedPost(tenantId, postId);
        User authorRef = userRepository.getReferenceById(author.getId());
        CommunityComment comment = CommunityComment.builder()
                .tenantId(tenantId)
                .post(post)
                .author(authorRef)
                .body(request.getBody().trim())
                .isDeleted(false)
                .build();
        CommunityComment saved = communityCommentRepository.save(comment);
        return toCommentResponse(saved);
    }

    @Override
    public void deleteComment(User actor, Long commentId) {
        String tenantId = requireTenantId(actor);
        CommunityComment comment = communityCommentRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        if (!Objects.equals(comment.getAuthor().getId(), actor.getId())) {
            throw new AccessDeniedException("본인 댓글만 삭제할 수 있습니다.");
        }
        comment.delete();
        communityCommentRepository.save(comment);
    }

    @Override
    public void addLike(User actor, Long postId) {
        String tenantId = requireTenantId(actor);
        CommunityPost post = requireApprovedPost(tenantId, postId);
        if (communityPostLikeRepository.existsByTenantIdAndPost_IdAndUser_IdAndIsDeletedFalse(
                tenantId, postId, actor.getId())) {
            return;
        }
        User userRef = userRepository.getReferenceById(actor.getId());
        CommunityPostLike row = CommunityPostLike.builder()
                .tenantId(tenantId)
                .post(post)
                .user(userRef)
                .isDeleted(false)
                .build();
        communityPostLikeRepository.save(row);
    }

    @Override
    public void removeLike(User actor, Long postId) {
        String tenantId = requireTenantId(actor);
        communityPostLikeRepository
                .findByTenantIdAndPost_IdAndUser_IdAndIsDeletedFalse(tenantId, postId, actor.getId())
                .ifPresent(communityPostLikeRepository::delete);
    }

    @Override
    public void report(User reporter, Long postId, CommunityReportCreateRequest request) {
        String tenantId = requireTenantId(reporter);
        CommunityPost post = requireApprovedPost(tenantId, postId);
        CommunityComment targetComment = null;
        if (request.getCommentId() != null) {
            targetComment = communityCommentRepository
                    .findByTenantIdAndIdAndIsDeletedFalse(tenantId, request.getCommentId())
                    .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
            if (!Objects.equals(targetComment.getPost().getId(), post.getId())) {
                throw new AccessDeniedException("해당 게시글의 댓글이 아닙니다.");
            }
        }
        User reporterRef = userRepository.getReferenceById(reporter.getId());
        CommunityReport report = CommunityReport.builder()
                .tenantId(tenantId)
                .reporter(reporterRef)
                .post(post)
                .comment(targetComment)
                .reasonCode(request.getReasonCode().name())
                .detailMessage(trimToNull(request.getDetailMessage()))
                .isDeleted(false)
                .build();
        communityReportRepository.save(report);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommunityModerationQueueItemResponse> moderationQueue(
            User admin,
            CommunityModerationStatus status,
            Pageable pageable) {
        requireAdmin(admin);
        String tenantId = requireTenantId(admin);
        List<CommunityPost> rows;
        if (status == null) {
            rows = communityPostRepository.findModerationQueueAllStatuses(
                    tenantId, CommunityModerationStatus.PENDING, pageable);
        } else {
            rows = communityPostRepository.findModerationQueue(tenantId, status, pageable);
        }
        List<CommunityModerationQueueItemResponse> out = new ArrayList<>(rows.size());
        for (CommunityPost p : rows) {
            out.add(toQueueItemResponse(p));
        }
        return out;
    }

    private CommunityModerationQueueItemResponse toQueueItemResponse(CommunityPost p) {
        return CommunityModerationQueueItemResponse.builder()
                .id(p.getId())
                .postKind(p.getPostKind())
                .moderationStatus(p.getModerationStatus())
                .title(p.getTitle())
                .bodyPreview(bodyPreview(p.getBody()))
                .authorUserId(p.getAuthor().getId())
                .authorDisplay(displayForUser(p.getAuthor(), p.isAnonymous()))
                .anonymous(p.isAnonymous())
                .specialty(p.getSpecialty())
                .createdAt(fmt(p.getCreatedAt()))
                .build();
    }

    @Override
    public void moderatePost(User admin, Long postId, CommunityModerationPatchRequest request) {
        requireAdmin(admin);
        String tenantId = requireTenantId(admin);
        CommunityPost post = communityPostRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        if (post.getModerationStatus() != CommunityModerationStatus.PENDING) {
            throw new AccessDeniedException("검수 대기 상태의 게시글만 처리할 수 있습니다.");
        }
        CommunityModerationPatchRequest.Decision decision = request.getDecision();
        if (decision == CommunityModerationPatchRequest.Decision.APPROVE) {
            post.setModerationStatus(CommunityModerationStatus.APPROVED);
            post.setModerationReasonCode(trimToNull(request.getReasonCode()));
        } else if (decision == CommunityModerationPatchRequest.Decision.REJECT) {
            post.setModerationStatus(CommunityModerationStatus.REJECTED);
            post.setModerationReasonCode(
                    trimToNull(request.getReasonCode()) != null ? trimToNull(request.getReasonCode()) : "REJECTED");
        } else {
            throw new AccessDeniedException("decision 값이 올바르지 않습니다.");
        }
        post.setModerationNote(trimToNull(request.getNote()));
        post.setModeratedAt(java.time.LocalDateTime.now());
        post.setModeratedBy(userRepository.getReferenceById(admin.getId()));
        communityPostRepository.save(post);
    }

    private List<CommunityPostFeedItemResponse> mapPostsToFeed(String tenantId, List<CommunityPost> posts) {
        if (posts.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> ids = posts.stream().map(CommunityPost::getId).collect(Collectors.toList());
        List<CommunityComment> allComments = communityCommentRepository
                .findByTenantIdAndPost_IdInAndIsDeletedFalseOrderByCreatedAtAsc(tenantId, ids);
        Map<Long, List<CommunityComment>> byPost = new LinkedHashMap<>();
        for (Long id : ids) {
            byPost.put(id, new ArrayList<>());
        }
        for (CommunityComment c : allComments) {
            byPost.computeIfAbsent(c.getPost().getId(), k -> new ArrayList<>()).add(c);
        }
        List<CommunityPostFeedItemResponse> out = new ArrayList<>();
        for (CommunityPost p : posts) {
            long likes = communityPostLikeRepository.countByTenantIdAndPost_IdAndIsDeletedFalse(tenantId, p.getId());
            out.add(toFeedItem(p, byPost.getOrDefault(p.getId(), Collections.emptyList()), likes));
        }
        return out;
    }

    private List<CommunityPost> loadApprovedPosts(String tenantId, String tab, Pageable pageable) {
        String t = tab == null ? "all" : tab.trim().toLowerCase();
        if ("reviews".equals(t)) {
            return communityPostRepository.findFeedApprovedByKind(
                    tenantId, CommunityModerationStatus.APPROVED, CommunityPostKind.CLIENT_REVIEW, pageable);
        }
        if ("columns".equals(t)) {
            return communityPostRepository.findFeedApprovedByKind(
                    tenantId, CommunityModerationStatus.APPROVED, CommunityPostKind.CONSULTANT_COLUMN, pageable);
        }
        return communityPostRepository.findFeedApprovedAll(tenantId, CommunityModerationStatus.APPROVED, pageable);
    }

    private CommunityPost requireReadablePost(String tenantId, Long postId, User reader) {
        CommunityPost post = communityPostRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        if (post.getModerationStatus() == CommunityModerationStatus.APPROVED) {
            return post;
        }
        if (Objects.equals(post.getAuthor().getId(), reader.getId())) {
            return post;
        }
        throw new AccessDeniedException("이 게시글을 볼 권한이 없습니다.");
    }

    private CommunityPost requireOwnedPost(String tenantId, Long postId, User author) {
        CommunityPost post = communityPostRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        if (!Objects.equals(post.getAuthor().getId(), author.getId())) {
            throw new AccessDeniedException("본인 게시글만 수정·삭제할 수 있습니다.");
        }
        return post;
    }

    private CommunityPost requireApprovedPost(String tenantId, Long postId) {
        CommunityPost post = communityPostRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        if (post.getModerationStatus() != CommunityModerationStatus.APPROVED) {
            throw new AccessDeniedException("승인된 게시글에만 댓글·좋아요·신고를 할 수 있습니다.");
        }
        return post;
    }

    private static void validateKindForRole(User author, CommunityPostKind kind) {
        if (kind == CommunityPostKind.CLIENT_REVIEW) {
            if (author.getRole() == null || !author.getRole().isClient()) {
                throw new AccessDeniedException("내담자 후기는 내담자만 작성할 수 있습니다.");
            }
            return;
        }
        if (kind == CommunityPostKind.CONSULTANT_COLUMN) {
            if (author.getRole() == null || !author.getRole().isProfessionalProvider()) {
                throw new AccessDeniedException("상담사 칼럼은 전문가 역할만 작성할 수 있습니다.");
            }
        }
    }

    private static void requireAdmin(User user) {
        if (user.getRole() == null || !user.getRole().isAdmin()) {
            throw new AccessDeniedException("관리자만 이용할 수 있습니다.");
        }
    }

    private static String requireTenantId(User user) {
        String tenantId = user.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return tenantId.trim();
    }

    private CommunityPostFeedItemResponse toFeedItem(CommunityPost post, List<CommunityComment> comments, long likeCount) {
        String tab = post.getPostKind() == CommunityPostKind.CLIENT_REVIEW ? "reviews" : "columns";
        boolean isConsultant = post.getPostKind() == CommunityPostKind.CONSULTANT_COLUMN;
        List<CommunityCommentResponse> commentDtos = comments.stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
        return CommunityPostFeedItemResponse.builder()
                .id(post.getId())
                .tab(tab)
                .author(displayForUser(post.getAuthor(), post.isAnonymous()))
                .specialty(post.getSpecialty() != null ? post.getSpecialty() : "")
                .title(post.getTitle())
                .body(post.getBody())
                .likes(Math.toIntExact(Math.min(likeCount, Integer.MAX_VALUE)))
                .comments(commentDtos)
                .time(fmt(post.getCreatedAt()))
                .isConsultant(isConsultant)
                .isAnonymous(post.isAnonymous())
                .build();
    }

    private CommunityCommentResponse toCommentResponse(CommunityComment c) {
        return CommunityCommentResponse.builder()
                .id(c.getId())
                .author(displayForUser(c.getAuthor(), false))
                .body(c.getBody())
                .time(fmt(c.getCreatedAt()))
                .likes(0)
                .build();
    }

    private static String displayForUser(User user, boolean anonymous) {
        if (anonymous) {
            return "익명";
        }
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname().trim();
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName().trim();
        }
        return "사용자";
    }

    private static String fmt(java.time.LocalDateTime t) {
        if (t == null) {
            return "";
        }
        return ISO_DT.format(t);
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String bodyPreview(String body) {
        if (body == null) {
            return "";
        }
        String t = body.trim();
        if (t.length() <= BODY_PREVIEW_MAX) {
            return t;
        }
        return t.substring(0, BODY_PREVIEW_MAX) + "…";
    }
}
