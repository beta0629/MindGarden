package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
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
import com.coresolution.consultation.constant.CommunityReportPriority;
import com.coresolution.consultation.constant.CommunityReportResolutionAction;
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
import com.coresolution.consultation.service.CommunityContentFilterService;
import com.coresolution.consultation.service.CommunityService;
import com.coresolution.consultation.service.CommunityUserBlockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommunityServiceImpl implements CommunityService {

    private static final DateTimeFormatter ISO_DT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final int BODY_PREVIEW_MAX = 240;

    /**
     * Apple T2 (1.2 UGC) — 동일 콘텐츠 자동 격리 임계치.
     *
     * <p>같은 게시물·댓글에 대해 활성 신고가 {@value} 건 이상 누적되면 즉시 {@code hidden_at}
     * 을 설정하고 마지막 신고를 {@link CommunityReportPriority#AUTO_QUARANTINE} 으로 마킹한다.
     * Apple 1.2 의 24h SLA 가드와 함께 자동 보호선을 형성한다.</p>
     */
    static final int AUTO_QUARANTINE_THRESHOLD = 3;

    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;
    private final CommunityPostLikeRepository communityPostLikeRepository;
    private final CommunityReportRepository communityReportRepository;
    private final UserRepository userRepository;
    private final CommunityUserBlockService communityUserBlockService;
    private final CommunityContentFilterService communityContentFilterService;

    @Override
    @Transactional(readOnly = true)
    public List<CommunityPostFeedItemResponse> listApprovedFeed(User reader, String tab, Pageable pageable) {
        String tenantId = requireTenantId(reader);
        List<Long> blockedIds = communityUserBlockService.findBlockedUserIds(reader);
        List<CommunityPost> posts = loadApprovedPosts(tenantId, tab, blockedIds, pageable);
        return mapPostsToFeed(tenantId, posts, blockedIds);
    }

    @Override
    @Transactional(readOnly = true)
    public CommunityPostFeedItemResponse getPost(User reader, Long postId) {
        String tenantId = requireTenantId(reader);
        CommunityPost post = requireReadablePost(tenantId, postId, reader);
        List<Long> blockedIds = communityUserBlockService.findBlockedUserIds(reader);
        List<CommunityComment> comments = loadVisibleComments(tenantId, List.of(post.getId()), blockedIds);
        long likes = communityPostLikeRepository.countByTenantIdAndPost_IdAndIsDeletedFalse(tenantId, post.getId());
        return toFeedItem(post, comments, likes);
    }

    @Override
    public CommunityPostFeedItemResponse createPost(User author, CommunityPostCreateRequest request) {
        String tenantId = requireTenantId(author);
        validateKindForRole(author, request.getPostKind());
        String title = request.getTitle().trim();
        String body = request.getBody().trim();
        CommunityContentFilterService.FilterResult filter = communityContentFilterService.inspect(title + "\n" + body);
        boolean autoModerated = filter.matched();
        if (autoModerated) {
            log.warn("[CommunityService] createPost auto-moderation triggered — user={} reason={}",
                    author.getId(), filter.reasonCode());
        }
        User authorRef = userRepository.getReferenceById(author.getId());
        CommunityPost post = CommunityPost.builder()
                .tenantId(tenantId)
                .author(authorRef)
                .postKind(request.getPostKind())
                .title(title)
                .body(body)
                .specialty(trimToNull(request.getSpecialty()))
                .anonymous(request.isAnonymous())
                .moderationStatus(CommunityModerationStatus.PENDING)
                .autoModerated(autoModerated)
                .autoModeratedReasonCode(autoModerated ? filter.reasonCode() : null)
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
        String body = request.getBody().trim();
        CommunityContentFilterService.FilterResult filter = communityContentFilterService.inspect(body);
        boolean autoModerated = filter.matched();
        LocalDateTime now = LocalDateTime.now();
        User authorRef = userRepository.getReferenceById(author.getId());
        CommunityComment comment = CommunityComment.builder()
                .tenantId(tenantId)
                .post(post)
                .author(authorRef)
                .body(body)
                .autoModerated(autoModerated)
                .autoModeratedReasonCode(autoModerated ? filter.reasonCode() : null)
                .hiddenAt(autoModerated ? now : null)
                .hiddenReason(autoModerated ? ("AUTO:" + filter.reasonCode()) : null)
                .isDeleted(false)
                .build();
        if (autoModerated) {
            log.warn("[CommunityService] addComment auto-moderation triggered — user={} reason={}",
                    author.getId(), filter.reasonCode());
        }
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
        Long commentIdForLookup = targetComment != null ? targetComment.getId() : null;
        if (communityReportRepository.existsActiveByReporter(
                tenantId, reporter.getId(), postId, commentIdForLookup)) {
            throw new AccessDeniedException("이미 신고하신 콘텐츠입니다.");
        }
        User reporterRef = userRepository.getReferenceById(reporter.getId());
        // P2-C (Apple G1.2) — 레거시 8종 코드가 들어와도 5종으로 정규화한다.
        String approvedReasonCode = request.getReasonCode().toApprovedReasonCode().name();
        CommunityReport report = CommunityReport.builder()
                .tenantId(tenantId)
                .reporter(reporterRef)
                .post(post)
                .comment(targetComment)
                .reasonCode(approvedReasonCode)
                .detailMessage(trimToNull(request.getDetailMessage()))
                .status(CommunityReportStatus.OPEN)
                .priority(CommunityReportPriority.NORMAL)
                .isDeleted(false)
                .build();
        CommunityReport saved = communityReportRepository.save(report);
        triggerAutoQuarantineIfNeeded(tenantId, post, targetComment, saved);
    }

    /**
     * Apple T2 1.2 — 동일 콘텐츠 3건 누적 신고 자동 격리.
     *
     * <p>임계치 도달 시 콘텐츠의 {@code hidden_at} 을 즉시 설정하고 마지막 신고를
     * {@link CommunityReportPriority#AUTO_QUARANTINE} 으로 마킹한다. 어드민이 24h SLA 내에 처리해야 한다.</p>
     */
    private void triggerAutoQuarantineIfNeeded(
            String tenantId,
            CommunityPost post,
            CommunityComment targetComment,
            CommunityReport latestReport) {
        boolean isCommentReport = targetComment != null;
        long activeCount = isCommentReport
                ? communityReportRepository.countActiveByComment(tenantId, targetComment.getId())
                : communityReportRepository.countActiveByPost(tenantId, post.getId());
        if (activeCount < AUTO_QUARANTINE_THRESHOLD) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        latestReport.setPriority(CommunityReportPriority.AUTO_QUARANTINE);
        communityReportRepository.save(latestReport);
        if (isCommentReport) {
            if (targetComment.getHiddenAt() == null) {
                targetComment.setHiddenAt(now);
                targetComment.setHiddenReason("AUTO:THREE_REPORTS");
                communityCommentRepository.save(targetComment);
                log.warn("[CommunityService] auto-quarantine triggered for comment id={} count={}",
                        targetComment.getId(), activeCount);
            }
        } else {
            if (post.getHiddenAt() == null) {
                post.setHiddenAt(now);
                post.setHiddenReason("AUTO:THREE_REPORTS");
                communityPostRepository.save(post);
                log.warn("[CommunityService] auto-quarantine triggered for post id={} count={}",
                        post.getId(), activeCount);
            }
        }
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

    private List<CommunityPostFeedItemResponse> mapPostsToFeed(
            String tenantId,
            List<CommunityPost> posts,
            List<Long> blockedUserIds) {
        if (posts.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> ids = posts.stream().map(CommunityPost::getId).collect(Collectors.toList());
        List<CommunityComment> allComments = loadVisibleComments(tenantId, ids, blockedUserIds);
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

    private List<CommunityComment> loadVisibleComments(
            String tenantId,
            List<Long> postIds,
            List<Long> blockedUserIds) {
        boolean applyBlock = blockedUserIds != null && !blockedUserIds.isEmpty();
        List<Long> ids = applyBlock ? blockedUserIds : List.of(-1L);
        return communityCommentRepository.findVisibleByPostIds(tenantId, postIds, ids, applyBlock);
    }

    private List<CommunityPost> loadApprovedPosts(
            String tenantId,
            String tab,
            List<Long> blockedUserIds,
            Pageable pageable) {
        boolean applyBlock = blockedUserIds != null && !blockedUserIds.isEmpty();
        List<Long> ids = applyBlock ? blockedUserIds : List.of(-1L);
        String t = tab == null ? "all" : tab.trim().toLowerCase();
        if ("reviews".equals(t)) {
            return communityPostRepository.findFeedApprovedByKind(
                    tenantId, CommunityModerationStatus.APPROVED, CommunityPostKind.CLIENT_REVIEW,
                    ids, applyBlock, pageable);
        }
        if ("columns".equals(t)) {
            return communityPostRepository.findFeedApprovedByKind(
                    tenantId, CommunityModerationStatus.APPROVED, CommunityPostKind.CONSULTANT_COLUMN,
                    ids, applyBlock, pageable);
        }
        return communityPostRepository.findFeedApprovedAll(
                tenantId, CommunityModerationStatus.APPROVED, ids, applyBlock, pageable);
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

    @Override
    @Transactional(readOnly = true)
    public List<CommunityReportQueueItemResponse> listReportQueue(
            User admin,
            CommunityReportStatus status,
            Pageable pageable) {
        requireAdmin(admin);
        String tenantId = requireTenantId(admin);
        List<CommunityReport> rows = communityReportRepository.findAdminQueue(tenantId, status, pageable);
        List<CommunityReportQueueItemResponse> out = new ArrayList<>(rows.size());
        for (CommunityReport r : rows) {
            out.add(toReportQueueItem(r));
        }
        return out;
    }

    @Override
    public void resolveReport(User admin, Long reportId, CommunityReportResolutionRequest request) {
        requireAdmin(admin);
        String tenantId = requireTenantId(admin);
        CommunityReport report = communityReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("신고를 찾을 수 없습니다."));
        if (!Objects.equals(report.getTenantId(), tenantId)) {
            throw new AccessDeniedException("다른 테넌트의 신고는 처리할 수 없습니다.");
        }
        if (report.getStatus() == CommunityReportStatus.RESOLVED
                || report.getStatus() == CommunityReportStatus.REJECTED) {
            throw new AccessDeniedException("이미 처리된 신고입니다.");
        }
        CommunityReportStatus targetStatus = request.getStatus();
        if (targetStatus != CommunityReportStatus.RESOLVED
                && targetStatus != CommunityReportStatus.REJECTED) {
            throw new AccessDeniedException("status 는 RESOLVED 또는 REJECTED 만 허용됩니다.");
        }
        CommunityReportResolutionAction action = request.getAction();
        if (targetStatus == CommunityReportStatus.REJECTED) {
            action = CommunityReportResolutionAction.NONE;
        } else if (action == null || action == CommunityReportResolutionAction.NONE) {
            throw new AccessDeniedException("RESOLVED 처리에는 액션이 필요합니다.");
        }
        report.setStatus(targetStatus);
        report.setResolutionAction(action);
        report.setResolvedAt(LocalDateTime.now());
        report.setResolvedByAdmin(userRepository.getReferenceById(admin.getId()));
        communityReportRepository.save(report);
        applyResolutionAction(tenantId, report, action, trimToNull(request.getNote()), admin);
    }

    private void applyResolutionAction(
            String tenantId,
            CommunityReport report,
            CommunityReportResolutionAction action,
            String note,
            User admin) {
        switch (action) {
            case HIDE_CONTENT -> {
                if (report.getComment() != null) {
                    hideCommentEntity(report.getComment(), admin, note, true);
                } else {
                    hidePostEntity(report.getPost(), admin, note, true);
                }
            }
            case DELETE_CONTENT -> {
                if (report.getComment() != null) {
                    report.getComment().delete();
                    communityCommentRepository.save(report.getComment());
                } else {
                    report.getPost().delete();
                    communityPostRepository.save(report.getPost());
                }
            }
            case SUSPEND_USER, BAN_USER -> log.info(
                "[CommunityService] resolution action {} requested for report id={} — user account "
                + "actions will be applied by UserAccountService in follow-up",
                action, report.getId());
            case NONE -> {
                // 기각(REJECTED) 처리이거나 액션 없음 — 별도 조치 없음.
            }
        }
    }

    @Override
    public void hidePost(User admin, Long postId, String reason, boolean hide) {
        requireAdmin(admin);
        String tenantId = requireTenantId(admin);
        CommunityPost post = communityPostRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        hidePostEntity(post, admin, reason, hide);
    }

    @Override
    public void hideComment(User admin, Long commentId, String reason, boolean hide) {
        requireAdmin(admin);
        String tenantId = requireTenantId(admin);
        CommunityComment comment = communityCommentRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        hideCommentEntity(comment, admin, reason, hide);
    }

    private void hidePostEntity(CommunityPost post, User admin, String reason, boolean hide) {
        if (hide) {
            post.setHiddenAt(LocalDateTime.now());
            post.setHiddenBy(userRepository.getReferenceById(admin.getId()));
            post.setHiddenReason(trimToNull(reason));
        } else {
            post.setHiddenAt(null);
            post.setHiddenBy(null);
            post.setHiddenReason(null);
        }
        communityPostRepository.save(post);
    }

    private void hideCommentEntity(CommunityComment comment, User admin, String reason, boolean hide) {
        if (hide) {
            comment.setHiddenAt(LocalDateTime.now());
            comment.setHiddenBy(userRepository.getReferenceById(admin.getId()));
            comment.setHiddenReason(trimToNull(reason));
        } else {
            comment.setHiddenAt(null);
            comment.setHiddenBy(null);
            comment.setHiddenReason(null);
        }
        communityCommentRepository.save(comment);
    }

    private CommunityReportQueueItemResponse toReportQueueItem(CommunityReport r) {
        CommunityPost post = r.getPost();
        CommunityComment comment = r.getComment();
        long minutesSince = 0L;
        if (r.getCreatedAt() != null) {
            minutesSince = java.time.Duration.between(r.getCreatedAt(), LocalDateTime.now()).toMinutes();
            if (minutesSince < 0L) {
                minutesSince = 0L;
            }
        }
        User resolvedAdmin = r.getResolvedByAdmin();
        return CommunityReportQueueItemResponse.builder()
                .id(r.getId())
                .status(r.getStatus())
                .priority(r.getPriority())
                .reasonCode(r.getReasonCode())
                .detailMessage(r.getDetailMessage())
                .reporterDisplay(displayForUser(r.getReporter(), false))
                .reporterUserId(r.getReporter().getId())
                .postId(post.getId())
                .postAuthorDisplay(displayForUser(post.getAuthor(), post.isAnonymous()))
                .postAuthorUserId(post.getAuthor().getId())
                .postTitle(post.getTitle())
                .postBodyPreview(bodyPreview(post.getBody()))
                .commentId(comment != null ? comment.getId() : null)
                .commentBodyPreview(comment != null ? bodyPreview(comment.getBody()) : null)
                .postHidden(post.getHiddenAt() != null)
                .createdAt(fmt(r.getCreatedAt()))
                .minutesSinceCreated(minutesSince)
                .resolvedAt(fmt(r.getResolvedAt()))
                .resolvedByDisplay(resolvedAdmin != null ? displayForUser(resolvedAdmin, false) : null)
                .resolutionAction(r.getResolutionAction())
                .build();
    }
}
